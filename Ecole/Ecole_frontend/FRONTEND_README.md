# 🎨 Frontend - Interface React

## 📋 Description

Interface utilisateur moderne et responsive pour la gestion scolaire.

## 🚀 Installation

```bash
npm install
npm start
```

## 🔧 Configuration

Créer `.env`:
```env
REACT_APP_API_URL=http://localhost:8000/api
```

## 📁 Structure

```
src/
├── components/
│   ├── SuperAdminDashboard.jsx
│   └── EcoleManagement.jsx
├── Directeurs/
│   └── dash.jsx
├── DirecteursM/
│   └── dash.jsx
├── DirecteursP/
│   └── dash.jsx
├── DirecteursS/
│   └── dash.jsx
├── Parents/
│   └── dash.jsx
├── Eleves/
│   └── DashboardEleve.jsx
├── Enseignants/
│   └── DashboardEnseignant.jsx
├── api.js
└── App.js
```

## 🎯 Dashboards

### Super Admin
- Gestion de toutes les écoles
- Statistiques globales
- Export de données
- Configuration système

### Directeur
- Vue par niveau (Maternelle/Primaire/Secondaire)
- Gestion élèves/enseignants
- Notes et bulletins
- Statistiques école

### Parent
- Suivi des enfants
- Consultation notes/bulletins
- Paiements en ligne
- Communication

### Élève
- Consultation notes
- Emploi du temps
- Devoirs

### Enseignant
- Saisie des notes
- Gestion des classes
- Communication

## 📦 Packages

```json
{
  "react": "^18.0.0",
  "react-router-dom": "^6.0.0",
  "axios": "^1.0.0",
  "recharts": "^2.0.0",
  "lucide-react": "^0.263.0"
}
```

## 🎨 Styles

- CSS Modules
- Styled JSX
- Responsive Design

## 🔐 Routes Protégées

```jsx
<ProtectedRoute allowedRoles={['directeur']}>
  <Dashboard />
</ProtectedRoute>
```

## 🚀 Build Production

```bash
npm run build
```

## Parcours métier (novembre 2026)

Pages de travail ajoutées ou rebranchées sur l'API au fil du plan de correction (`audit/11-plan-de-correction.md`) :

| Domaine | Page | Points d'attention |
|---|---|---|
| Inscription | `/eleves` (Nouvel élève, Importer un fichier, Fiche) | Matricule généré ou saisi ; parent créé ou retrouvé par son téléphone ; import CSV tout-ou-rien, 2 000 lignes, simulation d'abord |
| Personnel | `/personnel` | Direction seulement ; mot de passe provisoire affiché une fois |
| Notes | `/notes/saisie` | Grille au clavier, brouillon sur l'appareil, import de tableur lu dans le navigateur |
| Bulletins | `/bulletins` | Arrêt par la direction ou le censeur ; impression un par page A4 |
| Paiement parent | `/parent/paiements`, `/paiement/retour` | Passerelle FedaPay (bac à sable par défaut) |
| Vie scolaire | `/surveillant/presences`, `/censeur/discipline` | Appel rejouable et hors-ligne ; incidents et sanctions |
| Services | `/emploi-du-temps`, `/secretaire/*`, `/infirmier/*`, `/bibliothecaire/*`, `/comptable/*` | Formulaires via `shared/components/ui/FormDialog.jsx` |

### Comptes et sécurité

- Un mot de passe produit par l'école est **provisoire** : `/changer-mot-de-passe` s'impose à la première connexion, avant l'activation de la double authentification.
- Double authentification : huit **codes de secours** remis à l'activation ; le super-administrateur peut la réinitialiser.
- Déconnexion après inactivité : 15 min pour la direction, la comptabilité et l'administration, 60 min sinon (`shared/lib/useInactivite.js`).
- Connexion par numéro de téléphone (toutes écritures béninoises) ; mot de passe oublié par SMS (`/mot-de-passe-oublie/sms`).
- Aide sur la page de connexion : le téléphone de la dernière école connectée sur l'appareil (`shared/lib/aideEcole.js`), sinon `VITE_AIDE_TELEPHONE` et `VITE_AIDE_NOM` fixés au déploiement, sinon « Contactez votre administrateur ». Le numéro vient de la fiche de l'école (`ecoles.phone`).

### Écritures hors-ligne

Le client HTTP met en file une écriture faite sans réseau et répond `{ queued: true }` (statut 202). Une page **ne doit pas** l'annoncer comme enregistrée : voir `SaisieNotesPage.jsx` et `PresencesPage.jsx`.

### Utilitaires partagés

- `shared/lib/useElevesOptions.js` : élèves en options de liste (le nom vit sur `eleve.user`, pas sur `eleve`).
- `shared/lib/telecharger.js` : CSV pour tableur français (`;`, BOM), reçu nommé.
- Les correctifs de contraste vivent **hors** de `@layer components` dans `styles/proposition-c.css`, sinon les utilitaires Tailwind les écrasent.

