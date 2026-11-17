# 05 — Analyse UX/UI

> **Nature de cette analyse.** C'est une **évaluation d'expert** (heuristique), fondée sur les écrans réellement parcourus dans Chrome et sur les mesures de `03` et `07`. **Aucun test n'a été mené avec de vrais parents, enseignants ou agents.** Chaque constat est étiqueté : **[Observé]** (vu à l'écran ou mesuré), **[Hypothèse]** (à vérifier avec des utilisateurs).

## 1. Ce qui est réussi

- **[Observé] Une identité visuelle cohérente.** Barre verte, onglets, cartes à filets fins, une seule police : toutes les pages parcourues partagent les mêmes composants. La page de connexion ne présente aucune violation d'accessibilité détectée.
- **[Observé] La connexion est simple et sûre.** Deux champs, messages d'erreur en français (« Identifiants incorrects »), validation locale avant envoi, pas d'indice sur l'existence d'un compte.
- **[Observé] Le français est globalement correct**, accents compris, et les montants sont en francs CFA.
- **[Observé] Les états vides existent** (« Aucun élève trouvé », « Aucune note trouvée ») et la recherche d'élèves filtre correctement (32 → 1 ligne).
- **[Observé] Le menu mobile fonctionne** à 360 px, et un bandeau prévient en cas de coupure du réseau.
- **[Observé] Aucun accès indu** : chaque rôle ne voit que ses pages (970 refus sur 970 tentatives).

## 2. Le problème central : une interface qui promet plus qu'elle ne fait

**[Observé]** Sur 274 boutons distincts cliqués, 111 n'ont aucun effet et 13 échouent côté API. L'utilisateur ne peut pas distinguer un bouton qui fonctionne d'un bouton décoratif : ils ont la même apparence.

C'est le défaut d'ergonomie le plus grave du produit, avant toute question de couleur ou de mise en page. Un directeur qui clique « Nouvel élève » et ne voit rien se passer ne se dit pas « fonction à venir » : il pense que l'outil est en panne, et il n'y revient pas. **[Hypothèse]** Dans un contexte où la confiance envers un service numérique se gagne à l'usage, un seul bouton mort sur un écran de paiement suffit à faire douter de tout le reste.

**Recommandation :** retirer immédiatement tout bouton sans action (ou le désactiver avec la mention « Bientôt disponible »), puis rétablir les fonctions une à une.

## 3. Navigation

| Constat | Nature | Détail |
|---|---|---|
| 21 % des pages ouvertes mènent à un refus de l'API | [Observé] | Le menu propose « Élèves » au comptable, « Notes » au bibliothécaire, « Emploi du temps » au recteur ; la page s'ouvre sur une erreur (BUG-006) |
| Trois mots pour une même idée | [Observé] | « Annonces » (menu), « Communications » (titre de page), « Échanges » (onglet du tableau de bord parent), « Messagerie » (autre page) |
| Les onglets du tableau de bord doublent le menu | [Observé] | Parent : onglets « Notes », « Emploi du temps », « Paiements » sous un menu qui contient déjà « Notes » et « Paiements ». L'onglet « Notes » quitte le tableau de bord pour la page « Notes » |
| « Messagerie » absente du menu de plusieurs rôles | [Observé] | La page est autorisée à tous mais n'apparaît dans le menu que via « Plus » ou pas du tout selon le rôle (`01`, « pages sans lien dans le menu ») |
| Jusqu'à 9 entrées de menu, dont 3 cachées dans « Plus » | [Observé] | Directeur : 6 visibles + « Plus » |
| Fil d'Ariane technique | [Observé] | « Accueil › Parent › Ai report » |

**Recommandation :** un seul mot par notion (« Annonces » pour ce que l'école diffuse, « Messages » pour les échanges à deux) ; supprimer les onglets qui renvoient vers une autre page ; ne jamais afficher un lien que le rôle ne peut pas utiliser.

## 4. Parcours principaux : nombre d'étapes

Compté sur les écrans réels, depuis la page de connexion.

| Objectif | Rôle | Étapes | Résultat |
|---|---|---|---|
| Voir les notes de mon enfant | Parent | Connexion → « Mes enfants » : **2 écrans, 1 clic** après la connexion | **Atteint** (notes listées dans la fiche de l'enfant) |
| Voir les notes depuis « Notes » | Parent | Connexion → « Notes » | **Échec** : page vide (BUG-001) |
| Voir ce que je dois payer | Parent | Tableau de bord : solde affiché | Partiel : montant global, sans détail |
| Payer la scolarité | Parent | — | **Impossible** (BUG-003) |
| Lire une annonce de l'école | Parent, élève | Connexion → « Annonces » : 1 clic | **Atteint** |
| Écrire à un enseignant | Parent | « Messagerie » → « Nouvelle conversation » → choisir parmi 87 noms → écrire → Entrée : **4 actions** | **Atteint**, mais liste trop longue et non filtrée par pertinence (BUG-010) |
| Publier une annonce | Directeur | « Annonces » → « Nouvelle publication » → titre, texte → « Publier » : **3 actions** | **Atteint**, visible aussitôt par parents et élèves |
| Saisir des notes | Enseignant | — | **Impossible** (BUG-002) |
| Inscrire un élève | Secrétaire, directeur | — | **Impossible** (BUG-002) |
| Faire l'appel | Surveillant | — | **Impossible** (`/surveillant/presences` : API refusée, « Modifier » sans effet) |
| Retirer un élève | Directeur | « Élèves » → « Retirer » → confirmer : 3 actions | Partiel : effectué en base, mais affichage inchangé (BUG-008) |
| Créer une école | Super-admin | « Écoles » → « Ajouter » → 5 champs → « Créer » | **Atteint** |
| Activer la double authentification | Direction, comptabilité | Écran imposé à la première connexion : QR code, code à 6 chiffres | **Atteint** |

## 5. Formulaires et messages

| Constat | Nature |
|---|---|
| Les messages de validation du serveur sont en anglais (« The titre field is required. ») | [Observé] BUG-017 |
| Plus de la moitié des champs n'ont pas d'étiquette visible, seulement un texte indicatif | [Observé] 172 sur 324 |
| Aucun message après une action réussie sur plusieurs écrans (retrait d'un élève, création d'école, publication hors-ligne) | [Observé] |
| Les erreurs techniques sont montrées telles quelles (« Erreur : Unauthorized - Role required: directeur, comptable ») | [Observé] |
| Statistiques trompeuses quand il n'y a pas de données : « Échecs 100 % », « Impayés 100 % » avec zéro note ou zéro paiement | [Observé] |
| Libellés tronqués ou techniques : « Taux d'Encaisse », « Taux recouvrement », « Ai report » | [Observé] |
| Deux écritures de la monnaie : « 171 934 FCFA » et « 602 076 F CFA » | [Observé] |
| Les caractères accentués, apostrophes et noms composés sont acceptés et restitués correctement | [Observé] parcours B2, G2, F1 |

**Recommandation :** un message court et en français après chaque action (« Annonce publiée », « Élève retiré des effectifs — Annuler »), des erreurs qui disent quoi faire (« Vous n'avez pas accès aux paiements. Contactez le secrétariat. »), et « — » plutôt que « 100 % » quand il n'y a rien à mesurer.

## 6. Hiérarchie visuelle et lisibilité

- **[Observé]** Les tableaux de bord ouvrent sur des cartes de chiffres puis des graphiques. Pour la direction, ce qui demande une décision (impayés, notes manquantes) n'est pas mis en avant.
- **[Observé]** 97 éléments de texte n'atteignent pas le contraste minimal sur 5 pages : surtout du texte gris secondaire dans les tableaux.
- **[Observé]** Les boutons d'action dans les lignes de tableau n'ont que des icônes, sans libellé ni nom accessible (42 sur la page des transactions).
- **[Hypothèse]** Pour un parent peu à l'aise avec le numérique, un tableau de bord à 5 onglets, 4 chiffres et un graphique d'évolution est trop chargé ; la fiche « Mes enfants », plus directe, devrait être la page d'accueil.

## 7. Apprentissage et aide

- **[Observé]** Aucune aide en ligne, aucun guide de première connexion, aucune info-bulle explicative n'a été rencontrée. Le seul texte d'aide est « Besoin d'aide ? Contactez votre administrateur », sans numéro ni moyen de contact.
- **[Observé]** L'écran d'activation de la double authentification explique les trois étapes : c'est le seul parcours guidé de l'application.
- **[Hypothèse]** Un numéro WhatsApp ou téléphonique de l'école, affiché sur la page de connexion et dans le menu, lèverait la plupart des blocages de première connexion.

## 8. Synthèse des frictions, par ordre de gravité

1. Boutons sans action (BUG-002) — l'utilisateur ne peut pas faire son travail.
2. Pages qui s'ouvrent sur un refus (BUG-006) — le menu ment.
3. Absence de retour après une action — l'utilisateur ne sait pas si c'est fait.
4. Vocabulaire instable et messages en anglais ou techniques.
5. Tableaux qui débordent et cibles trop petites sur téléphone.
6. Tableaux de bord chargés pour les utilisateurs occasionnels.
