# 💳 Système de Paiement

## 📋 Vue d'Ensemble

Système complet de paiement avec FedaPay, gestion des remboursements et historique détaillé.

## 🔧 Configuration

### .env
```env
FEDAPAY_PUBLIC_KEY=pk_sandbox_xxx
FEDAPAY_SECRET_KEY=sk_sandbox_xxx
FEDAPAY_ENVIRONMENT=sandbox
FEDAPAY_WEBHOOK_SECRET=whsec_xxx
```

## 💰 Types de Paiement

- **Scolarité** - Frais d'inscription, mensualités
- **Cantine** - Repas quotidiens
- **Transport** - Bus scolaire
- **Autre** - Activités, fournitures

## 🔄 Flux de Paiement

```
1. Initialisation
   POST /api/payments/initialize
   {
     "eleve_id": 1,
     "amount": 50000,
     "type": "scolarite",
     "description": "Frais de scolarité Janvier"
   }

2. Traitement
   POST /api/payments/mobile-money
   {
     "payment_id": 1,
     "phone_number": "+22997000000",
     "operator": "mtn"
   }

3. Vérification
   GET /api/payments/status?payment_id=1

4. Callback
   GET /api/payments/callback?id=xxx
```

## 📊 Endpoints

### Initialisation
```bash
POST /api/payments/initialize
```

### Mobile Money
```bash
POST /api/payments/mobile-money
```

### Carte Bancaire
```bash
POST /api/payments/card
```

### Historique
```bash
GET /api/payments/history?eleve_id=1&status=completed
```

### Statistiques
```bash
GET /api/payments/stats?ecole_id=1
```

### Remboursement
```bash
POST /api/payments/refund/request
POST /api/payments/refund/process
```

### Export
```bash
GET /api/payments/export?format=csv&date_from=2024-01-01
```

## 🔐 Sécurité

### Webhook Signature
```php
$signature = hash_hmac('sha256', $payload, $secret);
```

### Validation
- Montant minimum: 100 XOF
- Vérification élève/école
- Transaction unique

## 📈 Statistiques Disponibles

```json
{
  "total_collected": 5000000,
  "pending_amount": 500000,
  "failed_amount": 50000,
  "by_type": [
    {"type": "scolarite", "total": 3000000},
    {"type": "cantine", "total": 1500000}
  ],
  "monthly_revenue": [...]
}
```

## 🔄 Statuts

- `pending` - En attente
- `completed` - Payé
- `failed` - Échoué
- `refunded` - Remboursé

## 📝 Historique

Chaque paiement enregistre:
- Changements de statut
- Actions utilisateur
- Notes et commentaires
- Horodatage

## 🧪 Mode Test

```php
if (config('services.fedapay.environment') === 'sandbox') {
    // Simulation automatique
}
```

## 📧 Notifications

- Email de confirmation
- SMS de rappel
- Reçu PDF
- Alertes échéances

## 🔍 Logs

```bash
storage/logs/payments.log
```
