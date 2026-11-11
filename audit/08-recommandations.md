# 08 — Recommandations

Chaque recommandation distingue le **fait observé**, l'**hypothèse** éventuelle et l'**amélioration proposée**. Les références BUG renvoient à `04`. Les estimations de complexité sont des ordres de grandeur d'expert (S : quelques jours · M : une à trois semaines · L : plus d'un mois), **non chiffrées avec l'équipe**.

## A. Corrections indispensables

| N° | Fait observé | Amélioration | Complexité |
|---|---|---|---|
| A1 | La page « Notes » est vide malgré 641 notes (BUG-001) | Lire la réponse paginée (`unwrapList`), afficher la pagination | S |
| A2 | 111 boutons sur 274 sans effet (BUG-002) | **Dans l'immédiat :** retirer ou désactiver tout bouton sans action. **Ensuite :** développer les formulaires dans l'ordre du §D | S puis L |
| A3 | Le parent ne peut ni voir ni payer ; le comptable ne peut ouvrir aucun échéancier (BUG-003) | Page « Mes paiements » du parent sur les routes parent ; autoriser le comptable à lister les élèves ; bouton « Payer » | M |
| A4 | 44 pages sur 210 s'ouvrent sur un refus de l'API (BUG-004, 006, 023) | Aligner les droits de `route-config.js` sur ceux de l'API ; test automatique qui échoue quand ils divergent | M |
| A5 | Tableau de bord université en erreur 500 ; page des cours en erreur d'affichage (BUG-005, 014) | Corriger, ou masquer le module université tant qu'il n'est pas stable | S à M |
| A6 | La recherche globale plante (BUG-007) | Afficher le nom de la classe, pas l'objet ; ajouter une barrière d'erreur autour de la palette | S |
| A7 | Élève retiré toujours affiché « actif », sans message (BUG-008) | Rafraîchir la liste, afficher le statut réel, message de confirmation avec « Annuler », action « Réintégrer » | S |
| A8 | Un parent voit et peut contacter tous les utilisateurs (BUG-010) | Restreindre les contacts aux enseignants de ses enfants, à la direction et au secrétariat | S à M |
| A9 | SMS : numéros à 10 chiffres rejetés (BUG-012) | Accepter `01XXXXXXXX` et `+22901XXXXXXXX` ; convertir les anciens numéros à 8 chiffres ; contrôler le format à la saisie | S |
| A10 | Messages du serveur en anglais ; heure en UTC (BUG-017, 024) | `locale = fr`, traductions de validation, `timezone = Africa/Porto-Novo` | S |
| A11 | « Nouvelle publication » proposé à des rôles refusés (BUG-011) | Masquer le bouton selon le rôle | S |
| A12 | Fiche parent sans école dans les données de démonstration (BUG-013) | Corriger le peuplement ; empêcher en base la création d'un parent sans école | S |

## B. Améliorations de l'expérience

| N° | Fait observé | Amélioration | Effet attendu |
|---|---|---|---|
| B1 | Aucun retour après plusieurs actions réussies | Message systématique, court, en français, avec « Annuler » quand c'est possible | L'utilisateur sait que c'est fait |
| B2 | Erreurs techniques affichées telles quelles | Messages qui disent quoi faire ; journaliser le détail technique côté serveur seulement | Moins d'appels à l'aide |
| B3 | Quatre mots pour annonces et messages | « Annonces » (école vers tous) et « Messages » (à deux) partout | Menu compréhensible |
| B4 | Onglets du tableau de bord qui doublent le menu | Les supprimer ; faire de « Mes enfants » l'accueil du parent | Moins d'écrans |
| B5 | « Échecs 100 % », « Impayés 100 % » sans données | Afficher « — » quand il n'y a rien à mesurer | Chiffres crédibles |
| B6 | 172 champs sans étiquette, 115 boutons sans nom (BUG-016) | Étiquette visible sur chaque champ ; `aria-label` sur chaque bouton à icône, ou icône + mot | Accessibilité, clarté |
| B7 | 8 pages débordent sur téléphone ; cibles trop petites (BUG-019, 020) | Tableaux transformés en cartes sous 768 px ; cibles de 44 px | Lecture à une main |
| B8 | Indicateur de chargement sans fin ni message | Après 5 s : « Connexion lente… » ; après 15 s : « Réessayer » | Fin de l'attente à l'aveugle |
| B9 | Page vide hors-ligne ; file d'attente silencieuse (BUG-018) | Afficher les dernières données connues, datées ; pastille « 1 envoi en attente » puis « Envoyé » | Confiance en zone mal couverte |
| B10 | Aucune aide, aucun contact | Numéro de téléphone et WhatsApp de l'école sur la connexion et dans le menu ; guide de première connexion en 3 écrans | Autonomie |
| B11 | Script principal de 849 ko pour tous les rôles | Découper par rôle, charger les graphiques à la demande | Connexion utilisable en moins de 5 s en 3G lente |
| B12 | Exports et reçus ouverts dans un nouvel onglet (BUG-029) | Téléchargement avec nom de fichier explicite | Pas de sortie de l'application |

## C. Adaptations au Bénin et à l'Afrique de l'Ouest

| N° | Fait observé / contexte | Hypothèse | Amélioration | Segment |
|---|---|---|---|---|
| C1 | Aucune notification sortante constatée ; service SMS Africa's Talking présent dans le code mais non branché à un parcours observé | Les parents ne viendront pas d'eux-mêmes consulter l'application | **SMS** (et WhatsApp quand c'est possible) pour : absence du jour, nouvelle note ou bulletin, échéance à 7 jours et à 1 jour, reçu de paiement, convocation | Parents, Bénin |
| C2 | Identifiant = adresse électronique pour 32 parents sur 33 ; mot de passe oublié par courriel | Beaucoup de parents n'ont pas de courriel actif | **Connexion par numéro de téléphone** et code reçu par SMS ; réinitialisation par SMS | Parents |
| C3 | MTN et Moov seulement ; pas de paiement partiel constaté ; « Nouveau paiement » sans effet | Les familles paient par tranches, souvent en espèces | Ajouter **Celtiis** ; paiement partiel libre ; frais affichés avant validation ; saisie des **paiements en espèces** par la comptabilité avec reçu imprimable et SMS | Parents, comptables |
| C4 | Double authentification par application, sans code de secours | Obstacle pour la direction ; risque de blocage définitif | Codes de secours imprimables à l'activation ; option code par SMS ; procédure de déblocage par le super-admin | Direction, comptabilité |
| C5 | Français parfois administratif ; pas de langue locale | Une partie des parents lit peu le français, et pas davantage les langues nationales à l'écrit | Français simplifié côté parent ; **messages vocaux** en fongbé d'abord, puis yoruba/nago, bariba, dendi selon les écoles clientes | Parents peu lettrés |
| C6 | 8,6 s en 3G lente, 13,9 s en 2G | Zones rurales, fin de forfait | Voir B11 ; page parent allégée (notes, solde, annonces) sans graphiques | Parents hors grandes villes |
| C7 | Saisie non sauvegardée ; coupures fréquentes | L'appel et la saisie des notes se font en classe | Brouillon automatique et envoi différé pour l'appel et les notes | Enseignants, surveillants |
| C8 | Session longue sur cookie, pas d'invitation à se déconnecter | Téléphones et ordinateurs partagés | Déconnexion automatique après inactivité (durée courte pour la direction et la comptabilité) ; bouton « Se déconnecter » visible sur mobile | Tous |
| C9 | Aucune information sur les données personnelles ; dossiers médicaux et disciplinaires d'enfants | Obligation légale probable | Mention d'information, consentement des parents, déclaration auprès de l'APDP — **à valider par un juriste** | Éditeur, écoles |
| C10 | Arabe présent, incomplet | Peu d'utilisateurs au Bénin | Retirer l'arabe ou le terminer selon la cible commerciale réelle | Éditeur |
| C11 | Classes et séries codées pour un cas ; CI absent de la liste ; pas de fonction pour le CEP, le BEPC, le BAC | Chaque école a ses particularités | Référentiel des classes, séries et examens paramétrable par école | Écoles |
| C12 | Module université, infirmerie, bibliothèque, transport, IA : larges mais en lecture seule ou en erreur | Peu d'écoles en ont besoin au départ | Les mettre en retrait (désactivables par école) et concentrer l'effort sur notes, paiements, absences | Éditeur |

## D. Nouvelles fonctionnalités à forte valeur

Classées par valeur pour les utilisateurs. Les trois premières ne sont pas « nouvelles » : elles sont annoncées par l'interface et absentes.

### D1 — Saisie des notes par l'enseignant
- **Problème :** aucune saisie possible sur le web (BUG-002). **Utilisateurs :** enseignants, direction.
- **Solution :** grille par classe et par évaluation, navigation au clavier, enregistrement automatique, brouillon hors-ligne, import d'un tableur.
- **Valeur :** sans notes, pas de bulletin ni de suivi parental. **Faisabilité :** l'API existe (`/notes`, verrouillage, export). **Complexité :** M. **Dépendances :** affectations (BUG-009). **Priorité :** P0.

### D2 — Paiement de la scolarité par le parent, par mobile money
- **Problème :** BUG-003. **Utilisateurs :** parents, comptables.
- **Solution :** écran « Reste à payer » → montant libre → opérateur → validation sur le téléphone → reçu par SMS. Saisie des espèces côté comptable.
- **Valeur :** encaissement plus rapide, moins d'impayés, argument commercial principal. **Faisabilité :** FedaPay intégré côté API ; **à tester en bac à sable**. **Complexité :** M à L. **Dépendances :** clés FedaPay, C3. **Priorité :** P0.

### D3 — Inscription et dossier de l'élève
- **Problème :** « Nouvel élève » sans effet ; pas de fiche détaillée. **Utilisateurs :** secrétariat, direction.
- **Solution :** formulaire d'inscription (élève, parents, classe, pièces), fiche élève, réinscription d'une année sur l'autre.
- **Valeur :** point d'entrée de toutes les autres données. **Complexité :** M. **Priorité :** P0.

### D4 — Appel quotidien et alerte d'absence aux parents
- **Problème :** l'appel est impossible (BUG-006) ; aucune alerte. **Utilisateurs :** surveillants, enseignants, parents.
- **Solution :** appel en trois touches par élève (présent, absent, retard), utilisable hors-ligne ; SMS au parent le jour même.
- **Valeur :** fonction la plus visible pour les parents, différenciante. **Complexité :** M. **Dépendances :** C1. **Priorité :** P1.

### D5 — Notifications par SMS et WhatsApp
- Voir C1. **Complexité :** M. **Dépendances :** contrat avec un fournisseur, budget par message (à faire porter par l'école ou l'abonnement). **Priorité :** P1.

### D6 — Bulletins : génération, verrouillage, remise
- **Problème :** les écrans « Bulletins » existent (« Recalculer l'instantané », « Verrouiller le bulletin ») mais n'ont pas pu être évalués faute de notes affichées. **Solution :** génération par classe, PDF, envoi du lien par SMS, impression en lot. **Complexité :** M. **Priorité :** P1.

### D7 — Connexion par téléphone
- Voir C2. **Complexité :** M. **Priorité :** P1.

### D8 — Tableau « ce qui demande une décision » pour la direction
- **Problème :** les tableaux de bord montrent des chiffres, pas des actions. **Solution :** trois listes : impayés par classe, notes non saisies par enseignant, absences non justifiées, chacune avec une action (« Relancer »). **Complexité :** S à M. **Priorité :** P2.

### Écartées
- **Assistant IA, marque blanche, module université, application de bureau :** pas de besoin utilisateur démontré à ce stade, coût de maintenance réel. À reprendre une fois D1 à D4 en service.
- **Traduction de l'interface en langues nationales :** voir C5 ; le vocal apporte plus pour moins cher.
