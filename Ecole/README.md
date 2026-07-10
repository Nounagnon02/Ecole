# 🏫 École — Système de Gestion Scolaire

[![CI](https://github.com/Nounagnon02/Ecole/actions/workflows/ci.yml/badge.svg)](https://github.com/Nounagnon02/Ecole/actions/workflows/ci.yml)
![PHP](https://img.shields.io/badge/PHP-8.2-777BB4?logo=php)
![Laravel](https://img.shields.io/badge/Laravel-11-FF2D20?logo=laravel)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)
![React Native](https://img.shields.io/badge/React_Native-Expo-000020?logo=react)
![License](https://img.shields.io/badge/License-MIT-green)

**École** est une plateforme complète de gestion scolaire conçue pour les établissements d'Afrique francophone. Elle couvre l'administration, les notes, les paiements, la discipline, l'infirmerie, la bibliothèque, et plus — avec une intelligence artificielle intégrée.

## Architecture

```
Ecole/
├── Ecole_backend/      ← Laravel 11 API (PHP 8.2)
├── Ecole_frontend/     ← React 18 + Vite
├── Ecole_mobile/       ← React Native + Expo
├── Ecole_desktop/      ← Electron Desktop app
└── docs/               ← Documentation
```

## Fonctionnalités

### 📚 Modules principaux
- **Gestion des élèves** — Inscription, dossiers, matricules
- **Notes & Bulletins** — Saisie, verrouillage, export XLSX, classement
- **Paiements** — Mobile Money (Orange Money, MTN), reçus, échéanciers
- **Emploi du temps** — Planning par classe et enseignant
- **Communications** — Fil d'actualité, messagerie interne
- **Discipline** — Incidents, sanctions, statistiques
- **Infirmerie** — Dossiers médicaux, vaccinations, consultations
- **Bibliothèque** — Catalogue, emprunts, pénalités
- **Secrétariat** — Courriers, rendez-vous, certificats
- **Transport** — Gestion des véhicules et trajets

### 🤖 EduPilot (IA)
- Assistant pédagogique pour enseignants
- Tutorat personnalisé pour élèves
- Analyse prédictive des performances
- Rapports intelligents pour parents

### 🌐 SaaS Multi-Tenant
- Isolation complète par établissement
- Plans d'abonnement (gratuit, pro, campus)
- Paiements intégrés (CinetPay, FedaPay, Stripe)
- Modules activables par école
- Personnalisation white-label

## Rôles utilisateurs

| Rôle | Dashboard | Accès principal |
|------|-----------|----------------|
| Directeur | 📊 Direction | Tout l'établissement |
| Enseignant | 📚 Enseignant | Notes, classes, emploi du temps |
| Élève | 🎓 Élève | Notes, cours, emploi du temps |
| Parent | 👨‍👩‍👧‍👦 Parent | Suivi des enfants |
| Comptable | 💰 Comptable | Paiements, factures |
| Surveillant | 👁️ Surveillance | Absences, incidents |
| Censeur | ⚖️ Censeur | Discipline, absences |
| Infirmier | 🏥 Infirmerie | Dossiers médicaux |
| Bibliothécaire | 📖 Bibliothèque | Livres, emprunts |
| Secrétaire | 📋 Secrétariat | Courriers, inscriptions |

## Installation rapide

### Backend
```bash
cd Ecole/Ecole_backend
composer install
php artisan key:generate
php artisan migrate
php artisan db:seed
php artisan serve
```

### Frontend
```bash
cd Ecole/Ecole_frontend
npm install
npm run dev
```

### Mobile
```bash
cd Ecole/Ecole_mobile
npx expo start
```

## Tests
```bash
# Backend
cd Ecole/Ecole_backend && php artisan test

# Frontend
cd Ecole/Ecole_frontend && npm test
```

## Stack technique

- **Backend**: Laravel 11, Sanctum, Spatie Permissions, MySQL 8
- **Frontend Web**: React 18, Vite 5, TanStack Query, Zustand, Tailwind v4
- **Mobile**: React Native, Expo
- **Desktop**: Electron (wrapper)
- **IA**: Claude API (Anthropic)
- **Paiements**: Orange Money, MTN MoMo, CinetPay, FedaPay, Stripe
- **CI/CD**: GitHub Actions
- **Monitoring**: Sentry, Laravel Telescope

## Documentation

- [Architecture](docs/architecture.md)
- [API Backend](docs/api.md)
- [Architecture technique](docs/architecture.md)
- [Benchmark concurrentiel](docs/benchmark-concurrentiel.md)

## Licence

MIT — voir [LICENSE](LICENSE)
