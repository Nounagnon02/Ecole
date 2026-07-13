# 📊 KPIs Détaillés — Système de Gestion Scolaire

> Document de référence : décryptage de chaque indicateur clé de performance (KPI)
> sur tous les dashboards de l'application.

---

## Table des matières

1. [Directeur](#1-directeur)
2. [Admin (Super Admin)](#2-admin-super-admin)
3. [Comptable](#3-comptable)
4. [Surveillant](#4-surveillant)
5. [Censeur](#5-censeur)
6. [Infirmier](#6-infirmier)
7. [Bibliothécaire](#7-bibliothécaire)
8. [Secrétaire](#8-secrétaire)
9. [Enseignant](#9-enseignant)
10. [Élève](#10-élève)
11. [Parent](#11-parent)
12. [Université](#12-université)

---

## 1. Directeur

### 🧑‍🎓 Total Élèves

| Attribut | Valeur |
|---|---|
| **Source** | `Eleve::count()` |
| **Fréquence** | Temps réel (cache 5 min) |
| **Formule** | Compte brut de la table `eleves` |

**À quoi ça sert :** C'est le KPI racine. Tout découle de lui : budget, personnel, infrastructures.
Une baisse d'une année sur l'autre signale un problème d'attractivité ou de rétention.

**Seuils d'alerte :**
- 🔴 Baisse > 10 % vs année précédente
- 🟡 Baisse entre 5 et 10 %
- 🟢 Variation < 5 %

---

### 👨‍🏫 Enseignants

| Attribut | Valeur |
|---|---|
| **Source** | `User::where('role', 'enseignant')->where('ecole_id', ...)` |
| **Fréquence** | Temps réel |

**À quoi ça sert :** Permet de calculer le ratio **élèves / enseignant** — indicateur qualité critique.
- Ratio < 20 : confort pédagogique
- Ratio 20-30 : normal
- Ratio > 30 : surcharge, besoin de recrutement

**Décision :** Si le nombre de classes augmente sans recrutement d'enseignants, le ratio se dégrade et la qualité de l'enseignement chute.

---

### 🏫 Classes

| Attribut | Valeur |
|---|---|
| **Source** | `Classes::count()` |
| **Fréquence** | Temps réel |

**À quoi ça sert :** Structure organisationnelle. Classes × effectif moyen = taux d'occupation réel.
Une classe avec 50+ élèves doit être dédoublée ; une classe avec < 15 élèves peut être mutualisée.

---

### 📈 Évolution des Effectifs (Area Chart)

| Attribut | Valeur |
|---|---|
| **Source** | `computeMonthlyEnrollment()` |
| **Données** | 12 mois (Sept → Août) |
| **Unité** | Nombre d'élèves inscrits par mois |

**Interprétation :**

| Courbe | Signification | Action |
|---|---|---|
| Pic en Sept-Oct | Inscriptions normales de rentrée | ✅ Normal |
| Nouveaux inscrits en cours d'année | Bonne attractivité en cours d'année | 🟢 Capitaliser |
| Courbe descendante | Départs d'élèves en cours d'année | 🔴 Enquête qualité/rétention |
| Plateau prolongé | Capacité d'accueil saturée | 🟡 Envisager extension |

---

### 🥧 Répartition des Notes (Donut Chart)

| Attribut | Valeur |
|---|---|
| **Source** | `computeGradeDistribution()` en backend |
| **Tranches** | Excellent (≥16), Bien (14-15.99), Moyen (10-13.99), Insuffisant (<10) |

**Interprétation :**
- **Excellent + Bien > 40 %** → niveau académique solide, argument marketing
- **Insuffisant > 30 %** → alerte rouge : révision des programmes ou des méthodes pédagogiques
- **Croisement avec les données du Censeur** : les classes avec plus de sanctions ont-elles plus d'insuffisants ?

---

### 📋 Classes et Effectifs (Tableau)

| Colonne | Donnée | Utilité |
|---|---|---|
| **Classe** | `nom_classe` | Identification |
| **Effectif** | `eleves_count` | Détection des surcharges |
| **Catégorie** | `categorie_classe` | Répartition Maternelle/Primaire/Secondaire |

**Décision :** Si la 3ème a 50 élèves et la 6ème 15, le directeur doit ouvrir une division supplémentaire en 3ème et enquêter sur la chute (décrochage entre 6ème et 3ème).

---

## 2. Admin (Super Admin)

### 👥 Utilisateurs Actifs

| Attribut | Valeur |
|---|---|
| **Source** | `User::where('is_active', true)->count()` |
| **Fréquence** | Temps réel |

**À quoi ça sert :** Mesure la **santé de la plateforme**. Un nombre d'utilisateurs actifs stable ou croissant signifie que l'adoption est bonne. Une baisse soudaine peut indiquer un problème de connexion, de maintenance ou de satisfaction.

---

### ⚡ Requêtes / minute

**À quoi ça sert :** KPI de **charge serveur**. Permet de dimensionner l'infrastructure (taille du serveur, nombre de workers, file d'attente).
- Variation > 20 % sur la journée → identifie les heures de pointe
- Pic anormal sans augmentation du nombre d'utilisateurs → possible attaque ou boucle dans le code

---

### 💾 Espace Disque

**À quoi ça sert :** Surveillance des **ressources matérielles**.
- > 80 % : alerte, prévoir extension ou nettoyage
- > 95 % : critique, risque d'arrêt de la base de données

---

### ❌ Erreurs API (24h)

**À quoi ça sert :** KPI de **qualité de service**. Chaque erreur API (500, 502, 503) est un utilisateur qui n'a pas pu faire son travail. Un nombre élevé d'erreurs signale :
1. Un bug à corriger (500)
2. Un serveur surchargé (503)
3. Un problème réseau (502)

---

### ⏱️ Temps Réponse API (ms)

| Attribut | Valeur |
|---|---|
| **Référence** | < 200 ms = excellent, 200-500 = acceptable, > 500 = lent |
| **Source** | Monitoring des endpoints |

**À quoi ça sert :** Impact direct sur l'expérience utilisateur. Un tableau de bord qui met 2 secondes à charger décourage les directeurs de l'utiliser. Un temps réponse > 1s est un signal d'alerte technique.

---

### ✅ Uptime (disponibilité)

| Attribut | Valeur |
|---|---|
| **Objectif** | 99.9 %+ |
| **Formule** | (Temps total - temps d'arrêt) / Temps total × 100 |

**À quoi ça sert :** Engagement de **qualité de service**. 99.9 % = ~8h d'arrêt par an ; 99.99 % = ~52 min par an.
Un uptime < 99.5 % est inacceptable pour un outil de gestion scolaire utilisé quotidiennement.

---

### 🏥 Santé Système (CPU, RAM, Disque, Cache Redis, Workers)

**À quoi ça sert :** Vue d'ensemble instantanée de l'état des serveurs. Chaque barre de progression est un **diagnostic préventif** :
- CPU > 80 % : le serveur peine, passer à plus de cœurs
- RAM > 85 % : risque de swap, ajouter de la RAM
- Cache Redis > 90 % : saturation mémoire du cache

---

### 📋 Logs Système

**À quoi ça sert :** Journal d'audit. Les logs ERROR sont des incidents immédiats ; les WARN sont des situations à surveiller. Le décompte des erreurs dans le badge (`Badge variant="danger"`) donne le nombre d'incidents en cours.

---

## 3. Comptable

### 💰 Revenus du Mois

| Attribut | Valeur |
|---|---|
| **Source** | `Paiement::where('statut', 'paye')->sum('montant')` filtré par mois |
| **Fréquence** | Temps réel (cache 2 min) |

**À quoi ça sert :** KPI de **trésorerie**. Toute baisse des revenus mensuels par rapport à l'année précédente au même mois signale un problème d'encaissement ou de diminution des effectifs.

---

### ⏳ Factures en Attente

| Attribut | Valeur |
|---|---|
| **Source** | `Paiement::where('statut', 'en_attente')->count()` |

**À quoi ça sert :** KPI de **recouvrement**. Un stock d'impayés élevé (> 20 % des factures) menace la trésorerie. Le comptable doit relancer les parents concernés.

---

### 📊 Taux de Recouvrement

| Attribut | Valeur |
|---|---|
| **Formule** | (Payés / Total factures du mois) × 100 |
| **Source** | `Paiement::whereMonth('date_paiement', now()->month)` |

**À quoi ça sert :** KPI le plus important pour le comptable. Il mesure l'efficacité du processus d'encaissement.
- > 90 % : excellent
- 75-90 % : normal
- < 75 % : alerte, revoir les procédures de relance

---

### 📉 Dépenses du Mois

**À quoi ça sert :** Suivi des **charges** (salaires, fournitures, entretien, électricité). Croisé avec les revenus, il donne le **résultat net** mensuel. Des dépenses qui augmentent plus vite que les revenus → déficit structurel.

---

### 🥧 Répartition des Revenus

| Secteur | Part |
|---|---|
| Frais Scolaire | 65 % |
| Cantine | 15 % |
| Transport | 12 % |
| Activités | 8 % |

**À quoi ça sert :** Permet de diversifier les sources de revenus. Si les frais scolaires représentent > 80 %, l'établissement dépend trop d'une seule source.

---

## 4. Surveillant

### 👥 Total Élèves

**À quoi ça sert :** Base de référence. Le surveillant sait combien d'élèves il doit gérer chaque jour.

---

### ✅ Présents Aujourd'hui

| Attribut | Valeur |
|---|---|
| **Source** | `Eleve::count() - Absence::whereDate('date', today())->count()` |
| **Fréquence** | Temps réel |

**À quoi ça sert :** KPI **quotidien** de présence. Un fort taux d'absence (> 10 %) peut indiquer :
- Une épidémie (grippe, paludisme) → croiser avec l'infirmier
- Un événement local (fête, deuil)
- Un problème de transport en saison des pluies

---

### ❌ Absents (aujourd'hui)

| Attribut | Valeur |
|---|---|
| **Source** | `Absence::whereDate('date', today())->count()` |

**À quoi ça sert :** Suivi des absences en temps réel pour déclencher les appels aux parents. Les absences non signalées (absence sans appel du parent) doivent être vérifiées avant 10h.

---

### 🚨 Alertes

| Attribut | Valeur |
|---|---|
| **Source** | Incidents en cours (bagarres, blessures, comportements graves) |

**À quoi ça sert :** Indicateur de **sécurité et discipline**. Un nombre d'alertes > 5 par jour signale un climat scolaire dégradé. L'objectif est zéro alerte.

---

### 📊 Présences de la Semaine (Bar Chart)

| Mois | Présents | Absents |
|---|---|---|
| LUN | ~1160 | ~124 |
| MAR | ~1175 | ~109 |
| MER | ~1156 | ~128 |
| JEU | ~1180 | ~104 |
| VEN | ~1142 | ~142 |

**Interprétation :** Le vendredi a historiquement plus d'absents. Le surveillant peut renforcer les contrôles ce jour-là. Si la courbe est descendante sur la semaine, les élèves se fatiguent et décrochent.

---

### ⏰ Retards Récents

| Colonne | Utilité |
|---|---|
| **Temps** | Durée du retard — 5 min ≠ 30 min |
| **Motif** | Transport, Médical, Non justifié |
| **Récurrent** | Flag pour les retardataires chroniques |

**Décision :** Les retards récurrents (même élève, 3x/semaine) doivent déclencher une convocation des parents.

---

## 5. Censeur

### 👥 Total Élèves

Base de référence pour la discipline.

---

### ⚖️ Sanctions du Mois

| Attribut | Valeur |
|---|---|
| **Source** | `Sanction::whereMonth('created_at', now()->month)->count()` |

**À quoi ça sert :** KPI de **discipline**. Une tendance à la hausse des sanctions peut indiquer :
- Un relâchement dans la discipline générale
- Un problème avec une classe ou un groupe spécifique
- Des règles mal comprises par les élèves

**Objectif :** Baisse tendancielle. Si les sanctions augmentent alors que la prévention (causeries, sensibilisation) augmente aussi, il faut revoir la méthode.

---

### 📅 Absences Non Justifiées

| Attribut | Valeur |
|---|---|
| **Source** | `Absence::where('justifiee', false)->whereMonth('date', now()->month)->count()` |

**À quoi ça sert :** Distingue les absences excusées (médical, famille) des absences **volontaires**. Un taux d'absences non justifiées > 30 % signale un problème d'**assiduité et de motivation**.

---

### ⚠️ Avertissements

**À quoi ça sert :** Premier niveau de sanction. Un nombre élevé d'avertissements signifie que les problèmes sont détectés tôt. Un nombre faible de sanctions lourdes malgré beaucoup d'avertissements → les premières sanctions ne sont pas assez dissuasives.

---

### 📊 Évolution des Sanctions

**Interprétation :** Si la courbe des sanctions baisse tout en maintenant la qualité, les mesures disciplinaires sont efficaces. Si elle baisse mais que les absences non justifiées augmentent, la discipline n'est simplement plus respectée.

---

### 📋 Dernières Sanctions

**À quoi ça sert :** Transparence. Le censeur peut suivre chaque cas individuellement, vérifier la proportionnalité de la sanction, et s'assurer que les parents ont été informés.

---

## 6. Infirmier

### 🏥 Visites du Mois

| Attribut | Valeur |
|---|---|
| **Source** | `ConsultationMedicale::whereMonth('created_at', now()->month)->count()` |

**À quoi ça sert :** KPI de **fréquentation de l'infirmerie**. Une hausse brutale peut signaler :
- Une épidémie (paludisme, grippe, dengue)
- Un problème d'hygiène (eau, cantine)
- Un stress collectif (examens)

---

### 🕐 En Cours

| Attribut | Valeur |
|---|---|
| **Source** | `ConsultationMedicale::where('statut', 'observation')->count()` |

**À quoi ça sert :** État de la charge de travail immédiate de l'infirmerie. Si > 5 patients en observation, l'infirmerie est saturée.

---

### 🚨 Cas Urgents

**À quoi ça sert :** Les cas urgents (traumatismes, réactions allergiques, blessures graves) nécessitent une évacuation vers l'hôpital. Le suivi de ce KPI permet d'anticiper les besoins en trousse d'urgence et en formation aux premiers soins.

---

### 👨‍⚕️ Consultations Trimestre

**À quoi ça sert :** Vision macro. Une baisse des consultations peut être bonne (moins de malades) ou mauvaise (les élèves ne viennent plus à l'infirmerie). Le croisement avec les présences du surveillant donne la réponse.

---

### 📈 Visites dans le Temps (Area Chart)

**Interprétation :** Les pics saisonniers (saison des pluies = paludisme, saison fraîche = rhumes) sont normaux. Un pic hors saison est un signal d'alerte épidémiologique.

---

## 7. Bibliothécaire

### 📚 Total Ouvrages

| Attribut | Valeur |
|---|---|
| **Source** | `Livre::count()` |

**À quoi ça sert :** Patrimoine documentaire. Un nombre d'ouvrages qui stagne signifie que la bibliothèque ne se renouvelle pas. L'UNESCO recommande minimum **10 livres par élève** dans une bibliothèque scolaire.

---

### 📖 Emprunts en Cours

| Attribut | Valeur |
|---|---|
| **Source** | `Emprunt::where('statut', 'en_cours')->count()` |

**À quoi ça sert :** KPI d'**utilisation**. Une bibliothèque avec beaucoup d'ouvrages mais peu d'emprunts est une bibliothèque dortoir. L'objectif est d'avoir > 30 % du fonds en circulation.

---

### ⏰ Retards

| Attribut | Valeur |
|---|---|
| **Source** | `Emprunt::where('statut', 'en_cours')->where('date_retour_prevue', '<', today())->count()` |

**À quoi ça sert :** Un taux de retard > 15 % signale que les règles de prêt ne sont pas respectées. Il faut renforcer les relances ou réduire la durée des prêts.

---

### 👥 Membres Actifs

**À quoi ça sert :** Mesure l'**adhésion** à la bibliothèque. Idéalement, 100 % des élèves sont inscrits. Si le nombre de membres actifs est faible, c'est un problème de sensibilisation à la lecture.

---

### 📊 Catégories (Pie Chart)

**Interprétation :** Le déséquilibre entre catégories (Scolaire > Romans > Sciences > BD > Autres) montre les goûts de lecture. Si la catégorie "Scolaire" domine > 60 %, les élèves ne lisent que par obligation et non par plaisir.

---

## 8. Secrétaire

### 📋 Inscriptions

| Attribut | Valeur |
|---|---|
| **Source** | `Eleve::count()` |
| **Fréquence** | Temps réel |

**À quoi ça sert :** Indicateur de **charge de travail**. Le secrétaire gère les dossiers d'inscription. Le pic se situe en Sept-Oct et en Jan-Fév.

---

### 🆕 Nouveaux ce Mois

| Attribut | Valeur |
|---|---|
| **Source** | `Eleve::whereMonth('created_at', now()->month)->count()` |

**À quoi ça sert :** Flux d'entrée. Un nombre élevé de nouveaux inscrits en dehors de la période de rentrée est bon signe (attractivité en cours d'année). Un nombre < 5 pendant trois mois consécutifs → problème d'attractivité.

---

### 📑 Dossiers en Cours

**À quoi ça sert :** **Backlog** du secrétaire. Ce sont les inscriptions non finalisées. Un backlog > 10 signifie que le secrétaire est surchargé et que des parents attendent.

---

### 📄 Documents Générés

**À quoi ça sert :** Volume de travail administratif (bulletins, certificats de scolarité, relevés de notes, attestations). Permet d'anticiper les besoins en fournitures (papier, cartouches d'encre).

---

### 📊 Flux d'Inscriptions (Bar Chart)

**Interprétation :** Les transferts (élèves venant d'autres écoles) sont un signal de qualité de l'établissement. Beaucoup de transferts entrants = bonne réputation. Beaucoup de transferts sortants = problème interne.

---

## 9. Enseignant

### 👨‍🎓 Mes Élèves

| Attribut | Valeur |
|---|---|
| **Source** | Modèle `Enseignant` → relation `classes` → relation `eleves` |

**À quoi ça sert :** L'enseignant sait combien d'élèves il a en charge. Impact direct sur la gestion de classe et le temps de correction.

---

### 🕐 Cours Cette Semaine

| Attribut | Valeur |
|---|---|
| **Unité** | Heures de cours + nombre de périodes |
| **Source** | Emploi du temps |

**À quoi ça sert :** Charge de travail hebdomadaire. Au Bénin, le maximum légal est de **24h/semaine** pour un enseignant du secondaire. Dépasser régulièrement → surmenage, baisse de qualité.

---

### 📈 Moyenne de la Classe

| Attribut | Valeur |
|---|---|
| **Unité** | /20 |
| **Source** | `Notes::whereIn('classe_id', ...)->avg('note')` |

**À quoi ça sert :** KPI d'**efficacité pédagogique**. Une moyenne de classe qui baisse sur plusieurs évaluations signale :
- Des difficultés d'apprentissage
- Une méthode inadaptée
- Un programme trop chargé
- Des problèmes de discipline en classe

---

### 📝 Devoirs à Corriger

**À quoi ça sert :** KPI de **charge de correction**. Un nombre élevé de copies en retard (> 30) signifie que l'enseignant n'arrive pas à suivre le rythme. L'enseignant doit soit ajuster la fréquence des devoirs, soit demander un allègement.

---

### 📋 Notes Récentes

**À quoi ça sert :** Tableau de bord pédagogique immédiat. L'enseignant voit en un coup d'œil les 5 dernières évaluations saisies avec l'appréciation (Excellent, Bien, À améliorer). Permet de repérer les élèves en difficulté.

---

### 🏫 Emploi du Temps

**À quoi ça sert :** Planification quotidienne. L'enseignant voit sa journée (classe, matière, salle, heure). Évite les conflits d'horaires et les retards entre les salles.

---

### 📚 Devoirs à Venir

**À quoi ça sert :** Planification pédagogique. L'enseignant peut préparer ses évaluations à l'avance et voir l'état de préparation (à préparer, prêt, distribué, corrigé).

---

## 10. Élève

### 📈 Moyenne Générale

| Attribut | Valeur |
|---|---|
| **Source** | API → `Notes::where('eleve_id', $id)->avg('note')` |
| **Unité** | /20 |

**À quoi ça sert :** Le KPI le plus important pour l'élève. Résume l'ensemble de ses performances. Permet de se situer par rapport à la moyenne de la classe.

---

### 🏆 Total Notes

**À quoi ça sert :** Volume d'évaluations. Un élève avec beaucoup de notes a plus d'opportunités de prouver ses compétences. Un nombre faible (< 3 par matière par trimestre) peut être injuste.

---

### ⚠️ Absences ce Mois

| Attribut | Valeur |
|---|---|
| **Source** | `Absence::where('eleve_id', $id)->whereMonth('date', now()->month)->count()` |

**À quoi ça sert :** L'élève voit son assiduité. Plus de 3 absences par mois sans justification = risque de convocation des parents. L'impact direct : une absence = cours manqués = note en baisse.

---

### 📊 Notes par Matière (Radar Chart)

**À quoi ça sert :** Vue d'ensemble des forces et faiblesses par matière.
- Forme équilibrée → bon élève général
- Forme en étoile → points forts et faibles identifiables
- Une matière en retrait → besoin de soutien spécifique

**Décision :** L'élève consacre plus de temps aux matières où le radar est enfoncé.

---

### 🏫 Emploi du Temps

**À quoi ça sert :** Organisation quotidienne. L'élève sait quels cours il a, dans quelle salle, et avec quel enseignant. Favorise l'autonomie.

---

## 11. Parent

### 👨‍👩‍👧‍👧 Enfants Scolarisés

**À quoi ça sert :** Confirmation du nombre d'enfants inscrits dans l'établissement. Un parent peut suivre tous ses enfants depuis un seul tableau de bord.

---

### 📈 Moyenne Générale (tous enfants confondus)

**À quoi ça sert :** Synthèse rapide des performances de tous les enfants. Si la moyenne générale est < 12/20, le parent doit prendre rendez-vous avec les enseignants.

---

### ✅ Assiduité

| Attribut | Valeur |
|---|---|
| **Formule** | (Total jours présents / Total jours ouvrés) × 100 |
| **Cible** | > 95 % |

**À quoi ça sert :** L'assiduité est le plus fort prédicteur de la réussite scolaire. Un enfant avec 100 % de présence réussit statistiquement mieux qu'un enfant avec 85 %. Objectif : 100 %.

---

### 💰 Solde (Imp ayé)

**À quoi ça sert :** État des frais de scolarité. Le parent voit immédiatement ce qu'il doit et l'échéance. Réduit les "je ne savais pas" et améliore le recouvrement pour l'école.

---

### 📈 Évolution des Notes (Line Chart)

**Interprétation :** Le parent voit la progression (ou régression) de chaque enfant mois par mois.
- Pente ascendante → bon suivi, enfant qui progresse
- Pente descendante → difficultés, besoin d'intervention
- Croisement des courbes → un enfant dépasse l'autre

---

### 📬 Communications Récentes

**À quoi ça sert :** Messagerie avec l'école. Les communications urgentes (surlignées en rouge) sont prioritaires. Un parent qui ne consulte pas ses messages peut manquer des informations importantes (réunion, convocation, rappel de paiement).

---

## 12. Université

### 🏛️ Facultés

| Attribut | Valeur |
|---|---|
| **Source** | Données statiques / configuration |

**À quoi ça sert :** Structure organisationnelle de l'université. Le nombre de facultés détermine la complexité de la gestion. Chaque faculté est un centre de coût.

---

### 🏫 Départements

**À quoi ça sert :** Sous-structures académiques. Une faculté avec > 6 départements est une grosse faculté qui nécessite plus de coordination.

---

### 👨‍🏫 Enseignants (Universitaires)

**À quoi ça sert :** Ratio **étudiants / enseignant** = qualité de l'enseignement supérieur. Le Ministère de l'Enseignement Supérieur recommande :
- < 30 : bon
- 30-50 : acceptable
- > 50 : alerte

---

### 🎓 Étudiants

**À quoi ça sert :** KPI principal de l'université. La croissance des effectifs (8.1 % dans les données) est positive. Une université qui perd des étudiants doit revoir son offre de formation.

---

### 📈 Inscriptions / Diplômés (Bar Chart)

**Interprétation :** L'écart entre les inscriptions (année N) et les diplômés (année N + durée du cycle) est le **taux de réussite**. Un écart > 40 % signifie que beaucoup d'étudiants ne terminent pas leur cycle (abandon, échec, réorientation).

---

### 🗺️ Facultés (Tableau de bord)

| Colonne | Utilité |
|---|---|
| **Nom** | Identification |
| **Étudiants** | Poids de la faculté |
| **Enseignants** | Ratio d'encadrement |
| **Départements** | Complexité organisationnelle |

**Décision :** Une faculté avec beaucoup d'étudiants et peu d'enseignants (< 20 étudiants/enseignant) nécessite un recrutement prioritaire.

---

### 🔔 Activités Récentes

**À quoi ça sert :** Fil d'actualité institutionnel. Permet au recteur/doyen de voir les événements importants : nouvelles inscriptions, publications de notes, conseils d'université, rappels administratifs.

---

## Annexes

### A. Arbre des KPIs

```
                                  ┌── Directeur (vision globale)
                                  │   ├── Dashboard → 3 stats cards + 2 graphes + tableau
                                  │   └── Écoles (super admin)
                                  │
                                  ├── Staff (vision opérationnelle)
                                  │   ├── Comptable → trésorerie
                                  │   ├── Surveillant → présences
                                  │   ├── Censeur → discipline
                                  │   ├── Infirmier → santé
                                  │   ├── Bibliothécaire → documentation
                                  │   └── Secrétaire → inscriptions
                                  │
    Plateforme (SIS) ─────────────┤
                                  ├── Pédagogique (vision enseignement)
                                  │   ├── Enseignant → ses classes, ses notes
                                  │   └── Élève → ses notes, ses absences
                                  │
                                  ├── Parent (vision suivi)
                                  │   └── Dashboard parental → notes + assiduité + solde
                                  │
                                  └── Admin (vision système)
                                      └── Super Admin → performance + logs + backups
```

### B. KPIs interdépendants

| Variation | Cause possible | Vérifier avec |
|---|---|---|
| Baisse des effectifs élèves | Problème d'attractivité | Dashboard Secrétaire (inscriptions) |
| Hausse des absences | Épidémie | Dashboard Infirmier (visites) |
| Hausse des sanctions | Climat scolaire tendu | Dashboard Surveillant (alertes) |
| Baisse des notes | Programme trop difficile | Dashboard Directeur (répartition) |
| Hausse des impayés | Situation économique difficile | Dashboard Comptable (recouvrement) |

### C. Sources des données (backend)

| KPI | Contrôleur Backend | Modèle |
|---|---|---|
| Directeur | `DashboardController::getDashboardData()` | Eleve, Classes, User, Notes |
| Admin | `DashboardController::admin()` | Ecole, User |
| Comptable | `DashboardController::comptable()` | Paiement |
| Surveillant | `DashboardController::surveillant()` | Absence, Eleve |
| Censeur | `DashboardController::censeur()` | Sanction, Absence |
| Infirmier | `DashboardController::infirmier()` | ConsultationMedicale |
| Bibliothécaire | `DashboardController::bibliothecaire()` | Livre, Emprunt |
| Secrétaire | `DashboardController::secretaire()` | Eleve, RendezVous |
| Enseignant | `DashboardController::enseignant()` | Notes, Classes |
| Élève | `DashboardController::eleve()` | Notes, Absence |
| Parent | `DashboardController::parent()` | Eleve, Notes |
| Université | `DashboardController::universite()` | Données configurables |
| Écoles | `EcoleController::stats()` | Ecole, Eleve, User |

---

*Document généré le 8 juillet 2026 — Révision 1.0*
