# 04 — Bugs et anomalies

31 anomalies, toutes observées dans Google Chrome le 11 novembre 2026, sauf mention « analyse du code ». Statut de toutes : **À corriger**, sauf indication contraire. Aucune n'a été corrigée pendant l'audit.

**Répartition par sévérité :** Critique 5 · Élevée 11 · Moyenne 11 · Faible 4.

**Preuves.** Captures : `preuves/captures/<compte>/<page>.jpg` (parcours du robot) et `preuves/captures/parcours/<ID>-*.jpg`. Mesures : `preuves/mesures/`. Détail clic par clic : `03-resultats-tests.md`.

**Origine.** Ces anomalies ne viennent pas de la refonte visuelle en cours : pour les 8 pages comparées au dernier commit (élèves, notes, paiements, emploi du temps, factures, soins, surveillance, documents), le nombre d'actions câblées est identique avant et après. Pour les autres pages, l'origine n'a pas été vérifiée.

---

## Critiques

### BUG-001 — La page « Notes » n'affiche aucune note
- **Fonctionnalité :** consultation des notes · **Page :** `/notes` · **Rôles :** tous ceux qui y ont accès (direction, enseignants, parent, élève)
- **Reproduction :** 1. Se connecter comme directeur. 2. Ouvrir « Notes ».
- **Attendu :** la liste des notes de l'école (641 en base).
- **Obtenu :** « Total évaluations 0 », « Aucune note trouvée ». Aucune erreur affichée.
- **Preuves :** parcours N1, N2, P5 ; l'appel `GET /api/notes/eleve` répond 200 avec les notes dans `data.data`.
- **Impact utilisateur :** personne ne peut consulter les notes depuis cette page. Un parent croit que son enfant n'a aucune note.
- **Impact métier :** le suivi des notes est la raison d'être du produit.
- **Cause (analyse du code) :** `NotesPage.jsx:38` n'accepte qu'un tableau dans `notesData.data`, alors que l'API renvoie une réponse paginée (`data.data.data`). L'utilitaire `unwrapList` du projet gère ce cas et n'est pas utilisé ici.
- **Solution :** utiliser `unwrapList(notesData)` et gérer la pagination.

### BUG-002 — La quasi-totalité des boutons de création n'ont aucune action
- **Fonctionnalité :** création et édition · **Pages :** 45 pages · **Rôles :** tous
- **Reproduction :** cliquer sur « Nouvel élève » (`/eleves`), « Nouvelle note » ou « Importer » (`/notes`), « Nouveau paiement » (`/paiements`), « Ajouter un cours » (`/emploi-du-temps`), « Nouvelle facture », « Envoyer », « Imprimer » (`/comptable/factures`), « Nouveau soin », « Nouveau dossier » (infirmerie), « Nouvel incident » (surveillance), « Nouveau courrier » (secrétariat), « Ajouter un ouvrage » (bibliothèque), « Saisir des notes » (tableau de bord enseignant), « Ajouter une faculté / un étudiant / un enseignant », « Nouveau plan », « Nouveau module », « Exporter » (7 pages)…
- **Attendu :** un formulaire ou une action.
- **Obtenu :** rien. Ni dialogue, ni appel à l'API, ni message.
- **Preuves :** 111 boutons distincts « SANS EFFET » sur 274 cliqués (`03`). 22 d'entre eux ont été vérifiés dans le code : le bouton n'a pas de gestionnaire `onClick` (ex. `ElevesPage.jsx:96-97`, `PaiementsPage.jsx:155-156`, `SoinsPage.jsx:103`). Une partie des 111 sont des onglets déjà actifs (faux positifs, estimés à une vingtaine).
- **Impact utilisateur :** on ne peut ni inscrire un élève, ni saisir une note, ni enregistrer un paiement, un soin, un incident, un cours ou une facture depuis le web.
- **Impact métier :** l'application web est, pour l'essentiel, **en lecture seule**. Les seules écritures qui fonctionnent sont listées dans `10-rapport-final.md` (§6).
- **Cause :** fonctionnalités non développées côté web ; les boutons sont des maquettes.
- **Solution :** développer les formulaires, ou retirer les boutons en attendant (un bouton qui ne fait rien détruit la confiance).

### BUG-003 — Le paiement en ligne est inatteignable
- **Fonctionnalité :** paiement des frais de scolarité · **Pages :** `/paiements`, onglet « Échéancier » · **Rôles :** parent, élève, comptable
- **Reproduction A (parent) :** se connecter comme parent, ouvrir « Paiements ». **Obtenu :** « Erreur : Unauthorized - Role required: directeur, comptable », tableau vide. Aucun bouton pour payer.
- **Reproduction B (comptable) :** ouvrir « Paiements » › « Échéancier ». **Obtenu :** « Aucun élève trouvé » : la liste des élèves est vide, car `GET /api/eleves` répond 403 au comptable. Aucun échéancier ne peut donc être ouvert, et le bouton qui lance FedaPay n'apparaît jamais.
- **Attendu :** le parent voit ce qu'il doit et peut payer par mobile money.
- **Preuves :** parcours P4, J1, J4 ; matrice d'accès (`/paiements` ⚠ pour parent, élève, secrétaire ; `/eleves` ⚠ pour comptable).
- **Impact utilisateur :** un parent voit son solde sur le tableau de bord (ex. 171 934 FCFA) mais ne peut ni en voir le détail ni payer.
- **Impact métier :** aucun encaissement en ligne possible. C'est la fonctionnalité qui justifie un abonnement pour une école.
- **Cause (analyse du code) :** la page appelle `/api/comptable/paiements`, réservé à la direction et à la comptabilité ; le lancement du paiement (`/comptable/echeancier/{id}/initier-paiement`) est lui aussi sous le préfixe comptable. Il existe des routes parent (`/api/parent/enfants/{id}/paiements`) que la page n'utilise pas.
- **Solution :** une page « Mes paiements » pour le parent, branchée sur les routes parent, avec un bouton « Payer » ; autoriser le comptable à lister les élèves.
- **Non testé :** l'aller-retour FedaPay lui-même (aucune clé de bac à sable, aucune autorisation).

### BUG-004 — Les pages du censeur sont refusées par l'API
- **Pages :** `/censeur/discipline`, `/censeur/absences` · **Rôle :** censeur
- **Obtenu :** `403` sur `/api/surveillant/incidents`, `/api/surveillant/statistiques`, `/api/surveillant/absences` ; les pages affichent une erreur et un bouton « Réessayer » qui échoue à nouveau.
- **Impact :** le censeur n'a aucune page métier utilisable en dehors de son tableau de bord.
- **Cause :** les pages du censeur appellent les routes du surveillant. **Solution :** routes propres au censeur, ou ouvrir ces routes à ce rôle.

### BUG-005 — Le tableau de bord de l'université échoue (erreur 500)
- **Page :** `/universite/dashboard` · **Rôles :** recteur, doyen, professeur, étudiant, personnel (les 5 rôles du module)
- **Obtenu :** `500` sur `GET /api/dashboard/universite`. C'est la page d'arrivée de ces cinq rôles.
- **Impact :** première page en erreur pour tout le module université. **Cause :** non recherchée (erreur serveur). **Statut :** à corriger, cause à identifier dans les journaux de l'API.

---

## Élevées

### BUG-006 — Un clic sur 5 pages ouvertes mène à un refus de l'API
- **Constat :** sur 210 couples (rôle, page) que l'interface autorise, 44 (21 %) affichent une page dont l'API refuse les données.
- **Détail :** `/notes` (12 rôles), `/emploi-du-temps` (9 rôles), `/eleves` (7 rôles : parent, comptable, secrétaire, surveillant, infirmier, bibliothécaire, censeur), `/paiements` (3), `/admin/utilisateurs` (admin d'école), `/secretaire/planning`, `/surveillant/presences`, `/universite/enseignants` (professeur), `/eleve/cours` et `/universite/notes` (étudiant).
- **Impact :** des liens de menu qui mènent à « Erreur » ou à une page vide. Le secrétaire ne peut pas lister les élèves ; le surveillant ne peut pas faire l'appel.
- **Cause :** les rôles autorisés dans `route-config.js` ne correspondent pas aux rôles autorisés par les routes de l'API. **Solution :** une seule source de vérité pour les droits, et un test automatique qui compare les deux.
- **Preuve :** `01-inventaire-fonctionnel.md`, matrice (cases ⚠).

### BUG-007 — La recherche globale plante dès qu'un élève correspond
- **Reproduction :** Ctrl+K, taper « A ». **Obtenu :** la palette disparaît ; console : `Objects are not valid as a React child (found: object with keys {id, nom_classe})`.
- **Cause :** `CommandPalette.jsx:218` et `:459` affichent `el.classe`, qui est un objet. **Solution :** afficher `el.classe?.nom_classe`.
- **Impact :** la recherche d'un élève, premier réflexe d'un secrétariat, est inutilisable. **Preuve :** parcours C4.

### BUG-008 — Un élève retiré des effectifs reste affiché « actif »
- **Reproduction :** directeur › « Élèves » › « Retirer des effectifs » sur une ligne, confirmer.
- **Obtenu :** `POST /api/eleves/32/deactivate` répond 200 et l'élève passe à `inactive` en base, mais la ligne reste affichée avec le statut « actif », même après rechargement. Aucun message. Aucun moyen de le réintégrer depuis l'interface.
- **Impact :** le directeur ne sait pas si son action a eu lieu ; il peut recliquer. Les effectifs affichés sont faux. **Preuve :** parcours H2 (deux passes).

### BUG-009 — Affectation d'un enseignant impossible
- **Page :** `/affectations` · **Obtenu :** après le choix d'un enseignant et d'une classe (essais avec « Petite Section » et « 2nde C »), la liste « Série » reste vide, donc « Matière » aussi, et le bouton « Affecter » reste désactivé. La base contient 6 séries et 14 matières.
- **Statut : À vérifier** — données de démonstration incomplètes (séries non rattachées aux classes) ou défaut de chargement. Dans les deux cas, le parcours est bloqué et aucun message n'explique pourquoi. **Preuve :** parcours K1.
- **Conséquence observée :** l'enseignant de démonstration a « Aucune classe assignée ».

### BUG-010 — Un parent peut écrire à n'importe quel utilisateur de l'école
- **Page :** `/messagerie` › « Nouvelle conversation » · **Rôle :** parent (non vérifié pour l'élève)
- **Obtenu :** 87 contacts proposés, dont des élèves, d'autres parents, des étudiants de l'université et les administrateurs, avec leur nom complet et leur rôle.
- **Impact :** exposition de l'annuaire complet (dont des mineurs) à tout parent ; un adulte peut contacter directement l'enfant d'un autre. Risque de protection de l'enfance et de conformité à la loi béninoise sur les données personnelles (Code du numérique, à faire valider par un juriste).
- **Solution :** limiter les contacts d'un parent aux enseignants de ses enfants, à la direction et au secrétariat. **Preuve :** reconnaissance des écrans, capture `parcours/F1-messagerie.jpg`.

### BUG-011 — « Nouvelle publication » est proposé à tous, et refusé à presque tous
- **Page :** `/communications` · **Rôles :** 12 rôles sur 20 (parent, élève, enseignant, comptable, infirmier…) reçoivent `403` en cliquant « Publier ».
- **Impact :** l'utilisateur rédige une annonce, puis la perd. **Solution :** masquer le bouton aux rôles non autorisés. **Preuve :** parcours B4, B5, `03`.

### BUG-012 — Les SMS rejettent les numéros béninois à 10 chiffres (analyse du code)
- **Constat :** `SmsService::normalizePhone` n'accepte que `+229` suivi de 8 chiffres, ou 8 chiffres seuls.
- **Contexte :** le Bénin est passé à une numérotation à 10 chiffres (préfixe 01) le 30 novembre 2024. **À confirmer** auprès de l'ARCEP Bénin, mais les numéros en service aujourd'hui sont à 10 chiffres.
- **Impact :** tout numéro saisi au format actuel (`0197123456`, `+2290197123456`) est rejeté ; aucun SMS ne part. L'interface, elle, accepte ce format sans le signaler (parcours C1).
- **Non testé en conditions réelles :** aucun envoi de SMS (pas de clé Africa's Talking).

### BUG-013 — Le compte parent de démonstration n'a aucun enfant
- **Compte :** PAR001 · **Obtenu :** « Aucun enfant lié à votre compte », tableau de bord vide.
- **Cause :** dans la base peuplée, la fiche parent de PAR001 a `ecole_id` vide, donc le filtre par école l'exclut. Les 32 autres parents sont corrects.
- **Impact :** la démonstration du parcours parent, le plus important, est vide. **Statut : À vérifier** — défaut du jeu de données (`BeninEducationSeeder`), mais le même défaut toucherait tout parent créé sans école.

### BUG-014 — Pages et recherches de l'université en erreur d'affichage
- **Page :** `/universite/cours` · **Obtenu :** erreur React `Objects are not valid as a React child` (objets enseignant, semestre, filière affichés tels quels) ; la page affiche « Réessayer », sans effet.
- **Impact :** la liste des cours de l'université est inutilisable. Même famille que BUG-007.

### BUG-015 — Fonctions d'intelligence artificielle refusées
- **Pages :** `/eleve/tutor`, `/parent/ai-report`, `/enseignant/ai-assistant` · **Obtenu :** « Analyser » → `403` sur `/api/v1/ia/predictive` ; « Chat IA » sans effet.
- **Impact :** fonctionnalité mise en avant (le manifeste de l'application annonce « intelligence artificielle intégrée ») mais inopérante pour trois des quatre rôles ciblés. **Non testé :** la réponse de l'IA elle-même (aucune clé).

### BUG-016 — Accessibilité : boutons sans nom, champs sans étiquette, contrastes insuffisants
- **Mesure (axe-core, 13 pages) :** 11 pages en échec. `button-name` (critique) sur 6 pages, 48 boutons ; `label` (critique) sur 1 page, 4 champs ; `color-contrast` (sérieux) sur 5 pages, 97 éléments ; `svg-img-alt` (sérieux) sur 3 pages.
- **Relevé du robot (toutes pages) :** 115 boutons sans nom accessible sur 1 597, 172 champs sans étiquette sur 324.
- **Impact :** un lecteur d'écran annonce « bouton » sans dire lequel ; texte gris difficile à lire en plein soleil sur un écran d'entrée de gamme. Détail dans `07`.

---

## Moyennes

### BUG-017 — Messages de validation en anglais
- **Obtenu :** « The titre field is required. », « The email field is required. » (annonces, création d'école).
- **Cause :** `config/app.php` : `locale` = `en`. **Solution :** `fr` par défaut et fichiers de langue français.

### BUG-018 — Hors-ligne : page vide et aucune information
- **Obtenu :** réseau coupé, un clic sur un autre onglet du menu ouvre une page **vide** (aucun message). Une annonce publiée pendant la coupure est bien mise en file et envoyée au retour du réseau (parcours D2), mais **rien ne le dit** : aucun message ni pendant, ni après.
- **Impact :** l'utilisateur croit avoir perdu sa saisie, ou ressaisit. **Preuve :** parcours D2, D3.

### BUG-019 — Débordement horizontal sur téléphone
- **Mesure à 390 px :** `/emploi-du-temps` (+56 à +145 px selon le rôle), `/admin/dashboard` (+539 px), `/comptable/transactions` (+33), `/paiements` (+27), `/universite/cours` (+27), `/notes` (+23), `/admin/billing` (+18), `/comptable/factures` (+9). À 360 px, `/notes` déborde de 53 px.
- **Impact :** toute la page défile de côté ; des colonnes sont coupées.

### BUG-020 — Zones tactiles trop petites
- **Mesure :** 283 boutons de moins de 32 px sur 1 597 (parcours du robot, écran de bureau) ; sur `/notes` à 360 px, 7 éléments interactifs sur 18 font moins de 44 px ; plus petite police : 12 px.
- **Référence :** WCAG 2.2, critère 2.5.8 (24 px minimum), 44 px recommandés.

### BUG-021 — Création d'école : aucune confirmation, comptes créés non communiqués
- **Obtenu :** `POST /api/ecoles` répond 201 et l'école apparaît dans la liste, mais aucun message de succès n'a été relevé et les identifiants des comptes créés automatiquement (directeur, censeur, comptable…) ne sont pas affichés.
- **Statut : À vérifier** — le message a pu disparaître avant le relevé. **Preuve :** parcours G2.

### BUG-022 — Console d'administration : boutons décoratifs
- **Pages :** `/admin/dashboard` (« Alertes », « Paramètres », « Voir tous les logs », « Sauvegarder »), `/admin/configuration` (« Enregistrer », « Modifier »), `/admin/white-label` (6 couleurs, « Choisir un fichier »), `/admin/utilisateurs` (« Désactiver », « Ajouter »), `/admin/journal-audit` (« Voir le détail »).
- **Obtenu :** aucun effet. **Impact :** l'administrateur croit avoir enregistré une configuration. Cas particulier grave de BUG-002.

### BUG-023 — L'administrateur d'école ne peut pas gérer les utilisateurs
- **Page :** `/admin/utilisateurs` · **Rôle :** admin · **Obtenu :** `403` sur `/api/v1/admin/tenants`.

### BUG-024 — Heure du serveur en UTC (analyse du code)
- **Constat :** `config/app.php` : `timezone` = `UTC`. Le Bénin est à UTC+1.
- **Impact probable :** reçus, absences et journaux d'audit horodatés avec une heure de retard ; un paiement fait à 00 h 30 daté de la veille. **Non vérifié à l'écran.**

### BUG-025 — Paiement mobile : Celtiis absent, numéro non contrôlé (analyse du code)
- **Constat :** `MobileMoneyRequest` n'accepte que `mtn` et `moov` ; `phone_number` est une simple chaîne sans contrôle de format.
- **Impact :** les abonnés Celtiis Cash ne peuvent pas payer ; un numéro mal saisi part tel quel chez l'opérateur.

### BUG-026 — Titres de page absents ou génériques
- **Constat :** `/messagerie` et `/emploi-du-temps` n'ont pas de titre `h1` ; le fil d'Ariane de l'assistant parent affiche « Ai report ».

### BUG-031 — Fil d'Ariane : 13 liens vers des pages qui n'existent pas
- **Constat :** le deuxième niveau du fil d'Ariane (« Accueil › Parent › … ») pointe vers `/parent`, `/eleve`, `/directeur`, `/enseignant`, `/comptable`, `/secretaire`, `/surveillant`, `/censeur`, `/infirmier`, `/bibliothecaire`, `/admin`, `/universite`, `/paiement`. Aucune de ces adresses n'est une route de l'application : elles mènent à la page 404.
- **Méthode :** destinations comparées à la table des routes ; **liens non cliqués un à un**. **Statut : À vérifier** par un clic, puis à corriger (pointer vers le tableau de bord du rôle).

---

## Faibles

### BUG-027 — Arabe : interface partiellement traduite
- **Obtenu :** en arabe, la page « Paramètres » reste en français (« Paramètres », « Profil », « Notifications »). Le sens d'écriture droite-gauche est bien appliqué et conservé après rechargement. **Preuve :** parcours C2.

### BUG-028 — Clavier : focus peu visible sur deux éléments de la connexion
- **Obtenu :** le sélecteur de langue et le bouton « Se connecter » ne présentent ni contour ni ombre au focus (mesure des styles calculés). **Statut : À vérifier** à l'œil. Le lien « Aller au contenu principal » existe mais ne déplace pas le focus sur le contenu.

### BUG-029 — Exports et reçus ouverts dans un nouvel onglet
- **Obtenu :** « Exporter » (notes) et « Voir le reçu » ouvrent `/api/...` dans un nouvel onglet, sans nom de fichier ni retour. Sur téléphone, l'utilisateur quitte l'application.

### BUG-030 — Environnement local : dossiers de cache appartenant à `root`
- **Obtenu :** `storage/framework/cache/data/3b`, `…/c1` et 18 autres entrées appartiennent à `root` ; l'API répond 500 (`fopen … No such file or directory`) dès qu'une clé de cache tombe dans ces dossiers (ex. activation de la double authentification pour l'admin).
- **Portée :** ce poste de développement uniquement. **Solution :** `sudo chown -R $USER Ecole/Ecole_backend/storage`.

---

## Anomalies non reproduites ou hors périmètre

- **Accès indus :** aucun. Les 970 tentatives d'accès à une page non autorisée ont toutes été refusées. Les 82 « accès » d'abord relevés par le robot étaient des pages restées sur l'indicateur de chargement (machine saturée) ; la matrice a été refaite.
- **Limitation de débit et verrouillage de compte :** non testés (cache en mémoire, voir `02`).
- **Documentation obsolète :** `Ecole_frontend/FRONTEND_README.md` décrit une arborescence (`src/Directeurs/`, `src/Parents/`…) et une variable `REACT_APP_API_URL` qui n'existent plus.
