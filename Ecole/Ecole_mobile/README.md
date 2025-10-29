# École Mobile - Application de Gestion Scolaire

Application mobile React Native complète pour la gestion d'établissements scolaires avec 10 rôles utilisateurs différents.

## 🚀 Fonctionnalités

### Rôles Utilisateurs
- **Directeur** : Vue d'ensemble, gestion des classes, enseignants, paramètres
- **Enseignant** : Gestion des classes, notes, devoirs, profil
- **Élève** : Consultation bulletins, devoirs, emploi du temps, profil
- **Parent** : Suivi des enfants, bulletins, communication, profil
- **Comptable** : Gestion paiements, finances, bourses, rapports
- **Surveillant** : Gestion absences, incidents, sanctions
- **Censeur** : Résultats académiques, conseils de classe, examens
- **Infirmier** : Consultations, dossiers médicaux, vaccinations
- **Bibliothécaire** : Catalogue livres, emprunts, réservations
- **Secrétaire** : Dossiers élèves, rendez-vous, certificats

### Fonctionnalités Principales
- ✅ Authentification sécurisée par rôle
- ✅ Navigation par onglets adaptée à chaque rôle
- ✅ Interface responsive et moderne
- ✅ Gestion complète des données scolaires
- ✅ Génération de bulletins PDF
- ✅ Statistiques et graphiques
- ✅ Recherche et filtrage
- ✅ Notifications et alertes

## 📱 Technologies

- **React Native** avec Expo
- **React Navigation** pour la navigation
- **React Native Paper** pour l'UI
- **Axios** pour les appels API
- **AsyncStorage** pour le stockage local
- **Expo Print** pour la génération PDF
- **React Native Chart Kit** pour les graphiques

## 🛠️ Installation

1. **Prérequis**
   ```bash
   npm install -g expo-cli
   ```

2. **Installation des dépendances**
   ```bash
   cd EcoleMobile
   npm install
   ```

3. **Configuration API**
   - Modifier l'URL de l'API dans `src/services/api.js`
   - Remplacer `http://localhost:8000/api` par votre URL backend

4. **Lancement de l'application**
   ```bash
   npm start
   # ou
   expo start
   ```

## 📂 Structure du Projet

```
EcoleMobile/
├── src/
│   ├── context/
│   │   └── AuthContext.js          # Contexte d'authentification
│   ├── screens/
│   │   ├── LoginScreen.js          # Écran de connexion
│   │   ├── DirecteurDashboard.js   # Dashboard directeur
│   │   ├── EnseignantDashboard.js  # Dashboard enseignant
│   │   ├── EleveDashboard.js       # Dashboard élève
│   │   ├── ParentDashboard.js      # Dashboard parent
│   │   ├── ComptableDashboard.js   # Dashboard comptable
│   │   ├── SurveillantDashboard.js # Dashboard surveillant
│   │   ├── CenseurDashboard.js     # Dashboard censeur
│   │   ├── InfirmierDashboard.js   # Dashboard infirmier
│   │   ├── BibliothecaireDashboard.js # Dashboard bibliothécaire
│   │   └── SecretaireDashboard.js  # Dashboard secrétaire
│   └── services/
│       └── api.js                  # Configuration API
├── App.js                          # Composant principal
├── package.json                    # Dépendances
└── app.json                        # Configuration Expo
```

## 🎨 Interface Utilisateur

### Écran de Connexion
- Sélection du rôle utilisateur
- Authentification sécurisée
- Redirection automatique vers le dashboard approprié

### Dashboards par Rôle
Chaque rôle dispose d'un dashboard personnalisé avec :
- Navigation par onglets
- Statistiques en temps réel
- Actions spécifiques au rôle
- Interface intuitive et moderne

## 🔐 Authentification

- Système d'authentification basé sur les rôles
- Stockage sécurisé des tokens
- Gestion automatique des sessions
- Déconnexion sécurisée

## 📊 Fonctionnalités Avancées

### Génération de Bulletins
- Bulletins PDF personnalisés
- Calculs automatiques des moyennes
- Signature numérique du directeur
- Partage et téléchargement

### Statistiques et Graphiques
- Graphiques interactifs
- Statistiques en temps réel
- Rapports personnalisés
- Analyses de performance

### Recherche et Filtrage
- Recherche intelligente
- Filtres avancés
- Tri personnalisable
- Navigation rapide

## 🚀 Déploiement

### Build Android
```bash
expo build:android
```

### Build iOS
```bash
expo build:ios
```

### Publication sur les stores
```bash
expo publish
```

## 🔧 Configuration Backend

L'application nécessite un backend Laravel avec les endpoints suivants :

- `POST /api/login` - Authentification
- `GET /api/directeur/*` - Endpoints directeur
- `GET /api/enseignant/*` - Endpoints enseignant
- `GET /api/eleve/*` - Endpoints élève
- `GET /api/parent/*` - Endpoints parent
- `GET /api/comptable/*` - Endpoints comptable
- `GET /api/surveillant/*` - Endpoints surveillant
- `GET /api/censeur/*` - Endpoints censeur
- `GET /api/infirmier/*` - Endpoints infirmier
- `GET /api/bibliothecaire/*` - Endpoints bibliothécaire
- `GET /api/secretaire/*` - Endpoints secrétaire

## 📱 Compatibilité

- **iOS** : 11.0+
- **Android** : API 21+ (Android 5.0+)
- **Expo** : SDK 49+

## 🤝 Contribution

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/AmazingFeature`)
3. Commit les changements (`git commit -m 'Add AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 📞 Support

Pour toute question ou support :
- Email : support@ecole-mobile.com
- Documentation : [docs.ecole-mobile.com](https://docs.ecole-mobile.com)
- Issues : [GitHub Issues](https://github.com/votre-repo/issues)