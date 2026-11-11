# 10 — Rapport final d'audit

**Produit :** École — plateforme de gestion scolaire · **Date :** 11 novembre 2026 · **Branche :** `chore/world-class-additions` (travail non commité inclus)

## 1. Présentation du projet

Plateforme de gestion d'établissements scolaires multi-écoles, pensée pour le Bénin, de la maternelle au supérieur : élèves, notes et bulletins, paiements, emploi du temps, discipline, infirmerie, bibliothèque, messagerie, module université, assistant IA. Quatre surfaces partagent une API Laravel : web (React), mobile (Expo), bureau (Electron). 20 rôles, 59 pages protégées côté web, 423 routes d'API.

## 2. Objectifs de l'audit

Déterminer, par des interactions réelles dans Google Chrome, ce qui fonctionne, ce qui ne fonctionne pas et ce qui manque, puis juger si le produit est utilisable, utile et adapté au Bénin et à l'Afrique de l'Ouest.

## 3. Méthodologie

Six niveaux, détaillés dans `02-plan-de-tests.md` : inventaire et accès (20 comptes × 59 routes), clic sur chaque onglet et chaque bouton, parcours métier de bout en bout, réseau et appareils simulés, accessibilité (axe-core, clavier), lecture ciblée du code pour confirmer les causes. Tout s'est déroulé dans **Google Chrome en mode visible**, piloté par des scripts conservés dans `preuves/outils/`.

## 4. Environnements testés

Poste Linux, Chrome installé, frontend en développement puis en version de production, API locale, MySQL 8 jetable peuplé avec les données de démonstration. **Simulé :** écrans de 360 et 390 px, réseaux 4G, 3G, 3G lente et 2G. **Non testé :** téléphone physique, application mobile, application de bureau, services externes réels (FedaPay, SMS, IA).

## 5. Indicateurs chiffrés

### 5.1 Pages

| Indicateur | Valeur | Formule |
|---|---|---|
| Pages identifiées | 67 | 59 routes protégées + 8 pages publiques ou système |
| Pages testées | 63 | 59 protégées (chacune atteinte par au moins un rôle) + connexion, mot de passe oublié, activation de la double authentification, accès non autorisé |
| Pages non testées | 4 | `/`, `/reset-password`, `/403`, `/404` |
| **Couverture des pages** | **94 %** | 63 ÷ 67 |
| Visites de pages (rôle × page) | 1 180 tentées | 20 comptes × 59 routes |
| — autorisées | 210 | matrice d'accès sur la version de production |
| — refusées | 970 | idem ; **aucun accès indu** |
| — autorisées mais refusées par l'API | 44 (21 %) | 44 ÷ 210 |

### 5.2 Boutons

| Indicateur | Valeur | Formule |
|---|---|---|
| Boutons identifiés (page × rôle × vue) | 2 286 | relevé du robot sur 196 visites abouties |
| Boutons cliqués | 1 363 | plafond de 30 par vue |
| **Couverture des boutons** | **60 %** | 1 363 ÷ 2 286 ; les 923 restants sont surtout des boutons répétés dans les lignes de tableau, au-delà du plafond |
| Boutons **distincts** cliqués | 274 | page + vue + libellé |
| — qui réagissent | 142 (52 %) | effet observable ; **ne vaut pas validation métier** |
| — sans aucun effet | 111 (41 %) | dont une vingtaine d'onglets déjà actifs (estimation) ; 22 confirmés sans action dans le code |
| — en échec d'API | 13 (5 %) | réponse 4xx ou 5xx |
| — désactivés, non exécutés | 8 (3 %) | |

### 5.3 Liens

| Indicateur | Valeur | Formule |
|---|---|---|
| Liens de menu identifiés | 175 (58 distincts) | somme des menus des 20 rôles |
| Liens de menu vérifiés | 175 | destination visitée par son adresse ; **le lien lui-même n'a pas été cliqué**, sauf sur mobile (parcours L1) |
| — menant à une page fonctionnelle | 153 (87 %) | |
| — menant à une page refusée par l'API | 22 (13 %) | |
| Liens internes distincts dans le contenu | 27 | |
| — vers une adresse inexistante | 13 | fil d'Ariane (BUG-031), comparés à la table des routes, non cliqués |
| Liens externes | 0 relevé | |

### 5.4 Formulaires

| Indicateur | Valeur |
|---|---|
| Champs de saisie visibles (page × rôle) | 324, dont 172 sans étiquette associée |
| Formulaires d'écriture identifiés | 11 : connexion, mot de passe oublié, réinitialisation, activation 2FA, code 2FA, annonce, message, profil, changement de mot de passe, école, affectation |
| Formulaires testés (envoi valide + cas d'erreur) | 8 : connexion, mot de passe oublié, activation 2FA, code 2FA, annonce, message, profil, école |
| Formulaires bloqués | 1 : affectation |
| Formulaires non testés | 2 : réinitialisation et changement de mot de passe |
| **Couverture des formulaires** | **73 %** (8 ÷ 11) |

Les « formulaires » attendus derrière les boutons de création (élève, note, paiement, cours, facture, soin, incident, courrier…) **n'existent pas** : voir BUG-002.

### 5.5 Fonctionnalités

58 fonctionnalités identifiées (liste au §6).

| Statut | Nombre | Part |
|---|---|---|
| Validées | 18 | 31 % |
| Partielles | 6 | 10 % |
| En échec | 20 | 34 % |
| Bloquées | 4 | 7 % |
| Non exécutées | 10 | 17 % |

- **Taux de couverture = (validées + partielles + en échec) ÷ identifiées = 44 ÷ 58 = 76 %.**
- **Taux de réussite des tests exécutés = validées ÷ (validées + partielles + en échec) = 18 ÷ 44 = 41 %** (55 % en comptant les partielles).

### 5.6 Parcours métier et anomalies

| Indicateur | Valeur |
|---|---|
| Cas de parcours joués | 61 |
| — validés / partiels / en échec | 23 / 4 / 17 |
| — observés sans critère / bloqués | 11 / 2 |
| — non exécutés (échec du script de test) | 4 |
| Taux de réussite des parcours tranchés | 52 % (23 ÷ 44) |
| **Anomalies** | **31** : 5 critiques, 11 élevées, 11 moyennes, 4 faibles |

## 6. Fonctionnalités : état constaté

**Validées (18).** Connexion · déconnexion · contrôle d'accès par rôle · demande de mot de passe oublié · activation imposée de la double authentification · connexion avec code · publication d'une annonce · lecture des annonces par parent et élève · envoi d'un message · modification du profil · thème sombre · création d'une école · recherche d'un élève dans la liste · fiche « Mes enfants » du parent (avec ses notes) · reçu de paiement · liste et filtre des paiements (comptable) · expiration de session · menu mobile.

**Partielles (6).** Changement de langue (arabe incomplet) · retrait d'un élève (effectué, mal affiché) · hors-ligne (file d'attente sans information, page vide) · tableaux de bord (école : oui ; université : erreur 500) · navigation au clavier sur la connexion · export des notes (s'ouvre dans un onglet, contenu non vérifié).

**En échec (20).** Consultation des notes · saisie des notes · import de notes · inscription d'un élève · paiement en ligne par le parent · enregistrement d'un paiement · échéancier · recherche globale · édition de l'emploi du temps · appel et présences · discipline et absences du censeur · soins et dossiers de l'infirmerie (création) · bibliothèque (ajout, emprunt) · factures · documents du secrétariat · université (tableau de bord, cours) · assistant IA · gestion des utilisateurs par l'admin d'école · configuration, marque blanche, plans, modules · exports (élèves, paiements, transactions, emploi du temps).

**Bloquées (4).** Affectation d'un enseignant (listes vides) · aller-retour FedaPay (ni clé de bac à sable ni autorisation) · envoi réel de SMS · limitation de débit et verrouillage de compte (cache en mémoire).

**Non exécutées (10).** Lien de réinitialisation du mot de passe · changement de mot de passe · désactivation de la double authentification · génération et verrouillage des bulletins · « Provisionner » une école · choix d'école pour un compte multi-établissements · invitation d'un parent · notifications en temps réel · application mobile · application de bureau.

## 7. Bugs

31 anomalies, détaillées dans `04`. Les cinq critiques :

1. **BUG-001** — La page « Notes » n'affiche aucune note (641 en base).
2. **BUG-002** — La quasi-totalité des boutons de création n'ont aucune action : l'application web est en lecture seule.
3. **BUG-003** — Le paiement en ligne est inatteignable, pour le parent comme pour le comptable.
4. **BUG-004** — Les pages du censeur sont refusées par l'API.
5. **BUG-005** — Le tableau de bord de l'université échoue (erreur 500) pour ses cinq rôles.

## 8. Problèmes UX/UI

Voir `05`. L'essentiel : l'interface promet plus qu'elle ne fait (boutons décoratifs, menus menant à des refus), ne confirme pas les actions, mêle quatre mots pour annonces et messages, et affiche des messages en anglais ou techniques. La base visuelle, elle, est cohérente et saine.

## 9. Performance

Voir `07`. Rapide en 4G (1,6 s) et en 3G (3,2 s), dissuasive en 3G lente (8,6 s) et en 2G (13,9 s). Poids de première visite : 302 ko, concentré dans un script principal de 849 ko (non compressé) chargé par tous les rôles. Lighthouse non exécuté.

## 10. Accessibilité

Voir `07`. 11 pages sur 13 en échec avec axe-core : boutons sans nom (48), contrastes insuffisants (97), champs sans étiquette, graphiques sans texte de remplacement. 8 pages débordent sur téléphone. Aucun test avec lecteur d'écran.

## 11. Contexte béninois

Voir `06`. Points saillants :

- **Téléphone :** le service SMS rejette les numéros à 10 chiffres en vigueur.
- **Paiement :** FedaPay est le bon choix, mais le parcours n'existe pas pour le parent ; Celtiis manque ; les espèces, mode dominant, ne peuvent pas être saisies.
- **Canal :** aucune notification sortante ; tout repose sur le courriel, peu utilisé par les parents.
- **Sécurité praticable :** double authentification par application sans code de secours.
- **Réglages :** serveur en UTC et en anglais.
- **Langue :** pas besoin de traduire l'interface en langues nationales ; le vocal en fongbé apporterait davantage.
- **Bon point :** monnaie, dates, noms accentués et adresses libres sont correctement traités.

## 12. Contexte ouest-africain

Rien n'est prêt pour un second pays (devise, indicatif, opérateurs, système scolaire, réglementation). Recommandation : réussir au Bénin d'abord ; le Togo est l'extension la plus naturelle.

## 13. Améliorations recommandées

Voir `08` : 12 corrections indispensables (A), 12 améliorations d'expérience (B), 12 adaptations locales (C).

## 14. Nouvelles fonctionnalités proposées

Voir `08`, §D. Par ordre de valeur : saisie des notes, paiement par le parent en mobile money (et espèces côté comptable), inscription et dossier de l'élève, appel avec alerte d'absence, notifications SMS/WhatsApp, bulletins, connexion par téléphone, tableau des décisions pour la direction. Écartés pour l'instant : IA, marque blanche, université, application de bureau.

## 15. Feuille de route

Voir `09` : 34 actions priorisées (7 en P0, 11 en P1, 10 en P2, 6 en P3) et quatre étapes : **arrêter de promettre**, **les trois gestes essentiels**, **toucher les parents**, **confort et terrain difficile**.

## 16. Appréciation de la maturité

**Le produit est une démonstration avancée, pas encore un outil exploitable par une école.**

| Dimension | Appréciation | Justification |
|---|---|---|
| Socle technique | Solide | Cloisonnement par école, contrôle d'accès sans faille constatée (970 refus sur 970), double authentification, tests automatisés nombreux, file hors-ligne |
| Identité visuelle | Bonne | Cohérente, sobre, adaptée |
| Étendue fonctionnelle | Très large | 20 rôles, 59 pages |
| **Profondeur fonctionnelle** | **Insuffisante** | 41 % de réussite sur les fonctionnalités testées ; 4 boutons distincts sur 10 sans effet ; aucune saisie métier sur le web |
| Fiabilité des parcours critiques | Insuffisante | Notes, paiement, inscription, appel : en échec |
| Adéquation au Bénin | Partielle | Bons fondamentaux (monnaie, prestataire de paiement), mais téléphone, canal de notification et paiement inadaptés en l'état |
| Accessibilité | À reprendre | 11 pages sur 13 en échec |
| Performance | Correcte, sauf réseau lent | |

**Réponse à la question posée.** Le produit est-il utilisable, utile, fiable, compréhensible et adapté à son marché ? **Compréhensible : en grande partie. Fiable sur l'accès et la sécurité : oui. Utilisable et utile au quotidien : pas encore**, car les trois gestes qui justifient son existence — saisir des notes, encaisser la scolarité, prévenir les parents — ne sont pas réalisables depuis le web.

Le chemin le plus court vers un produit vendable n'est pas d'ajouter, mais de **retirer ce qui ne marche pas et d'achever trois parcours**.

## 17. Limites de cet audit

- L'application mobile, sans doute le canal principal des parents, n'a pas été testée : il est possible que certaines fonctions absentes du web y existent.
- Aucun test avec de vrais utilisateurs, aucun appareil physique, aucun réseau réel.
- Les services externes n'ont pas été appelés ; le paiement n'a pas été testé de bout en bout.
- Le parcours des boutons s'est limité à 30 boutons par vue ; 923 occurrences n'ont pas été cliquées.
- Les jeux de données de démonstration sont incomplets (parent sans enfant, enseignant sans classe, séries non rattachées), ce qui a bloqué ou limité certains parcours.
- Les affirmations de contexte sur le marché béninois ne sont pas sourcées et doivent être vérifiées.
