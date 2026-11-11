# 07 — Performance et accessibilité

## 1. Performance

### 1.1 Méthode

- Version de **production** du frontend (`vite build`, servie par `vite preview`, compression active), API locale.
- Google Chrome visible, écran de 360 × 740 px, service worker désactivé pour mesurer une **première visite**.
- Réseau et processeur bridés par le protocole DevTools de Chrome. **Ce sont des simulations**, pas des mesures sur un téléphone ni sur un réseau béninois réel. L'API étant sur la même machine, le temps de réponse du serveur est sous-estimé.
- **Lighthouse n'a pas été exécuté** (outil absent du poste). Les indicateurs Core Web Vitals (LCP, INP, CLS) ne sont donc pas fournis ; seul le premier affichage (FCP) est mesuré.
- Données brutes : `preuves/mesures/performance-reseau.json`.

### 1.2 Temps de chargement mesurés

| Profil simulé | Page de connexion utilisable (première visite) | Tableau de bord parent après connexion |
|---|---|---|
| Fibre / Wi-Fi, non bridé | 0,4 s | 0,9 s |
| 4G correcte (9 Mb/s, 170 ms, processeur ÷ 4) | 1,6 s | 2,1 s |
| 3G (1,6 Mb/s, 300 ms, processeur ÷ 4) | 3,2 s | 3,4 s |
| 3G lente (400 kb/s, 400 ms, processeur ÷ 6) | **8,6 s** | 5,6 s |
| 2G / EDGE (240 kb/s, 800 ms, processeur ÷ 6) | **13,9 s** | 9,5 s |

- **Poids transféré :** 302 ko pour la première visite (6 requêtes), puis 136 ko et 16 requêtes pour ouvrir le tableau de bord parent.
- **Navigation entre pages (non bridé, 210 pages) :** médiane 0,96 s, 90ᵉ centile 1,1 s, maximum 7,1 s (rechargement complet à chaque fois).

**Lecture.** En 4G et en 3G correcte, l'application est rapide. En 3G lente, le premier écran demande près de 9 secondes : c'est le cas d'un parent en zone rurale ou en fin de forfait. Les visites suivantes devraient être plus rapides grâce au service worker, **ce qui n'a pas été mesuré**.

### 1.3 Poids de l'application

| Élément | Taille (non compressée) | Remarque |
|---|---|---|
| Script principal `index-*.js` | 849 ko (≈ 256 ko compressé) | Chargé par **tout le monde**, y compris sur la page de connexion |
| Bibliothèque de graphiques | 384 ko (≈ 106 ko compressé) | Chargée dès qu'un tableau de bord s'ouvre |
| Feuille de style | 88 ko | — |
| Polices Figtree | 30 ko (2 fichiers) | Hébergées localement : bon point (aucun appel à Google Fonts) |
| Total JavaScript, tous morceaux | 1,82 Mo | 95 fichiers |
| Images | 15 ko (2 icônes) | Aucune image lourde |

**Constat.** Le script principal est le seul vrai problème de poids. Un parent qui ne veut que voir une note télécharge le code des 20 rôles. À 1 Go pour 500 FCFA environ (ordre de grandeur des forfaits mobiles, **à vérifier** selon l'opérateur), une première visite coûte peu, mais le temps d'attente en 3G lente, lui, est dissuasif.

**Pistes :** découper le script principal par rôle (les pages sont déjà chargées à la demande, mais pas le socle commun : graphiques, animations, palette de recherche) ; ne charger la bibliothèque de graphiques que lorsqu'un graphique est visible ; viser moins de 150 ko compressés pour l'écran de connexion.

### 1.4 Requêtes et fiabilité

- **44 pages sur 210 déclenchent au moins une requête refusée** (403) ou en erreur (500) au chargement : trafic inutile et écrans d'erreur (BUG-005, BUG-006).
- **Double-clic sur « Publier » :** un seul envoi (bon point, parcours B2).
- **Rechargement de page :** la session est conservée ; les données saisies dans un formulaire ouvert ne le sont pas.
- **Expiration de session :** renvoi propre vers la connexion (parcours A7).
- **Coupure réseau :** bandeau affiché ; une écriture est mise en file et rejouée (parcours D2), mais une navigation mène à une page vide (BUG-018).
- **Sous forte charge du poste** (trois navigateurs sur le serveur de développement), 82 chargements de page n'ont pas abouti en 6 secondes et la page restait sur un indicateur de chargement **sans message ni délai maximal**. Sur un téléphone lent, ce cas se produira : prévoir un message après quelques secondes.
- **Non testé :** montée en charge, limitation de débit, verrouillage de compte.

## 2. Accessibilité

### 2.1 Méthode

- **axe-core** (règles WCAG 2.0, 2.1 et 2.2, niveaux A et AA) sur 13 pages, 4 rôles, plus une passe en thème sombre.
- Relevés du robot sur toutes les pages visitées (noms accessibles, étiquettes, taille des cibles).
- Parcours au clavier de la page de connexion.
- **Limites :** un outil automatique détecte une partie seulement des défauts (de l'ordre d'un tiers). **Aucun test avec un lecteur d'écran ni avec des personnes en situation de handicap.**

### 2.2 Résultats axe-core

**11 pages sur 13 en échec** (au moins une violation critique ou sérieuse). Sans violation détectée : `/connexion` et `/messagerie`.

| Règle | Gravité | Pages touchées | Éléments | Critère WCAG |
|---|---|---|---|---|
| `button-name` — bouton sans nom accessible | Critique | 6 | 48 | 4.1.2 |
| `label` — champ sans étiquette | Critique | 1 (`/parametres`) | 4 | 1.3.1, 4.1.2 |
| `color-contrast` — contraste insuffisant | Sérieux | 5 | 97 | 1.4.3 |
| `svg-img-alt` — graphique sans texte de remplacement | Sérieux | 3 | 9 | 1.1.1 |

Pages les plus touchées : `/comptable/transactions` (42 boutons sans nom, 42 contrastes), `/eleves` (32 contrastes), `/parent/enfants` (14 contrastes), `/emploi-du-temps` (8 contrastes, 2 boutons sans nom). Détail : `preuves/mesures/accessibilite-axe.json`.

### 2.3 Relevés du robot (196 visites de pages)

| Mesure | Résultat |
|---|---|
| Boutons sans nom accessible (ni texte, ni `aria-label`, ni `title`) | 115 sur 1 597 (7 %) |
| Champs sans étiquette associée | 172 sur 324 (53 %) |
| Boutons de moins de 32 px de côté | 283 sur 1 597 (18 %) |
| Images sans attribut `alt` | 0 |
| Pages sans titre `h1` | `/messagerie`, `/emploi-du-temps` |

Les 172 champs sans étiquette sont surtout des champs de recherche et des filtres qui n'ont qu'un texte indicatif (`placeholder`) : il disparaît dès la saisie et n'est pas toujours lu par les lecteurs d'écran.

### 2.4 Clavier

| Vérification | Résultat |
|---|---|
| Tous les champs de la connexion atteignables à la touche Tab, dans l'ordre visuel | Oui |
| Connexion possible sans souris (Entrée dans le mot de passe) | Oui |
| Lien « Aller au contenu principal » présent | Oui, mais après Entrée le focus ne se place pas sur le contenu |
| Focus visible | Non détecté sur le sélecteur de langue et sur « Se connecter » (**à vérifier à l'œil**) |
| Fermeture des dialogues par Échap | Oui (palette de recherche, menus) |
| Reste de l'application au clavier | **Non testé** |

### 2.5 Mobile et tactile (simulé)

- **Menu mobile :** fonctionne à 360 px (8 liens pour le parent).
- **Débordement horizontal :** 8 pages (BUG-019), dont `/emploi-du-temps` et `/notes`, deux pages très consultées.
- **Cibles tactiles :** sur `/notes` à 360 px, 7 éléments interactifs sur 18 font moins de 44 px.
- **Texte :** plus petite police relevée, 12 px ; correct mais limite pour des libellés de tableau.
- **Tableaux :** ils défilent dans leur cadre, sauf sur les pages ci-dessus où c'est toute la page qui défile.

### 2.6 Thème sombre et arabe

- Thème sombre : activation et conservation après rechargement validées ; même violation qu'en clair sur le tableau de bord directeur (graphiques sans texte de remplacement). Contrastes du thème sombre **non mesurés page par page**.
- Arabe : sens droite-gauche appliqué, aucun débordement relevé sur la page testée ; traduction incomplète (BUG-027). **Une seule page vérifiée.**

## 3. Sécurité (vérifications non intrusives)

| Vérification | Résultat |
|---|---|
| Pages protégées sans session | Renvoi vers la connexion (parcours A4) |
| 970 tentatives d'accès à une page d'un autre rôle (20 comptes) | Toutes refusées |
| Message d'échec de connexion | Identique pour un compte existant et inexistant : ne révèle pas l'existence d'un compte (parcours A3) |
| Mot de passe oublié | Réponse identique quel que soit le compte (parcours A5) |
| Session | Cookie de session, pas de jeton dans le stockage du navigateur (lecture du code) |
| Déconnexion puis bouton « Précédent » | Reste sur la connexion (parcours A6) |
| Double authentification obligatoire (direction, comptabilité, administration) | Fonctionne ; **aucun code de secours** en cas de perte du téléphone |
| Annuaire exposé dans la messagerie | **Défaut** (BUG-010) |
| Messages d'erreur du serveur | En mode débogage, l'API renvoie le chemin des fichiers et la pile d'appels. **À vérifier** que `APP_DEBUG=false` en production |
| Limitation de débit, verrouillage de compte | **Non testés** |
| Secrets dans le code du navigateur | Non recherchés de façon systématique |
