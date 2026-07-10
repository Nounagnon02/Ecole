# Architecture Technique

## Vue d'ensemble

```
┌─────────────────────────────────────────────────────┐
│                  Clients                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────┐   │
│  │   Web    │  │  Mobile   │  │    Desktop       │   │
│  │  (React) │  │(RN/Expo)  │  │   (Electron)     │   │
│  └────┬─────┘  └────┬─────┘  └────────┬─────────┘   │
└───────┼─────────────┼─────────────────┼──────────────┘
        │             │                 │
        │           API REST            │
        │         (Sanctum)             │
┌───────┴─────────────┴─────────────────┴──────────────┐
│                 Backend Laravel                       │
│  ┌─────────┐ ┌──────────┐ ┌──────────────────────┐   │
│  │ Routes  │ │  Middleware│ │    Controllers       │   │
│  │  API    │ │ EcoleScope│ │    (RESTful)         │   │
│  └────┬────┘ │SpatieRole│ └──────────┬───────────┘   │
│       │      └──────────┘            │                │
│  ┌────┴──────────────────────────────┴───────────┐   │
│  │              Services                          │   │
│  │  AIService  BillingService  ExportService...   │   │
│  └────────────────────────────────────────────────┘   │
│  ┌────────────────────────────────────────────────┐   │
│  │              Modèles Eloquent                    │   │
│  │  BelongsToEcole (Multi-tenancy)                  │   │
│  │  Auditable (Audit logs)                          │   │
│  └────────────────────────────────────────────────┘   │
│  ┌────────────────────────────────────────────────┐   │
│  │       Base de données MySQL 8                    │   │
│  └────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────┘
```

## Multi-tenancy

L'application utilise un modèle **multi-tenant basé sur `ecole_id`** :

1. **EcoleScope Middleware** — injecté dans toutes les requêtes API
2. **BelongsToEcole Trait** — applique automatiquement un scope global sur toutes les requêtes
3. **Cache scoped** — les clés de cache incluent `ecole_id` pour éviter les fuites inter-écoles
4. **Audit logs** — chaque entrée est associée à une école

## Sécurité

- **Authentification**: Sanctum (token-based)
- **Autorisation**: Spatie Laravel-Permission (15 rôles)
- **Audit**: Trait Auditable sur les modèles sensibles
- **CORS**: Configuration restrictive
- **Rate Limiting**: 60 req/min, 10 req/min pour les webhooks

## Flux de données

### Paiement Mobile Money
```
User → API POST /paiements → PaymentProviderFactory
  → Orange Money / MTN MoMo API → Callback → Webhook
  → Mise à jour du statut → Notification utilisateur
```

### Analyse IA (EduPilot)
```
User → API POST /ai/chat → AIController
  → AIService → Anthropic Claude API
  → Analyse contextuelle (notes, absences, tendances)
  → Réponse personnalisée
```

## Frontend (React)

### Architecture des composants
```
src/
├── shared/           # Composants réutilisables
│   ├── components/ui/  # Button, Card, Badge, Table, etc.
│   ├── lib/            # Utilitaires, API client
│   └── types/          # Constantes et types
├── app/
│   ├── dashboards/     # Dashboards par rôle
│   ├── features/       # Pages fonctionnelles
│   └── landing/        # Landing page
├── hooks/             # Custom hooks
└── features/roles/    # Route configuration
```

### Gestion d'état
- **TanStack Query** — Données API avec cache et revalidation
- **Zustand** — État global (auth, préférences)
- **Context API** — État partagé local

## Déploiement

### Prérequis
- PHP 8.2+
- MySQL 8.0+
- Node.js 20+
- Composer 2+

### Production
```bash
# Backend
cd Ecole_backend
composer install --optimize
php artisan config:cache
php artisan route:cache
php artisan migrate --force

# Frontend
cd Ecole_frontend
npm ci
npm run build

# Servi par Nginx
```
