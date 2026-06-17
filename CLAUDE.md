# Project Context

**Nom:** École — Système de Gestion Scolaire Complet
**Stack:**
- Backend: **Laravel 10** (PHP 8.1+, MySQL, API RESTful)
- Web Frontend: **React 18** + **Vite** (React Router, Axios)
- Mobile: **React Native** + **Expo**

**Rôles utilisateurs:** Directeur, Directeur Primaire, Directeur Secondaire, Enseignant Primaire, Enseignant Secondaire, Élève, Parent, Comptable, Surveillant, Censeur, Infirmier, Bibliothécaire, Secrétaire

**Structure du repo:**
```
Ecole/
├── Ecole_backend/       ← Laravel 10 API
├── Ecole_frontend/      ← React + Vite web app
└── Ecole_mobile/        ← React Native + Expo mobile app
```

---

# Instructions Projet

## Référence globale
Les standards universels (coding, sécurité, tests, performance, accessibilité, git) sont définis dans le fichier général `~/CLAUDE.md`. Ce fichier projet ne contient que les **surcharges et conventions spécifiques** à ce projet.

## Conventions Laravel (Backend)

- **Modèles:** Eloquent, singulier (`User.php`, `Classe.php`)
- **Migrations:** snake_case (`create_users_table.php`)
- **Controllers:** RESTful, pluriel (`UsersController`)
- **Routes:** `Route::apiResource()` par défaut
- **Validation:** Form Requests dédiés
- **API:** Versionnée via `/api/v1/`
- **Authentification:** Sanctum (SPA ou token-based selon le client)
- **Base de données:** MySQL, migrations versionnées, timestamps `created_at`/`updated_at` sur toutes les tables

## Conventions React (Frontend)

- **Composants:** Fichiers `.jsx`, un composant par fichier
- **Routing:** React Router v6 avec routes centralisées dans `App.jsx`
- **State:** Context API + hooks locaux (pas de Redux)
- **API:** Axios avec instance configurée (`api.js`)
- **Organisation:** Composants groupés par rôle :
  - `src/Directeurs/`, `src/DirecteursM/`, `src/DirecteursP/`, `src/DirecteursS/`
  - `src/Enseignants_primaire/`, `src/Enseignants_secondaire/`
  - `src/Ecoliers/`, `src/Parents/`, `src/Secretaire/`
  - `src/Universite/` (module université)
- **Dashboard layout:** Chaque rôle a son dashboard avec sidebar, header, et contenu
- **CSS:** Fichiers CSS séparés par vue (dans un dossier `Mes_CSS/` ou à côté du composant)

## Conventions Git

- Messages en anglais, conventional commits
- Branche par défaut: `main`
- Workflow: feature branches depuis `main`

## Commandes utiles

```bash
# Backend
cd Ecole/Ecole_backend && php artisan serve

# Frontend
cd Ecole/Ecole_frontend && npm run dev

# Mobile
cd Ecole/Ecole_mobile && npx expo start
```
