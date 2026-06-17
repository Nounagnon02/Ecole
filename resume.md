# Projet Ecole — Résumé

> **Plateforme de gestion scolaire complète** — Maternelle, Primaire, Secondaire & Université
>
> Dernière mise à jour : 16 juin 2026

---

## 🎯 Objectif

Système de gestion intégré couvrant l'ensemble du cycle scolaire : de la maternelle à l'université. Gère les inscriptions, notes, emplois du temps, paiements, messagerie, cahier de texte, bibliothèque, infirmerie, transports, etc.

## 🏗 Stack Technique

| Couche | Technologie | Version |
|--------|-------------|---------|
| **Frontend** | React + Vite | React 18.2, Vite 5.4 |
| **Backend** | Laravel (API REST) | Laravel 10 |
| **Base de données** | MySQL | — |
| **Tests frontend** | Vitest + Testing Library | Vitest 1.6 |
| **Build/Bundler** | Vite | 5.4 |
| **Authentification** | Laravel Sanctum (token-based) | — |

## 👥 Rôles & Utilisateurs (20 rôles)

### École (Maternelle/Primaire/Secondaire)
| Rôle | Dashboard | Description |
|------|-----------|-------------|
| `directeur` | `/directeur/dashboard` | Directeur général |
| `directeurM` | `/maternelle/dashboard` | Directeur maternelle |
| `directeurP` | `/primaire/dashboard` | Directeur primaire |
| `directeurS` | `/secondaire/dashboard` | Directeur secondaire |
| `enseignant` | `/enseignant/dashboard` | Enseignant |
| `enseignement` | `/enseignant/secondaire` | Enseignant secondaire |
| `enseignementM` | `/enseignant/maternelle` | Enseignant maternelle |
| `enseignementP` | `/enseignant/primaire` | Enseignant primaire |
| `eleve` | `/eleve/dashboard` | Élève |
| `parent` | `/parent/dashboard` | Parent d'élève |
| `comptable` | `/comptable/dashboard` | Comptable |
| `surveillant` | `/surveillant/dashboard` | Surveillant |
| `censeur` | `/censeur/dashboard` | Censeur |
| `infirmier` | `/infirmier/dashboard` | Infirmier scolaire |
| `bibliothecaire` | `/bibliothecaire/dashboard` | Bibliothécaire |
| `secretaire` | `/secretaire/dashboard` | Secrétaire |

### Université
| Rôle | Dashboard | Description |
|------|-----------|-------------|
| `recteur` | `/universite/dashboard` | Recteur |
| `doyen` | `/universite/dashboard` | Doyen |
| `professeur` | `/universite/dashboard` | Professeur |
| `etudiant` | `/universite/dashboard` | Étudiant |
| `personnel` | `/universite/dashboard` | Personnel universitaire |

### Administration
| Rôle | Dashboard | Description |
|------|-----------|-------------|
| `admin` | `/admin/dashboard` | Administrateur |
| `super-admin` | `/admin/ecoles` | Super administrateur |

## 📦 Fonctionnalités Principales

- **Authentification multi-rôles** — Login/inscription avec extraction automatique de matricule depuis PDF
- **Dashboards par rôle** — 15 dashboards distincts avec stats, graphiques (Recharts)
- **Gestion des matières** — CRUD, coefficients, séries, sessions
- **Gestion des classes** — Élèves, emplois du temps, cahier de texte
- **Notes & Moyennes** — Saisie, calcul, bulletins
- **Paiements** — Frais scolaires, mobile money, export PDF (jsPDF)
- **Messagerie interne** — Messages entre utilisateurs
- **Bibliothèque** — Emprunts, réservations, inventaire
- **Infirmerie** — Dossiers médicaux, consultations, vaccinations
- **Transport** — Abonnements, trajets, véhicules
- **Événements & Sanctions** — Discipline, incidents
- **Université** — Module complet avec ses propres routes (React Router)

## 🧱 Architecture Frontend (107 fichiers source, 1.2 MB)

```
src/
├── config/routes.jsx         ← Source unique de vérité : routes, rôles, redirections (178 lignes)
├── App.jsx                   ← Génération dynamique des routes depuis le config (87 lignes)
├── api.js                    ← Instance Axios centralisée (interceptors, auth headers)
├── auth/
│   ├── AuthContext.jsx       ← Provider unique d'authentification (126 lignes)
│   ├── ProtectedRoute.jsx    ← Garde de route par rôles (allowedRoles)
│   └── RoleBasedRedirect.jsx ← Redirection post-login selon le rôle
├── components/
│   ├── DashboardLayout.jsx   ← Layout partagé sidebar+header+contenu (128 lignes)
│   ├── GenericDashboard.jsx  ← Dashboard générique avec stats
│   ├── NotificationBell.jsx  ← Cloche de notifications
│   ├── LoginForm.jsx         ← Formulaire de connexion partagé
│   └── ...
├── Directeurs/               ← Dashboard + composants directeur
│   ├── Dashboard/            ← Architecture modulaire (hooks/, pages/, components/)
│   ├── Matieres.jsx          ← Gestion CRUD matières (221 lignes, utilise DashboardLayout)
│   └── ...
├── Ecoliers/                 ← Inscription & dashboard élèves
│   ├── Connexion.jsx         ← Login écoliers
│   ├── Inscription.jsx       ← Inscription avec extraction PDF (lazy pdfjs-dist)
│   └── Dashboard/            ← Dashboard élève (hooks, pages)
├── Parents/
│   └── Dashboard/            ← Dashboard parent (pages, hooks)
├── Universite/               ← Module universitaire (routes, auth, dashboard)
├── Comptable/-Secretaire/-Surveillant/-Censeur/-Infirmier/-Bibliothecaire/
├── Enseignants / Enseignants_primaire / Enseignants_secondaire/
├── Eleves/ paiements/ home/ styles/
└── hooks/ services/ utils/
```

### Décisions architecturales clés
- **Routes centralisées** dans `config/routes.jsx` — ajouter un dashboard = 3 lignes de config
- **Lazy loading** de tous les dashboards via `React.lazy()` + `Suspense`
- **`DashboardLayout`** partagé par tous les dashboards (sidebar, header, notifications)
- **`AuthContext`** source unique pour le login (élimination du double appel API)
- **Instance `api.js`** avec intercepteurs Axios (token, erreurs)
- **CSS** : variables CSS globales dans `Theme.css`, 18 fichiers CSS organisés par rôle
- **Code-splitting** : `pdfjs-dist` (472 KB) chargé uniquement à la demande

## 📊 Modèles Backend (50+ modèles Eloquent)

```
Ecole, Eleve, Enseignant, User, UserParent, Classes, Matieres, Notes, Moyennes,
Examen, Devoir, EmploiDuTemps, CahierDeTexte, Paiement, PaiementEleve,
PaymentHistory, Depense, FichePaie, TransactionPaiement, StatutTranche,
Message, Notification, Livre, Emprunt, Reservation, DossierMedical,
ConsultationMedicale, Vaccination, Absence, Sanction, Incident, ConseilClasse,
Evenement, RendezVous, Bourse, Contributions, Certificat,
Serie, SeriesMatieres, Session, SessionsMatieres, CoefficientMatiere,
TypeEvaluation, Vehicule, TrajetTransport, AbonnementTransport, Personnel,
universite (module)
```

## 🔐 Sécurité

- Authentification via **Laravel Sanctum** (token stocké dans `localStorage`)
- Routes protégées par `ProtectedRoute` avec vérification `allowedRoles`
- Instance Axios avec intercepteur pour attacher automatiquement le token
- Redirection automatique vers `/connexion` si non authentifié
- Protection contre l'accès non autorisé avec page `/unauthorized`

## 📈 Historique Récent (Refactoring)

| Commit | Description |
|--------|-------------|
| `49f427d` | Routes centralisées, flux login réparé, URLs hardcodées éliminées |
| `00d0292` | Nettoyage code mort, refactoring dashboards, imports corrigés |
| `c4dfe29` | Migration CRA → Vite + tests |
| `8e8cca4` | Interface universitaire complète |

### Dernière phase de refactoring (juin 2026)
- **28 fichiers supprimés** (doublons AuthContext, ProtectedRoute, CSS, Classes.jsx mort)
- **4 imports corrigés** vers `auth/AuthContext.jsx`
- **12 URLs hardcodées** `http://localhost:8000/api/...` → instance `api.js`
- **Dashboard Ecoliers** refactoré : 384 → modules (hooks, pages, composants)
- **Dashboard Directeur** allégé : 516 → 135 lignes
- **Matieres.jsx** : sidebar inline → `DashboardLayout` (359 → 189 lignes)
- **Inscription** : `pdfjs-dist` → lazy-load (929 KB → 19 KB initial)
- **CSS** : 42 → 18 fichiers (doublons éliminés)

## 🚀 Scripts

```bash
cd Ecole_frontend
npm install          # Installation
npm run dev          # Développement (Vite dev server)
npm run build        # Build production
npm test             # Tests (Vitest)
```

---

*Projet développé par Nounagnon02 — https://github.com/Nounagnon02/Ecole*
