# Écarts entre le frontend et l'API

**Méthode** — les appels API distincts du frontend, extraits automatiquement des
sources React, confrontés aux routes réellement enregistrées (`php artisan
route:list --json`).

**État initial** — 41 appels sur 70 atteignaient une route existante. 23
pointaient dans le vide.

**État actuel** — **plus aucun appel effectif ne pointe dans le vide.** Le
contrôle relève 5 « orphelins » résiduels : 4 sont des pages désormais
neutralisées (l'appel n'est plus émis, voir §4) et 1 est un faux positif de
l'extracteur sur un ternaire (`/notes/${id}/${locked ? 'unlock' : 'lock'}` — les
deux routes existent).

---

## 1. Câblage corrigé — le double préfixe

11 sites appelaient `/api/v1/...` sur un client dont le `baseURL` vaut déjà
`/api` : chaque requête partait vers `/api/api/v1/...`. C'était le pendant
frontal de `routes/central.php`, qui n'était chargé nulle part — les deux bouts
étaient cassés, donc la panne était invisible.

| Appel front | Défaut | Route réelle |
|---|---|---|
| `/api/v1/admin/{modules,plans,tenants,billing/invoices,analytics/overview}` | Double préfixe | `/v1/admin/...` |
| `/api/v1/ia/{chat,predictive}` | Double préfixe **et** routes réservées aux sous-domaines tenant | `/v1/ia/...`, déplacées sur la surface principale |
| `/api/v1/admin/ecoles` | Ressource inexistante | `/v1/admin/tenants` |
| `/api/v1/admin/billing/revenus-mensuels` | Endpoint inexistant | `/v1/admin/analytics/revenue` |
| `/api/v1/admin/white-label/{id}` | Double préfixe, chemin inexistant, verbe `PUT` au lieu de `PATCH`, champs français contre serveur anglais | `PATCH /v1/admin/tenants/{id}/settings` |

`patch` a été ajouté au hook `useApi`, qui ne l'exposait pas.

## 2. Recâblage — la donnée existait sous un autre nom

| Appel front | Route réelle |
|---|---|
| `GET /paiements` | `/comptable/paiements` |
| `GET /paiements/revenus-mensuels` | `/comptable/finances` |
| `GET /types-frais` | `/contributions` |
| `GET /notes` | `/notes/eleve` (paramètre optionnel) |
| `GET /enseignant/classes/{id}/eleves` | `/classes/{id}/eleves` |
| `GET /eleve/cours` | `/eleves/me/cours` |
| `GET /universite/cours` | `/universite/matieres` |
| `GET /messagerie/conversations` | `/messages/conversations` |
| `GET /messagerie/conversations/{id}/messages` | `/messages/conversation/{contactId}` |
| `POST /messagerie/conversations/{id}/messages` | `POST /messages` |

Trois méthodes de `MessageController` — `getConversations`, `unreadCount`,
`getUsers` — existaient sans aucune route. La page Messagerie appelait
`/messagerie/conversations` faute d'endpoint exposé pour la première.

`POST /messages` exigeait un `sujet`, que l'interface de conversation n'a pas.
Le champ est devenu facultatif côté serveur, avec une valeur de repli — la
colonne est `NOT NULL`.

## 3. Endpoints construits — le modèle existait, pas la lecture

| Endpoint | Source de données |
|---|---|
| `GET /parent/enfants/{id}/notes` | `Notes` |
| `GET /parent/enfants/{id}/absences` | `Absence`, avec compteurs justifiées / injustifiées |
| `GET /parent/enfants/{id}/emploi-du-temps` | `EmploiDuTemps` de la classe de l'enfant |
| `GET /parent/enfants/{id}/paiements` | `PaiementEleve`, avec solde restant |
| `GET /notes/stats` | Agrégats, notes ramenées sur 20 |
| `GET /notes/moyennes-par-matiere` | Moyennes groupées par matière |
| `GET /eleves/me/cours` | `CahierDeTexte` de la classe de l'élève |
| `GET /periodes` (+ 6 variantes) | `periodes` — contrôleur et modèle existaient, la route manquait |

Les quatre sous-ressources parent vérifient que l'enfant appartient bien au
parent connecté, et répondent **404** sinon : un 403 confirmerait l'existence de
l'enfant. `notes/stats` et `moyennes-par-matiere` restreignent le périmètre par
rôle en liste blanche — un élève ne voit que ses notes, un parent celles de ses
enfants, le personnel l'établissement.

Couverture : `tests/Feature/Api/NewEndpointsTest.php`, 10 cas.

## 4. Manque structurel — 4 pages, pas de modèle de données

Ces pages appellent une API cohérente, mais aucune table ne peut l'alimenter.
Elles affichaient une liste vide en avalant l'erreur — indistinguable, pour
l'utilisateur, d'un « aucune donnée ». Elles rendent désormais un état explicite
(`FeatureUnavailable`) et **n'émettent plus l'appel** : un drapeau
`API_AVAILABLE = false` en tête de fichier suffit à le réactiver.

| Page | Ce qui manque |
|---|---|
| `communications/CommunicationsPage` | Aucune table d'annonces. La fonctionnalité doit être conçue. |
| `universite/PlanningPage` | Le module universitaire n'a pas de modèle d'emploi du temps (l'équivalent scolaire est `EmploiDuTemps`). |
| `universite/TachesPage` | Pas de modèle de devoirs universitaires (l'équivalent scolaire est `Devoir`). |
| `universite/MesCoursPage` | **`etudiants` ne porte pas de `user_id`** : un compte connecté ne peut pas être relié à un étudiant. C'est le prérequis de tout l'espace étudiant. |

Ce dernier point est le plus lourd : sans lien compte ↔ étudiant, aucune vue
personnelle du module universitaire n'est possible. À traiter avant les trois
autres.

---

## Garder ce contrôle vivant

```bash
cd Ecole/Ecole_backend && php artisan route:list --json > /tmp/routes.json
# puis confronter aux appels extraits des sources React
```

Ce contrôle détecte en quelques secondes une classe d'erreur qu'aucun test
unitaire des deux côtés ne peut voir. Il mériterait une place en CI.
