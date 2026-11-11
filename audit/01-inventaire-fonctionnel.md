# 01 — Inventaire fonctionnel

## Vue d'ensemble

- Comptes parcourus : 20 (20 complets), connexions réussies : 20
- Pages distinctes atteintes : 57 ; visites de pages autorisées (page × rôle) : 196
- Tentatives d'accès refusées : 901 ; redirigées : 1
- Boutons vus (page × rôle × vue) : 2286 ; boutons distincts cliqués : 274
- Liens internes distincts dans le contenu : 27 ; champs de formulaire visibles : 324 ; onglets : 94

> Généré par `preuves/outils/generer-rapports.mjs` à partir des mesures relevées dans Google Chrome. Ne pas modifier à la main.

## admin_ecole1

- Connexion : réussie → `/admin/dashboard` en 9741 ms · 2FA : code saisi
- Liens du menu (7) : Tableau de bord `/admin/dashboard` · Utilisateurs `/admin/utilisateurs` · Journal d'audit `/admin/journal-audit` · Configuration `/admin/configuration` · Messagerie `/messagerie` · Paramètres `/parametres` · Annonces `/communications`
- Pages autorisées sans lien dans le menu : `/notes`, `/emploi-du-temps`
- Routes : 8 autorisées, 46 refusées, 0 redirigées, 5 chargements non aboutis (machine saturée)

| Page | Titre | Boutons | Onglets | Liens | Champs | Lignes de tableau | Erreurs API au chargement | Débord. 390 px |
|---|---|---|---|---|---|---|---|---|
| `/admin/dashboard` | Administration système | 5 | 5 | 1 | 0 | 0 | — | +539 px |
| `/notes` | Notes | 7 | 0 | 1 | 3 | 1 | 403 GET /api/notes/eleve | +23 px |
| `/communications` | Communications | 5 | 0 | 1 | 0 | 0 | — | — |
| `/emploi-du-temps` | _(aucun h1)_ | 0 | 0 | 1 | 0 | 0 | 403 GET /api/emploi-du-temps | — |
| `/parametres` | Paramètres | 6 | 0 | 1 | 5 | 0 | — | — |
| `/messagerie` | _(aucun h1)_ | 4 | 0 | 1 | 1 | 0 | — | — |
| `/admin/utilisateurs` | _(aucun h1)_ | 0 | 0 | 2 | 0 | 0 | 403 GET /api/v1/admin/tenants | — |
| `/admin/configuration` | Configuration | 12 | 0 | 2 | 0 | 0 | — | — |

## bibliothecaire_ecole1

- Connexion : réussie → `/bibliothecaire/dashboard` en 3300 ms
- Liens du menu (7) : Tableau de bord `/bibliothecaire/dashboard` · Catalogue `/bibliothecaire/catalogue` · Emprunts `/bibliothecaire/emprunts` · Emploi du temps `/emploi-du-temps` · Annonces `/communications` · Messagerie `/messagerie` · Paramètres `/parametres`
- Pages autorisées sans lien dans le menu : `/eleves`, `/notes`
- Routes : 6 autorisées, 45 refusées, 0 redirigées, 8 chargements non aboutis (machine saturée)

| Page | Titre | Boutons | Onglets | Liens | Champs | Lignes de tableau | Erreurs API au chargement | Débord. 390 px |
|---|---|---|---|---|---|---|---|---|
| `/bibliothecaire/dashboard` | Bibliothèque | 36 | 3 | 1 | 0 | 15 | — | — |
| `/eleves` | Élèves | 3 | 0 | 1 | 2 | 1 | 403 GET /api/eleves | — |
| `/notes` | Notes | 7 | 0 | 1 | 3 | 1 | 403 GET /api/notes/eleve | +23 px |
| `/communications` | Communications | 5 | 0 | 1 | 0 | 0 | — | — |
| `/emploi-du-temps` | _(aucun h1)_ | 0 | 0 | 1 | 0 | 0 | 403 GET /api/emploi-du-temps | — |
| `/bibliothecaire/catalogue` | Catalogue | 17 | 0 | 2 | 1 | 0 | — | — |

## censeur_ecole1

- Connexion : réussie → `/censeur/dashboard` en 3690 ms
- Liens du menu (7) : Tableau de bord `/censeur/dashboard` · Discipline `/censeur/discipline` · Absences `/censeur/absences` · Emploi du temps `/emploi-du-temps` · Annonces `/communications` · Messagerie `/messagerie` · Paramètres `/parametres`
- Pages autorisées sans lien dans le menu : `/eleves`, `/notes`
- Routes : 9 autorisées, 46 refusées, 0 redirigées, 4 chargements non aboutis (machine saturée)

| Page | Titre | Boutons | Onglets | Liens | Champs | Lignes de tableau | Erreurs API au chargement | Débord. 390 px |
|---|---|---|---|---|---|---|---|---|
| `/censeur/dashboard` | Censeur | 4 | 3 | 1 | 0 | 10 | — | — |
| `/eleves` | Élèves | 3 | 0 | 1 | 2 | 1 | 403 GET /api/eleves | — |
| `/notes` | Notes | 7 | 0 | 1 | 3 | 1 | — | +23 px |
| `/communications` | Communications | 5 | 0 | 1 | 0 | 0 | — | — |
| `/emploi-du-temps` | Emploi du temps | 4 | 0 | 1 | 3 | 0 | — | +145 px |
| `/parametres` | Paramètres | 6 | 0 | 1 | 5 | 0 | — | — |
| `/messagerie` | _(aucun h1)_ | 4 | 0 | 1 | 1 | 0 | — | — |
| `/censeur/discipline` | _(aucun h1)_ | 1 | 0 | 2 | 0 | 0 | 403 GET /api/surveillant/incidents ; 403 GET /api/surveillant/statistiques | — |
| `/censeur/absences` | _(aucun h1)_ | 1 | 0 | 2 | 0 | 0 | 403 GET /api/surveillant/absences | — |

## comptable_ecole1

- Connexion : réussie → `/comptable/dashboard` en 5185 ms · 2FA : activée pendant le test
- Liens du menu (7) : Tableau de bord `/comptable/dashboard` · Transactions `/comptable/transactions` · Factures `/comptable/factures` · Paiements `/paiements` · Annonces `/communications` · Paramètres `/parametres` · Messagerie `/messagerie`
- Pages autorisées sans lien dans le menu : `/eleves`, `/notes`, `/emploi-du-temps`, `/paiement/callback`
- Routes : 11 autorisées, 48 refusées, 0 redirigées, 0 chargements non aboutis (machine saturée)

| Page | Titre | Boutons | Onglets | Liens | Champs | Lignes de tableau | Erreurs API au chargement | Débord. 390 px |
|---|---|---|---|---|---|---|---|---|
| `/comptable/dashboard` | Comptabilité | 258 | 3 | 1 | 0 | 18 | — | — |
| `/eleves` | Élèves | 3 | 0 | 1 | 2 | 1 | 403 GET /api/eleves | — |
| `/notes` | Notes | 7 | 0 | 1 | 3 | 1 | 403 GET /api/notes/eleve | +23 px |
| `/paiements` | Paiements | 48 | 0 | 1 | 2 | 42 | — | +27 px |
| `/communications` | Communications | 5 | 0 | 1 | 0 | 0 | — | — |
| `/emploi-du-temps` | _(aucun h1)_ | 0 | 0 | 1 | 0 | 0 | 403 GET /api/emploi-du-temps | — |
| `/parametres` | Paramètres | 6 | 0 | 1 | 5 | 0 | — | — |
| `/messagerie` | _(aucun h1)_ | 4 | 0 | 1 | 1 | 0 | — | — |
| `/comptable/transactions` | Transactions | 43 | 0 | 2 | 3 | 42 | — | +33 px |
| `/comptable/factures` | Factures | 128 | 0 | 2 | 2 | 42 | — | +9 px |
| `/paiement/callback` | Confirmation indisponible | 1 | 0 | 2 | 0 | 0 | — | — |

## directeur_ecole1

- Connexion : réussie → `/directeur/dashboard` en 5049 ms · 2FA : activée pendant le test
- Liens du menu (11) : Tableau de bord `/directeur/dashboard` · Élèves `/eleves` · Affectations `/affectations` · Notes `/notes` · Emploi du temps `/emploi-du-temps` · Paiements `/paiements` · Annonces `/communications` · Journal d'audit `/admin/journal-audit` · Paramètres `/parametres` · Messagerie `/messagerie` · Assistant `/directeur/ai-insights`
- Pages autorisées sans lien dans le menu : `/paiement/callback`
- Routes : 12 autorisées, 47 refusées, 0 redirigées, 0 chargements non aboutis (machine saturée)

| Page | Titre | Boutons | Onglets | Liens | Champs | Lignes de tableau | Erreurs API au chargement | Débord. 390 px |
|---|---|---|---|---|---|---|---|---|
| `/directeur/dashboard` | Tableau de bord | 196 | 6 | 1 | 1 | 20 | — | — |
| `/eleves` | Élèves | 67 | 0 | 1 | 2 | 32 | — | — |
| `/notes` | Notes | 7 | 0 | 1 | 3 | 1 | — | +23 px |
| `/paiements` | Paiements | 48 | 0 | 1 | 2 | 42 | — | +27 px |
| `/communications` | Communications | 5 | 0 | 1 | 0 | 0 | — | — |
| `/emploi-du-temps` | Emploi du temps | 4 | 0 | 1 | 3 | 0 | — | +145 px |
| `/parametres` | Paramètres | 6 | 0 | 1 | 5 | 0 | — | — |
| `/messagerie` | _(aucun h1)_ | 4 | 0 | 1 | 1 | 0 | — | — |
| `/affectations` | Affectations des enseignants | 1 | 2 | 1 | 4 | 0 | — | — |
| `/paiement/callback` | Confirmation indisponible | 1 | 0 | 2 | 0 | 0 | — | — |
| `/directeur/ai-insights` | Tableau de bord prédictif | 7 | 0 | 2 | 1 | 0 | — | — |
| `/admin/journal-audit` | Journal d'audit | 28 | 0 | 2 | 4 | 25 | — | — |

## directeurM_ecole1

- Connexion : réussie → `/directeur/dashboard` en 3860 ms · 2FA : activée pendant le test
- Liens du menu (11) : Tableau de bord `/directeur/dashboard` · Élèves `/eleves` · Affectations `/affectations` · Notes `/notes` · Emploi du temps `/emploi-du-temps` · Paiements `/paiements` · Annonces `/communications` · Journal d'audit `/admin/journal-audit` · Paramètres `/parametres` · Messagerie `/messagerie` · Assistant `/directeur/ai-insights`
- Pages autorisées sans lien dans le menu : `/paiement/callback`
- Routes : 10 autorisées, 41 refusées, 0 redirigées, 8 chargements non aboutis (machine saturée)

| Page | Titre | Boutons | Onglets | Liens | Champs | Lignes de tableau | Erreurs API au chargement | Débord. 390 px |
|---|---|---|---|---|---|---|---|---|
| `/directeur/dashboard` | Tableau de bord | 18 | 6 | 1 | 1 | 3 | — | — |
| `/eleves` | Élèves | 15 | 0 | 1 | 2 | 6 | — | — |
| `/notes` | Notes | 7 | 0 | 1 | 3 | 1 | — | +23 px |
| `/paiements` | Paiements | 14 | 0 | 1 | 2 | 8 | — | +27 px |
| `/emploi-du-temps` | Emploi du temps | 4 | 0 | 1 | 3 | 0 | — | +145 px |
| `/parametres` | Paramètres | 6 | 0 | 1 | 5 | 0 | — | — |
| `/messagerie` | _(aucun h1)_ | 4 | 0 | 1 | 1 | 0 | — | — |
| `/paiement/callback` | Confirmation indisponible | 1 | 0 | 2 | 0 | 0 | — | — |
| `/directeur/ai-insights` | Assistant IA | 7 | 0 | 2 | 1 | 0 | — | — |
| `/admin/journal-audit` | Journal d'audit | 28 | 0 | 2 | 4 | 25 | — | — |

## directeurP_ecole1

- Connexion : réussie → `/directeur/dashboard` en 3820 ms · 2FA : activée pendant le test
- Liens du menu (11) : Tableau de bord `/directeur/dashboard` · Élèves `/eleves` · Affectations `/affectations` · Notes `/notes` · Emploi du temps `/emploi-du-temps` · Paiements `/paiements` · Annonces `/communications` · Journal d'audit `/admin/journal-audit` · Paramètres `/parametres` · Messagerie `/messagerie` · Assistant `/directeur/ai-insights`
- Pages autorisées sans lien dans le menu : `/paiement/callback`
- Routes : 12 autorisées, 44 refusées, 0 redirigées, 3 chargements non aboutis (machine saturée)

| Page | Titre | Boutons | Onglets | Liens | Champs | Lignes de tableau | Erreurs API au chargement | Débord. 390 px |
|---|---|---|---|---|---|---|---|---|
| `/directeur/dashboard` | Tableau de bord | 6 | 6 | 1 | 1 | 5 | — | — |
| `/eleves` | Élèves | 23 | 0 | 1 | 2 | 10 | — | — |
| `/notes` | Notes | 7 | 0 | 1 | 3 | 1 | — | +23 px |
| `/paiements` | Paiements | 17 | 0 | 1 | 2 | 11 | — | +27 px |
| `/communications` | Communications | 5 | 0 | 1 | 0 | 0 | — | — |
| `/emploi-du-temps` | Emploi du temps | 4 | 0 | 1 | 3 | 0 | — | +56 px |
| `/parametres` | Paramètres | 6 | 0 | 1 | 5 | 0 | — | — |
| `/messagerie` | _(aucun h1)_ | 4 | 0 | 1 | 1 | 0 | — | — |
| `/affectations` | Affectations des enseignants | 1 | 2 | 1 | 4 | 0 | — | — |
| `/paiement/callback` | Confirmation indisponible | 1 | 0 | 2 | 0 | 0 | — | — |
| `/directeur/ai-insights` | Assistant IA | 7 | 0 | 2 | 1 | 0 | — | — |
| `/admin/journal-audit` | Journal d'audit | 28 | 0 | 2 | 4 | 25 | — | — |

## directeurS_ecole1

- Connexion : réussie → `/directeur/dashboard` en 9779 ms · 2FA : code saisi
- Liens du menu (11) : Tableau de bord `/directeur/dashboard` · Élèves `/eleves` · Affectations `/affectations` · Notes `/notes` · Emploi du temps `/emploi-du-temps` · Paiements `/paiements` · Annonces `/communications` · Journal d'audit `/admin/journal-audit` · Paramètres `/parametres` · Messagerie `/messagerie` · Assistant `/directeur/ai-insights`
- Pages autorisées sans lien dans le menu : `/paiement/callback`
- Routes : 12 autorisées, 42 refusées, 0 redirigées, 5 chargements non aboutis (machine saturée)

| Page | Titre | Boutons | Onglets | Liens | Champs | Lignes de tableau | Erreurs API au chargement | Débord. 390 px |
|---|---|---|---|---|---|---|---|---|
| `/directeur/dashboard` | Tableau de bord | 84 | 6 | 1 | 1 | 12 | — | — |
| `/eleves` | Élèves | 35 | 0 | 1 | 2 | 16 | — | — |
| `/notes` | _(aucun h1)_ | 7 | 0 | 1 | 0 | 0 | — | +23 px |
| `/paiements` | Paiements | 29 | 0 | 1 | 2 | 23 | — | +27 px |
| `/communications` | Communications | 5 | 0 | 1 | 0 | 0 | — | — |
| `/emploi-du-temps` | Emploi du temps | 4 | 0 | 1 | 3 | 0 | — | +78 px |
| `/parametres` | Paramètres | 6 | 0 | 1 | 5 | 0 | — | — |
| `/messagerie` | _(aucun h1)_ | 4 | 0 | 1 | 1 | 0 | — | — |
| `/affectations` | Affectations des enseignants | 1 | 2 | 1 | 4 | 0 | — | — |
| `/paiement/callback` | Confirmation indisponible | 1 | 0 | 2 | 0 | 0 | — | — |
| `/directeur/ai-insights` | Assistant IA | 7 | 0 | 2 | 1 | 0 | — | — |
| `/admin/journal-audit` | Journal d'audit | 28 | 0 | 2 | 4 | 25 | — | — |

## doyen_faculte1

- Connexion : réussie → `/universite/dashboard` en 2410 ms
- Liens du menu (10) : Tableau de bord `/universite/dashboard` · Départements `/universite/departements` · Étudiants `/universite/etudiants` · Cours `/universite/cours` · Emploi du temps `/emploi-du-temps` · Annonces `/communications` · Messagerie `/messagerie` · Paramètres `/parametres` · Facultés `/universite/facultes` · Enseignants `/universite/enseignants`
- Pages autorisées sans lien dans le menu : `/notes`
- Routes : 11 autorisées, 44 refusées, 0 redirigées, 4 chargements non aboutis (machine saturée)

| Page | Titre | Boutons | Onglets | Liens | Champs | Lignes de tableau | Erreurs API au chargement | Débord. 390 px |
|---|---|---|---|---|---|---|---|---|
| `/notes` | Notes | 7 | 0 | 1 | 3 | 1 | 403 GET /api/notes/eleve | +23 px |
| `/communications` | Communications | 5 | 0 | 1 | 0 | 0 | — | — |
| `/emploi-du-temps` | _(aucun h1)_ | 0 | 0 | 1 | 0 | 0 | 403 GET /api/emploi-du-temps | — |
| `/parametres` | Paramètres | 6 | 0 | 1 | 5 | 0 | — | — |
| `/messagerie` | _(aucun h1)_ | 4 | 0 | 1 | 1 | 0 | — | — |
| `/universite/facultes` | Facultés | 1 | 0 | 2 | 1 | 0 | — | — |
| `/universite/departements` | Départements | 9 | 0 | 2 | 2 | 0 | — | — |
| `/universite/etudiants` | Étudiants | 15 | 0 | 2 | 1 | 12 | — | — |
| `/universite/enseignants` | Enseignants | 1 | 0 | 2 | 1 | 0 | — | — |
| `/universite/cours` | Erreur serveur | 1 | 0 | 3 | 0 | 0 | — | +27 px |
| `/universite/dashboard` | Université | 25 | 5 | 1 | 0 | 0 | 500 GET /api/dashboard/universite | — |

## EL001

- Connexion : réussie → `/eleve/dashboard` en 2345 ms
- Liens du menu (9) : Tableau de bord `/eleve/dashboard` · Matières `/eleve/cours` · Emploi du temps `/emploi-du-temps` · Notes `/notes` · Paiements `/paiements` · Annonces `/communications` · Paramètres `/parametres` · Messagerie `/messagerie` · Assistant `/eleve/tutor`
- Pages autorisées sans lien dans le menu : `/paiement/callback`
- Routes : 10 autorisées, 39 refusées, 0 redirigées, 10 chargements non aboutis (machine saturée)

| Page | Titre | Boutons | Onglets | Liens | Champs | Lignes de tableau | Erreurs API au chargement | Débord. 390 px |
|---|---|---|---|---|---|---|---|---|
| `/eleve/dashboard` | Mon espace élève | 10 | 4 | 1 | 0 | 0 | — | — |
| `/notes` | Notes | 7 | 0 | 1 | 3 | 1 | — | +23 px |
| `/paiements` | Paiements | 6 | 0 | 1 | 2 | 1 | 403 GET /api/comptable/paiements | +27 px |
| `/communications` | Communications | 5 | 0 | 1 | 0 | 0 | — | — |
| `/emploi-du-temps` | Emploi du temps | 4 | 0 | 1 | 3 | 0 | — | +145 px |
| `/parametres` | Paramètres | 6 | 0 | 1 | 5 | 0 | — | — |
| `/messagerie` | _(aucun h1)_ | 4 | 0 | 1 | 1 | 0 | — | — |
| `/eleve/cours` | Mes cours | 0 | 0 | 2 | 3 | 0 | — | — |
| `/paiement/callback` | Confirmation indisponible | 1 | 0 | 2 | 0 | 0 | — | — |
| `/eleve/tutor` | Tuteur IA | 7 | 0 | 2 | 1 | 0 | — | — |

## enseignant_ecole1

- Connexion : réussie → `/enseignant/dashboard` en 2300 ms
- Liens du menu (9) : Tableau de bord `/enseignant/dashboard` · Classes `/enseignant/classes` · Élèves `/eleves` · Notes `/notes` · Emploi du temps `/emploi-du-temps` · Annonces `/communications` · Paramètres `/parametres` · Messagerie `/messagerie` · Assistant `/enseignant/ai-assistant`
- Routes : 9 autorisées, 47 refusées, 0 redirigées, 3 chargements non aboutis (machine saturée)

| Page | Titre | Boutons | Onglets | Liens | Champs | Lignes de tableau | Erreurs API au chargement | Débord. 390 px |
|---|---|---|---|---|---|---|---|---|
| `/enseignant/dashboard` | Mon espace enseignant | 5 | 6 | 1 | 0 | 0 | — | — |
| `/eleves` | Élèves | 67 | 0 | 1 | 2 | 32 | — | — |
| `/notes` | Notes | 7 | 0 | 1 | 3 | 1 | — | +23 px |
| `/communications` | Communications | 5 | 0 | 1 | 0 | 0 | — | — |
| `/emploi-du-temps` | Emploi du temps | 4 | 0 | 1 | 3 | 0 | — | +145 px |
| `/parametres` | Paramètres | 21 | 0 | 1 | 7 | 0 | — | — |
| `/messagerie` | _(aucun h1)_ | 4 | 0 | 1 | 1 | 0 | — | — |
| `/enseignant/classes` | Mes classes | 0 | 0 | 2 | 0 | 0 | — | — |
| `/enseignant/ai-assistant` | Assistant pédagogique IA | 7 | 0 | 2 | 1 | 0 | — | — |

## infirmier_ecole1

- Connexion : réussie → `/infirmier/dashboard` en 2459 ms
- Liens du menu (7) : Tableau de bord `/infirmier/dashboard` · Soins du jour `/infirmier/soins` · Dossiers médicaux `/infirmier/dossiers` · Emploi du temps `/emploi-du-temps` · Annonces `/communications` · Messagerie `/messagerie` · Paramètres `/parametres`
- Pages autorisées sans lien dans le menu : `/eleves`, `/notes`
- Routes : 9 autorisées, 45 refusées, 0 redirigées, 5 chargements non aboutis (machine saturée)

| Page | Titre | Boutons | Onglets | Liens | Champs | Lignes de tableau | Erreurs API au chargement | Débord. 390 px |
|---|---|---|---|---|---|---|---|---|
| `/infirmier/dashboard` | Infirmerie | 28 | 3 | 1 | 0 | 18 | — | — |
| `/eleves` | Élèves | 3 | 0 | 1 | 2 | 1 | 403 GET /api/eleves | — |
| `/notes` | Notes | 7 | 0 | 1 | 3 | 1 | 403 GET /api/notes/eleve | +23 px |
| `/communications` | Communications | 5 | 0 | 1 | 0 | 0 | — | — |
| `/emploi-du-temps` | _(aucun h1)_ | 0 | 0 | 1 | 0 | 0 | 403 GET /api/emploi-du-temps | — |
| `/parametres` | Paramètres | 6 | 0 | 1 | 5 | 0 | — | — |
| `/messagerie` | _(aucun h1)_ | 4 | 0 | 1 | 0 | 0 | — | — |
| `/infirmier/soins` | Soins infirmiers | 13 | 0 | 2 | 3 | 0 | — | — |
| `/infirmier/dossiers` | Dossiers médicaux | 43 | 0 | 2 | 2 | 0 | — | — |

## PAR001

- Connexion : réussie → `/parent/dashboard` en 2461 ms
- Liens du menu (8) : Tableau de bord `/parent/dashboard` · Mes enfants `/parent/enfants` · Notes `/notes` · Paiements `/paiements` · Annonces `/communications` · Paramètres `/parametres` · Messagerie `/messagerie` · Assistant `/parent/ai-report`
- Pages autorisées sans lien dans le menu : `/eleves`, `/paiement/callback`
- Routes : 10 autorisées, 45 refusées, 0 redirigées, 4 chargements non aboutis (machine saturée)

| Page | Titre | Boutons | Onglets | Liens | Champs | Lignes de tableau | Erreurs API au chargement | Débord. 390 px |
|---|---|---|---|---|---|---|---|---|
| `/parent/dashboard` | Espace parent | 26 | 5 | 1 | 0 | 0 | — | — |
| `/eleves` | Élèves | 3 | 0 | 1 | 2 | 1 | 403 GET /api/eleves | — |
| `/notes` | Notes | 7 | 0 | 1 | 3 | 1 | — | +23 px |
| `/paiements` | Paiements | 6 | 0 | 1 | 2 | 1 | 403 GET /api/comptable/paiements | +27 px |
| `/communications` | Communications | 5 | 0 | 1 | 0 | 0 | — | — |
| `/parametres` | Paramètres | 6 | 0 | 1 | 5 | 0 | — | — |
| `/messagerie` | _(aucun h1)_ | 4 | 0 | 1 | 1 | 0 | — | — |
| `/parent/enfants` | Mes enfants | 0 | 0 | 2 | 0 | 0 | — | — |
| `/paiement/callback` | Confirmation indisponible | 1 | 0 | 2 | 0 | 0 | — | — |
| `/parent/ai-report` | Assistant parental | 7 | 0 | 2 | 1 | 0 | — | — |

## perso_bossou-marcellin

- Connexion : réussie → `/universite/dashboard` en 2357 ms
- Liens du menu (7) : Tableau de bord `/universite/dashboard` · Tâches `/universite/taches` · Planning `/universite/planning` · Emploi du temps `/emploi-du-temps` · Annonces `/communications` · Messagerie `/messagerie` · Paramètres `/parametres`
- Pages autorisées sans lien dans le menu : `/notes`
- Routes : 7 autorisées, 50 refusées, 0 redirigées, 2 chargements non aboutis (machine saturée)

| Page | Titre | Boutons | Onglets | Liens | Champs | Lignes de tableau | Erreurs API au chargement | Débord. 390 px |
|---|---|---|---|---|---|---|---|---|
| `/notes` | Notes | 7 | 0 | 1 | 3 | 1 | 403 GET /api/notes/eleve | +23 px |
| `/communications` | Communications | 5 | 0 | 1 | 0 | 0 | — | — |
| `/parametres` | Paramètres | 6 | 0 | 1 | 5 | 0 | — | — |
| `/messagerie` | _(aucun h1)_ | 4 | 0 | 1 | 1 | 0 | — | — |
| `/universite/taches` | Tâches | 1 | 0 | 2 | 2 | 0 | — | — |
| `/universite/planning` | Planning | 9 | 0 | 2 | 1 | 0 | — | — |
| `/universite/dashboard` | Université | 4 | 5 | 1 | 0 | 0 | 500 GET /api/dashboard/universite | — |

## prof_agbodjan-fifame

- Connexion : réussie → `/universite/dashboard` en 2306 ms
- Liens du menu (10) : Tableau de bord `/universite/dashboard` · Mes cours `/universite/mes-cours` · Étudiants `/universite/etudiants` · Notes `/universite/notes` · Emploi du temps `/emploi-du-temps` · Annonces `/communications` · Messagerie `/messagerie` · Paramètres `/parametres` · Enseignants `/universite/enseignants` · Cours `/universite/cours`
- Pages autorisées sans lien dans le menu : `/notes`
- Routes : 11 autorisées, 48 refusées, 0 redirigées, 0 chargements non aboutis (machine saturée)

| Page | Titre | Boutons | Onglets | Liens | Champs | Lignes de tableau | Erreurs API au chargement | Débord. 390 px |
|---|---|---|---|---|---|---|---|---|
| `/notes` | Notes | 7 | 0 | 1 | 3 | 1 | 403 GET /api/notes/eleve | +23 px |
| `/communications` | Communications | 5 | 0 | 1 | 0 | 0 | — | — |
| `/emploi-du-temps` | _(aucun h1)_ | 0 | 0 | 1 | 0 | 0 | 403 GET /api/emploi-du-temps | — |
| `/parametres` | Paramètres | 6 | 0 | 1 | 5 | 0 | — | — |
| `/messagerie` | _(aucun h1)_ | 4 | 0 | 1 | 1 | 0 | — | — |
| `/universite/etudiants` | Étudiants | 15 | 0 | 2 | 1 | 12 | — | — |
| `/universite/enseignants` | _(aucun h1)_ | 0 | 0 | 2 | 0 | 0 | 403 GET /api/universite/enseignants | — |
| `/universite/cours` | Erreur serveur | 1 | 0 | 3 | 0 | 0 | — | +27 px |
| `/universite/mes-cours` | Mes cours | 6 | 0 | 2 | 1 | 0 | — | — |
| `/universite/notes` | Notes | 17 | 0 | 2 | 2 | 15 | — | — |
| `/universite/dashboard` | Université | 4 | 5 | 1 | 0 | 0 | 500 GET /api/dashboard/universite | — |

## recteur_universite

- Connexion : réussie → `/universite/dashboard` en 2444 ms
- Liens du menu (9) : Tableau de bord `/universite/dashboard` · Facultés `/universite/facultes` · Étudiants `/universite/etudiants` · Cours `/universite/cours` · Emploi du temps `/emploi-du-temps` · Annonces `/communications` · Paramètres `/parametres` · Messagerie `/messagerie` · Enseignants `/universite/enseignants`
- Pages autorisées sans lien dans le menu : `/notes`
- Routes : 9 autorisées, 46 refusées, 0 redirigées, 4 chargements non aboutis (machine saturée)

| Page | Titre | Boutons | Onglets | Liens | Champs | Lignes de tableau | Erreurs API au chargement | Débord. 390 px |
|---|---|---|---|---|---|---|---|---|
| `/notes` | Notes | 7 | 0 | 1 | 3 | 1 | 403 GET /api/notes/eleve | +23 px |
| `/communications` | Communications | 5 | 0 | 1 | 0 | 0 | — | — |
| `/emploi-du-temps` | _(aucun h1)_ | 0 | 0 | 1 | 0 | 0 | 403 GET /api/emploi-du-temps | — |
| `/parametres` | Paramètres | 6 | 0 | 1 | 5 | 0 | — | — |
| `/universite/facultes` | Facultés | 1 | 0 | 2 | 1 | 0 | — | — |
| `/universite/etudiants` | Étudiants | 15 | 0 | 2 | 1 | 12 | — | — |
| `/universite/enseignants` | Enseignants | 1 | 0 | 2 | 1 | 0 | — | — |
| `/universite/cours` | Erreur serveur | 1 | 0 | 3 | 0 | 0 | — | +27 px |
| `/universite/dashboard` | Université | 25 | 5 | 1 | 0 | 0 | 500 GET /api/dashboard/universite | — |

## secretaire_ecole1

- Connexion : réussie → `/secretaire/dashboard` en 2557 ms
- Liens du menu (8) : Tableau de bord `/secretaire/dashboard` · Inscriptions `/secretaire/inscriptions` · Élèves `/eleves` · Planning `/secretaire/planning` · Documents `/secretaire/documents` · Annonces `/communications` · Paramètres `/parametres` · Messagerie `/messagerie`
- Pages autorisées sans lien dans le menu : `/notes`, `/paiements`, `/emploi-du-temps`, `/paiement/callback`
- Routes : 11 autorisées, 46 refusées, 0 redirigées, 2 chargements non aboutis (machine saturée)

| Page | Titre | Boutons | Onglets | Liens | Champs | Lignes de tableau | Erreurs API au chargement | Débord. 390 px |
|---|---|---|---|---|---|---|---|---|
| `/secretaire/dashboard` | Secrétariat | 37 | 4 | 1 | 0 | 13 | — | — |
| `/eleves` | Élèves | 3 | 0 | 1 | 2 | 1 | 403 GET /api/eleves | — |
| `/notes` | Notes | 7 | 0 | 1 | 3 | 1 | 403 GET /api/notes/eleve | +23 px |
| `/paiements` | Paiements | 6 | 0 | 1 | 2 | 1 | 403 GET /api/comptable/paiements | +27 px |
| `/communications` | Communications | 5 | 0 | 1 | 0 | 0 | — | — |
| `/emploi-du-temps` | Emploi du temps | 4 | 0 | 1 | 3 | 0 | — | +145 px |
| `/parametres` | Paramètres | 6 | 0 | 1 | 5 | 0 | — | — |
| `/messagerie` | _(aucun h1)_ | 4 | 0 | 1 | 1 | 0 | — | — |
| `/secretaire/planning` | _(aucun h1)_ | 0 | 0 | 2 | 0 | 0 | 403 GET /api/evenements | — |
| `/secretaire/documents` | Courriers | 2 | 0 | 2 | 2 | 1 | — | — |
| `/paiement/callback` | Confirmation indisponible | 1 | 0 | 2 | 0 | 0 | — | — |

## super-admin@ecole.bj

- Connexion : réussie → `/admin/dashboard` en 12257 ms · 2FA : code saisi
- Liens du menu (12) : Écoles `/admin/ecoles` · Tableau de bord `/admin/dashboard` · Utilisateurs `/admin/utilisateurs` · Statistiques `/admin/statistiques` · Abonnements `/admin/plans` · Facturation `/admin/billing` · Modules `/admin/modules` · Identité visuelle `/admin/white-label` · Configuration `/admin/configuration` · Messagerie `/messagerie` · Paramètres `/parametres` · Annonces `/communications`
- Pages autorisées sans lien dans le menu : `/notes`, `/admin/journal-audit`
- Routes : 13 autorisées, 38 refusées, 0 redirigées, 8 chargements non aboutis (machine saturée)

| Page | Titre | Boutons | Onglets | Liens | Champs | Lignes de tableau | Erreurs API au chargement | Débord. 390 px |
|---|---|---|---|---|---|---|---|---|
| `/admin/dashboard` | Administration système | 25 | 5 | 1 | 0 | 0 | — | +539 px |
| `/notes` | Notes | 7 | 0 | 1 | 3 | 1 | 403 GET /api/notes/eleve | +23 px |
| `/parametres` | Paramètres | 6 | 0 | 1 | 5 | 0 | — | — |
| `/messagerie` | _(aucun h1)_ | 4 | 0 | 1 | 1 | 0 | — | — |
| `/admin/ecoles` | Écoles | 4 | 0 | 2 | 2 | 0 | — | — |
| `/admin/utilisateurs` | Utilisateurs | 2 | 0 | 2 | 3 | 1 | — | — |
| `/admin/statistiques` | Statistiques | 0 | 0 | 2 | 0 | 0 | — | — |
| `/admin/configuration` | Configuration | 12 | 0 | 2 | 0 | 0 | — | — |
| `/admin/journal-audit` | Journal d'audit | 1 | 0 | 2 | 4 | 0 | — | — |
| `/admin/plans` | Plans d'abonnement | 1 | 0 | 2 | 0 | 0 | — | — |
| `/admin/billing` | Facturation | 1 | 0 | 2 | 1 | 0 | — | +18 px |
| `/admin/modules` | Modules | 1 | 0 | 2 | 0 | 0 | — | — |
| `/admin/white-label` | White-Label | 9 | 0 | 2 | 4 | 0 | — | — |

## surveillant_ecole1

- Connexion : réussie → `/surveillant/dashboard` en 2454 ms
- Liens du menu (7) : Tableau de bord `/surveillant/dashboard` · Surveillance `/surveillant/surveillance` · Présences `/surveillant/presences` · Emploi du temps `/emploi-du-temps` · Annonces `/communications` · Messagerie `/messagerie` · Paramètres `/parametres`
- Pages autorisées sans lien dans le menu : `/eleves`, `/universite/notes`
- Routes : 9 autorisées, 48 refusées, 0 redirigées, 2 chargements non aboutis (machine saturée)

| Page | Titre | Boutons | Onglets | Liens | Champs | Lignes de tableau | Erreurs API au chargement | Débord. 390 px |
|---|---|---|---|---|---|---|---|---|
| `/surveillant/dashboard` | Surveillance | 34 | 3 | 1 | 0 | 16 | — | — |
| `/eleves` | Élèves | 3 | 0 | 1 | 2 | 1 | 403 GET /api/eleves | — |
| `/communications` | Communications | 5 | 0 | 1 | 0 | 0 | — | — |
| `/emploi-du-temps` | Emploi du temps | 4 | 0 | 1 | 3 | 0 | — | +145 px |
| `/parametres` | Paramètres | 6 | 0 | 1 | 5 | 0 | — | — |
| `/messagerie` | _(aucun h1)_ | 4 | 0 | 1 | 1 | 0 | — | — |
| `/surveillant/surveillance` | Surveillance | 11 | 0 | 2 | 1 | 0 | — | — |
| `/surveillant/presences` | Présences | 16 | 0 | 2 | 3 | 15 | 403 GET /api/eleves | — |
| `/universite/notes` | Accès non autorisé | 0 | 0 | 1 | 0 | 0 | — | — |

## uac2024001

- Connexion : réussie → `/universite/dashboard` en 2641 ms
- Liens du menu (7) : Tableau de bord `/universite/dashboard` · Mes cours `/universite/mes-cours` · Notes `/universite/notes` · Emploi du temps `/emploi-du-temps` · Annonces `/communications` · Messagerie `/messagerie` · Paramètres `/parametres`
- Pages autorisées sans lien dans le menu : `/notes`, `/eleve/cours`
- Routes : 7 autorisées, 46 refusées, 1 redirigées, 5 chargements non aboutis (machine saturée)

| Page | Titre | Boutons | Onglets | Liens | Champs | Lignes de tableau | Erreurs API au chargement | Débord. 390 px |
|---|---|---|---|---|---|---|---|---|
| `/notes` | Notes | 7 | 0 | 1 | 3 | 1 | 403 GET /api/notes/eleve | +23 px |
| `/communications` | Communications | 5 | 0 | 1 | 0 | 0 | — | — |
| `/parametres` | Paramètres | 6 | 0 | 1 | 5 | 0 | — | — |
| `/messagerie` | _(aucun h1)_ | 4 | 0 | 1 | 1 | 0 | — | — |
| `/eleve/cours` | _(aucun h1)_ | 0 | 0 | 2 | 0 | 0 | 403 GET /api/eleves/me/cours | — |
| `/universite/mes-cours` | Mes cours | 10 | 0 | 2 | 1 | 0 | — | — |
| `/universite/notes` | _(aucun h1)_ | 0 | 0 | 2 | 0 | 0 | 403 GET /api/universite/notes | — |


## Matrice d'accès (version de production, un navigateur par groupe)

✔ = page ouverte · ⚠ = page ouverte mais l'API refuse ou échoue · vide = accès refusé (redirigé vers « Accès non autorisé »).

| Route | EL001 | PAR001 | admin | bibliothecaire | censeur | comptable | directeurM | directeurP | directeurS | directeur | doyen | enseignant | infirmier | perso | prof | recteur | secretaire | super-admin | surveillant | etudiant |
|---|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| `/directeur/dashboard` |  |  |  |  |  |  | ✔ | ✔ | ✔ | ✔ |  |  |  |  |  |  |  |  |  |  |
| `/enseignant/dashboard` |  |  |  |  |  |  |  |  |  |  |  | ✔ |  |  |  |  |  |  |  |  |
| `/eleve/dashboard` | ✔ |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| `/parent/dashboard` |  | ✔ |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| `/admin/dashboard` |  |  | ✔ |  |  |  |  |  |  |  |  |  |  |  |  |  |  | ✔ |  |  |
| `/comptable/dashboard` |  |  |  |  |  | ✔ |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| `/surveillant/dashboard` |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | ✔ |  |
| `/censeur/dashboard` |  |  |  |  | ✔ |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| `/infirmier/dashboard` |  |  |  |  |  |  |  |  |  |  |  |  | ✔ |  |  |  |  |  |  |  |
| `/bibliothecaire/dashboard` |  |  |  | ✔ |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| `/secretaire/dashboard` |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | ✔ |  |  |  |
| `/eleves` |  | ⚠ |  | ⚠ | ⚠ | ⚠ | ✔ | ✔ | ✔ | ✔ |  | ✔ | ⚠ |  |  |  | ⚠ |  | ⚠ |  |
| `/notes` | ✔ | ✔ | ⚠ | ⚠ | ✔ | ⚠ | ✔ | ✔ | ✔ | ✔ | ⚠ | ✔ | ⚠ | ⚠ | ⚠ | ⚠ | ⚠ | ⚠ | ⚠ | ⚠ |
| `/paiements` | ⚠ | ⚠ |  |  |  | ✔ | ✔ | ✔ | ✔ | ✔ |  |  |  |  |  |  | ⚠ |  |  |  |
| `/communications` | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ |
| `/emploi-du-temps` | ✔ | ✔ | ⚠ | ⚠ | ✔ | ⚠ | ✔ | ✔ | ✔ | ✔ | ⚠ | ✔ | ⚠ | ⚠ | ⚠ | ⚠ | ✔ | ✔ | ✔ | ⚠ |
| `/parametres` | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ |
| `/messagerie` | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ |
| `/affectations` |  |  |  |  |  |  | ✔ | ✔ | ✔ | ✔ |  |  |  |  |  |  |  |  |  |  |
| `/enseignant/classes` |  |  |  |  |  |  |  |  |  |  |  | ✔ |  |  |  |  |  |  |  |  |
| `/parent/enfants` |  | ✔ |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| `/eleve/cours` | ✔ |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | ⚠ |
| `/comptable/transactions` |  |  |  |  |  | ✔ |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| `/comptable/factures` |  |  |  |  |  | ✔ |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| `/surveillant/surveillance` |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | ✔ |  |
| `/surveillant/presences` |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | ⚠ |  |
| `/censeur/discipline` |  |  |  |  | ⚠ |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| `/censeur/absences` |  |  |  |  | ⚠ |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| `/infirmier/soins` |  |  |  |  |  |  |  |  |  |  |  |  | ✔ |  |  |  |  |  |  |  |
| `/infirmier/dossiers` |  |  |  |  |  |  |  |  |  |  |  |  | ✔ |  |  |  |  |  |  |  |
| `/bibliothecaire/catalogue` |  |  |  | ✔ |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| `/bibliothecaire/emprunts` |  |  |  | ✔ |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| `/secretaire/inscriptions` |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | ✔ |  |  |  |
| `/secretaire/planning` |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | ⚠ |  |  |  |
| `/secretaire/documents` |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | ✔ |  |  |  |
| `/universite/facultes` |  |  |  |  |  |  |  |  |  |  | ✔ |  |  |  |  | ✔ |  |  |  |  |
| `/universite/departements` |  |  |  |  |  |  |  |  |  |  | ✔ |  |  |  |  |  |  |  |  |  |
| `/universite/etudiants` |  |  |  |  |  |  |  |  |  |  | ✔ |  |  |  | ✔ | ✔ |  |  |  |  |
| `/universite/enseignants` |  |  |  |  |  |  |  |  |  |  | ✔ |  |  |  | ⚠ | ✔ |  |  |  |  |
| `/universite/cours` |  |  |  |  |  |  |  |  |  |  | ✔ |  |  |  | ✔ | ✔ |  |  |  |  |
| `/universite/mes-cours` |  |  |  |  |  |  |  |  |  |  |  |  |  |  | ✔ |  |  |  |  | ✔ |
| `/universite/notes` |  |  |  |  |  |  |  |  |  |  |  |  |  |  | ✔ |  |  |  |  | ⚠ |
| `/universite/taches` |  |  |  |  |  |  |  |  |  |  |  |  |  | ✔ |  |  |  |  |  |  |
| `/universite/planning` |  |  |  |  |  |  |  |  |  |  |  |  |  | ✔ |  |  |  |  |  |  |
| `/universite/dashboard` |  |  |  |  |  |  |  |  |  |  | ⚠ |  |  | ⚠ | ⚠ | ⚠ |  |  |  | ⚠ |
| `/paiement/callback` | ✔ | ✔ |  |  |  | ✔ | ✔ | ✔ | ✔ | ✔ |  |  |  |  |  |  | ✔ |  |  |  |
| `/directeur/ai-insights` |  |  |  |  |  |  | ✔ | ✔ | ✔ | ✔ |  |  |  |  |  |  |  |  |  |  |
| `/enseignant/ai-assistant` |  |  |  |  |  |  |  |  |  |  |  | ✔ |  |  |  |  |  |  |  |  |
| `/parent/ai-report` |  | ✔ |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| `/eleve/tutor` | ✔ |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| `/admin/ecoles` |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | ✔ |  |  |
| `/admin/utilisateurs` |  |  | ⚠ |  |  |  |  |  |  |  |  |  |  |  |  |  |  | ✔ |  |  |
| `/admin/statistiques` |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | ✔ |  |  |
| `/admin/configuration` |  |  | ✔ |  |  |  |  |  |  |  |  |  |  |  |  |  |  | ✔ |  |  |
| `/admin/journal-audit` |  |  | ✔ |  |  |  | ✔ | ✔ | ✔ | ✔ |  |  |  |  |  |  |  | ✔ |  |  |
| `/admin/plans` |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | ✔ |  |  |
| `/admin/billing` |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | ✔ |  |  |
| `/admin/modules` |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | ✔ |  |  |
| `/admin/white-label` |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | ✔ |  |  |
