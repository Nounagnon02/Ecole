# 02 — Plan de tests

Audit réalisé le 11 novembre 2026 sur la branche `chore/world-class-additions` (travail non commité inclus : refonte « Proposition C » et activation imposée de la double authentification).

## 1. Périmètre

| Surface | Testée ? | Remarque |
|---|---|---|
| Application web (`Ecole/Ecole_frontend`) | **Oui**, dans Google Chrome visible | Objet principal de l'audit |
| API (`Ecole/Ecole_backend`) | Oui, à travers l'interface et la console réseau | Pas de test d'intrusion |
| Application mobile Expo (`Ecole/Ecole_mobile`) | **Non** | Hors de portée d'un test dans Chrome ; à auditer séparément sur appareil Android |
| Application de bureau Electron (`Ecole/Ecole_desktop`) | **Non** | Enveloppe du build web ; non lancée |
| Services externes (FedaPay, Africa's Talking, IA) | **Non** | Aucune clé de bac à sable fournie ; aucun appel réel autorisé |

## 2. Environnement de test

| Élément | Valeur |
|---|---|
| Navigateur | Google Chrome installé sur le poste, piloté par Playwright en **mode visible** (`channel: 'chrome'`, `headless: false`) |
| Frontend | Serveur de développement Vite (port 3002) pour le parcours des boutons ; **version de production** (`vite preview`) pour la matrice d'accès et les mesures de performance |
| API | `php artisan serve` (port 8000), PHP 8.5 |
| Base de données | MySQL 8.0 dans un conteneur Docker jetable (`ecole-e2e-mysql`), réinitialisée par `migrate:fresh --seed` |
| Données | Jeux de démonstration du dépôt (1 école peuplée, 32 élèves, 33 parents, 641 notes, module université) |
| Appareil | Ordinateur de bureau Linux. **Aucun test sur téléphone physique** : les tailles d'écran mobiles et les réseaux lents sont **simulés** dans Chrome |

### Écarts par rapport à une production réelle (à garder en tête en lisant les résultats)

1. **Cache en mémoire** (`CACHE_DRIVER=array`). Des dossiers de `storage/framework/cache` appartiennent à `root` sur ce poste et faisaient échouer l'API (erreur 500). Conséquence : **la limitation de débit et le verrouillage de compte après échecs répétés n'ont pas pu être testés**.
2. **Mots de passe de test imposés** pour six comptes (super-admin, recteur, doyen, professeur, étudiant, personnel) dont le mot de passe est aléatoire après peuplement, et pour un second parent. Fait dans la base jetable uniquement.
3. **Double authentification** : activée par le robot pour les rôles où elle est obligatoire, avec un code calculé à partir du secret affiché à l'écran.
4. **API sur la même machine que le navigateur** : les temps de réponse du serveur sont sous-estimés par rapport à un hébergement distant (voir `07`).
5. **Parcours des boutons réalisé avec trois fenêtres en parallèle** : la machine a été saturée par moments ; 82 chargements de page n'ont pas abouti dans le délai et ont été exclus (voir `03`). La matrice d'accès a été refaite séparément sur la version de production.

## 3. Comptes utilisés

20 comptes, un par rôle : `directeur`, `directeurM`, `directeurP`, `directeurS`, `censeur`, `secretaire`, `comptable`, `surveillant`, `infirmier`, `bibliothecaire`, `enseignant`, `parent` (PAR001), `eleve` (EL001), `admin`, `super-admin`, `recteur`, `doyen`, `professeur`, `etudiant`, `personnel`. Un second parent (`basile.adjovi@parent.bj`) a servi aux parcours parent, car le compte de démonstration PAR001 n'a aucun enfant rattaché (BUG-013).

## 4. Niveaux de test

| Niveau | Méthode | Outil | Livrable |
|---|---|---|---|
| N1 — Inventaire et accès | Pour chaque compte, visite des 59 routes protégées ; relevé de l'accès, du titre, des éléments, des erreurs | `audit-crawl.mjs`, `matrice.mjs` | `01`, `preuves/mesures/crawl-*.json`, `matrice-acces.json` |
| N2 — Clic sur chaque bouton | Sur chaque page autorisée : clic sur chaque onglet puis sur chaque bouton visible (30 au plus par vue) ; relevé de l'effet (appel API, dialogue, navigation, téléchargement, impression, changement d'affichage, rien) | `audit-crawl.mjs` | `03` |
| N3 — Parcours métier de bout en bout | Scénarios écrits à la main, avec vérification du résultat, de la persistance après rechargement et de la visibilité par les autres rôles | `wf-a` à `wf-e` | `03` (section parcours), `preuves/mesures/parcours-*.json` |
| N4 — Réseau et appareils | Bridage du réseau et du processeur par le protocole DevTools ; écrans de 360 et 390 px | `perf.mjs`, robot | `07` |
| N5 — Accessibilité | axe-core (règles WCAG 2.0/2.1/2.2 A et AA), parcours au clavier, relevés du robot | `wf-e.mjs` | `07` |
| N6 — Analyse du code | Lecture ciblée pour confirmer la cause des anomalies observées et pour le volet Bénin | — | `04`, `06` |

## 5. Verdicts employés

| Verdict | Signification |
|---|---|
| **VALIDÉ** | L'objectif métier est atteint et vérifié (résultat affiché, persistance après rechargement) |
| **PARTIEL** | L'objectif est atteint avec un défaut constaté |
| **ÉCHEC** | L'objectif n'est pas atteint |
| **BLOQUÉ** | Test impossible (donnée, clé ou autorisation manquante) — la raison est indiquée |
| **OBSERVÉ** | Comportement relevé sans critère de réussite tranché |
| « réagit » (N2 seulement) | Le clic produit un effet observable. **Ce n'est pas une validation métier.** |
| « SANS EFFET » (N2 seulement) | Aucun effet observable après le clic |

## 6. Ce qui n'a volontairement pas été fait

- **Aucun paiement**, réel ou en bac à sable : les boutons qui appellent FedaPay n'ont pas été cliqués.
- **Aucun envoi de SMS ni de courriel réel** (`MAIL_MAILER=log`).
- **Aucun test destructif ni d'intrusion** ; aucune tentative de contourner un contrôle d'accès.
- **Aucune correction du produit.** Les anomalies sont documentées dans `04`, pas corrigées.
- **Aucun test avec de vrais utilisateurs.** Les jugements d'ergonomie de `05` et `06` sont une évaluation d'expert (heuristique), pas un test d'utilisabilité.

## 7. Reproduire

Les scripts sont dans `audit/preuves/outils/`. Prérequis : API sur le port 8000, frontend sur le port 3002, base peuplée. Exemple :

```bash
node audit/preuves/outils/audit-crawl.mjs audit/preuves 0 enseignant_ecole1:/enseignant/dashboard
node audit/preuves/outils/generer-rapports.mjs      # régénère 01 et 03
```
