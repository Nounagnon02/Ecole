# 🗄️ Migrations Universitaires - Documentation

## Structure de la Base de Données

### Tables Créées (14 tables)

#### 1. **universites**
```sql
- id (PK)
- nom
- sigle (10 caractères)
- adresse
- telephone (20 caractères)
- email
- site_web
- timestamps
```

#### 2. **facultes**
```sql
- id (PK)
- nom
- sigle (10 caractères)
- universite_id (FK → universites)
- timestamps
```

#### 3. **departements**
```sql
- id (PK)
- nom
- faculte_id (FK → facultes)
- timestamps
```

#### 4. **filieres**
```sql
- id (PK)
- nom
- niveau (Licence, Master, Doctorat)
- departement_id (FK → departements)
- timestamps
```

#### 5. **etudiants**
```sql
- id (PK)
- matricule (20 caractères, unique)
- nom
- prenom
- date_naissance
- lieu_naissance
- sexe (M/F)
- telephone (20 caractères)
- email
- adresse
- annee_entree (year)
- filiere_id (FK → filieres)
- timestamps
```

#### 6. **enseignants**
```sql
- id (PK)
- nom
- prenom
- grade
- specialite
- telephone (20 caractères)
- email
- departement_id (FK → departements)
- timestamps
```

#### 7. **personnels**
```sql
- id (PK)
- nom
- prenom
- poste
- telephone (20 caractères)
- email
- universite_id (FK → universites)
- timestamps
```

#### 8. **annee_academiques**
```sql
- id (PK)
- libelle (Ex: 2024-2025)
- date_debut
- date_fin
- timestamps
```

#### 9. **inscriptions**
```sql
- id (PK)
- etudiant_id (FK → etudiants)
- annee_academique_id (FK → annee_academiques)
- date_inscription
- montant_frais (decimal 10,2)
- statut (En cours, Validée, Annulée)
- timestamps
```

#### 10. **semestres**
```sql
- id (PK)
- libelle (S1, S2)
- annee_academique_id (FK → annee_academiques)
- timestamps
```

#### 11. **matieres**
```sql
- id (PK)
- code (20 caractères)
- intitule
- credit (integer)
- enseignant_id (FK → enseignants)
- semestre_id (FK → semestres)
- filiere_id (FK → filieres)
- timestamps
```

#### 12. **notes**
```sql
- id (PK)
- etudiant_id (FK → etudiants)
- matiere_id (FK → matieres)
- note (decimal 5,2)
- type (CC, TP, Examen)
- date_evaluation
- timestamps
```

#### 13. **diplomes**
```sql
- id (PK)
- etudiant_id (FK → etudiants)
- intitule
- date_delivrance
- mention
- timestamps
```

#### 14. **paiements**
```sql
- id (PK)
- etudiant_id (FK → etudiants)
- montant (decimal 10,2)
- date_paiement
- motif (frais inscription, scolarité, examen)
- timestamps
```

## Relations entre Tables

### Hiérarchie Organisationnelle
```
Universite
    └── Faculte
        └── Departement
            └── Filiere
                └── Etudiant
```

### Relations Académiques
```
AnneeAcademique
    ├── Inscription → Etudiant
    └── Semestre
        └── Matiere
            ├── Enseignant
            ├── Filiere
            └── Note → Etudiant
```

### Relations Financières
```
Etudiant
    ├── Inscription (montant_frais)
    └── Paiement (montant)
```

## Contraintes d'Intégrité

### Clés Étrangères avec CASCADE
Toutes les relations utilisent `onDelete('cascade')` :
- Suppression d'une université → supprime facultés, personnels
- Suppression d'une faculté → supprime départements
- Suppression d'un département → supprime filières, enseignants
- Suppression d'une filière → supprime étudiants, matières
- Suppression d'un étudiant → supprime inscriptions, notes, paiements, diplômes

### Contraintes UNIQUE
- `etudiants.matricule` - Matricule unique par étudiant

### Contraintes ENUM
- `etudiants.sexe` : M, F
- `notes.type` : CC, TP, Examen
- `inscriptions.statut` : En cours, Validée, Annulée

## Commandes de Migration

### Exécuter les migrations
```bash
php artisan migrate
```

### Rollback
```bash
php artisan migrate:rollback
```

### Reset et re-migrer
```bash
php artisan migrate:fresh
```

### Vérifier le statut
```bash
php artisan migrate:status
```

## Ordre d'Exécution

Les migrations s'exécutent dans cet ordre (par timestamp) :
1. universites
2. facultes
3. departements
4. filieres
5. etudiants
6. enseignants
7. personnels
8. annee_academiques
9. inscriptions
10. semestres
11. matieres
12. notes
13. diplomes
14. paiements

## Seeders Recommandés

Pour tester la structure, créer des seeders pour :
- Universités (1-2 universités)
- Facultés (3-5 par université)
- Départements (2-3 par faculté)
- Filières (Licence, Master, Doctorat)
- Années académiques (2023-2024, 2024-2025)
- Semestres (S1, S2 par année)
