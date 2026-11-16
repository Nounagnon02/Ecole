# AUDIT UX/UI — École Système de Gestion Scolaire

> **Mission :** Audit critique complet de la plateforme SaaS École
> **Équipe virtuelle :** Consultants UX/UI, Architecte Logiciel, Designer Produit, Expert Accessibilité
> **Date :** 23 juin 2026
> **Version audité :** Frontend React 18 + Vite / Backend Laravel 10

---

## Table des matières

1. [UX Global — Architecture & Navigation](#1-ux-global--architecture--navigation)
2. [Architecture des Rôles](#2-architecture-des-rôles)
3. [Architecture des Portails](#3-architecture-des-portails)
4. [Génération des Accès](#4-génération-des-accès)
5. [Gestion Multi-Écoles](#5-gestion-multi-écoles)
6. [Analyse des Dashboards](#6-analyse-des-dashboards)
7. [UX des Connexions](#7-ux-des-connexions)
8. [Analyse Mobile](#8-analyse-mobile)
9. [Benchmark Mondial](#9-benchmark-mondial)
10. [Recommandations Stratégiques](#10-recommandations-stratégiques)

---

## 1. UX Global — Architecture & Navigation

### 1.1 Résumé Exécutif

**Verdict : Architecture duale non soutenable.** La plateforme souffre d'une schizophrénie architecturale grave : DEUX systèmes de routes, DEUX systèmes d'auth, DEUX configurations de rôles, et DEUX ensembles de composants qui coexistent sans cohérence. C'est le problème n°1, il bloque tout le reste.

### 1.2 Problème Critique : Dualité Architecture Legacy / Premium

#### Constat

Le codebase contient DEUX architectures complètes qui fonctionnent en parallèle :

| Dimension | Legacy | Premium |
|---|---|---|
| **Routes** | `src/config/routes.jsx` (193 l.) | `src/features/roles/route-config.js` (330 l.) |
| **Auth** | `src/auth/AuthContext.jsx` (React Context) | `src/shared/stores/auth-store.js` (Zustand) |
| **Dashboards** | `src/Directeurs/dash.jsx` (réexport) | `src/app/dashboards/directeur/index.jsx` (599 l.) |
| **Layout** | Chaque page gère son layout | `AppShell` centralisé |
| **Styles** | CSS fichiers séparés par vue | Tailwind + design-tokens.css |
| **Composants** | Composants isolés par rôle | `shared/components/ui/` réutilisables |

#### Impact

1. **Duplication de code massive** — Les mêmes concepts (rôles, routes, permissions) sont définis dans au moins 3 fichiers différents
2. **Incohérence garantie** — Les redirections par rôle diffèrent entre les fichiers
3. **Maintenance impossible** — Ajouter une fonctionnalité = modifier 2-3 systèmes en parallèle
4. **Bug latent** — Selon quel système de routes répond en premier, l'utilisateur arrive sur une page différente
5. **Surcharge cognitive** — Un nouveau développeur met 2 jours à comprendre quelle architecture est "la bonne"

#### Sévérité : CRITIQUE (bloquant)

### 1.3 Navigation

#### Points négatifs

- **Entrée utilisateur ambiguë** — `/dashboard` est une redirection vide, pas une vraie page.
- **Sidebar redondante** — Le code du menu latéral (`Sidebar.jsx`) définit les items de navigation EN DUR pour chaque rôle, alors que `route-config.js` les définit déjà. Deux sources de vérité pour la navigation.
- **Pas de fil d'Ariane** — Aucun breadcrumb. Dans une app avec 22 rôles et des hiérarchies profondes, l'utilisateur se perd.
- **Pas d'indicateur de position** — Aucun moyen pour l'utilisateur de savoir "où je suis" dans la hiérarchie.
- **Les 4 rôles Directeur** (DIRECTEUR_M/P/S) pointent tous vers `/directeur/dashboard` et ont exactement les mêmes items de menu. Leur existence est inutile côté UX.

#### Points positifs (Sidebar premium)

- Animations framer-motion fluides
- Active indicator bar animée
- Logo avec effet shimmer
- Mode mobile avec overlay
- État "online" sur l'avatar utilisateur

#### Sévérité : HAUTE

### 1.4 Architecture de Fichiers

**Problème de nommage :** Le dossier `Ecole/Ecole/` double imbriqué est une aberration. 100% des chemins devraient être `Ecole/frontend/`, `Ecole/backend/`, `Ecole/mobile/`.

**Disparité des conventions :**
- `Directeurs/` (français, pluriel)
- `Enseignants_primaire/` (français, snake_case)
- `shared/components/` (anglais)
- `app/features/` (anglais)
- `Mes_CSS/` (français, avec majuscule)

Le mélange de langues et de conventions nuit à la maintenabilité.

#### Sévérité : MOYENNE

---

## 2. Architecture des Rôles

### 2.1 Inflation : 22 Rôles pour 12 Cas d'Usage Réels

**Constat :** Le système définit 22 rôles mais n'en nécessite que ~12-14.

#### Rôles redondants identifiés

| Groupe | Rôles existants | Rôles nécessaires | Problème |
|--------|-----------------|-------------------|----------|
| Direction | `DIRECTEUR`, `DIRECTEUR_M`, `DIRECTEUR_P`, `DIRECTEUR_S` | `DIRECTEUR` (avec `niveau`) | 4 rôles superflus : le niveau scolaire est un attribut de l'établissement |
| Enseignement | `ENSEIGNANT`, `ENSEIGNEMENT`, `ENSEIGNEMENT_M`, `ENSEIGNEMENT_P` | `ENSEIGNANT` | Confusion sémantique totale |
| Université | `RECTEUR`, `DOYEN`, `PROFESSEUR`, `ETUDIANT`, `PERSONNEL` | `RECTEUR`, `PROFESSEUR`, `ETUDIANT` | DOYEN sous-catégorie de RECTEUR |
| Admin | `SUPER_ADMIN`, `ADMIN` | `SUPER_ADMIN` | ADMIN et DIRECTEUR se chevauchent |

#### Impact

1. **Complexité exponentielle des guards** — Chaque route doit lister jusqu'à 4 rôles qui ont le même accès
2. **Liste de connexion incomplète** — `LoginForm.jsx` n'affiche que 10 rôles sur 22
3. **Erreur de mapping** — Dans le `ROLE_REDIRECT_MAP`, `RECTEUR` et `DOYEN` pointent vers `/directeur/dashboard` au lieu de `/universite/dashboard`
4. **Branchement conditionnel toxique** — `if role === 'directeurM' ... else if role === 'directeurP' ...`

#### Sévérité : HAUTE

### 2.2 Groupes de Rôles Incohérents

```javascript
ROLE_GROUPS.ADMIN = Object.freeze([R.DIRECTEUR, R.ADMIN, R.SUPER_ADMIN]);
```

`ROLE_GROUPS.ADMIN` inclut DIRECTEUR mais pas DIRECTEUR_M/P/S. Si un Directeur Maternelle a besoin d'accéder à l'admin, il ne peut pas. Mais dans `route-config.js`, la route admin est configurée avec `[ROLES.ADMIN, ROLES.DIRECTEUR, ROLES.SUPER_ADMIN]` — contradiction.

#### Sévérité : MOYENNE

### 2.3 Icons Mapping Trompeur

Les icônes dans `ROLE_ICONS` utilisent des noms de composants (ex: `GraduationCap`) au lieu d'être importées directement. Aucun type-checking. Si une icône change de nom dans lucide-react, le code ne plante pas mais l'icône disparaît.

#### Sévérité : FAIBLE

---

## 3. Architecture des Portails

### 3.1 Problème Critique : 6 Staff Roles → 1 Dashboard

```javascript
// features/roles/route-config.js (copié-collé toxique)
comptable:      { component: () => import('@/app/dashboards/admin'), ... },
surveillant:    { component: () => import('@/app/dashboards/admin'), ... },
censeur:        { component: () => import('@/app/dashboards/admin'), ... },
infirmier:      { component: () => import('@/app/dashboards/admin'), ... },
bibliothecaire: { component: () => import('@/app/dashboards/admin'), ... },
secretaire:     { component: () => import('@/app/dashboards/admin'), ... },
```

**6 rôles métiers complètement différents pointent vers EXACTEMENT le même composant dashboard.** Un infirmier arrive sur un dashboard financier. Un surveillant voit des graphiques de notes. C'est une erreur de conception majeure.

### 3.2 Pas de Dashboard Universitaire Premium

- Les rôles RECTEUR, DOYEN, PROFESSEUR, ETUDIANT, PERSONNEL n'ont PAS de dashboard dans l'architecture premium
- Ils utilisent uniquement les composants legacy

### 3.3 Routes Premium Inutilisées

- `/directeur/premium`, `/enseignant/premium`, `/eleve/premium`, `/parent/premium` sont définies dans `config/routes.jsx` mais ne sont référencées nulle part
- Routes mortes qui ajoutent de la confusion

### 3.4 Features Partagées

**Bon :** Les routes partagées (`/eleves`, `/notes`, `/paiements`) sont bien définies avec des permissions granulaires.

**Problématique :** La page `/communications` est accessible à TOUS les rôles, incluant ÉLÈVE et PARENT, sans distinction de contenu.

#### Sévérité : CRITIQUE

---

## 4. Génération des Accès

### 4.1 Processus d'Inscription / Création de Compte

**Problème :** La route d'inscription (`POST /api/inscription`) est protégée par middleware `auth:sanctum` avec rôle `directeur,super-admin,admin`. Cela signifie :
- **Pas d'inscription publique**
- **Pas de "Mot de passe oublié"** — Aucune route de reset password trouvée
- **Pas d'invitation par email**

**Workflow actuel :** Le Directeur crée manuellement un compte, puis communique les identifiants via un canal externe. Process non scalable et non sécurisé.

#### Sévérité : HAUTE

### 4.2 Sécurité des Tokens

**Constat alarmant :** Le token Sanctum est stocké dans `localStorage` :

```javascript
localStorage.setItem('token', data.token);   // AuthContext.jsx
storage: window.localStorage,                // auth-store.js (Zustand persist)
```

**Pourquoi c'est dangereux :**
1. Un token dans `localStorage` est accessible à TOUTE extension navigateur et à tout script XSS
2. Pas de protection CSRF
3. Token permanent jusqu'à logout explicite — aucun refresh token
4. Si le token fuit, l'attaquant a accès complet à l'API

#### Sévérité : ÉLEVÉE

### 4.3 Dualité des Endpoints Auth

**Deux endpoints de connexion :**
1. `POST /api/connexion` (AuthContext legacy)
2. `POST /api/auth/login` (auth-store Zustand)

Les deux systèmes d'auth coexistent. L'un peut être connecté et pas l'autre. Les clés localStorage sont différentes.

#### Sévérité : CRITIQUE

---

## 5. Gestion Multi-Écoles

### 5.1 Architecture Multi-Établissements

**Constat positif :** Le champ `ecole_id` est présent dans le login et dans le store. L'architecture reconnaît la nécessité multi-écoles.

**Problèmes :**

1. **Pas de dashboard super-admin complet** — Les routes existent, le composant n'a pas été audité
2. **Switching d'école inexistant** — Aucun mécanisme UI pour changer d'école sans se déconnecter
3. **ecole_id en champ texte libre** — L'utilisateur doit taper l'ID numérique. Aucun sélecteur avec recherche
4. **Données non isolées** — Aucun Axios interceptor pour préfixer `ecole_id` automatiquement
5. **Pas de branding multi-école** — Logo, couleurs, nom identiques pour toutes les écoles

#### Sévérité : HAUTE

---

## 6. Analyse des Dashboards

### 6.1 Dashboard Directeur Premium

**Fichier :** `src/app/dashboards/directeur/index.jsx` (599 lignes)

#### ✅ Ce qui est BON

- **Design System cohérent** — Carte glassmorphism, grilles responsives, animations subtiles
- **Recharts bien intégré** — AreaChart avec gradient fill, PieChart en donut
- **Micro-animations** — StatsCard avec icônes animées, compteurs qui incrémentent
- **Structure de données** — KPI cards bien organisées (Élèves, Enseignants, Taux réussite, Revenus)
- **Tabs** — 6 onglets thématiques
- **Responsive** — Grid Tailwind adaptée aux breakpoints

#### ❌ Ce qui est TRÈS PROBLÉMATIQUE

**1. 100% Données Mock — Zéro API Call**
```javascript
const stats = [
  { label: 'Total Élèves', value: '1 247', ... },
  { label: 'Enseignants', value: '89', ... },
  // ...
];
```
Aucun appel API. Les données sont écrites en dur. Le dashboard est une maquette statique.

**2. 5 Tabs sur 6 Sont des Placeholders Vides**
- **Élèves** → "Section Élèves en cours d'implémentation..."
- **Performances** → "Section Performances en cours d'implémentation..."
- **Finances** → "Section Finances en cours d'implémentation..."
- **Messages** → "Section Messages en cours d'implémentation..."
- **Calendrier** → "Section Calendrier en cours d'implémentation..."

**3. Pas de Gestion d'Erreur**
- Aucun try/catch
- Aucun état "empty"
- Aucun état "error"

**4. Pas de Squelettes de Chargement** — Les graphiques apparaissent tous en même temps ou pas du tout.

#### Sévérité : CRITIQUE — Le dashboard premium est une coquille vide

### 6.2 Dashboard Admin Partagé (6 Staff Roles)

**Problème :** Le même fichier `admin/index.jsx` est utilisé pour COMPTABLE, SURVEILLANT, CENSEUR, INFIRMIER, BIBLIOTHECAIRE, SECRETAIRE, ADMIN, et DIRECTEUR. Un comptable voit des graphiques d'absence. Un surveillant voit des données financières. Absurdité UX.

#### Sévérité : CRITIQUE

### 6.3 Composants UI Réutilisables

**Existant :** Avatar, Badge, Button, Card, Input, Modal, StatsCard, Table

**Manquant :**
- ✅ Dropdown/Select — Pas de composant standardisé
- ✅ DatePicker — Essentiel pour filtres
- ✅ Pagination — Aucune pagination standardisée
- ✅ DataTable — Tri, filtre, recherche
- ✅ Empty State — Composant "aucune donnée"
- ✅ Loading Skeleton — Aucun skeleton pour cards/tables

#### Sévérité : MOYENNE

---

## 7. UX des Connexions

### 7.1 Formulaire de Connexion Premium

**Fichier :** `LoginForm.jsx`

#### Points négatifs

1. **Sélecteur de rôle contre-intuitif** — L'utilisateur doit sélectionner son rôle dans le formulaire. Pourquoi demander le rôle si le backend le déduit du token ?

2. **10 rôles listés sur 22** — DIRECTEUR_M/P/S, rôles universitaires, admin et super-admin absents.

3. **ecole_id champ texte libre** — L'utilisateur doit connaître l'ID numérique de son école.

4. **Pas de "Mot de passe oublié"** — Lien absent.

5. **Pas d'inscription** — Aucun lien.

6. **Gestion d'erreur basique** — Un seul champ `error` string. Pas d'erreur par champ.

7. **Redirect Map Partielle** — Seulement 10 rôles. Les autres tombent sur `/dashboard` = redirection vide.

#### Points positifs
- Design visuel soigné (dégradé, animations framer-motion)
- Gestion du loading
- Icône oeil pour afficher/masquer le mot de passe

#### Sévérité : ÉLEVÉE

### 7.2 Dual des Formats de Réponse Backend

Le code `AuthContext.jsx` contient le commentaire : "Supporte les deux formats de réponse backend". L'API backend elle-même est inconsistante — renvoie tantôt `{ token, role, user }`, tantôt `{ success, token, user }`.

#### Sévérité : ÉLEVÉE

---

## 8. Analyse Mobile

### 8.1 Problèmes Anticipés

1. **API non optimisée pour mobile** — Payloads lourds, pas de pagination systématique
2. **Design System non réutilisable** — Tailwind CSS ne s'applique pas à React Native. Tout est à recréer.
3. **Nav non synchronisée** — Changement de routes web ne met pas à jour l'app mobile
4. **Pas d'offline mode** — Aucun cache local
5. **Pas de push notifications** — Aucune infrastructure
6. **Responsive web ≠ mobile natif** — Les breakpoints `lg:` (1024px) laissent la version <1024px dégradée

### 8.2 Verdict

Non audité en détail, mais l'architecture ne montre aucune considération mobile native.

#### Sévérité : NON DÉTERMINÉE (code mobile non analysé)

---

## 9. Benchmark Mondial

### 9.1 Tableau Comparatif

| Critère | École | Google Classroom | Moodle | Canvas | PowerSchool | Schoology |
|---------|-------|-----------------|--------|--------|-------------|-----------|
| Multi-établissements | ⚠️ Partiel | ❌ | ✅ | ✅ | ✅ | ✅ |
| Rôles granulaires | ❌ Confus | ✅ Simple | ✅ Flexible | ✅ Flexible | ✅ | ✅ |
| Dashboard KPI | ❌ Maquette | ❌ | ✅ | ✅ | ✅ | ✅ |
| UI Moderne | ✅ Design tokens | ✅ | ❌ Daté | ⚠️ | ❌ Daté | ⚠️ |
| Mobile App | ⚠️ Non audité | ✅ | ✅ | ✅ | ✅ | ✅ |
| Offline Mode | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Gamification | ❌ | ✅ | ❌ | ✅ | ❌ | ❌ |
| API Ouverte | ✅ Laravel | ✅ | ✅ | ✅ | ✅ | ✅ |
| SSO | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Marché cible | Propre | K-12 monde | HE monde | HE monde | K-12 US | K-12 US |

### 9.2 Forces Concurrentielles

- **Stack technique moderne** — React + Vite + Tailwind > Moodle (PHP legacy), PowerSchool, Schoology
- **Design System professionnel** — design-tokens.css inspiré de Linear/Stripe
- **Couverture large** — Maternelle à Université en une plateforme
- **Extensible** — Architecture par rôles

### 9.3 Faiblesses Concurrentielles

- **Dashboard non fonctionnel** — Concurrents ont 100% de données réelles
- **Pas d'offline** — Google Classroom et Canvas permettent le travail hors-ligne
- **Pas de temps réel** — Pas de WebSocket/Laravel Reverb
- **Pas de LTI** — Standard edtech non implémenté
- **Pas de gamification** — Badges, points, classements
- **Pas de SSO** — Google/Microsoft/Apple SSO attendu
- **Pas de LXP** — Learning Experience Platform (parcours personnalisés)

### 9.4 Opportunité Stratégique

**Marché africain :** Dominé par des solutions internationales :
- En anglais uniquement
- Conçues pour contextes nord-américains/européens
- Trop chères
- Ne gèrent pas les spécificités locales

**École a une opportunité unique** si le produit devient fonctionnel avec une UX moderne, en français, adaptée au marché africain.

#### Sévérité : MOYENNE

---

## 10. Recommandations Stratégiques

### Priorité CRITIQUE (C0) — Faire immédiatement

#### R1. Unifier l'Architecture (2-3 jours)

**Actions :**
- [ ] Éliminer `config/routes.jsx` → `features/roles/route-config.js` comme SSOT
- [ ] Migrer `AuthContext.jsx` → `auth-store.js` Zustand
- [ ] Supprimer les dashboards legacy → tout dans `app/dashboards/`
- [ ] Standardiser les endpoints API auth
- [ ] Nettoyer `Ecole/frontend/`, `Ecole/backend/` (adieu double imbrication)

**Impact :** Met fin à la schizophrénie architecturale. Temps de dév réduit de ~40%.

#### R2. Réduire les Rôles de 22 à 13 (1-2 jours)

| Groupe | Actuels | Cibles |
|--------|---------|--------|
| Direction | DIRECTEUR × 4 | DIRECTEUR + attribut `niveau` |
| Enseignement | ENSEIGNANT × 4 | ENSEIGNANT |
| Université | 5 rôles | 3 rôles : RECTEUR, PROFESSEUR, ETUDIANT |
| Admin | SUPER_ADMIN, ADMIN | SUPER_ADMIN |

**Impact :** Complexité des guards divisée par 2.

### Priorité HAUTE (C1) — Faire dans la semaine

#### R3. Connecter les Dashboards aux API (3-5 jours)

- [ ] Endpoints API dédiés par dashboard (`GET /api/dashboard/:role/stats`)
- [ ] États loading/empty/error dans chaque section
- [ ] Skeletons par section de dashboard
- [ ] Remplacer les 5 tabs placeholder

**Impact :** Passe d'une maquette interactive à un produit fonctionnel.

#### R4. Créer 6 Dashboards Staff Distincts (2-3 jours)

- Dashboard comptable (finances, factures)
- Dashboard surveillant (présences, discipline)
- Dashboard censeur (discipline, sanctions)
- Dashboard infirmier (soins, vaccinations)
- Dashboard bibliothécaire (prêts, catalogue)
- Dashboard secrétaire (inscriptions, planning)

**Impact :** Chaque utilisateur voit UNIQUEMENT les données pertinentes.

#### R5. Corriger la Sécurité des Tokens (1-2 jours)

- [ ] Migrer localStorage → httpOnly cookies (Sanctum SPA)
- [ ] Ajouter CSRF protection
- [ ] Supprimer `localStorage.setItem('token', ...)` partout
- [ ] Alternative immédiate : refresh tokens avec expiration courte

**Impact :** Réduction du risque de fuite de token.

#### R6. Corriger le Formulaire de Connexion (1 jour)

- [ ] Supprimer le sélecteur de rôle (backend le déduit)
- [ ] Remplacer `ecole_id` text input par sélecteur avec recherche
- [ ] Ajouter "Mot de passe oublié"
- [ ] Messages d'erreur spécifiques par champ
- [ ] Redirect map complète ou dynamique depuis `ROLE_REDIRECT_MAP`

### Priorité MOYENNE (C2) — Faire dans le mois

#### R7. Onboarding et Invitation

- [ ] Workflow d'invitation par email
- [ ] Page "Mot de passe oublié" avec email de reset
- [ ] Premier login : onboarding contextuel
- [ ] Import CSV pour création de comptes en masse

#### R8. Multi-Écoles Complet

- [ ] Dashboard super-admin fonctionnel
- [ ] Sélecteur d'école active dans le header
- [ ] Branding par école (logo, couleurs)
- [ ] Axios interceptor pour `ecole_id` automatique
- [ ] Routes isolées : `/ecole/:ecoleId/dashboard`

#### R9. Navigation Améliorée

- [ ] Breadcrumbs sur toutes les pages profondes
- [ ] Indicateur de position dans la sidebar
- [ ] Recherche globale (⌘K)
- [ ] Menu contextuel (liens récents)

### Priorité BASSE (C3) — Faire dans le trimestre

#### R10. Design System Complet

- [ ] Dropdown, DatePicker, DataTable, Pagination, EmptyState, Skeleton
- [ ] Storybook
- [ ] Tests visuels (Chromatic)

#### R11. Fonctionnalités Avancées

- [ ] **Offline** — Service Worker + IndexedDB
- [ ] **Temps réel** — Laravel Reverb (WebSocket)
- [ ] **Gamification** — Badges, XP, classements
- [ ] **Learning Analytics** — Progression pédagogique
- [ ] **SSO** — Google Workspace / Microsoft 365
- [ ] **Export PDF/CSV**
- [ ] **API LTI**

#### R12. Accessibilité et Internationalisation

- [ ] Audit WCAG 2.1 AA
- [ ] i18n (Français + Anglais)
- [ ] Mode contraste élevé
- [ ] Support lecteur d'écran
- [ ] RTL (arabe, marchés nord-africains)

---

## Synthèse des Notes de Sévérité

| Section | Note | Priorité |
|---------|------|----------|
| 1. UX Global — Architecture duale | 2/10 | 🔴 C0 |
| 2. Architecture des Rôles | 4/10 | 🟠 C1 |
| 3. Architecture des Portails | 3/10 | 🔴 C0 |
| 4. Génération des Accès | 4/10 | 🟠 C1 |
| 5. Gestion Multi-Écoles | 5/10 | 🟡 C2 |
| 6. Analyse des Dashboards | 3/10 | 🔴 C0 |
| 7. UX des Connexions | 5/10 | 🟠 C1 |
| 8. Analyse Mobile | 5/10 | 🟡 C2 |
| 9. Benchmark Mondial | 6/10 | 🟢 C3 |
| **Moyenne Générale** | **4.1/10** | **CRITIQUE** |

---

## Conclusion

La plateforme École a **des bases solides** :
- Design system moderne et cohérent (design-tokens.css)
- Stack technique pertinente (React + Vite + Laravel)
- Architecture extensible (app/features/)
- Vision produit claire (multi-établissement, multi-niveau)

Mais elle souffre de **problèmes architecturaux bloquants** :
- L'architecture duale (legacy/premium) rend le code impossible à maintenir
- Les dashboards sont des maquettes statiques, pas des produits fonctionnels
- 6 rôles staff partagent le même dashboard (erreur de conception)
- 22 rôles dont 9 redondants (complexité inutile)
- Les tokens en localStorage exposent les utilisateurs à des risques XSS

**Le verdict est sans appel :** Le projet n'est pas un produit livrable. C'est un prototype avec un bel écran de connexion, des maquettes de dashboards, et une architecture qui a commencé une migration vers une version 2 sans finir la première.

**Le chantier prioritaire (C0) est :** Unification → Rôles → Données réelles → Dashboards spécifiques → Sécurité. Sans cela, le produit ne peut pas être mis en production.

---

*Audit réalisé le 23 juin 2026. Ce document est un livrable de consulting produit. Chaque recommandation est priorisée et dimensionnée pour une exécution immédiate.*
