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
