# 00 — Résumé exécutif

**Audit du 11 novembre 2026 — École, plateforme de gestion scolaire (application web).**
Tests réels dans Google Chrome visible : 20 comptes (un par rôle), 59 pages, 1 363 clics, 61 cas de parcours métier.

## Le verdict en une phrase

Le socle est solide et l'interface est soignée, mais **l'application web est aujourd'hui presque entièrement en lecture seule** : les trois gestes qui font la valeur d'un logiciel scolaire — saisir des notes, encaisser la scolarité, prévenir les parents — n'y sont pas réalisables.

## Les chiffres clés

| Indicateur | Valeur |
|---|---|
| Fonctionnalités validées, sur celles testées | **18 sur 44 (41 %)** |
| Boutons distincts sans aucun effet | **111 sur 274 (41 %)** |
| Pages ouvertes par le menu mais refusées par l'API | **44 sur 210 (21 %)** |
| Accès indus à la page d'un autre rôle | **0 sur 970 tentatives** |
| Anomalies | **31** : 5 critiques, 11 élevées, 11 moyennes, 4 faibles |
| Pages en échec d'accessibilité (axe-core) | 11 sur 13 |
| Page de connexion utilisable en 4G / 3G / 3G lente | 1,6 s / 3,2 s / 8,6 s (simulé) |

## Ce qui fonctionne réellement

Connexion, déconnexion et contrôle d'accès · double authentification · annonces de l'école (publiées par la direction, lues par parents et élèves) · messagerie · fiche « Mes enfants » du parent avec ses notes · profil, thème, menu mobile · création d'une école · liste des paiements et reçus côté comptable.

## Ce qui ne fonctionne pas

1. **La page « Notes » est vide** alors que la base contient 641 notes.
2. **Les boutons de création n'ont aucune action** : nouvel élève, nouvelle note, nouveau paiement, nouveau cours, nouvelle facture, nouveau soin, nouvel incident, exports…
3. **Le paiement en ligne est inatteignable** : le parent reçoit « Unauthorized », le comptable ne peut ouvrir aucun échéancier.
4. **Le censeur et les cinq rôles de l'université** arrivent sur des pages en erreur.
5. **La recherche globale plante** dès qu'un élève correspond.

## Ce qui pose problème au Bénin

- Le service SMS **rejette les numéros à 10 chiffres** en vigueur depuis fin 2024 (à confirmer auprès de l'ARCEP).
- **Aucune notification** vers les parents ; tout repose sur le courriel.
- Paiement : **Celtiis absent**, espèces non saisissables, aucun parcours parent.
- Double authentification par application, **sans code de secours**, imposée à la direction.
- Serveur réglé en **UTC et en anglais**.
- Dans la messagerie, **un parent voit et peut contacter tous les utilisateurs**, élèves compris.

## Ce qu'il faut faire, dans l'ordre

1. **Arrêter de promettre (1 à 2 semaines).** Corriger la page Notes, retirer tout bouton sans action, fermer l'annuaire de la messagerie, accepter les numéros à 10 chiffres, passer le serveur en français et à l'heure du Bénin.
2. **Achever trois parcours (6 à 10 semaines).** Inscrire un élève ; saisir des notes ; voir ce que l'on doit et payer par mobile money.
3. **Toucher les parents (4 à 8 semaines).** SMS d'absence, d'échéance et de reçu ; connexion par numéro de téléphone ; test avec une école pilote.
4. **Ne rien ajouter d'autre entre-temps** : ni rôle, ni module, ni second pays, ni IA.

## Limites à connaître

- **L'application mobile n'a pas été testée** ; certaines fonctions absentes du web y existent peut-être.
- **Aucun test avec de vrais utilisateurs**, aucun téléphone physique, aucun réseau réel : écrans et débits sont simulés.
- **Aucun paiement, aucun SMS réel** : FedaPay et le fournisseur SMS n'ont pas été appelés.
- Les données de contexte sur le marché béninois ne sont pas sourcées.
- **Aucune correction n'a été faite** : cet audit documente, il ne modifie pas le produit.

## Où trouver quoi

| Document | Contenu |
|---|---|
| `01-inventaire-fonctionnel.md` | Pages, menus et éléments par rôle ; matrice d'accès |
| `02-plan-de-tests.md` | Périmètre, environnement, méthode, limites |
| `03-resultats-tests.md` | Chaque clic, page par page ; parcours métier |
| `04-bugs-et-anomalies.md` | Les 31 anomalies, avec reproduction, cause et solution |
| `05-analyse-ux-ui.md` | Ergonomie, navigation, nombre d'étapes |
| `06-analyse-benin-afrique-ouest.md` | Réseau, téléphones, langues, paiement, formats, usages |
| `07-performance-accessibilite.md` | Temps de chargement, poids, axe-core, clavier, sécurité |
| `08-recommandations.md` | Corrections, améliorations, adaptations, fonctionnalités |
| `09-plan-amelioration-priorise.md` | 34 actions classées P0 à P3 et feuille de route |
| `10-rapport-final.md` | Synthèse complète et indicateurs avec leurs formules |
| `preuves/` | Captures, journaux, mesures brutes, scripts de test |
