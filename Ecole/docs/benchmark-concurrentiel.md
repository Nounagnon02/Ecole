# Benchmark Concurrentiel — École vs Alternatives

## Contexte

Analyse comparative des solutions de gestion scolaire présentes sur le marché
francophone africain (Bénin, Côte d'Ivoire, Sénégal, Cameroun).

## Concurrents

| Solution | Type | Pays | Tarif | Stack | Forces | Faiblesses |
|----------|------|------|-------|-------|--------|------------|
| **École** | SaaS/On-Prem | Bénin | Gratuit-50kF/mois | Laravel+React | Open-source, multi-tenant, 15 rôles | Communauté jeune |
| **EduPlanet** | SaaS | Côte d'Ivoire | 25-100kF/mois | PHP+JS | Interface mature | Fermé, pas de mobile |
| **Scolarix** | SaaS | Cameroun | 15-75kF/mois | Python+React | Reporting avancé | Pas d'IA |
| **Gestschool** | On-Prem | Sénégal | 500kF licence unique | Java Swing | Hors-ligne | Vétuste |
| **Schoolab** | SaaS | France | 50-200€/mois | Ruby+React | UX soignée | Cher, hors Afrique |
| **OpenSIS** | Open Source | USA | Gratuit | PHP | Communauté mondiale | Pas adapté CFA |
| **Chalkboard** | SaaS | Kenya | 10-50$/mois | Laravel+Angular | Mobile-first | Pas en français |
| **iSams** | SaaS | UK | 5-15£/élève | .NET | Très complet | Très cher |

## Positionnement d'École

### Avantages concurrentiels clés

1. **Gratuité & Open Source** — Licence MIT, pas de verrouillage éditeur
2. **Multi-tenant natif** — Isolation par école, adapté aux chaînes d'établissements
3. **15 rôles utilisateur** — Couvre tous les acteurs : direction, enseignants, parents, staff
4. **IA intégrée** — EduPilot (Claude) : analyse prédictive, tutorat intelligent
5. **Omnicanal** — Web + Mobile (React Native) + Desktop (Electron)
6. **Devise XOF** — Paiements Mobile Money natifs (Orange Money, MTN MoMo)
7. **Double niveau** — Primaire, Secondaire + Université
8. **Personnalisation** — White-label, modules activables par école

### Opportunités de marché

| Marché | Écoles estimées | TAM | Pénétration actuelle |
|--------|----------------|-----|---------------------|
| Bénin | 15 000 écoles | 3,5M€/an | <5% |
| Côte d'Ivoire | 30 000 écoles | 7M€/an | <10% |
| Sénégal | 20 000 écoles | 5M€/an | <8% |
| Cameroun | 25 000 écoles | 6M€/an | <5% |
| **Total UEMOA** | **100 000+** | **25M€/an** | **<8%** |

### Matrice Fonctionnelle

| Fonctionnalité | École | EduPlanet | Scolarix | Gestschool | OpenSIS |
|----------------|-------|-----------|----------|------------|---------|
| Gestion notes/bulletins | ✅ | ✅ | ✅ | ✅ | ✅ |
| Paiements Mobile Money | ✅ | ✅ | ❌ | ❌ | ❌ |
| Emploi du temps | ✅ | ✅ | ✅ | ✅ | ✅ |
| Communication parents | ✅ | ✅ | ✅ | ❌ | ✅ |
| Infirmerie | ✅ | ❌ | ❌ | ❌ | ❌ |
| Bibliothèque | ✅ | ❌ | ✅ | ❌ | ✅ |
| Discipline/Censure | ✅ | ✅ | ✅ | ✅ | ❌ |
| Comptabilité | ✅ | ✅ | ✅ | ✅ | ❌ |
| IA prédictive | ✅ | ❌ | ❌ | ❌ | ❌ |
| Tutorat intelligent | ✅ | ❌ | ❌ | ❌ | ❌ |
| Application mobile | ✅ | ❌ | ✅ | ❌ | ✅ |
| Multi-tenant | ✅ | ❌ | ❌ | ❌ | ❌ |
| Open source | ✅ | ❌ | ❌ | ❌ | ✅ |
| Langue française | ✅ | ✅ | ✅ | ✅ | Partiel |
| Support XOF/CFA | ✅ | ✅ | ✅ | ✅ | ❌ |
| API REST complète | ✅ | Partiel | ✅ | ❌ | ✅ |
| Export XLSX/PDF | ✅ | ✅ | ✅ | ✅ | ✅ |

## Recommandations stratégiques

1. **Pricing** : Freemium (gratuit 1 classe) → Pro (50kF/mois) → Campus (100kF/mois)
2. **Priorité feature** : Multi-school → E-learning → Alumni
3. **Expansion** : Bénin d'abord (marché test), puis Côte d'Ivoire, Sénégal
4. **Partenariats** : Orange Money, MTN, opérateurs télécoms pour distribution
5. **Différenciation forte** : IA EduPilot + Multi-tenant + Open Source
