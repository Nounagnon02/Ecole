# École - Système de Gestion Scolaire

## 🎯 Description
Application complète de gestion scolaire avec 10 dashboards spécialisés pour différents rôles.

## 🚀 Installation

```bash
# Installer les dépendances
npm install

# Démarrer en développement
npm start

# Build pour production
npm run build
```

## 👥 Rôles disponibles
- **Directeur** : Gestion globale, statistiques, classes
- **Enseignant** : Notes, devoirs, gestion de classe
- **Élève** : Bulletins, devoirs, emploi du temps
- **Parent** : Bulletins enfants, paiements, messages
- **Comptable** : Paiements, bourses, rapports financiers
- **Surveillant** : Absences, incidents, sanctions
- **Censeur** : Résultats, conseils de classe, examens
- **Infirmier** : Dossiers médicaux, consultations
- **Bibliothécaire** : Catalogue, emprunts, animations
- **Secrétaire** : Dossiers élèves, RDV, certificats

## 🔧 Configuration
Modifier les variables d'environnement dans `.env` :
- `REACT_APP_API_URL` : URL de l'API backend
- `REACT_APP_ENV` : Environnement (development/production)

## 📱 Fonctionnalités
- ✅ Authentification par rôles
- ✅ Dashboards responsives
- ✅ Gestion des notes et bulletins
- ✅ Système de paiements
- ✅ Messagerie interne
- ✅ Génération PDF
- ✅ Statistiques et rapports

## 🛠️ Technologies
- React 18
- React Router v6
- Lucide React (icônes)
- jsPDF (génération PDF)
- Recharts (graphiques)
- Axios (API calls)