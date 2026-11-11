# 11 — Plan de correction

Plan d'exécution pour corriger les 31 anomalies de `04` et réaliser les recommandations de `08`. Il précise, lot par lot, **quoi modifier, sur quelle route d'API s'appuyer, et comment prouver que c'est corrigé**.

**Rien de ce plan n'est commencé. Chaque lot attend une validation avant exécution.**

## Constat qui structure le plan

L'API possède déjà les routes d'écriture de presque toutes les fonctions absentes de l'écran (relevé du 11 novembre : 423 routes). La plupart des corrections consistent donc à **brancher un formulaire sur une route existante**, pas à développer une fonction de bout en bout.

| Fonction absente à l'écran | Route d'API déjà présente |
|---|---|
| Inscrire / modifier un élève | `POST eleves/store`, `PUT eleves/update/{id}`, `POST eleves/{id}/activate` |
| Saisir des notes | `POST notes/store`, `notes/bulk`, `notes/auto-save`, `notes/import-csv` |
| Enregistrer un paiement | `POST comptable/paiements`, `payments/initialize`, `payments/mobile-money` |
| Emploi du temps | `POST emploi-du-temps/store`, `PUT …/update/{id}`, `DELETE …/delete/{id}` |
| Absences, incidents, sanctions | `POST surveillant/absences`, `…/incidents`, `…/sanctions` |
| Infirmerie | `POST infirmier/consultations`, `…/dossiers-medicaux`, `…/vaccinations` |
| Bibliothèque | `POST bibliothecaire/livres`, `…/emprunts`, `PUT …/emprunts/{id}/retour` |
| Secrétariat | `POST secretaire/dossiers`, `…/courriers`, `…/certificats`, `…/rendez-vous` |
| Événements | `POST evenements`, `DELETE evenements/{id}` |
| Bulletins | `POST bulletins/verrouiller` (+ 5 routes de lecture) |

**À vérifier au début de chaque lot :** les rôles admis par la route, les champs exigés (classes `FormRequest`), et la forme de la réponse. L'existence d'une route ne garantit pas qu'elle fonctionne : aucune n'a été appelée pendant l'audit, sauf celles citées dans `03`.

## Règles communes à tous les lots

1. **Une branche et une demande de fusion par lot**, selon les conventions du dépôt. Le travail non commité actuel (refonte C, double authentification) est commité d'abord, séparément (lot 0).
2. **Test d'abord.** Chaque correction commence par un test qui échoue pour la bonne raison, puis passe. Contrôle par mutation sur les corrections sensibles (droits, paiement, messagerie).
3. **Suites complètes avant fusion :** tests unitaires du frontend, Pest côté API, 78 tests e2e, lint, build.
4. **Preuve dans Chrome.** Chaque lot se termine par un passage du robot (`audit/preuves/outils/audit-crawl.mjs`) et des parcours concernés. Le critère de sortie est mesurable, jamais « ça a l'air de marcher ».
5. **Un composant de formulaire partagé.** Un seul modèle (dialogue, champs étiquetés, validation, message de succès ou d'erreur en français, bouton désactivé pendant l'envoi) réutilisé par tous les formulaires : c'est ce qui rend les lots 4 à 6 rapides et cohérents.
6. **Ne pas élargir.** Aucun nouveau rôle, module ni écran hors de ce plan.

Estimations en jours-personne, **ordres de grandeur à confirmer** après lecture du code de chaque lot.

---

## Lot 0 — Mettre le dépôt au propre (0,5 j)

| Action | Détail |
|---|---|
| Commiter la refonte C et la double authentification imposée | Deux commits distincts ; ne pas y mêler les fichiers personnels non commités |
| Corriger les droits de `storage/` | `sudo chown -R $USER Ecole/Ecole_backend/storage` (BUG-030) — **à faire par vous** |
| Ajouter `audit/` au dépôt | Décision à prendre : avec ou sans les 8 Mo de captures |

**Sortie :** `git status` propre ; l'API démarre avec le cache fichier sans erreur 500.

## Lot 1 — Arrêter de promettre (4 à 6 j) · P0

Objectif : tout ce qui est affiché fonctionne. Aucun développement de fonction nouvelle.

| # | Anomalie | Correction | Fichiers principaux | Preuve |
|---|---|---|---|---|
| 1.1 | BUG-001 Notes vides | `unwrapList(notesData)` ; pagination ou chargement par pages | `features/notes/NotesPage.jsx` | Test : une réponse paginée de l'API affiche ses lignes. Chrome : le directeur voit des notes |
| 1.2 | BUG-007, BUG-014 Plantages d'affichage | Afficher `classe?.nom_classe` ; idem pour les objets enseignant, semestre, filière ; barrière d'erreur autour de la palette | `CommandPalette.jsx`, `universite/CoursPage.jsx` | Test : la recherche « A » liste des élèves sans erreur |
| 1.3 | BUG-002, BUG-022 Boutons sans action | Composant `Button` : en développement, avertir si ni `onClick`, ni `type="submit"`, ni lien. Masquer derrière un drapeau `fonctionnalite-a-venir` chaque bouton non câblé (liste dans `03`) | ~30 pages | Robot : **0 bouton « SANS EFFET »** hors onglets actifs |
| 1.4 | BUG-011 « Nouvelle publication » | Afficher le bouton aux seuls rôles autorisés par l'API | `CommunicationsPage.jsx` | Test par rôle ; robot : plus de 403 sur « Publier » |
| 1.5 | BUG-008 Élève retiré | Invalider la liste après l'action, afficher le statut réel, message avec « Annuler », action « Réintégrer » (`eleves/{id}/activate`) | `ElevesPage.jsx` | Parcours H2 : statut « inactif », puis réintégration |
| 1.6 | BUG-010 Annuaire de la messagerie | Côté API : limiter `messages/contacts` selon le rôle (parent → enseignants de ses enfants, direction, secrétariat ; élève → ses enseignants). **Test Pest avec mutation** | `MessageController`, `MessageriePage.jsx` | Un parent ne voit ni élèves ni autres parents |
| 1.7 | BUG-012 Numéros à 10 chiffres | `normalizePhone` : accepter `01XXXXXXXX`, `+22901XXXXXXXX`, convertir les 8 chiffres ; règle de validation commune aux formulaires ; exemple de saisie mis à jour | `SmsService.php`, `FormRequest` concernés | Tests unitaires sur 8 formats |
| 1.8 | BUG-017, BUG-024 Langue et heure | `locale = fr`, fichiers `lang/fr/validation.php`, `timezone = Africa/Porto-Novo` | `config/app.php`, `lang/` | Message « Le champ titre est obligatoire. » ; un reçu porte l'heure locale |
| 1.9 | BUG-031 Fil d'Ariane | Le niveau « rôle » pointe vers le tableau de bord du rôle | `Breadcrumb.jsx` | Test : aucun lien hors table des routes |
| 1.10 | BUG-013 Données de démonstration | Parent PAR001 rattaché à l'école ; enseignant de démonstration affecté ; séries rattachées aux classes ; contrainte `NOT NULL` sur `parents.ecole_id` | `BeninEducationSeeder`, migration | PAR001 voit ses 2 enfants |
| 1.11 | BUG-005 Université | Lire l'erreur 500 dans les journaux ; corriger si simple, sinon masquer le module derrière un réglage par école | `DashboardController` | Plus de 500, ou module invisible |

**Risque :** 1.3 touche beaucoup de fichiers ; le faire par famille de pages, un commit par famille.
**Sortie du lot :** robot : 0 bouton sans effet, 0 erreur de console ; parcours C4, H2, N1 validés.

## Lot 2 — Une seule vérité pour les droits (4 à 6 j) · P1

Objectif : plus aucune page ouverte que l'API refuse (BUG-004, 006, 023 : 44 cas sur 210).

| # | Action | Détail |
|---|---|---|
| 2.1 | Décider, cas par cas, qui a raison | Tableau des 13 couples page/route en défaut (voir `04`, BUG-006). Deux issues : ouvrir la route au rôle (ex. comptable et secrétaire sur `GET eleves`, surveillant sur `GET eleves` pour l'appel) ou retirer la page du menu du rôle (ex. « Notes » pour le bibliothécaire). **Cette décision est la vôtre : c'est une règle métier** |
| 2.2 | Censeur | Routes de lecture propres (`censeur/incidents`, `censeur/absences`) ou ouverture des routes du surveillant au censeur |
| 2.3 | Admin d'école | `/admin/utilisateurs` : route adaptée à un admin limité à son école |
| 2.4 | Test de contrat | Test automatique : pour chaque rôle et chaque page de `route-config.js`, les appels de chargement répondent 2xx. Il rejoue la matrice de l'audit et échoue à la première divergence |

**Sortie :** `matrice.mjs` : **0 case ⚠**. Contrôle par mutation : rouvrir une page à un rôle non admis fait échouer le test 2.4.

## Lot 3 — Paiement (10 à 15 j) · P0/P1

Objectif : un parent voit ce qu'il doit et paie ; la comptabilité encaisse, y compris en espèces (BUG-003, BUG-025).

| # | Action | Détail |
|---|---|---|
| 3.1 | Cadrage (1 j) | Lire `PaymentController`, `ComptableController`, `FedaPayService` ; établir le schéma d'états d'un paiement (initié, en attente, payé, échoué, expiré). Obtenir des **clés de bac à sable FedaPay** — **préalable de votre côté** |
| 3.2 | Page « Mes paiements » du parent | Par enfant : total dû, payé, reste, échéances. Sur les routes parent existantes, pas sur `/comptable/…` |
| 3.3 | Payer | Montant libre (paiement partiel), opérateur MTN, Moov, **Celtiis**, numéro prérempli et validé, récapitulatif avec frais, attente claire, reprise après coupure, **impossibilité de repayer une échéance en attente** |
| 3.4 | Retour et webhook | Écran de retour ; traitement idempotent du webhook (un même avis reçu deux fois ne crédite qu'une fois) ; **test Pest avec mutation** |
| 3.5 | Comptabilité | Formulaire « Enregistrer un paiement » (espèces, chèque, virement) sur `POST comptable/paiements` ; échéancier accessible ; reçu imprimable |
| 3.6 | Reçu | Téléchargement nommé (BUG-029), et par SMS au lot 7 |

**Risques :** argent réel. Aucune mise en production sans essai complet en bac à sable, puis un essai réel d'un petit montant **autorisé explicitement par vous**.
**Sortie :** parcours « le parent paie une tranche → statut en attente → confirmation → le comptable la voit → le reçu s'ouvre », rejoué en bac à sable ; un double clic ou un double webhook ne crée qu'un paiement.

## Lot 4 — Élèves et affectations (6 à 9 j) · P0

| # | Action | Route |
|---|---|---|
| 4.1 | Formulaire d'inscription (élève, classe, parents, téléphone à 10 chiffres) et modification | `eleves/store`, `eleves/update/{id}`, `parents`, `parents/{id}/eleves` |
| 4.2 | Fiche de l'élève (identité, classe, parents, notes, paiements, absences) | lectures existantes |
| 4.3 | Invitation du parent par code | `parents/invite`, `parents/{eleveId}/generate-code` |
| 4.4 | Affectations (BUG-009) : chargement des séries et matières, message quand une liste est vide | `series/*`, `enseignants/{id}/affectations` |
| 4.5 | Export de la liste (CSV) | à vérifier |

**Sortie :** « inscrire un élève → il apparaît dans sa classe → son parent se connecte et le voit » ; un enseignant affecté voit sa classe.

## Lot 5 — Notes et bulletins (8 à 12 j) · P0/P1

| # | Action | Route |
|---|---|---|
| 5.1 | Grille de saisie par classe et évaluation : clavier (Tab, Entrée), contrôle 0–20, « absent », enregistrement automatique | `notes/bulk`, `notes/auto-save` |
| 5.2 | Brouillon hors-ligne visible : pastille « 3 notes en attente », puis « Envoyé » (BUG-018) | file `offline-queue` existante |
| 5.3 | Import d'un tableur avec aperçu et rapport d'erreurs | `notes/import-csv` |
| 5.4 | Bulletins : calcul, verrouillage, PDF, impression par classe | `bulletins/*` |
| 5.5 | Vue parent et élève des notes | lecture |

**Sortie :** « l'enseignant saisit 40 notes sans souris, coupe le réseau au milieu, les notes partent au retour → le directeur verrouille → le parent voit la note et le bulletin ».

## Lot 6 — Vie scolaire et services (10 à 15 j) · P1/P2

Par ordre de valeur ; chaque ligne est un petit formulaire sur une route existante.

| Ordre | Fonction | Route |
|---|---|---|
| 6.1 | **Appel** : présent, absent, retard en une touche par élève, utilisable hors-ligne | `surveillant/absences` |
| 6.2 | Incidents et sanctions | `surveillant/incidents`, `…/sanctions` |
| 6.3 | Emploi du temps : ajouter, modifier, supprimer un cours ; vue mobile sans débordement | `emploi-du-temps/*` |
| 6.4 | Événements et planning du secrétariat | `evenements` |
| 6.5 | Secrétariat : dossiers, courriers, certificats | `secretaire/*` |
| 6.6 | Infirmerie : consultation, dossier, vaccination | `infirmier/*` |
| 6.7 | Bibliothèque : ouvrage, emprunt, retour | `bibliothecaire/*` |
| 6.8 | Factures et exports comptables | à cadrer : aucune route d'écriture relevée pour les factures |

**Sortie :** chaque fonction a son parcours validé dans Chrome (créer, voir dans la liste, recharger, modifier).

## Lot 7 — Toucher les parents (8 à 12 j) · P1

| # | Action | Détail |
|---|---|---|
| 7.1 | SMS sur 5 événements : absence du jour, nouvelle note ou bulletin, échéance à 7 j et à 1 j, reçu, convocation | `SmsService` existant ; file d'attente ; **préalable : compte fournisseur et budget par message** |
| 7.2 | Préférences du parent (quels messages, quelle langue) | — |
| 7.3 | Connexion et mot de passe oublié par numéro de téléphone et code SMS | nouvelle route |
| 7.4 | Double authentification : codes de secours imprimables, option SMS, déblocage par le super-admin | BUG : absence de secours |
| 7.5 | Déconnexion automatique après inactivité | durée courte pour direction et comptabilité |

**Sortie :** essai avec 10 à 20 parents d'une école pilote — **seule étape qui valide réellement l'adéquation au terrain.**

## Lot 8 — Accessibilité et mobile (6 à 9 j) · P2

| # | Action | Mesure de sortie |
|---|---|---|
| 8.1 | Nom accessible sur chaque bouton à icône ; étiquette sur chaque champ | axe-core : 0 violation `button-name` et `label` |
| 8.2 | Contrastes du texte secondaire | axe-core : 0 `color-contrast` |
| 8.3 | Texte de remplacement des graphiques | 0 `svg-img-alt` |
| 8.4 | Tableaux en cartes sous 768 px ; cibles de 44 px | 0 débordement à 360 px sur les 59 pages |
| 8.5 | Focus visible, lien d'évitement fonctionnel | parcours clavier validé |
| 8.6 | Test axe-core ajouté à la suite e2e | échec de la CI à la première violation critique |

## Lot 9 — Réseau lent et hors-ligne (5 à 8 j) · P2

| # | Action | Mesure de sortie |
|---|---|---|
| 9.1 | Découper le script principal par rôle ; graphiques chargés à la demande | connexion utilisable en moins de 5 s en 3G lente (`perf.mjs`) |
| 9.2 | Message après 5 s de chargement, « Réessayer » après 15 s | plus d'indicateur sans fin |
| 9.3 | Hors-ligne : dernières données connues, datées, au lieu d'une page vide | parcours D3 validé |
| 9.4 | Mesure Lighthouse ajoutée | Core Web Vitals relevés |

## Lot 10 — Finitions (4 à 6 j) · P3

Vocabulaire unifié (« Annonces », « Messages ») · « — » au lieu de « 100 % » sans données · suppression des onglets qui doublent le menu · arabe terminé ou retiré · numéro d'aide de l'école sur la connexion · mentions sur les données personnelles (**avec un juriste**) · `FRONTEND_README.md` mis à jour · tableau « décisions » de la direction.

## Hors plan, à décider séparément

Assistant IA (BUG-015), module université au-delà de la correction du lot 1, console d'administration de la plateforme (plans, modules, marque blanche), messages vocaux en langues nationales, référentiel scolaire paramétrable, second pays. Ils restent masqués tant qu'ils ne sont pas repris.

---

## Ordre et dépendances

```
Lot 0 → Lot 1 → Lot 2 ─┬→ Lot 4 → Lot 5 ─┐
                       ├→ Lot 3 ─────────┼→ Lot 7 → pilote
                       └→ Lot 6 ─────────┘
Lots 8, 9, 10 : en parallèle à partir du lot 2
```

- Le lot 2 précède les lots 3 à 6 : inutile de construire un formulaire que l'API refuse au rôle concerné.
- Le lot 4 précède le lot 5 : pas de saisie de notes sans élèves ni affectations.
- Le lot 7 dépend des lots 3, 5 et 6 pour avoir quelque chose à notifier.

## Charge totale

| Lots | Jours-personne (fourchette) |
|---|---|
| 0 à 2 — remettre d'aplomb | 9 à 13 |
| 3 à 5 — les trois gestes essentiels | 24 à 36 |
| 6 et 7 — vie scolaire et parents | 18 à 27 |
| 8 à 10 — qualité | 15 à 23 |
| **Total** | **66 à 99**, soit 3 à 5 mois pour une personne |

## Ce qui dépend de vous avant de commencer

1. **Valider l'ordre** et le périmètre (notamment ce qui est laissé hors plan).
2. **Trancher les règles de droits du lot 2** (qui voit les élèves, les notes, l'emploi du temps).
3. **Fournir les clés de bac à sable FedaPay** et un compte de fournisseur SMS.
4. **Corriger les droits du dossier `storage/`** (commande du lot 0).
5. **Dire si l'application mobile couvre déjà certaines fonctions** : si oui, le plan se réduit côté web.
6. **Identifier une école pilote** pour le lot 7.
