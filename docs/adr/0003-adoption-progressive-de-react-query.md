# ADR-0003 : Adoption progressive de react-query, pas un remplacement en un passage

**Statut** : Acceptée
**Date** : 2026-09-20

## Contexte

Le frontend fait cohabiter quatre façons de gérer l'état serveur :
`useApiQuery`/`useApiMutation` (react-query, 3 pages), un hook maison
`useApi()` (`useState` + axios, sans cache ni invalidation, 39 pages),
`useDashboardData` (`useState` + `Map`, 12 dashboards), et un appel `axios`
direct dans un `useEffect` (1 page). react-query est déjà configuré
globalement (`QueryClientProvider` au niveau racine) mais ne pilote qu'une
poignée de pages.

Deux bugs réels trouvés pendant l'audit venaient précisément de l'absence
de cache/déduplication du hook maison : un webhook de paiement et un job
d'export qui perdaient le contexte d'école ambiant parce que rien ne
partageait un état entre les appels (cf. `SchoolContext`).

## Décision

Migrer vers react-query page par page, en commençant par les surfaces où
le hook maison a concrètement causé un bug (paiements, exports), plutôt
qu'un remplacement en un seul passage des 39 pages qui utilisent encore
`useApi()`. Chaque migration est un changement isolé et testable, pas un
gros diff qui mélange la migration technique avec les corrections de bugs
qu'elle révèle au passage.

Un remplacement big-bang aurait unifié l'état serveur plus vite, mais sur
un dépôt sans TypeScript et avec une couverture de tests inégale entre les
39 pages concernées (~39 des 50 pages sans test avant cet audit), le risque
de régression silencieuse dépassait le bénéfice d'uniformité immédiate.

## Conséquences

Le dépôt reste avec quatre mécanismes coexistants pendant la transition,
ce qui demande de savoir dans quel fichier on est avant de savoir comment
il gère son état serveur. Chaque nouvelle page doit choisir react-query
(c'est le mécanisme cible, pas une option parmi d'autres) pour ne pas
ajouter un cinquième pattern à la liste.

À revoir si : le nombre de pages sur `useApi()` cesse de diminuer sur
plusieurs chantiers consécutifs — signe qu'il faut un sprint dédié plutôt
que de compter sur l'opportunisme « on migre quand on touche la page ».
