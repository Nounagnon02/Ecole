# API Documentation

## Authentification

Toutes les routes API (sauf onboarding) nécessitent un token Sanctum.

```http
Authorization: Bearer <token>
Content-Type: application/json
Accept: application/json
```

### Connexion
```http
POST /api/auth/login
{
  "identifiant": "directeur@ecole.com",
  "password": "password"
}
```

### Inscription (onboarding SaaS)
```http
POST /api/v1/onboarding/step/school
POST /api/v1/onboarding/step/plan
POST /api/v1/onboarding/step/admin
POST /api/v1/onboarding/step/modules
```

## Routes API

### Dashboard
| Méthode | URI | Rôle |
|---------|-----|------|
| GET | `/api/dashboard/directeur` | Directeur |
| GET | `/api/dashboard/enseignant` | Enseignant |
| GET | `/api/dashboard/eleve` | Élève |
| GET | `/api/dashboard/parent` | Parent |
| GET | `/api/dashboard/comptable` | Comptable |
| GET | `/api/dashboard/surveillant` | Surveillant |
| GET | `/api/dashboard/censeur` | Censeur |
| GET | `/api/dashboard/infirmier` | Infirmier |
| GET | `/api/dashboard/bibliothecaire` | Bibliothécaire |
| GET | `/api/dashboard/secretaire` | Secrétaire |
| GET | `/api/dashboard/admin` | Admin/Super-Admin |
| GET | `/api/dashboard/universite` | Recteur/Doyen |

### Notes
| Méthode | URI | Description |
|---------|-----|-------------|
| GET | `/api/notes/eleve` | Liste des notes |
| POST | `/api/notes/store` | Créer une note |
| PUT | `/api/notes/update/{id}` | Modifier une note |
| DELETE | `/api/notes/delete/{id}` | Supprimer une note |
| GET | `/api/notes/export?classe_id=&matiere_id=&periode=` | Export XLSX |
| POST | `/api/notes/{id}/lock` | Verrouiller une note |
| POST | `/api/notes/{id}/unlock` | Déverrouiller une note |
| GET | `/api/notes/classement/{classeId}/{periode}` | Classement des élèves |

### Paiements
| Méthode | URI | Description |
|---------|-----|-------------|
| GET | `/api/comptable/paiements` | Liste des paiements |
| POST | `/api/comptable/paiements` | Créer un paiement |
| GET | `/api/comptable/finances` | Statistiques financières |
| GET | `/api/comptable/paiements/{id}/recu` | Reçu PDF/HTML |
| GET | `/api/comptable/echeancier/{eleveId}` | Échéancier élève |

### Surveillance & Discipline
| Méthode | URI | Description |
|---------|-----|-------------|
| GET | `/api/surveillant/incidents` | Liste des incidents |
| POST | `/api/surveillant/incidents` | Créer un incident |
| GET | `/api/surveillant/absences` | Liste des absences |
| POST | `/api/surveillant/absences` | Enregistrer une absence |
| GET | `/api/surveillant/sanctions` | Liste des sanctions |
| GET | `/api/surveillant/statistiques` | Statistiques + alertes |

### Infirmerie
| Méthode | URI | Description |
|---------|-----|-------------|
| GET | `/api/infirmier/consultations` | Consultations |
| POST | `/api/infirmier/consultations` | Créer une consultation |
| GET | `/api/infirmier/dossiers-medicaux` | Dossiers médicaux |
| GET | `/api/infirmier/vaccinations` | Carnet de vaccination |
| POST | `/api/infirmier/vaccinations` | Ajouter un vaccin |
| GET | `/api/infirmier/statistiques` | Statistiques infirmerie |

### Bibliothèque
| Méthode | URI | Description |
|---------|-----|-------------|
| GET | `/api/bibliothecaire/livres` | Catalogue |
| POST | `/api/bibliothecaire/livres` | Ajouter un livre |
| GET | `/api/bibliothecaire/emprunts` | Liste des emprunts |
| POST | `/api/bibliothecaire/emprunts` | Créer un emprunt |
| PUT | `/api/bibliothecaire/emprunts/{id}/retour` | Retourner un livre |
| GET | `/api/bibliothecaire/reservations` | Réservations |
| GET | `/api/bibliothecaire/statistiques` | Statistiques |

### Secrétariat
| Méthode | URI | Description |
|---------|-----|-------------|
| GET | `/api/secretaire/dossiers-eleves` | Dossiers élèves |
| GET | `/api/secretaire/rendez-vous` | Rendez-vous |
| GET | `/api/secretaire/certificats` | Certificats |
| GET | `/api/secretaire/courriers` | Courriers |
| POST | `/api/secretaire/courriers` | Ajouter un courrier |

### Censeur
| Méthode | URI | Description |
|---------|-----|-------------|
| GET | `/api/censeur/resultats` | Résultats académiques |
| GET | `/api/censeur/conseils-classe` | Conseils de classe |
| POST | `/api/censeur/conseils-classe` | Créer un conseil |
| GET | `/api/censeur/examens` | Examens |
| GET | `/api/censeur/stats-chart` | Graphiques |
| GET | `/api/censeur/rapport-classe/{id}` | Rapport par classe |

### IA EduPilot
| Méthode | URI | Description |
|---------|-----|-------------|
| POST | `/api/ai/chat` | Assistant conversationnel |
| POST | `/api/ai/predictive-analysis` | Analyse prédictive |
| POST | `/api/ai/lesson-plan` | Plan de cours |
| POST | `/api/ai/tutor` | Tutorat personnalisé |
| POST | `/api/ai/parent-assistant` | Assistant parent |
| POST | `/api/ai/analyze-results` | Analyse des résultats |

### Enseignants
| Méthode | URI | Description |
|---------|-----|-------------|
| GET | `/api/enseignants` | Liste |
| GET | `/api/enseignants/{id}` | Détail |
| POST | `/api/enseignants/store` | Créer |

### Élèves
| Méthode | URI | Description |
|---------|-----|-------------|
| GET | `/api/eleves` | Liste |
| GET | `/api/eleves/{id}` | Détail |
| POST | `/api/eleves/store` | Créer |
| PUT | `/api/eleves/update/{id}` | Modifier |

### Admin SaaS
| Méthode | URI | Description |
|---------|-----|-------------|
| GET | `/api/v1/admin/analytics/overview` | Vue d'ensemble |
| GET | `/api/v1/admin/analytics/audit-logs` | Journaux d'audit |
| GET | `/api/v1/admin/tenants` | Établissements |
| GET | `/api/v1/admin/plans` | Plans d'abonnement |
| GET | `/api/v1/admin/subscriptions` | Abonnements |

## Formats de réponse

### Succès
```json
{
  "success": true,
  "data": { ... }
}
```

### Erreur
```json
{
  "success": false,
  "message": "Description de l'erreur"
}
```

## Codes d'erreur

| Code | Description |
|------|-------------|
| 200 | Succès |
| 201 | Créé |
| 400 | Requête invalide |
| 401 | Non authentifié |
| 403 | Non autorisé (rôle insuffisant) |
| 404 | Ressource introuvable |
| 422 | Validation échouée |
| 429 | Trop de requêtes |
| 500 | Erreur serveur |
