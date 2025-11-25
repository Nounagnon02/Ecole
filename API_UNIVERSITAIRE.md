# 📚 API Universitaire - Documentation

## Base URL
```
/api/universite
```

## Endpoints Disponibles

### 🏛️ Universités
```
GET    /api/universite/universites          - Liste toutes les universités
POST   /api/universite/universites          - Créer une université
GET    /api/universite/universites/{id}     - Détails d'une université
PUT    /api/universite/universites/{id}     - Modifier une université
DELETE /api/universite/universites/{id}     - Supprimer une université
```

### 🏫 Facultés
```
GET    /api/universite/facultes             - Liste toutes les facultés
POST   /api/universite/facultes             - Créer une faculté
GET    /api/universite/facultes/{id}        - Détails d'une faculté
PUT    /api/universite/facultes/{id}        - Modifier une faculté
DELETE /api/universite/facultes/{id}        - Supprimer une faculté
```

### 📂 Départements
```
GET    /api/universite/departements         - Liste tous les départements
POST   /api/universite/departements         - Créer un département
GET    /api/universite/departements/{id}    - Détails d'un département
PUT    /api/universite/departements/{id}    - Modifier un département
DELETE /api/universite/departements/{id}    - Supprimer un département
```

### 🎓 Filières
```
GET    /api/universite/filieres             - Liste toutes les filières
POST   /api/universite/filieres             - Créer une filière
GET    /api/universite/filieres/{id}        - Détails d'une filière
PUT    /api/universite/filieres/{id}        - Modifier une filière
DELETE /api/universite/filieres/{id}        - Supprimer une filière
```

### 👨‍🎓 Étudiants
```
GET    /api/universite/etudiants            - Liste tous les étudiants
POST   /api/universite/etudiants            - Créer un étudiant
GET    /api/universite/etudiants/{id}       - Détails d'un étudiant
PUT    /api/universite/etudiants/{id}       - Modifier un étudiant
DELETE /api/universite/etudiants/{id}       - Supprimer un étudiant
```

### 👨‍🏫 Enseignants
```
GET    /api/universite/enseignants          - Liste tous les enseignants
POST   /api/universite/enseignants          - Créer un enseignant
GET    /api/universite/enseignants/{id}     - Détails d'un enseignant
PUT    /api/universite/enseignants/{id}     - Modifier un enseignant
DELETE /api/universite/enseignants/{id}     - Supprimer un enseignant
```

### 📖 Matières/UE
```
GET    /api/universite/matieres             - Liste toutes les matières
POST   /api/universite/matieres             - Créer une matière
GET    /api/universite/matieres/{id}        - Détails d'une matière
PUT    /api/universite/matieres/{id}        - Modifier une matière
DELETE /api/universite/matieres/{id}        - Supprimer une matière
```

### 📝 Notes
```
GET    /api/universite/notes                - Liste toutes les notes
POST   /api/universite/notes                - Créer une note
GET    /api/universite/notes/{id}           - Détails d'une note
PUT    /api/universite/notes/{id}           - Modifier une note
DELETE /api/universite/notes/{id}           - Supprimer une note
```

### 📋 Inscriptions
```
GET    /api/universite/inscriptions         - Liste toutes les inscriptions
POST   /api/universite/inscriptions         - Créer une inscription
GET    /api/universite/inscriptions/{id}    - Détails d'une inscription
PUT    /api/universite/inscriptions/{id}    - Modifier une inscription
DELETE /api/universite/inscriptions/{id}    - Supprimer une inscription
```

### 📅 Semestres
```
GET    /api/universite/semestres            - Liste tous les semestres
POST   /api/universite/semestres            - Créer un semestre
GET    /api/universite/semestres/{id}       - Détails d'un semestre
PUT    /api/universite/semestres/{id}       - Modifier un semestre
DELETE /api/universite/semestres/{id}       - Supprimer un semestre
```

### 📆 Années Académiques
```
GET    /api/universite/annees-academiques         - Liste toutes les années
POST   /api/universite/annees-academiques         - Créer une année
GET    /api/universite/annees-academiques/{id}    - Détails d'une année
PUT    /api/universite/annees-academiques/{id}    - Modifier une année
DELETE /api/universite/annees-academiques/{id}    - Supprimer une année
```

### 👥 Personnel
```
GET    /api/universite/personnels           - Liste tout le personnel
POST   /api/universite/personnels           - Créer un personnel
GET    /api/universite/personnels/{id}      - Détails d'un personnel
PUT    /api/universite/personnels/{id}      - Modifier un personnel
DELETE /api/universite/personnels/{id}      - Supprimer un personnel
```

### 💰 Paiements
```
GET    /api/universite/paiements            - Liste tous les paiements
POST   /api/universite/paiements            - Créer un paiement
GET    /api/universite/paiements/{id}       - Détails d'un paiement
PUT    /api/universite/paiements/{id}       - Modifier un paiement
DELETE /api/universite/paiements/{id}       - Supprimer un paiement
```

### 🎖️ Diplômes
```
GET    /api/universite/diplomes             - Liste tous les diplômes
POST   /api/universite/diplomes             - Créer un diplôme
GET    /api/universite/diplomes/{id}        - Détails d'un diplôme
PUT    /api/universite/diplomes/{id}        - Modifier un diplôme
DELETE /api/universite/diplomes/{id}        - Supprimer un diplôme
```

## Exemples de Requêtes

### Créer une Université
```bash
POST /api/universite/universites
Content-Type: application/json

{
  "nom": "Université de Lomé",
  "sigle": "UL",
  "adresse": "BP 1515 Lomé, Togo",
  "telephone": "+228 22 25 50 01",
  "email": "contact@univ-lome.tg",
  "site_web": "https://www.univ-lome.tg"
}
```

### Créer un Étudiant
```bash
POST /api/universite/etudiants
Content-Type: application/json

{
  "matricule": "ETU2024001",
  "nom": "KOFFI",
  "prenom": "Jean",
  "date_naissance": "2000-05-15",
  "lieu_naissance": "Lomé",
  "sexe": "M",
  "telephone": "+228 90 12 34 56",
  "email": "jean.koffi@etudiant.ul.tg",
  "adresse": "Lomé, Togo",
  "annee_entree": 2024,
  "filiere_id": 1
}
```

### Créer une Note
```bash
POST /api/universite/notes
Content-Type: application/json

{
  "etudiant_id": 1,
  "matiere_id": 1,
  "note": 15.5,
  "type": "CC",
  "date_evaluation": "2024-11-25"
}
```

## Codes de Réponse

- `200` - Succès (GET, PUT)
- `201` - Créé avec succès (POST)
- `204` - Supprimé avec succès (DELETE)
- `400` - Erreur de validation
- `404` - Ressource non trouvée
- `500` - Erreur serveur

## Relations Chargées

Les endpoints `show()` chargent automatiquement les relations :

- **Université** → facultés, personnels
- **Faculté** → université, départements
- **Département** → faculté, filières, enseignants
- **Filière** → département, étudiants, matières
- **Étudiant** → filière, inscriptions, notes, paiements
- **Enseignant** → département, matières
- **Matière** → enseignant, semestre, filière, notes
- **Note** → étudiant, matière
- **Inscription** → étudiant, annéeAcademique
- **Semestre** → annéeAcademique, matières
