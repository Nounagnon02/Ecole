# 🔧 Backend - API Laravel

## 📋 Description

API RESTful pour la gestion scolaire avec authentification, gestion multi-écoles et paiements.

## 🚀 Installation

```bash
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate
php artisan db:seed
php artisan serve
```

## 🔑 Configuration (.env)

```env
DB_DATABASE=ecole_db
DB_USERNAME=root
DB_PASSWORD=

FEDAPAY_PUBLIC_KEY=your_key
FEDAPAY_SECRET_KEY=your_secret
FEDAPAY_ENVIRONMENT=sandbox

FRONTEND_URL=http://localhost:3000
```

## 📁 Structure

```
app/
├── Http/Controllers/
│   ├── AuthController.php
│   ├── EleveController.php
│   ├── NotesController.php
│   ├── PaymentController.php
│   └── ...
├── Models/
│   ├── Eleve.php
│   ├── Payment.php
│   └── ...
├── Traits/
│   └── BelongsToEcole.php
└── Services/
    └── BulletinService.php
```

## 🔐 Authentification

```bash
POST /api/connexion
POST /api/inscription
```

## 📊 Endpoints Principaux

### Élèves
```bash
GET    /api/eleves
POST   /api/eleves/store
GET    /api/elevesM  # Maternelle
GET    /api/elevesP  # Primaire
GET    /api/elevesS  # Secondaire
```

### Notes
```bash
GET    /api/notes/filter
POST   /api/notes
POST   /api/notes/import
```

### Paiements
```bash
POST   /api/payments/initialize
POST   /api/payments/mobile-money
GET    /api/payments/history
GET    /api/payments/stats
POST   /api/payments/refund
```

## 🎯 Traits Personnalisés

### BelongsToEcole
```php
use App\Traits\BelongsToEcole;

class Eleve extends Model {
    use BelongsToEcole;
}
```

## 🔒 Middleware

- `EcoleScope` - Filtre par école
- `CheckRole` - Vérification des rôles
- `ThrottleRequests` - Limitation de requêtes

## 📦 Packages

- `fedapay/fedapay-php` - Paiements
- `laravel/sanctum` - API tokens
- `maatwebsite/excel` - Import/Export
