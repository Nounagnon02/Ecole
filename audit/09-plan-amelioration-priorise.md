# 09 — Plan d'amélioration priorisé

**P0** : bloquant ou risque majeur · **P1** : parcours essentiel dégradé · **P2** : amélioration significative · **P3** : optimisation secondaire.
Complexité : **S** quelques jours · **M** une à trois semaines · **L** plus d'un mois (ordres de grandeur, à chiffrer avec l'équipe).

## Matrice

| ID | Problème | Impact utilisateur | Solution | Priorité | Complexité | Segment |
|---|---|---|---|---|---|---|
| 001 | Page « Notes » vide (BUG-001) | Personne ne voit les notes | Lire la réponse paginée | P0 | S | Tous |
| 002 | Boutons sans action (BUG-002) | Travail impossible, perte de confiance | Retirer ou désactiver sans délai | P0 | S | Tous |
| 003 | Paiement inatteignable (BUG-003) | Parent : ni détail ni paiement ; comptable : aucun échéancier | Page « Mes paiements », droits du comptable | P0 | M | Parents, comptables |
| 004 | Annuaire ouvert dans la messagerie (BUG-010) | Exposition des enfants et des familles | Restreindre les contacts | P0 | S–M | Parents, élèves |
| 005 | SMS : numéros à 10 chiffres rejetés (BUG-012) | Aucun SMS ne part | Accepter le format actuel | P0 | S | Bénin |
| 006 | Saisie des notes absente (D1) | Pas de notes, pas de bulletins | Grille de saisie, brouillon hors-ligne | P0 | M | Enseignants |
| 007 | Inscription d'un élève absente (D3) | Aucune donnée ne peut entrer | Formulaire d'inscription, fiche élève | P0 | M | Secrétariat |
| 008 | 44 pages sur 210 refusées par l'API (BUG-006, 004, 023) | Menu qui mène à des erreurs | Aligner les droits, test automatique | P1 | M | Personnel, université |
| 009 | Recherche globale en panne (BUG-007) | Impossible de retrouver un élève | Corriger l'affichage de la classe | P1 | S | Personnel |
| 010 | Élève retiré affiché « actif » (BUG-008) | Effectifs faux, double action | Rafraîchir, confirmer, réintégrer | P1 | S | Direction |
| 011 | Université : tableau de bord 500, cours en erreur (BUG-005, 014) | Module inutilisable | Corriger ou masquer le module | P1 | S–M | Université |
| 012 | Affectations bloquées (BUG-009) | Enseignants sans classe | Corriger données ou chargement des séries | P1 | S | Direction |
| 013 | Messages en anglais, heure en UTC (BUG-017, 024) | Incompréhension, horodatage décalé | Français et fuseau du Bénin | P1 | S | Bénin |
| 014 | Paiement par le parent en mobile money (D2) | — | Parcours en 3 étapes, reçu par SMS, espèces | P1 | M–L | Parents, comptables |
| 015 | Appel et alerte d'absence (D4) | Parents non prévenus | Appel hors-ligne, SMS le jour même | P1 | M | Surveillants, parents |
| 016 | Notifications SMS/WhatsApp (C1, D5) | Application peu consultée | Brancher le service SMS sur 5 événements | P1 | M | Parents |
| 017 | Connexion et récupération par téléphone (C2, D7) | Parents sans courriel bloqués | Code par SMS | P1 | M | Parents |
| 018 | Double authentification sans secours (C4) | Compte direction bloqué si téléphone perdu | Codes de secours, option SMS | P1 | S–M | Direction, comptabilité |
| 019 | Accessibilité : noms, étiquettes, contrastes (BUG-016) | Lecteurs d'écran, lisibilité au soleil | Corriger les 4 règles en échec | P2 | M | Tous |
| 020 | Débordements et cibles tactiles (BUG-019, 020) | Lecture difficile sur téléphone | Cartes sous 768 px, cibles 44 px | P2 | M | Parents, élèves |
| 021 | Aucun retour après action ; erreurs techniques | Doute, ressaisie | Messages en français, « Annuler » | P2 | S | Tous |
| 022 | Hors-ligne : page vide, file silencieuse (BUG-018) | Saisie crue perdue | Dernières données datées, pastille d'attente | P2 | M | Zones mal couvertes |
| 023 | Poids du script principal (849 ko) | 8,6 s en 3G lente | Découpage par rôle | P2 | M | Parents hors villes |
| 024 | « Nouvelle publication » montré à tous (BUG-011) | Annonce rédigée puis refusée | Masquer selon le rôle | P2 | S | 12 rôles |
| 025 | Celtiis absent, numéro non contrôlé (BUG-025) | Abonnés exclus, erreurs de saisie | Ajouter l'opérateur, valider le numéro | P2 | S | Bénin |
| 026 | Console d'administration décorative (BUG-022) | Configuration crue enregistrée | Retirer ou câbler | P2 | M | Éditeur |
| 027 | Bulletins non évaluables (D6) | — | Génération, PDF, remise | P2 | M | Direction, parents |
| 028 | Données personnelles : aucune information (C9) | Risque juridique | Mentions, consentement, formalités APDP | P2 | S + juriste | Éditeur, écoles |
| 029 | Vocabulaire instable, statistiques trompeuses | Confusion | Un mot par notion ; « — » sans données | P3 | S | Tous |
| 030 | Arabe incomplet (BUG-027) | Écrans mêlés | Terminer ou retirer | P3 | S | — |
| 031 | Exports dans un nouvel onglet (BUG-029) | Sortie de l'application | Téléchargement nommé | P3 | S | Personnel |
| 032 | Tableau « décisions » pour la direction (D8) | Chiffres sans action | Trois listes actionnables | P3 | S–M | Direction |
| 033 | Messages vocaux en langues nationales (C5) | Parents peu lettrés | Vocal en fongbé, puis yoruba, bariba, dendi | P3 | M | Parents |
| 034 | Référentiel scolaire paramétrable (C11) | Écoles aux structures variées | Classes, séries, examens par école | P3 | M | Écoles |

## Feuille de route proposée

### Étape 0 — Arrêter de promettre (1 à 2 semaines)
Objectif : que tout ce qui est affiché fonctionne.
IDs 001, 002, 004, 005, 009, 010, 013, 024. Masquer le module université (011), l'assistant IA et les consoles décoratives (026) tant qu'ils ne fonctionnent pas.
**Critère de sortie :** un nouveau passage du robot (`audit-crawl.mjs`) ne relève plus aucun bouton sans effet ni aucune page refusée par l'API.

### Étape 1 — Les trois gestes essentiels (6 à 10 semaines)
Objectif : une école peut travailler une semaine entière avec l'outil.
IDs 007 (inscrire), 006 et 012 (affecter, saisir des notes), 003 et 014 (voir et payer), 008 (droits).
**Critère de sortie :** les parcours « inscrire un élève → l'affecter → saisir ses notes → le parent les voit → le parent paie → le comptable voit le paiement » passent de bout en bout, en bac à sable FedaPay.

### Étape 2 — Toucher les parents là où ils sont (4 à 8 semaines)
IDs 016, 015, 017, 018, 025, 028.
**Critère de sortie :** test avec 10 à 20 parents réels d'une école pilote : chacun reçoit un SMS d'absence et paie une tranche depuis son téléphone sans aide.

### Étape 3 — Confort et terrain difficile (en continu)
IDs 019 à 023, 027, 029 à 034.

## Ce qu'il ne faut pas faire maintenant
- Ajouter des rôles, des modules ou des écrans : le produit en a déjà plus qu'il n'en fait fonctionner.
- Ouvrir un second pays.
- Investir dans l'IA, la marque blanche ou l'application de bureau.
