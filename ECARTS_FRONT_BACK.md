# Écarts entre le frontend et l'API

**Méthode** — les 70 appels API distincts du frontend, extraits automatiquement des
sources React, confrontés aux 310 routes réellement enregistrées (`php artisan
route:list --json`). Les faux positifs (exemples dans des blocs JSDoc, ternaires
tronqués par l'extraction) ont été écartés manuellement.

**Résultat** — 41 appels sur 70 atteignent une route existante. **23 pointent dans
le vide** : les pages concernées ne peuvent pas fonctionner.

---

## Corrigé

| Appel front | Problème | Route réelle |
|---|---|---|
| `/api/v1/admin/{modules,plans,tenants,billing/invoices,analytics/overview}` | Double préfixe `/api` (le client axios a déjà `baseURL: '/api'`) → `/api/api/v1/...` | `/v1/admin/...` |
| `/api/v1/ia/{chat,predictive}` | Double préfixe **et** routes déclarées seulement pour les sous-domaines tenant | `/v1/ia/...`, déplacées sur la surface principale |
| `/api/v1/admin/ecoles` | Ressource inexistante | `/v1/admin/tenants` |
| `/api/v1/admin/billing/revenus-mensuels` | Endpoint inexistant | `/v1/admin/analytics/revenue` |
| `/api/v1/admin/white-label/{id}` | Triple défaut : double préfixe, chemin inexistant, verbe `PUT` au lieu de `PATCH`, et champs en français (`nom_brand`, `couleur_primaire`) alors que le serveur valide `brand_name`, `primary_color` | `PATCH /v1/admin/tenants/{id}/settings` |

`patch` a été ajouté au hook `useApi`, qui ne l'exposait pas.

---

## Familles d'endpoints entièrement absentes

Le frontend a été construit en avance sur l'API : ces pages appellent des
endpoints cohérents entre eux, mais qui n'ont jamais été implémentés.
**Ce n'est pas un bug à corriger à l'aveugle** — c'est un choix de périmètre
produit : soit l'API se construit, soit les pages se retirent.

| Page | Appels sans route | Surface existante la plus proche |
|---|---|---|
| `features/messagerie/MessageriePage.jsx` | `GET /messagerie/conversations`<br>`GET /messagerie/conversations/{id}/messages`<br>`POST /messagerie/conversations/{id}/messages` | `/messages/received`, `/messages/sent`, `/messages/conversation/{contactId}`, `POST /messages` — l'API existe mais avec un modèle « messages » et non « conversations » |
| `features/paiements/index.jsx` | `GET /paiements`<br>`GET /paiements/revenus-mensuels`<br>`GET /types-frais` | `/comptable/paiements`, `/comptable/finances`, `/payments/history`, `/payments/stats` |
| `features/notes/index.jsx` | `GET /notes`<br>`GET /notes/stats`<br>`GET /notes/moyennes-par-matiere` | `/notes/eleve/{eleveId?}`, `/notes/classement/{classeId}/{periode}` |
| `features/communications/CommunicationsPage.jsx` | `GET /communications` | aucune |
| `features/parent/EnfantsPage.jsx` | `GET /parent/enfants/{id}/{notes,absences,emploi-du-temps,paiements}` | `/parent/enfants`, `/parent/bulletins`, `/parent/bulletin/{enfantId}/{periode}` — les quatre sous-ressources n'existent pas |
| `features/universite/{Cours,MesCours,Planning,Taches}Page.jsx` | `GET /universite/{cours,mes-cours,planning,taches}` | `/universite/{universites,facultes,departements,filieres,etudiants,enseignants,matieres,notes}` |
| `features/eleve/CoursPage.jsx` | `GET /eleve/cours` | préfixe réel `eleves` (pluriel) ; pas de ressource `cours` |
| `features/enseignant/ClassesPage.jsx` | `GET /enseignant/classes/{id}/eleves` | `/enseignant/classes` existe, pas la sous-ressource |
| 2 pages | `GET /periodes` | aucune route `api/periodes*` — pourtant `periodesController` existe et le modèle `periodes` aussi |

`/periodes` mérite une attention particulière : le contrôleur **et** le modèle
existent, seule la route manque. C'est probablement un simple oubli de câblage,
contrairement aux autres lignes de ce tableau.

---

## Détail annexe

`api/v1/eleves/{elefe}` — le paramètre de route s'appelle `elefe`. Laravel
singularise « eleves » en « elefe » ; le nom n'a pas d'incidence fonctionnelle
(la liaison est positionnelle) mais trahit un `apiResource` sur un nom français.

---

## Reproduire cette analyse

```bash
cd Ecole/Ecole_backend && php artisan route:list --json > /tmp/routes.json
# puis confronter aux appels extraits des sources React
```

Ce contrôle mériterait d'être automatisé en CI : il détecte en quelques secondes
une classe d'erreur qu'aucun test unitaire des deux côtés ne peut voir.
