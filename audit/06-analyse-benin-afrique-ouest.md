# 06 — Adéquation au Bénin et à l'Afrique de l'Ouest

> **Statut des affirmations.** **[Observé]** : constaté dans Chrome ou dans le code pendant l'audit. **[Contexte]** : fait général sur le marché, donné de mémoire, **sans source vérifiée pendant l'audit** — à confirmer avant toute décision. **[Hypothèse]** : supposition sur les utilisateurs, à valider par des entretiens dans de vraies écoles.
>
> Aucune étude de terrain n'a été menée. Les réseaux lents et les petits écrans ont été **simulés** dans Chrome.

## 1. Marché réellement visé

**[Observé]** Tout, dans le dépôt, désigne le Bénin : données de démonstration (Cotonou, Abomey, noms béninois, `@ecole.bj`, `@uac.bj`), indicatif `+229`, FedaPay comme prestataire de paiement, classes de la maternelle à la terminale avec séries A, C, D, université calquée sur l'UAC. Rien n'indique une cible hors du Bénin : pas de sélection de pays, pas d'autre devise, pas d'autre indicatif.

**Conséquence :** cet audit traite le Bénin comme marché cible. Les autres pays d'Afrique de l'Ouest sont abordés en §9 comme une extension possible, pas comme un acquis.

## 2. Connectivité

| Situation simulée | Résultat | Verdict |
|---|---|---|
| 4G correcte | Connexion utilisable en 1,6 s, tableau de bord en 2,1 s | Bon |
| 3G | 3,2 s puis 3,4 s | Acceptable |
| 3G lente (400 kb/s) | **8,6 s** avant de pouvoir se connecter | Dissuasif |
| 2G / EDGE | **13,9 s** | Inutilisable en pratique |
| Coupure pendant la saisie d'une annonce | Mise en file, envoyée au retour du réseau — **sans aucun message** | Mécanisme bon, information absente |
| Coupure puis clic sur un autre menu | **Page vide** | Défaut (BUG-018) |
| Page restée longtemps en chargement | Indicateur tournant, sans message ni délai maximal | Défaut |

**[Observé]** Le poids de la première visite est raisonnable (302 ko), mais il tient presque entièrement dans un seul script que tous les rôles téléchargent. Aucune image lourde.

**[Contexte]** Hors des grandes villes, et même à Cotonou aux heures de pointe, la 3G reste courante et les coupures fréquentes. Les forfaits sont prépayés et limités : un utilisateur hésite à ouvrir une application « qui consomme ».

**Faut-il un mode hors-ligne ?** Pas partout. Il se justifie pour deux usages précis :

1. **L'appel et la saisie des notes par l'enseignant** : faits en classe, souvent sans réseau, par lots de 40 à 60 élèves. Perdre une saisie est inacceptable. Le mécanisme de file d'attente existe déjà dans le code (`offline-queue`) : il suffit de l'étendre et, surtout, de **dire à l'utilisateur ce qui est en attente**.
2. **La consultation par le parent** de la dernière situation connue (notes, solde) : afficher les données de la dernière visite avec leur date, plutôt qu'une page vide.

Il **ne se justifie pas** pour le paiement (qui exige le réseau) ni pour l'administration.

## 3. Téléphones et équipements

**[Observé]**
- Le menu mobile fonctionne à 360 px.
- 8 pages débordent en largeur à 390 px, dont `/notes` et `/emploi-du-temps`, les deux pages qu'un parent ou un élève consulte le plus.
- 18 % des boutons font moins de 32 px ; sur `/notes` à 360 px, 7 éléments tactiles sur 18 sont sous 44 px.
- Plus petite police : 12 px.

**[Contexte]** Le téléphone type est un Android d'entrée de gamme (écran de 5 à 6,5 pouces, 2 à 3 Go de mémoire, navigateur Chrome), parfois partagé dans la famille.

**[Hypothèse]** Beaucoup de parents n'ouvriront jamais un navigateur pour l'école, mais répondront à un SMS ou à un message WhatsApp.

**Non testé :** l'application mobile Expo du dépôt, qui est sans doute le vrai canal pour les parents ; un téléphone physique ; la consommation de mémoire.

**Appareil partagé :** **[Observé]** la session repose sur un cookie ; rien n'invite à se déconnecter et aucune expiration courte n'a été constatée. Sur un téléphone partagé ou un ordinateur de salle des professeurs, la session du précédent reste ouverte. Pour la direction et la comptabilité, la double authentification limite le risque à la connexion suivante seulement.

## 4. Langues et compréhension

**[Observé]**
- Interface en français, anglais et arabe. Le français est correct ; l'arabe est incomplet (BUG-027).
- Des messages restent en anglais (« The titre field is required. ») ou techniques (« Unauthorized - Role required »).
- Vocabulaire parfois administratif ou abrégé : « Taux de recouvrement », « Échéancier », « Affectations », « 2FA », « Provisionner ».
- Aucun pictogramme d'aide, aucune assistance vocale.

**Analyse par public**

| Public | Français écrit | Besoin réel |
|---|---|---|
| Direction, enseignants, personnel | Maîtrisé (langue de travail de l'école) | Français clair, sans anglicisme. Rien d'autre |
| Élèves du secondaire, étudiants | Maîtrisé | Idem |
| Parents | **Très variable** [Hypothèse] : une partie lit peu ou pas le français | Messages très courts, chiffres et pictogrammes ; **notifications vocales ou en langue locale** pour les informations importantes (absence, échéance) |

**Faut-il traduire l'interface en langues nationales ?** **Non, pas en priorité.** [Hypothèse] Un parent qui ne lit pas le français lit rarement le fongbé ou le yoruba écrits : ces langues sont surtout orales. Traduire les menus coûterait cher pour peu d'effet. Ce qui apporte une vraie valeur :

1. **Des messages vocaux** (note vocale WhatsApp ou appel automatique) en **fongbé** d'abord (langue la plus parlée dans le sud, où se concentrent les écoles privées), puis en **yoruba/nago**, **bariba** et **dendi** selon l'implantation des écoles clientes, pour trois événements : absence de l'enfant, échéance de paiement, convocation.
2. **Un français simplifié** partout côté parent : « Reste à payer » plutôt que « Solde », « Dates de paiement » plutôt que « Échéancier ».

**L'arabe** : sa présence étonne pour le Bénin. **[Hypothèse]** Utile seulement si le produit vise des écoles franco-arabes ou des pays du Sahel ; sinon, c'est une charge de maintenance (60 ko de traductions) sans utilisateurs. L'anglais peut servir aux écoles bilingues et à une ouverture vers le Nigeria ou le Ghana.

## 5. Moyens de paiement

**[Observé]**
- Prestataire intégré : **FedaPay** (agrégateur béninois). Un fournisseur Stripe existe dans le code de facturation de la plateforme.
- La validation du paiement mobile n'accepte que **MTN** et **Moov** ; **Celtiis** est absent.
- Le numéro de téléphone du payeur n'est pas contrôlé.
- **Le parent ne peut pas payer** depuis le web, et le comptable ne peut pas ouvrir un échéancier (BUG-003). Le parcours n'a donc pas pu être évalué : ni les frais, ni la confirmation, ni l'attente, ni l'échec, ni le risque de double paiement.
- Le reçu d'un paiement enregistré s'ouvre correctement (parcours J3).

**[Contexte]** Au Bénin, le paiement des frais de scolarité se fait surtout en espèces à la comptabilité de l'école et, de plus en plus, par MTN Mobile Money et Moov Money ; Celtiis Cash progresse. La carte bancaire est marginale chez les parents. Wave et Orange Money ne sont pas implantés au Bénin (ils le sont au Sénégal, en Côte d'Ivoire, au Mali, au Burkina Faso).

**Ce qu'un parcours de paiement adapté doit garantir** (aucun de ces points n'a pu être vérifié) :

| Exigence | Pourquoi |
|---|---|
| Paiement **partiel** et par tranches | Les familles paient rarement en une fois |
| Frais affichés **avant** validation, et qui les supporte | Les frais de mobile money sont un motif de méfiance |
| Numéro prérempli, modifiable (le payeur n'est pas toujours le titulaire du compte) | Un oncle, une tante paient souvent pour l'enfant |
| État « en attente » clair, sans possibilité de repayer tant qu'il dure | Le risque de double paiement est le premier sujet de plainte |
| **Reçu par SMS ou WhatsApp**, pas seulement à l'écran | Preuve à montrer à l'école |
| Enregistrement d'un **paiement en espèces** par la comptabilité | Reste le mode dominant — or le bouton « Nouveau paiement » est sans effet |

## 6. Données et formats locaux

| Élément | Constat | Verdict |
|---|---|---|
| Devise | Franc CFA (XOF) via `Intl`, sans décimales | Bon ; deux écritures coexistent (« FCFA », « F CFA ») |
| **Téléphone** | L'interface accepte `0197123456` (10 chiffres) ; **le service SMS ne reconnaît que 8 chiffres** | **Défaut élevé** (BUG-012). **[Contexte]** numérotation à 10 chiffres, préfixe 01, depuis le 30 novembre 2024 — à confirmer auprès de l'ARCEP |
| Exemple de saisie | « +229 01 02 03 04 » sur le formulaire d'école : format à 8 chiffres | À mettre à jour |
| Dates | Format français (« mercredi 11 novembre 2026 ») | Bon |
| **Fuseau horaire** | Serveur en **UTC** ; le Bénin est à UTC+1, sans heure d'été | Défaut (BUG-024) |
| Langue par défaut de l'API | Anglais | Défaut (BUG-017) |
| Adresse | Champ libre (« Quartier Hountondji, Abomey ») | **Bon choix** : pas de code postal imposé ; l'adressage se fait par quartier et repère |
| Découpage administratif | Aucun référentiel (département, commune, arrondissement) | Acceptable pour une école ; utile seulement pour des statistiques multi-écoles |
| Noms | Nom en majuscules puis prénom ; accents, apostrophes et traits d'union acceptés (« Sainte-Thérèse d'Abomey », « Yèhossou ») | Bon |
| Système scolaire | Maternelle (3 sections), primaire (CI absent : la liste commence au CP), collège, lycée avec séries A, C, D ; trimestres ; notes sur 20 ; coefficients | Globalement adapté. **À vérifier :** absence du CI, séries B, G, F du technique, rang, moyenne de classe, mentions |
| Examens nationaux | CEP, BEPC, BAC : aucune fonction dédiée repérée | Manque possible |
| Année scolaire | Septembre à juillet | Non vérifié dans l'interface |

## 7. Usages et comportements

**[Observé]**
- **Aucune notification sortante n'a pu être constatée** : pas de SMS, pas de WhatsApp, courriel en simulation. Or **[Hypothèse]** c'est le canal qui touche réellement les parents ; une application qu'il faut penser à ouvrir sera peu consultée.
- **Le courriel comme pivot** (mot de passe oublié par courriel, identifiant = adresse électronique pour 32 parents sur 33) : **[Contexte]** beaucoup de parents n'ont pas d'adresse électronique active, ou ne la consultent pas. Le numéro de téléphone est l'identifiant naturel.
- **La double authentification par application** (Google Authenticator) est imposée à la direction et à la comptabilité, **sans code de secours**. **[Hypothèse]** Installer une application d'authentification est un obstacle réel pour un directeur ou un comptable d'école ; un téléphone perdu, volé ou réinitialisé bloque définitivement le compte. Un code par SMS, moins sûr mais praticable, ou des codes de secours imprimables sont nécessaires.
- **Confiance et données personnelles :** aucune mention d'information sur l'usage des données, aucun consentement, aucun lien vers une politique de confidentialité n'a été rencontré. Les dossiers médicaux et disciplinaires d'enfants sont des données sensibles. **[Contexte]** Le Code du numérique béninois et l'APDP (autorité de protection des données) imposent des formalités — **à faire valider par un juriste**.
- **Annuaire ouvert dans la messagerie** (BUG-010) : contraire à l'attente de discrétion des familles.
- **Interruptions :** une saisie longue n'est pas sauvegardée en brouillon ; une coupure d'électricité ou un appel entrant fait perdre le formulaire.
- **Assistance :** « Contactez votre administrateur », sans numéro.

## 8. Pertinence des fonctionnalités

| Fonctionnalité | Problème résolu | Qui, à quelle fréquence | Adaptée ? | État constaté | Verdict |
|---|---|---|---|---|---|
| Notes et bulletins | Informer les familles, produire les bulletins | Enseignants (hebdo), parents (mensuel), direction (trimestriel) | Oui, cœur du besoin | Page vide, saisie impossible | **À réparer d'abord** |
| Paiement de la scolarité | Encaisser, réduire les impayés | Parents (3 à 9 fois l'an), comptable (quotidien) | Oui, forte valeur | Inatteignable | **À réparer d'abord** |
| Annonces | Remplacer le cahier de liaison | Direction (hebdo), parents | Oui | **Fonctionne** | À compléter par SMS/WhatsApp |
| Messagerie | Échanges parent-enseignant | Occasionnel | Oui, si cadrée | Fonctionne ; annuaire trop ouvert | À restreindre |
| Absences et appel | Prévenir les parents le jour même | Surveillant (quotidien) | Oui, très attendu | Inutilisable | À développer, avec alerte SMS |
| Emploi du temps | Informer | Élèves, enseignants | Oui | Lecture seule, déborde sur mobile | À corriger |
| Infirmerie, bibliothèque, transport | Gestion interne | Peu d'écoles ont ces services structurés [Hypothèse] | Pour les grands établissements | Lecture seule | **Secondaire** : à reporter |
| Module université | Autre marché | — | Besoins très différents d'une école | En erreur | **À sortir du périmètre** tant que l'école n'est pas solide |
| Assistant IA | Conseils, analyses | Incertain | [Hypothèse] faible valeur perçue, coût par requête, exige le réseau | Refusé | **Gadget à ce stade** : à reporter |
| Marque blanche, plans, facturation plateforme | Vendre le service | Éditeur | Oui, côté éditeur | Boutons décoratifs | Après le cœur de métier |
| Journal d'audit | Traçabilité | Direction | Oui | Lecture | Bon |

**Constat d'ensemble :** le produit est **large mais peu profond**. Vingt rôles et une soixantaine de pages existent, mais les trois gestes qui font la valeur d'un logiciel scolaire au Bénin — saisir des notes, encaisser la scolarité, prévenir les parents — ne fonctionnent pas sur le web.

## 9. Extension à d'autres pays d'Afrique de l'Ouest

Rien n'est prêt aujourd'hui. Ce qu'il faudrait, par ordre de coût croissant :

| Besoin | Commun à la zone UEMOA | Spécifique |
|---|---|---|
| Devise | XOF commun au Bénin, Togo, Côte d'Ivoire, Sénégal, Mali, Burkina Faso, Niger, Guinée-Bissau | Naira (Nigeria), cedi (Ghana), franc guinéen |
| Téléphone | — | Indicatif et longueur par pays : rendre le format paramétrable |
| Paiement | Mobile money dominant partout | MTN/Moov/Celtiis (Bénin) ; Flooz/TMoney (Togo) ; Orange Money/Wave/MTN (Côte d'Ivoire, Sénégal) ; un agrégateur multi-pays éviterait une intégration par opérateur |
| Système scolaire | Trimestres, notes sur 20, examens nationaux | Noms des classes, séries, examens et barèmes propres à chaque pays |
| Langue | Français | Anglais (Nigeria, Ghana) ; langues nationales pour le vocal |
| Réglementation | — | Autorité de protection des données et règles propres à chaque pays |

**Recommandation :** réussir au Bénin avant d'ouvrir un second pays ; le **Togo** est l'extension la plus naturelle (même devise, même langue, système scolaire proche).
