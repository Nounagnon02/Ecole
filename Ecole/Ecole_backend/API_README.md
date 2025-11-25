# 📡 Documentation API

## 🔐 Authentification

### Connexion
```http
POST /api/connexion
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password"
}
```

**Réponse:**
```json
{
  "success": true,
  "token": "xxx",
  "user": {...}
}
```

### Inscription
```http
POST /api/inscription
```

---

## 🏫 Écoles

### Liste
```http
GET /api/ecoles
```

### Créer
```http
POST /api/ecoles
{
  "nom": "École Primaire",
  "email": "ecole@example.com",
  "telephone": "+22997000000",
  "adresse": "Cotonou",
  "slug": "ecole-primaire"
}
```

### Modifier
```http
PUT /api/ecoles/{id}
```

### Supprimer
```http
DELETE /api/ecoles/{id}
```

---

## 👨‍🎓 Élèves

### Liste globale
```http
GET /api/eleves
```

### Par niveau
```http
GET /api/elevesM  # Maternelle
GET /api/elevesP  # Primaire
GET /api/elevesS  # Secondaire
```

### Par classe
```http
GET /api/eleves/listeChaqueClasseMaternelle
GET /api/eleves/listeChaqueClassePrimaire
GET /api/eleves/listeChaqueClasseSecondaire
```

### Créer
```http
POST /api/eleves/store
{
  "nom": "Doe",
  "prenom": "John",
  "date_naissance": "2010-01-01",
  "classe_id": 1,
  "serie_id": 1
}
```

### Statistiques
```http
GET /api/stats/effectifs-maternelle
GET /api/stats/effectifs-primaire
GET /api/stats/effectifs-secondaire
```

---

## 📚 Classes

### Liste
```http
GET /api/classes
GET /api/classesM  # Maternelle
GET /api/classesP  # Primaire
GET /api/classesS  # Secondaire
```

### Effectifs
```http
GET /api/classes/effectif/maternelle
GET /api/classes/effectif/primaire
GET /api/classes/effectif/secondaire
```

### Avec séries et matières
```http
GET /api/with-series-matieresMaternelle
GET /api/with-series-matieresPrimaire
GET /api/with-series-matieresSecondaire
```

---

## 📝 Notes

### Filtrer
```http
GET /api/notes/filter?classe_id=1&matiere_id=2&periode=1
```

### Créer
```http
POST /api/notes
{
  "eleve_id": 1,
  "matiere_id": 2,
  "note": 15,
  "type_evaluation": "Devoir1",
  "periode": "1"
}
```

### Importer
```http
POST /api/notes/import
Content-Type: multipart/form-data

{
  "fichier": file,
  "classe_id": 1,
  "matiere_id": 2
}
```

### Statistiques
```http
GET /api/stats/repartition-notes-maternelle
GET /api/stats/repartition-notes-primaire
GET /api/stats/repartition-notes-secondaire
```

---

## 💳 Paiements

### Initialiser
```http
POST /api/payments/initialize
{
  "eleve_id": 1,
  "amount": 50000,
  "type": "scolarite",
  "description": "Frais janvier"
}
```

### Mobile Money
```http
POST /api/payments/mobile-money
{
  "payment_id": 1,
  "phone_number": "+22997000000",
  "operator": "mtn"
}
```

### Historique
```http
GET /api/payments/history?eleve_id=1&status=completed
```

### Statistiques
```http
GET /api/payments/stats?ecole_id=1
```

### Remboursement
```http
POST /api/payments/refund/request
{
  "payment_id": 1,
  "reason": "Erreur de montant"
}
```

### Export
```http
GET /api/payments/export?format=csv&date_from=2024-01-01
```

---

## 👨‍🏫 Enseignants

### Liste
```http
GET /api/enseignants
GET /api/enseignants/MP  # Maternelle/Primaire
```

### Effectifs
```http
GET /api/enseignants/effectif/maternelle
GET /api/enseignants/effectif/primaire
GET /api/enseignants/effectif/secondaire
```

---

## 📖 Matières

### Liste
```http
GET /api/matieres
GET /api/matieresM  # Maternelle
GET /api/matieresP  # Primaire
GET /api/matieresS  # Secondaire
```

### Avec séries
```http
GET /api/matieres-with-series
```

---

## 📊 Séries

### Liste
```http
GET /api/series
```

### Avec classes
```http
GET /api/classes-with-series
```

---

## 🔔 Headers Requis

```http
Content-Type: application/json
X-Ecole-Id: 1
Authorization: Bearer {token}
```

---

## ⚠️ Codes d'Erreur

| Code | Description |
|------|-------------|
| 200 | Succès |
| 201 | Créé |
| 400 | Requête invalide |
| 401 | Non authentifié |
| 403 | Non autorisé |
| 404 | Non trouvé |
| 429 | Trop de requêtes |
| 500 | Erreur serveur |

---

## 📝 Format de Réponse

### Succès
```json
{
  "success": true,
  "data": {...}
}
```

### Erreur
```json
{
  "success": false,
  "message": "Error message",
  "errors": {...}
}
```
