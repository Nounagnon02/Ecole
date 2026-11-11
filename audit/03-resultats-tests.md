# 03 — Résultats des tests interactifs

> Généré par `preuves/outils/generer-rapports.mjs`. Chaque ligne est un clic réellement effectué dans Google Chrome par le robot.
>
> **Lecture des verdicts.** « réagit » : le clic a produit un effet observable (appel API réussi, dialogue, navigation, changement d'affichage) — cela ne prouve pas que l'objectif métier est atteint, voir les parcours de bout en bout. « SANS EFFET » : aucun effet observable. « ÉCHEC API » : l'API a répondu 4xx/5xx. « non exécuté » : bouton désactivé ou clic impossible.

## admin_ecole1

### `/admin/dashboard` — Administration système

| Vue | Bouton | Effet observé | Verdict |
|---|---|---|---|
| Aperçu | Actualiser | api 200 GET /api/dashboard/admin | réagit |
| Aperçu | Alertes | AUCUN EFFET VISIBLE | SANS EFFET |
| Aperçu | Paramètres | AUCUN EFFET VISIBLE | SANS EFFET |
| Aperçu | Actualiser | api 200 GET /api/dashboard/admin | réagit |
| Aperçu | Voir tous les logs | AUCUN EFFET VISIBLE | SANS EFFET |

### `/notes` — Notes

| Vue | Bouton | Effet observé | Verdict |
|---|---|---|---|
| vue initiale | (sans nom) | api 403 GET /api/notes/eleve | ÉCHEC API |
| vue initiale | Exporter | popup: http://localhost:3002/api/notes/export | réagit |
| vue initiale | Importer | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Nouvelle note | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Notes | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Classement | changement d’affichage | réagit |
| vue initiale | Bulletins | changement d’affichage | réagit |

### `/communications` — Communications

| Vue | Bouton | Effet observé | Verdict |
|---|---|---|---|
| vue initiale | Nouvelle publication | changement d’affichage | réagit |
| vue initiale | Publier | api 403 POST /api/communications | ÉCHEC API |
| vue initiale | Annuler | changement d’affichage | réagit |
| vue initiale | Informations | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Événements | AUCUN EFFET VISIBLE | SANS EFFET |

### `/parametres` — Paramètres

| Vue | Bouton | Effet observé | Verdict |
|---|---|---|---|
| vue initiale | Profil | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Notifications | changement d’affichage | réagit |
| vue initiale | Sécurité | changement d’affichage | réagit |
| vue initiale | Apparence | changement d’affichage | réagit |
| vue initiale | Préférences | changement d’affichage | réagit |

### `/messagerie` — 

| Vue | Bouton | Effet observé | Verdict |
|---|---|---|---|
| vue initiale | Boîte | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Favoris | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Archive | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Nouvelle conversation | api 200 GET /api/messages/contacts | réagit |

### `/admin/configuration` — Configuration

| Vue | Bouton | Effet observé | Verdict |
|---|---|---|---|
| vue initiale | Enregistrer | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Général Paramètres généraux de l'application | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Scolarité Configuration des cycles et niveaux | changement d’affichage | réagit |
| vue initiale | Notifications Configuration des alertes et rappels | changement d’affichage | réagit |
| vue initiale | Sécurité Politiques de sécurité et d'accès | changement d’affichage | réagit |
| vue initiale | Paiements Configuration des moyens de paiement | changement d’affichage | réagit |
| vue initiale | Modifier | AUCUN EFFET VISIBLE (clic déclenché par script : bouton masqué par un autre élément) | SANS EFFET |
| vue initiale | (sans nom) | AUCUN EFFET VISIBLE (clic déclenché par script : bouton masqué par un autre élément) | SANS EFFET |
| vue initiale | Modifier | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Modifier | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Réinitialiser | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Enregistrer | AUCUN EFFET VISIBLE | SANS EFFET |

## bibliothecaire_ecole1

### `/bibliothecaire/dashboard` — Bibliothèque

| Vue | Bouton | Effet observé | Verdict |
|---|---|---|---|
| Aperçu | Actualiser | api 200 GET /api/dashboard/bibliothecaire | réagit |
| Aperçu | Recherche rapide | AUCUN EFFET VISIBLE | SANS EFFET |
| Catalogue | Ajouter un ouvrage | navigation /bibliothecaire/catalogue | réagit |
| Catalogue | Toutes | navigation /bibliothecaire/catalogue | réagit |
| Catalogue | Littérature | navigation /bibliothecaire/catalogue | réagit |
| Catalogue | Jeunesse | navigation /bibliothecaire/catalogue | réagit |
| Catalogue | Scolaire | navigation /bibliothecaire/catalogue | réagit |
| Catalogue | Histoire | navigation /bibliothecaire/catalogue | réagit |
| Catalogue | Sciences | navigation /bibliothecaire/catalogue | réagit |
| Catalogue | Détails | navigation /bibliothecaire/catalogue | réagit |
| Catalogue | Emprunter | désactivé | non exécuté (désactivé) |
| Catalogue | Détails | navigation /bibliothecaire/catalogue | réagit |
| Catalogue | Emprunter | désactivé | non exécuté (désactivé) |
| Catalogue | Détails | navigation /bibliothecaire/catalogue | réagit |
| Catalogue | Emprunter | désactivé | non exécuté (désactivé) |
| Catalogue | Détails | navigation /bibliothecaire/catalogue | réagit |
| Catalogue | Emprunter | désactivé | non exécuté (désactivé) |
| Catalogue | Détails | navigation /bibliothecaire/catalogue | réagit |
| Catalogue | Emprunter | désactivé | non exécuté (désactivé) |
|  | Ajouter un ouvrage | navigation /bibliothecaire/catalogue | réagit |
|  | Marquer retour | navigation /bibliothecaire/emprunts | réagit |
|  | Détails | navigation /bibliothecaire/emprunts | réagit |

### `/eleves` — Élèves

| Vue | Bouton | Effet observé | Verdict |
|---|---|---|---|
| vue initiale | (sans nom) | api 403 GET /api/eleves | ÉCHEC API |
| vue initiale | Exporter | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Nouvel élève | AUCUN EFFET VISIBLE | SANS EFFET |

### `/notes` — Notes

| Vue | Bouton | Effet observé | Verdict |
|---|---|---|---|
| vue initiale | (sans nom) | api 403 GET /api/notes/eleve | ÉCHEC API |
| vue initiale | Exporter | popup: http://localhost:3002/api/notes/export | réagit |
| vue initiale | Importer | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Nouvelle note | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Notes | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Classement | changement d’affichage | réagit |
| vue initiale | Bulletins | changement d’affichage | réagit |

### `/communications` — Communications

| Vue | Bouton | Effet observé | Verdict |
|---|---|---|---|
| vue initiale | Nouvelle publication | changement d’affichage | réagit |
| vue initiale | Publier | api 403 POST /api/communications | ÉCHEC API |
| vue initiale | Annuler | changement d’affichage | réagit |
| vue initiale | Informations | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Événements | AUCUN EFFET VISIBLE | SANS EFFET |

### `/bibliothecaire/catalogue` — Catalogue

| Vue | Bouton | Effet observé | Verdict |
|---|---|---|---|
| vue initiale | Ajouter un ouvrage | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Toutes | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Littérature | changement d’affichage | réagit |
| vue initiale | Jeunesse | changement d’affichage | réagit |
| vue initiale | Scolaire | changement d’affichage | réagit |
| vue initiale | Histoire | changement d’affichage | réagit |
| vue initiale | Sciences | changement d’affichage | réagit |
| vue initiale | Détails | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Emprunter | désactivé | non exécuté (désactivé) |

## censeur_ecole1

### `/censeur/dashboard` — Censeur

| Vue | Bouton | Effet observé | Verdict |
|---|---|---|---|
| Aperçu | Actualiser | api 200 GET /api/dashboard/censeur | réagit |
| Aperçu | Règlement | AUCUN EFFET VISIBLE | SANS EFFET |
| Discipline | Réessayer | navigation /censeur/discipline + api 200 GET /api/auth/me | réagit |
|  | Réessayer | navigation /censeur/discipline + api 200 GET /api/auth/me | réagit |

### `/eleves` — Élèves

| Vue | Bouton | Effet observé | Verdict |
|---|---|---|---|
| vue initiale | (sans nom) | api 403 GET /api/eleves | ÉCHEC API |
| vue initiale | Exporter | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Nouvel élève | AUCUN EFFET VISIBLE | SANS EFFET |

### `/notes` — Notes

| Vue | Bouton | Effet observé | Verdict |
|---|---|---|---|
| vue initiale | (sans nom) | api 200 GET /api/notes/eleve | réagit |
| vue initiale | Exporter | popup: http://localhost:3002/api/notes/export | réagit |
| vue initiale | Importer | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Nouvelle note | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Notes | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Classement | changement d’affichage | réagit |
| vue initiale | Bulletins | changement d’affichage | réagit |

### `/communications` — Communications

| Vue | Bouton | Effet observé | Verdict |
|---|---|---|---|
| vue initiale | Nouvelle publication | changement d’affichage | réagit |
| vue initiale | Publier | api 422 POST /api/communications | ÉCHEC API |
| vue initiale | Annuler | changement d’affichage | réagit |
| vue initiale | Informations | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Événements | AUCUN EFFET VISIBLE | SANS EFFET |

### `/emploi-du-temps` — Emploi du temps

| Vue | Bouton | Effet observé | Verdict |
|---|---|---|---|
| vue initiale | Exporter | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Ajouter un cours | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | (sans nom) | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | (sans nom) | AUCUN EFFET VISIBLE | SANS EFFET |

### `/parametres` — Paramètres

| Vue | Bouton | Effet observé | Verdict |
|---|---|---|---|
| vue initiale | Profil | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Notifications | changement d’affichage | réagit |
| vue initiale | Sécurité | changement d’affichage | réagit |
| vue initiale | Apparence | changement d’affichage | réagit |
| vue initiale | Préférences | changement d’affichage | réagit |

### `/messagerie` — 

| Vue | Bouton | Effet observé | Verdict |
|---|---|---|---|
| vue initiale | Boîte | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Favoris | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Archive | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Nouvelle conversation | api 200 GET /api/messages/contacts | réagit |

### `/censeur/discipline` — 

| Vue | Bouton | Effet observé | Verdict |
|---|---|---|---|
| vue initiale | Réessayer | api 200 GET /api/auth/me, 403 GET /api/surveillant/incidents, 403 GET /api/surveillant/statistiques | ÉCHEC API |

### `/censeur/absences` — 

| Vue | Bouton | Effet observé | Verdict |
|---|---|---|---|
| vue initiale | Réessayer | api 200 GET /api/auth/me, 403 GET /api/surveillant/absences | ÉCHEC API |

## comptable_ecole1

### `/comptable/dashboard` — Comptabilité

| Vue | Bouton | Effet observé | Verdict |
|---|---|---|---|
| Aperçu | Actualiser | api 200 GET /api/dashboard/comptable | réagit |
| Aperçu | Synthèse | AUCUN EFFET VISIBLE | SANS EFFET |
| Factures | Exporter | navigation /comptable/factures | réagit |
| Factures | Nouvelle facture | navigation /comptable/factures | réagit |
| Factures | Voir | navigation /comptable/factures | réagit |
| Factures | Envoyer | navigation /comptable/factures | réagit |
| Factures | Imprimer | navigation /comptable/factures | réagit |
| Factures | Voir | navigation /comptable/factures | réagit |
| Factures | Envoyer | navigation /comptable/factures | réagit |
| Factures | Imprimer | navigation /comptable/factures | réagit |
| Factures | Voir | navigation /comptable/factures | réagit |
| Factures | Envoyer | navigation /comptable/factures | réagit |
| Factures | Imprimer | navigation /comptable/factures | réagit |
| Factures | Voir | navigation /comptable/factures | réagit |
| Factures | Envoyer | navigation /comptable/factures | réagit |
| Factures | Imprimer | navigation /comptable/factures | réagit |
| Factures | Voir | navigation /comptable/factures | réagit |
| Factures | Envoyer | navigation /comptable/factures | réagit |
| Factures | Imprimer | navigation /comptable/factures | réagit |
| Factures | Voir | navigation /comptable/factures | réagit |
| Factures | Envoyer | navigation /comptable/factures | réagit |
| Factures | Imprimer | navigation /comptable/factures | réagit |
| Factures | Voir | navigation /comptable/factures | réagit |
| Factures | Envoyer | navigation /comptable/factures | réagit |
| Factures | Imprimer | navigation /comptable/factures | réagit |
| Factures | Voir | navigation /comptable/factures | réagit |
| Factures | Envoyer | navigation /comptable/factures | réagit |
| Factures | Imprimer | navigation /comptable/factures | réagit |
| Factures | Voir | navigation /comptable/factures | réagit |
| Factures | Envoyer | navigation /comptable/factures | réagit |
| Factures | Imprimer | navigation /comptable/factures | réagit |
| Factures | Voir | navigation /comptable/factures | réagit |
|  | Exporter | navigation /comptable/factures | réagit |
|  | (sans nom) | navigation /comptable/transactions | réagit |
|  | (sans nom) | navigation /comptable/transactions | réagit |
|  | (sans nom) | navigation /comptable/transactions | réagit |
|  | (sans nom) | navigation /comptable/transactions | réagit |
|  | (sans nom) | navigation /comptable/transactions | réagit |
|  | (sans nom) | navigation /comptable/transactions | réagit |
|  | (sans nom) | navigation /comptable/transactions | réagit |
|  | (sans nom) | navigation /comptable/transactions | réagit |
|  | (sans nom) | navigation /comptable/transactions | réagit |
|  | (sans nom) | navigation /comptable/transactions | réagit |
|  | (sans nom) | navigation /comptable/transactions | réagit |
|  | (sans nom) | navigation /comptable/transactions | réagit |
|  | (sans nom) | navigation /comptable/transactions | réagit |
|  | (sans nom) | navigation /comptable/transactions | réagit |
|  | (sans nom) | navigation /comptable/transactions | réagit |
|  | (sans nom) | navigation /comptable/transactions | réagit |
|  | (sans nom) | navigation /comptable/transactions | réagit |
|  | (sans nom) | navigation /comptable/transactions | réagit |
|  | (sans nom) | navigation /comptable/transactions | réagit |
|  | (sans nom) | navigation /comptable/transactions | réagit |
|  | (sans nom) | navigation /comptable/transactions | réagit |
|  | (sans nom) | navigation /comptable/transactions | réagit |
|  | (sans nom) | navigation /comptable/transactions | réagit |
|  | (sans nom) | navigation /comptable/transactions | réagit |
|  | (sans nom) | navigation /comptable/transactions | réagit |
|  | (sans nom) | navigation /comptable/transactions | réagit |
|  | (sans nom) | navigation /comptable/transactions | réagit |
|  | (sans nom) | navigation /comptable/transactions | réagit |
|  | (sans nom) | navigation /comptable/transactions | réagit |

### `/eleves` — Élèves

| Vue | Bouton | Effet observé | Verdict |
|---|---|---|---|
| vue initiale | (sans nom) | api 403 GET /api/eleves | ÉCHEC API |
| vue initiale | Exporter | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Nouvel élève | AUCUN EFFET VISIBLE | SANS EFFET |

### `/notes` — Notes

| Vue | Bouton | Effet observé | Verdict |
|---|---|---|---|
| vue initiale | (sans nom) | api 403 GET /api/notes/eleve | ÉCHEC API |
| vue initiale | Exporter | popup: http://localhost:3002/api/notes/export | réagit |
| vue initiale | Importer | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Nouvelle note | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Notes | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Classement | changement d’affichage | réagit |
| vue initiale | Bulletins | changement d’affichage | réagit |

### `/paiements` — Paiements

| Vue | Bouton | Effet observé | Verdict |
|---|---|---|---|
| vue initiale | (sans nom) | api 200 GET /api/comptable/paiements | réagit |
| vue initiale | Factures | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Exporter | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Nouveau paiement | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Paiements | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Échéancier | changement d’affichage | réagit |

### `/communications` — Communications

| Vue | Bouton | Effet observé | Verdict |
|---|---|---|---|
| vue initiale | Nouvelle publication | changement d’affichage | réagit |
| vue initiale | Publier | api 403 POST /api/communications | ÉCHEC API |
| vue initiale | Annuler | changement d’affichage | réagit |
| vue initiale | Informations | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Événements | AUCUN EFFET VISIBLE | SANS EFFET |

### `/parametres` — Paramètres

| Vue | Bouton | Effet observé | Verdict |
|---|---|---|---|
| vue initiale | Profil | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Notifications | changement d’affichage | réagit |
| vue initiale | Sécurité | changement d’affichage | réagit |
| vue initiale | Apparence | changement d’affichage | réagit |
| vue initiale | Préférences | changement d’affichage | réagit |

### `/messagerie` — 

| Vue | Bouton | Effet observé | Verdict |
|---|---|---|---|
| vue initiale | Boîte | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Favoris | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Archive | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Nouvelle conversation | api 200 GET /api/messages/contacts | réagit |

### `/comptable/transactions` — Transactions

| Vue | Bouton | Effet observé | Verdict |
|---|---|---|---|
| vue initiale | Exporter | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | (sans nom) | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | (sans nom) | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | (sans nom) | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | (sans nom) | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | (sans nom) | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | (sans nom) | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | (sans nom) | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | (sans nom) | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | (sans nom) | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | (sans nom) | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | (sans nom) | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | (sans nom) | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | (sans nom) | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | (sans nom) | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | (sans nom) | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | (sans nom) | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | (sans nom) | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | (sans nom) | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | (sans nom) | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | (sans nom) | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | (sans nom) | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | (sans nom) | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | (sans nom) | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | (sans nom) | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | (sans nom) | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | (sans nom) | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | (sans nom) | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | (sans nom) | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | (sans nom) | AUCUN EFFET VISIBLE | SANS EFFET |

### `/comptable/factures` — Factures

| Vue | Bouton | Effet observé | Verdict |
|---|---|---|---|
| vue initiale | Exporter | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Nouvelle facture | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Voir | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Envoyer | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Imprimer | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Voir | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Envoyer | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Imprimer | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Voir | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Envoyer | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Imprimer | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Voir | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Envoyer | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Imprimer | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Voir | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Envoyer | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Imprimer | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Voir | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Envoyer | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Imprimer | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Voir | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Envoyer | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Imprimer | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Voir | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Envoyer | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Imprimer | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Voir | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Envoyer | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Imprimer | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Voir | AUCUN EFFET VISIBLE | SANS EFFET |

### `/paiement/callback` — Confirmation indisponible

| Vue | Bouton | Effet observé | Verdict |
|---|---|---|---|
| vue initiale | Retour à l'échéancier | navigation /paiements + api 200 GET /api/comptable/paiements | réagit |

## directeur_ecole1

### `/directeur/dashboard` — Tableau de bord

| Vue | Bouton | Effet observé | Verdict |
|---|---|---|---|
| Aperçu | Actualiser | api 200 GET /api/dashboard/directeur/data | réagit |
| Aperçu | Rapport | AUCUN EFFET VISIBLE | SANS EFFET |
| Aperçu | Exporter | AUCUN EFFET VISIBLE | SANS EFFET |
| Élèves | (sans nom) | navigation /eleves + api 200 GET /api/eleves | réagit |
| Élèves | Exporter | navigation /eleves | réagit |
| Élèves | Nouvel élève | navigation /eleves | réagit |
| Élèves | Plus d'actions | navigation /eleves | réagit |
| Élèves | Retirer des effectifs | navigation /eleves + confirm: Retirer AGBODJAN Yèhossou des effectifs ? Son dossier (notes, paiements…) reste  | réagit |
| Élèves | Plus d'actions | navigation /eleves | réagit |
| Élèves | Retirer des effectifs | navigation /eleves + confirm: Retirer HOUNGBO Fifamè des effectifs ? Son dossier (notes, paiements…) reste con | réagit |
| Élèves | Plus d'actions | navigation /eleves | réagit |
| Élèves | Retirer des effectifs | navigation /eleves + confirm: Retirer ADJOVI Koffi des effectifs ? Son dossier (notes, paiements…) reste consu | réagit |
| Élèves | Plus d'actions | navigation /eleves | réagit |
| Élèves | Retirer des effectifs | navigation /eleves + confirm: Retirer AHOUANSOU Mirabelle des effectifs ? Son dossier (notes, paiements…) rest | réagit |
| Élèves | Plus d'actions | navigation /eleves | réagit |
| Élèves | Retirer des effectifs | navigation /eleves + confirm: Retirer AKPOVI Joël des effectifs ? Son dossier (notes, paiements…) reste consul | réagit |
| Élèves | Plus d'actions | navigation /eleves | réagit |
| Élèves | Retirer des effectifs | navigation /eleves + confirm: Retirer BOKO Urbain des effectifs ? Son dossier (notes, paiements…) reste consul | réagit |
| Élèves | Plus d'actions | navigation /eleves | réagit |
| Élèves | Retirer des effectifs | navigation /eleves + confirm: Retirer CHABI Ornella des effectifs ? Son dossier (notes, paiements…) reste cons | réagit |
| Élèves | Plus d'actions | navigation /eleves | réagit |
| Élèves | Retirer des effectifs | navigation /eleves + confirm: Retirer DEGBEGNI Ruth des effectifs ? Son dossier (notes, paiements…) reste cons | réagit |
| Élèves | Plus d'actions | navigation /eleves | réagit |
| Élèves | Retirer des effectifs | navigation /eleves + confirm: Retirer EGBETOKO Sylvère des effectifs ? Son dossier (notes, paiements…) reste c | réagit |
| Élèves | Plus d'actions | navigation /eleves | réagit |
| Élèves | Retirer des effectifs | navigation /eleves + confirm: Retirer FIGNON Bérenger des effectifs ? Son dossier (notes, paiements…) reste co | réagit |
| Élèves | Plus d'actions | navigation /eleves | réagit |
| Élèves | Retirer des effectifs | navigation /eleves + confirm: Retirer GBAGUIDI Carmelle des effectifs ? Son dossier (notes, paiements…) reste  | réagit |
| Élèves | Plus d'actions | navigation /eleves | réagit |
| Élèves | Retirer des effectifs | navigation /eleves + confirm: Retirer HESSOU Fernand des effectifs ? Son dossier (notes, paiements…) reste con | réagit |
| Élèves | Plus d'actions | navigation /eleves | réagit |
| Élèves | Retirer des effectifs | navigation /eleves + confirm: Retirer HOUNKPATIN Déborah des effectifs ? Son dossier (notes, paiements…) reste | réagit |
| Élèves | Plus d'actions | navigation /eleves | réagit |
|  | (sans nom) | navigation /eleves + api 200 GET /api/eleves | réagit |
|  | Exporter | navigation /notes | réagit |
|  | Importer | navigation /notes | réagit |
|  | Nouvelle note | navigation /notes | réagit |
|  | Notes | navigation /notes | réagit |
|  | Classement | navigation /notes | réagit |
|  | Bulletins | navigation /notes | réagit |
|  | (sans nom) | navigation /notes + api 200 GET /api/notes/eleve | réagit |
|  | Factures | navigation /paiements | réagit |
|  | Exporter | navigation /paiements | réagit |
|  | Nouveau paiement | navigation /paiements | réagit |
|  | Paiements | navigation /paiements | réagit |
|  | Échéancier | navigation /paiements | réagit |
|  | Voir le reçu | navigation /paiements + popup: http://localhost:3002/api/comptable/paiements/24/recu | réagit |
|  | (sans nom) | navigation /paiements + api 200 GET /api/comptable/paiements | réagit |
|  | Favoris | navigation /messagerie | réagit |
|  | Archive | navigation /messagerie | réagit |
|  | Nouvelle conversation | navigation /messagerie + api 200 GET /api/messages/contacts | réagit |
|  | Boîte | navigation /messagerie | réagit |
|  | Ajouter un cours | navigation /emploi-du-temps | réagit |
|  | (sans nom) | navigation /emploi-du-temps | réagit |
|  | (sans nom) | navigation /emploi-du-temps | réagit |

### `/eleves` — Élèves

| Vue | Bouton | Effet observé | Verdict |
|---|---|---|---|
| vue initiale | (sans nom) | api 200 GET /api/eleves | réagit |
| vue initiale | Exporter | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Nouvel élève | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Plus d'actions | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Retirer des effectifs | confirm: Retirer AGBODJAN Yèhossou des effectifs ? Son dossier (notes, paiements…) reste  | réagit |
| vue initiale | Plus d'actions | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Retirer des effectifs | confirm: Retirer HOUNGBO Fifamè des effectifs ? Son dossier (notes, paiements…) reste con | réagit |
| vue initiale | Plus d'actions | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Retirer des effectifs | confirm: Retirer ADJOVI Koffi des effectifs ? Son dossier (notes, paiements…) reste consu | réagit |
| vue initiale | Plus d'actions | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Retirer des effectifs | confirm: Retirer AHOUANSOU Mirabelle des effectifs ? Son dossier (notes, paiements…) rest | réagit |
| vue initiale | Plus d'actions | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Retirer des effectifs | confirm: Retirer AKPOVI Joël des effectifs ? Son dossier (notes, paiements…) reste consul | réagit |
| vue initiale | Plus d'actions | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Retirer des effectifs | confirm: Retirer BOKO Urbain des effectifs ? Son dossier (notes, paiements…) reste consul | réagit |
| vue initiale | Plus d'actions | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Retirer des effectifs | confirm: Retirer CHABI Ornella des effectifs ? Son dossier (notes, paiements…) reste cons | réagit |
| vue initiale | Plus d'actions | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Retirer des effectifs | confirm: Retirer DEGBEGNI Ruth des effectifs ? Son dossier (notes, paiements…) reste cons | réagit |
| vue initiale | Plus d'actions | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Retirer des effectifs | confirm: Retirer EGBETOKO Sylvère des effectifs ? Son dossier (notes, paiements…) reste c | réagit |
| vue initiale | Plus d'actions | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Retirer des effectifs | confirm: Retirer FIGNON Bérenger des effectifs ? Son dossier (notes, paiements…) reste co | réagit |
| vue initiale | Plus d'actions | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Retirer des effectifs | confirm: Retirer GBAGUIDI Carmelle des effectifs ? Son dossier (notes, paiements…) reste  | réagit |
| vue initiale | Plus d'actions | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Retirer des effectifs | confirm: Retirer HESSOU Fernand des effectifs ? Son dossier (notes, paiements…) reste con | réagit |
| vue initiale | Plus d'actions | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Retirer des effectifs | confirm: Retirer HOUNKPATIN Déborah des effectifs ? Son dossier (notes, paiements…) reste | réagit |
| vue initiale | Plus d'actions | AUCUN EFFET VISIBLE | SANS EFFET |

### `/notes` — Notes

| Vue | Bouton | Effet observé | Verdict |
|---|---|---|---|
| vue initiale | (sans nom) | api 200 GET /api/notes/eleve | réagit |
| vue initiale | Exporter | popup: http://localhost:3002/api/notes/export | réagit |
| vue initiale | Importer | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Nouvelle note | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Notes | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Classement | changement d’affichage | réagit |
| vue initiale | Bulletins | changement d’affichage | réagit |

### `/paiements` — Paiements

| Vue | Bouton | Effet observé | Verdict |
|---|---|---|---|
| vue initiale | (sans nom) | api 200 GET /api/comptable/paiements | réagit |
| vue initiale | Factures | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Exporter | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Nouveau paiement | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Paiements | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Échéancier | changement d’affichage | réagit |

### `/communications` — Communications

| Vue | Bouton | Effet observé | Verdict |
|---|---|---|---|
| vue initiale | Nouvelle publication | changement d’affichage | réagit |
| vue initiale | Publier | api 422 POST /api/communications | ÉCHEC API |
| vue initiale | Annuler | changement d’affichage | réagit |
| vue initiale | Informations | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Événements | AUCUN EFFET VISIBLE | SANS EFFET |

### `/emploi-du-temps` — Emploi du temps

| Vue | Bouton | Effet observé | Verdict |
|---|---|---|---|
| vue initiale | Exporter | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Ajouter un cours | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | (sans nom) | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | (sans nom) | AUCUN EFFET VISIBLE | SANS EFFET |

### `/parametres` — Paramètres

| Vue | Bouton | Effet observé | Verdict |
|---|---|---|---|
| vue initiale | Profil | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Notifications | changement d’affichage | réagit |
| vue initiale | Sécurité | changement d’affichage | réagit |
| vue initiale | Apparence | changement d’affichage | réagit |
| vue initiale | Préférences | changement d’affichage | réagit |

### `/messagerie` — 

| Vue | Bouton | Effet observé | Verdict |
|---|---|---|---|
| vue initiale | Boîte | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Favoris | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Archive | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Nouvelle conversation | api 200 GET /api/messages/contacts | réagit |

### `/affectations` — Affectations des enseignants

| Vue | Bouton | Effet observé | Verdict |
|---|---|---|---|
| Secondaire | Affecter | désactivé | non exécuté (désactivé) |

### `/paiement/callback` — Confirmation indisponible

| Vue | Bouton | Effet observé | Verdict |
|---|---|---|---|
| vue initiale | Retour à l'échéancier | navigation /paiements + api 200 GET /api/comptable/paiements | réagit |

### `/directeur/ai-insights` — Tableau de bord prédictif

| Vue | Bouton | Effet observé | Verdict |
|---|---|---|---|
| vue initiale | Chat IA | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Analyses | changement d’affichage | réagit |
| vue initiale | Analyser | api 200 GET /api/v1/ia/predictive | réagit |

### `/admin/journal-audit` — Journal d'audit

| Vue | Bouton | Effet observé | Verdict |
|---|---|---|---|
| vue initiale | Réinitialiser les filtres | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Voir le détail | changement d’affichage | réagit |
| vue initiale | Voir le détail | changement d’affichage | réagit |
| vue initiale | Voir le détail | changement d’affichage | réagit |
| vue initiale | Voir le détail | changement d’affichage | réagit |
| vue initiale | Voir le détail | changement d’affichage | réagit |
| vue initiale | Voir le détail | changement d’affichage | réagit |
| vue initiale | Voir le détail | changement d’affichage | réagit |
| vue initiale | Voir le détail | changement d’affichage | réagit |
| vue initiale | Voir le détail | changement d’affichage | réagit |
| vue initiale | Voir le détail | changement d’affichage | réagit |
| vue initiale | Voir le détail | changement d’affichage | réagit |
| vue initiale | Voir le détail | changement d’affichage | réagit |
| vue initiale | Voir le détail | changement d’affichage | réagit |
| vue initiale | Voir le détail | changement d’affichage | réagit |
| vue initiale | Voir le détail | changement d’affichage | réagit |
| vue initiale | Voir le détail | changement d’affichage | réagit |
| vue initiale | Voir le détail | changement d’affichage | réagit |
| vue initiale | Voir le détail | changement d’affichage | réagit |
| vue initiale | Voir le détail | changement d’affichage | réagit |
| vue initiale | Voir le détail | changement d’affichage | réagit |
| vue initiale | Voir le détail | changement d’affichage | réagit |
| vue initiale | Voir le détail | changement d’affichage | réagit |
| vue initiale | Voir le détail | changement d’affichage | réagit |
| vue initiale | Voir le détail | changement d’affichage | réagit |
| vue initiale | Voir le détail | changement d’affichage | réagit |
| vue initiale | Page précédente | désactivé | non exécuté (désactivé) |
| vue initiale | Page suivante | api 200 GET /api/audit-logs | réagit |

## directeurM_ecole1

### `/directeur/dashboard` — Tableau de bord

| Vue | Bouton | Effet observé | Verdict |
|---|---|---|---|
| Aperçu | Actualiser | api 200 GET /api/dashboard/directeur/data | réagit |
| Aperçu | Rapport | AUCUN EFFET VISIBLE | SANS EFFET |
| Aperçu | Exporter | AUCUN EFFET VISIBLE | SANS EFFET |
| Élèves | (sans nom) | navigation /eleves + api 200 GET /api/eleves | réagit |
| Élèves | Exporter | navigation /eleves | réagit |
| Élèves | Nouvel élève | navigation /eleves | réagit |
| Élèves | Plus d'actions | navigation /eleves | réagit |
| Élèves | Retirer des effectifs | navigation /eleves + confirm: Retirer ADJOVI Koffi des effectifs ? Son dossier (notes, paiements…) reste consu | réagit |
| Élèves | Plus d'actions | navigation /eleves | réagit |
| Élèves | Retirer des effectifs | navigation /eleves + confirm: Retirer AHOUANSOU Mirabelle des effectifs ? Son dossier (notes, paiements…) rest | réagit |
| Élèves | Plus d'actions | navigation /eleves | réagit |
| Élèves | Retirer des effectifs | navigation /eleves + confirm: Retirer AKPOVI Joël des effectifs ? Son dossier (notes, paiements…) reste consul | réagit |
| Élèves | Plus d'actions | navigation /eleves | réagit |

### `/eleves` — Élèves

| Vue | Bouton | Effet observé | Verdict |
|---|---|---|---|
| vue initiale | (sans nom) | api 200 GET /api/eleves | réagit |
| vue initiale | Exporter | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Nouvel élève | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Plus d'actions | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Retirer des effectifs | confirm: Retirer ADJOVI Koffi des effectifs ? Son dossier (notes, paiements…) reste consu | réagit |
| vue initiale | Plus d'actions | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Retirer des effectifs | confirm: Retirer AHOUANSOU Mirabelle des effectifs ? Son dossier (notes, paiements…) rest | réagit |
| vue initiale | Plus d'actions | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Retirer des effectifs | confirm: Retirer AKPOVI Joël des effectifs ? Son dossier (notes, paiements…) reste consul | réagit |
| vue initiale | Plus d'actions | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Retirer des effectifs | confirm: Retirer OGOUDJOFOU Marthe des effectifs ? Son dossier (notes, paiements…) reste  | réagit |
| vue initiale | Plus d'actions | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Retirer des effectifs | confirm: Retirer PADONOU Nazaire des effectifs ? Son dossier (notes, paiements…) reste co | réagit |
| vue initiale | Plus d'actions | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Retirer des effectifs | confirm: Retirer QUENUM Odile des effectifs ? Son dossier (notes, paiements…) reste consu | réagit |

### `/notes` — Notes

| Vue | Bouton | Effet observé | Verdict |
|---|---|---|---|
| vue initiale | (sans nom) | api 200 GET /api/notes/eleve | réagit |
| vue initiale | Exporter | popup: http://localhost:3002/api/notes/export | réagit |
| vue initiale | Importer | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Nouvelle note | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Notes | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Classement | changement d’affichage | réagit |
| vue initiale | Bulletins | changement d’affichage | réagit |

### `/paiements` — Paiements

| Vue | Bouton | Effet observé | Verdict |
|---|---|---|---|
| vue initiale | (sans nom) | api 200 GET /api/comptable/paiements | réagit |
| vue initiale | Factures | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Exporter | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Nouveau paiement | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Paiements | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Échéancier | changement d’affichage | réagit |

### `/emploi-du-temps` — Emploi du temps

| Vue | Bouton | Effet observé | Verdict |
|---|---|---|---|
| vue initiale | Exporter | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Ajouter un cours | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | (sans nom) | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | (sans nom) | AUCUN EFFET VISIBLE | SANS EFFET |

### `/parametres` — Paramètres

| Vue | Bouton | Effet observé | Verdict |
|---|---|---|---|
| vue initiale | Profil | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Notifications | changement d’affichage | réagit |
| vue initiale | Sécurité | changement d’affichage | réagit |
| vue initiale | Apparence | changement d’affichage | réagit |
| vue initiale | Préférences | changement d’affichage | réagit |

### `/messagerie` — 

| Vue | Bouton | Effet observé | Verdict |
|---|---|---|---|
| vue initiale | Boîte | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Favoris | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Archive | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Nouvelle conversation | changement d’affichage | réagit |

### `/paiement/callback` — Confirmation indisponible

| Vue | Bouton | Effet observé | Verdict |
|---|---|---|---|
| vue initiale | Retour à l'échéancier | navigation /paiements + api 200 GET /api/comptable/paiements | réagit |

### `/directeur/ai-insights` — Assistant IA

| Vue | Bouton | Effet observé | Verdict |
|---|---|---|---|
| vue initiale | Chat IA | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Analyses | changement d’affichage | réagit |
| vue initiale | Analyser | api 200 GET /api/v1/ia/predictive | réagit |

### `/admin/journal-audit` — Journal d'audit

| Vue | Bouton | Effet observé | Verdict |
|---|---|---|---|
| vue initiale | Réinitialiser les filtres | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Voir le détail | changement d’affichage | réagit |
| vue initiale | Voir le détail | changement d’affichage | réagit |
| vue initiale | Voir le détail | changement d’affichage | réagit |
| vue initiale | Voir le détail | changement d’affichage | réagit |
| vue initiale | Voir le détail | changement d’affichage | réagit |
| vue initiale | Voir le détail | changement d’affichage | réagit |
| vue initiale | Voir le détail | changement d’affichage | réagit |
| vue initiale | Voir le détail | changement d’affichage | réagit |
| vue initiale | Voir le détail | changement d’affichage | réagit |
| vue initiale | Voir le détail | changement d’affichage | réagit |
| vue initiale | Voir le détail | changement d’affichage | réagit |
| vue initiale | Voir le détail | changement d’affichage | réagit |
| vue initiale | Voir le détail | changement d’affichage | réagit |
| vue initiale | Voir le détail | changement d’affichage | réagit |
| vue initiale | Voir le détail | changement d’affichage | réagit |
| vue initiale | Voir le détail | changement d’affichage | réagit |
| vue initiale | Voir le détail | changement d’affichage | réagit |
| vue initiale | Voir le détail | changement d’affichage | réagit |
| vue initiale | Voir le détail | changement d’affichage | réagit |
| vue initiale | Voir le détail | changement d’affichage | réagit |
| vue initiale | Voir le détail | changement d’affichage | réagit |
| vue initiale | Voir le détail | changement d’affichage | réagit |
| vue initiale | Voir le détail | changement d’affichage | réagit |
| vue initiale | Voir le détail | changement d’affichage | réagit |
| vue initiale | Voir le détail | changement d’affichage | réagit |
| vue initiale | Page précédente | désactivé | non exécuté (désactivé) |
| vue initiale | Page suivante | api 200 GET /api/audit-logs | réagit |

## directeurP_ecole1

### `/directeur/dashboard` — Tableau de bord

| Vue | Bouton | Effet observé | Verdict |
|---|---|---|---|
| Aperçu | Actualiser | AUCUN EFFET VISIBLE | SANS EFFET |
| Aperçu | Rapport | api 200 GET /api/dashboard/directeur/data | réagit |
| Aperçu | Exporter | AUCUN EFFET VISIBLE | SANS EFFET |
| Élèves | (sans nom) | désactivé | non exécuté (désactivé) |
| Élèves | Exporter | navigation /eleves + api 200 GET /api/eleves | réagit |

### `/eleves` — Élèves

| Vue | Bouton | Effet observé | Verdict |
|---|---|---|---|
| vue initiale | (sans nom) | api 200 GET /api/eleves | réagit |
| vue initiale | Exporter | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Nouvel élève | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Plus d'actions | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Retirer des effectifs | confirm: Retirer BOKO Urbain des effectifs ? Son dossier (notes, paiements…) reste consul | réagit |
| vue initiale | Plus d'actions | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Retirer des effectifs | confirm: Retirer CHABI Ornella des effectifs ? Son dossier (notes, paiements…) reste cons | réagit |
| vue initiale | Plus d'actions | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Retirer des effectifs | confirm: Retirer DEGBEGNI Ruth des effectifs ? Son dossier (notes, paiements…) reste cons | réagit |
| vue initiale | Plus d'actions | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Retirer des effectifs | confirm: Retirer EGBETOKO Sylvère des effectifs ? Son dossier (notes, paiements…) reste c | réagit |
| vue initiale | Plus d'actions | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Retirer des effectifs | confirm: Retirer FIGNON Bérenger des effectifs ? Son dossier (notes, paiements…) reste co | réagit |
| vue initiale | Plus d'actions | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Retirer des effectifs | confirm: Retirer SAGBO Pascal des effectifs ? Son dossier (notes, paiements…) reste consu | réagit |
| vue initiale | Plus d'actions | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Retirer des effectifs | confirm: Retirer TOSSA Reine des effectifs ? Son dossier (notes, paiements…) reste consul | réagit |
| vue initiale | Plus d'actions | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Retirer des effectifs | confirm: Retirer VICTOIRE Sébastien des effectifs ? Son dossier (notes, paiements…) reste | réagit |
| vue initiale | Plus d'actions | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Retirer des effectifs | confirm: Retirer YEHOUESSI Thérèse des effectifs ? Son dossier (notes, paiements…) reste  | réagit |
| vue initiale | Plus d'actions | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Retirer des effectifs | confirm: Retirer ZANNOU Ulrich des effectifs ? Son dossier (notes, paiements…) reste cons | réagit |

### `/notes` — Notes

| Vue | Bouton | Effet observé | Verdict |
|---|---|---|---|
| vue initiale | (sans nom) | api 200 GET /api/notes/eleve | réagit |
| vue initiale | Exporter | popup: http://localhost:3002/api/notes/export | réagit |
| vue initiale | Importer | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Nouvelle note | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Notes | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Classement | changement d’affichage | réagit |
| vue initiale | Bulletins | changement d’affichage | réagit |

### `/paiements` — Paiements

| Vue | Bouton | Effet observé | Verdict |
|---|---|---|---|
| vue initiale | (sans nom) | api 200 GET /api/comptable/paiements | réagit |
| vue initiale | Factures | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Exporter | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Nouveau paiement | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Paiements | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Échéancier | changement d’affichage | réagit |

### `/communications` — Communications

| Vue | Bouton | Effet observé | Verdict |
|---|---|---|---|
| vue initiale | Nouvelle publication | changement d’affichage | réagit |
| vue initiale | Publier | api 422 POST /api/communications | ÉCHEC API |
| vue initiale | Annuler | changement d’affichage | réagit |
| vue initiale | Informations | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Événements | AUCUN EFFET VISIBLE | SANS EFFET |

### `/emploi-du-temps` — Emploi du temps

| Vue | Bouton | Effet observé | Verdict |
|---|---|---|---|
| vue initiale | Exporter | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Ajouter un cours | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | (sans nom) | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | (sans nom) | AUCUN EFFET VISIBLE | SANS EFFET |

### `/parametres` — Paramètres

| Vue | Bouton | Effet observé | Verdict |
|---|---|---|---|
| vue initiale | Profil | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Notifications | changement d’affichage | réagit |
| vue initiale | Sécurité | changement d’affichage | réagit |
| vue initiale | Apparence | changement d’affichage | réagit |
| vue initiale | Préférences | changement d’affichage | réagit |

### `/messagerie` — 

| Vue | Bouton | Effet observé | Verdict |
|---|---|---|---|
| vue initiale | Boîte | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Favoris | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Archive | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Nouvelle conversation | api 200 GET /api/messages/contacts | réagit |

### `/affectations` — Affectations des enseignants

| Vue | Bouton | Effet observé | Verdict |
|---|---|---|---|
| Secondaire | Affecter | désactivé | non exécuté (désactivé) |

### `/paiement/callback` — Confirmation indisponible

| Vue | Bouton | Effet observé | Verdict |
|---|---|---|---|
| vue initiale | Retour à l'échéancier | navigation /paiements + api 200 GET /api/comptable/paiements | réagit |

### `/directeur/ai-insights` — Assistant IA

| Vue | Bouton | Effet observé | Verdict |
|---|---|---|---|
| vue initiale | Chat IA | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Analyses | changement d’affichage | réagit |
| vue initiale | Analyser | api 200 GET /api/v1/ia/predictive | réagit |

### `/admin/journal-audit` — Journal d'audit

| Vue | Bouton | Effet observé | Verdict |
|---|---|---|---|
| vue initiale | Réinitialiser les filtres | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Voir le détail | changement d’affichage | réagit |
| vue initiale | Voir le détail | changement d’affichage | réagit |
| vue initiale | Voir le détail | changement d’affichage | réagit |
| vue initiale | Voir le détail | changement d’affichage | réagit |
| vue initiale | Voir le détail | changement d’affichage | réagit |
| vue initiale | Voir le détail | changement d’affichage | réagit |
| vue initiale | Voir le détail | changement d’affichage | réagit |
| vue initiale | Voir le détail | changement d’affichage | réagit |
| vue initiale | Voir le détail | changement d’affichage | réagit |
| vue initiale | Voir le détail | changement d’affichage | réagit |
| vue initiale | Voir le détail | changement d’affichage | réagit |
| vue initiale | Voir le détail | changement d’affichage | réagit |
| vue initiale | Voir le détail | changement d’affichage | réagit |
| vue initiale | Voir le détail | changement d’affichage | réagit |
| vue initiale | Voir le détail | changement d’affichage | réagit |
| vue initiale | Voir le détail | changement d’affichage | réagit |
| vue initiale | Voir le détail | changement d’affichage | réagit |
| vue initiale | Voir le détail | changement d’affichage | réagit |
| vue initiale | Voir le détail | changement d’affichage | réagit |
| vue initiale | Voir le détail | changement d’affichage | réagit |
| vue initiale | Voir le détail | changement d’affichage | réagit |
| vue initiale | Voir le détail | changement d’affichage | réagit |
| vue initiale | Voir le détail | changement d’affichage | réagit |
| vue initiale | Voir le détail | changement d’affichage | réagit |
| vue initiale | Voir le détail | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Page précédente | désactivé | non exécuté (désactivé) |
| vue initiale | Page suivante | api 200 GET /api/audit-logs | réagit |

## directeurS_ecole1

### `/directeur/dashboard` — Tableau de bord

| Vue | Bouton | Effet observé | Verdict |
|---|---|---|---|
| Aperçu | Actualiser | api 200 GET /api/dashboard/directeur/data | réagit |
| Aperçu | Rapport | AUCUN EFFET VISIBLE | SANS EFFET |
| Aperçu | Exporter | AUCUN EFFET VISIBLE | SANS EFFET |
| Élèves | (sans nom) | navigation /eleves + api 200 GET /api/eleves | réagit |
| Élèves | Exporter | navigation /eleves | réagit |
| Élèves | Nouvel élève | navigation /eleves | réagit |
| Élèves | Plus d'actions | navigation /eleves | réagit |
| Élèves | Retirer des effectifs | navigation /eleves + confirm: Retirer AGBODJAN Yèhossou des effectifs ? Son dossier (notes, paiements…) reste  | réagit |
| Élèves | Plus d'actions | navigation /eleves | réagit |
| Élèves | Retirer des effectifs | navigation /eleves + confirm: Retirer HOUNGBO Fifamè des effectifs ? Son dossier (notes, paiements…) reste con | réagit |
| Élèves | Plus d'actions | navigation /eleves | réagit |
| Élèves | Retirer des effectifs | navigation /eleves + confirm: Retirer GBAGUIDI Carmelle des effectifs ? Son dossier (notes, paiements…) reste  | réagit |
| Élèves | Plus d'actions | navigation /eleves | réagit |
| Élèves | Retirer des effectifs | navigation /eleves + confirm: Retirer HESSOU Fernand des effectifs ? Son dossier (notes, paiements…) reste con | réagit |
| Élèves | Plus d'actions | navigation /eleves | réagit |
| Élèves | Retirer des effectifs | navigation /eleves + confirm: Retirer HOUNKPATIN Déborah des effectifs ? Son dossier (notes, paiements…) reste | réagit |
| Élèves | Plus d'actions | navigation /eleves | réagit |
|  | (sans nom) | navigation /eleves + api 200 GET /api/eleves | réagit |
| Finances | Actualiser | changement d’affichage (clic déclenché par script : bouton masqué par un autre élément) | réagit |
| Finances | Rapport | AUCUN EFFET VISIBLE (clic déclenché par script : bouton masqué par un autre élément) | SANS EFFET |
| Finances | Exporter | api 200 GET /api/dashboard/directeur/data | réagit |
| Messages | Boîte | navigation /messagerie | réagit |
| Messages | Favoris | navigation /messagerie | réagit |
| Messages | Archive | navigation /messagerie | réagit |
| Messages | Nouvelle conversation | navigation /messagerie + api 200 GET /api/messages/contacts | réagit |
|  | Boîte | navigation /messagerie | réagit |
|  | Ajouter un cours | navigation /emploi-du-temps | réagit |
|  | (sans nom) | navigation /emploi-du-temps | réagit |
|  | (sans nom) | navigation /emploi-du-temps | réagit |

### `/eleves` — Élèves

| Vue | Bouton | Effet observé | Verdict |
|---|---|---|---|
| vue initiale | (sans nom) | api 200 GET /api/eleves | réagit |
| vue initiale | Exporter | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Nouvel élève | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Plus d'actions | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Retirer des effectifs | confirm: Retirer AGBODJAN Yèhossou des effectifs ? Son dossier (notes, paiements…) reste  | réagit |
| vue initiale | Plus d'actions | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Retirer des effectifs | confirm: Retirer HOUNGBO Fifamè des effectifs ? Son dossier (notes, paiements…) reste con | réagit |
| vue initiale | Plus d'actions | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Retirer des effectifs | confirm: Retirer GBAGUIDI Carmelle des effectifs ? Son dossier (notes, paiements…) reste  | réagit |
| vue initiale | Plus d'actions | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Retirer des effectifs | confirm: Retirer HESSOU Fernand des effectifs ? Son dossier (notes, paiements…) reste con | réagit |
| vue initiale | Plus d'actions | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Retirer des effectifs | confirm: Retirer HOUNKPATIN Déborah des effectifs ? Son dossier (notes, paiements…) reste | réagit |
| vue initiale | Plus d'actions | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Retirer des effectifs | confirm: Retirer HOUNDJO Eliakim des effectifs ? Son dossier (notes, paiements…) reste co | réagit |
| vue initiale | Plus d'actions | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Retirer des effectifs | confirm: Retirer HOUNGBO Grâce des effectifs ? Son dossier (notes, paiements…) reste cons | réagit |
| vue initiale | Plus d'actions | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Retirer des effectifs | confirm: Retirer IDOHOU Gilles des effectifs ? Son dossier (notes, paiements…) reste cons | réagit |
| vue initiale | Plus d'actions | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Retirer des effectifs | confirm: Retirer JOHNSON Hortense des effectifs ? Son dossier (notes, paiements…) reste c | réagit |
| vue initiale | Plus d'actions | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Retirer des effectifs | confirm: Retirer KINTO Ismaël des effectifs ? Son dossier (notes, paiements…) reste consu | réagit |
| vue initiale | Plus d'actions | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Retirer des effectifs | confirm: Retirer LOKO Jospin des effectifs ? Son dossier (notes, paiements…) reste consul | réagit |
| vue initiale | Plus d'actions | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Retirer des effectifs | confirm: Retirer MESSAN Keren des effectifs ? Son dossier (notes, paiements…) reste consu | réagit |
| vue initiale | Plus d'actions | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Retirer des effectifs | confirm: Retirer NONVIGNON Léonard des effectifs ? Son dossier (notes, paiements…) reste  | réagit |
| vue initiale | Plus d'actions | AUCUN EFFET VISIBLE | SANS EFFET |

### `/notes` — 

| Vue | Bouton | Effet observé | Verdict |
|---|---|---|---|
| vue initiale | (sans nom) | api 200 GET /api/notes/eleve | réagit |
| vue initiale | Exporter | popup: http://localhost:3002/api/notes/export (clic déclenché par script : bouton masqué par un autre élément) | réagit |
| vue initiale | Importer | popup: http://localhost:3002/api/notes/export (clic déclenché par script : bouton masqué par un autre élément) | réagit |
| vue initiale | Nouvelle note | popup: http://localhost:3002/api/notes/export | réagit |
| vue initiale | Notes | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Classement | changement d’affichage | réagit |
| vue initiale | Bulletins | changement d’affichage | réagit |

### `/paiements` — Paiements

| Vue | Bouton | Effet observé | Verdict |
|---|---|---|---|
| vue initiale | (sans nom) | api 200 GET /api/comptable/paiements | réagit |
| vue initiale | Factures | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Exporter | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Nouveau paiement | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Paiements | AUCUN EFFET VISIBLE (clic déclenché par script : bouton masqué par un autre élément) | SANS EFFET |
| vue initiale | Échéancier | changement d’affichage | réagit |

### `/communications` — Communications

| Vue | Bouton | Effet observé | Verdict |
|---|---|---|---|
| vue initiale | Nouvelle publication | changement d’affichage | réagit |
| vue initiale | Publier | api 422 POST /api/communications | ÉCHEC API |
| vue initiale | Annuler | changement d’affichage | réagit |
| vue initiale | Informations | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Événements | AUCUN EFFET VISIBLE | SANS EFFET |

### `/emploi-du-temps` — Emploi du temps

| Vue | Bouton | Effet observé | Verdict |
|---|---|---|---|
| vue initiale | Exporter | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Ajouter un cours | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | (sans nom) | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | (sans nom) | AUCUN EFFET VISIBLE | SANS EFFET |

### `/parametres` — Paramètres

| Vue | Bouton | Effet observé | Verdict |
|---|---|---|---|
| vue initiale | Profil | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Notifications | changement d’affichage | réagit |
| vue initiale | Sécurité | changement d’affichage | réagit |
| vue initiale | Apparence | changement d’affichage | réagit |
| vue initiale | Préférences | changement d’affichage | réagit |

### `/messagerie` — 

| Vue | Bouton | Effet observé | Verdict |
|---|---|---|---|
| vue initiale | Boîte | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Favoris | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Archive | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Nouvelle conversation | api 200 GET /api/messages/contacts | réagit |

### `/affectations` — Affectations des enseignants

| Vue | Bouton | Effet observé | Verdict |
|---|---|---|---|
| Secondaire | Affecter | désactivé | non exécuté (désactivé) |

### `/paiement/callback` — Confirmation indisponible

| Vue | Bouton | Effet observé | Verdict |
|---|---|---|---|
| vue initiale | Retour à l'échéancier | navigation /paiements + api 200 GET /api/comptable/paiements | réagit |

### `/directeur/ai-insights` — Assistant IA

| Vue | Bouton | Effet observé | Verdict |
|---|---|---|---|
| vue initiale | Chat IA | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Analyses | changement d’affichage | réagit |
| vue initiale | Analyser | api 200 GET /api/v1/ia/predictive | réagit |

### `/admin/journal-audit` — Journal d'audit

| Vue | Bouton | Effet observé | Verdict |
|---|---|---|---|
| vue initiale | Réinitialiser les filtres | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Voir le détail | changement d’affichage | réagit |
| vue initiale | Voir le détail | changement d’affichage | réagit |
| vue initiale | Voir le détail | changement d’affichage | réagit |
| vue initiale | Voir le détail | changement d’affichage | réagit |
| vue initiale | Voir le détail | changement d’affichage | réagit |
| vue initiale | Voir le détail | changement d’affichage | réagit |
| vue initiale | Voir le détail | changement d’affichage | réagit |
| vue initiale | Voir le détail | changement d’affichage | réagit |
| vue initiale | Voir le détail | changement d’affichage | réagit |
| vue initiale | Voir le détail | changement d’affichage | réagit |
| vue initiale | Voir le détail | changement d’affichage | réagit |
| vue initiale | Voir le détail | changement d’affichage | réagit |
| vue initiale | Voir le détail | changement d’affichage | réagit |
| vue initiale | Voir le détail | changement d’affichage | réagit |
| vue initiale | Voir le détail | changement d’affichage | réagit |
| vue initiale | Voir le détail | changement d’affichage | réagit |
| vue initiale | Voir le détail | changement d’affichage | réagit |
| vue initiale | Voir le détail | changement d’affichage | réagit |
| vue initiale | Voir le détail | changement d’affichage | réagit |
| vue initiale | Voir le détail | changement d’affichage | réagit |
| vue initiale | Voir le détail | changement d’affichage | réagit |
| vue initiale | Voir le détail | changement d’affichage | réagit |
| vue initiale | Voir le détail | changement d’affichage | réagit |
| vue initiale | Voir le détail | changement d’affichage | réagit |
| vue initiale | Voir le détail | changement d’affichage | réagit |
| vue initiale | Page précédente | désactivé | non exécuté (désactivé) |
| vue initiale | Page suivante | api 200 GET /api/audit-logs | réagit |

## doyen_faculte1

### `/notes` — Notes

| Vue | Bouton | Effet observé | Verdict |
|---|---|---|---|
| vue initiale | (sans nom) | api 403 GET /api/notes/eleve | ÉCHEC API |
| vue initiale | Exporter | popup: http://localhost:3002/api/notes/export | réagit |
| vue initiale | Importer | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Nouvelle note | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Notes | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Classement | changement d’affichage | réagit |
| vue initiale | Bulletins | changement d’affichage | réagit |

### `/communications` — Communications

| Vue | Bouton | Effet observé | Verdict |
|---|---|---|---|
| vue initiale | Nouvelle publication | changement d’affichage | réagit |
| vue initiale | Publier | api 403 POST /api/communications | ÉCHEC API |
| vue initiale | Annuler | changement d’affichage | réagit |
| vue initiale | Informations | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Événements | AUCUN EFFET VISIBLE | SANS EFFET |

### `/parametres` — Paramètres

| Vue | Bouton | Effet observé | Verdict |
|---|---|---|---|
| vue initiale | Profil | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Notifications | changement d’affichage | réagit |
| vue initiale | Sécurité | changement d’affichage | réagit |
| vue initiale | Apparence | changement d’affichage | réagit |
| vue initiale | Préférences | changement d’affichage | réagit |

### `/messagerie` — 

| Vue | Bouton | Effet observé | Verdict |
|---|---|---|---|
| vue initiale | Boîte | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Favoris | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Archive | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Nouvelle conversation | api 200 GET /api/messages/contacts | réagit |

### `/universite/facultes` — Facultés

| Vue | Bouton | Effet observé | Verdict |
|---|---|---|---|
| vue initiale | Ajouter une faculté | AUCUN EFFET VISIBLE | SANS EFFET |

### `/universite/departements` — Départements

| Vue | Bouton | Effet observé | Verdict |
|---|---|---|---|
| vue initiale | Nouveau département | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Gérer | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Gérer | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Gérer | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Gérer | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Gérer | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Gérer | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Gérer | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Gérer | AUCUN EFFET VISIBLE | SANS EFFET |

### `/universite/etudiants` — Étudiants

| Vue | Bouton | Effet observé | Verdict |
|---|---|---|---|
| vue initiale | Ajouter un étudiant | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Tous | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | — | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Voir | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Voir | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Voir | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Voir | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Voir | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Voir | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Voir | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Voir | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Voir | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Voir | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Voir | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Voir | AUCUN EFFET VISIBLE | SANS EFFET |

### `/universite/enseignants` — Enseignants

| Vue | Bouton | Effet observé | Verdict |
|---|---|---|---|
| vue initiale | Ajouter un enseignant | AUCUN EFFET VISIBLE | SANS EFFET |

### `/universite/cours` — Erreur serveur

| Vue | Bouton | Effet observé | Verdict |
|---|---|---|---|
| vue initiale | Réessayer | AUCUN EFFET VISIBLE | SANS EFFET |

### `/universite/dashboard` — Université

| Vue | Bouton | Effet observé | Verdict |
|---|---|---|---|
| Aperçu | Actualiser | désactivé | non exécuté (désactivé) |
| Aperçu | (sans nom) | AUCUN EFFET VISIBLE | SANS EFFET |
| Aperçu | (sans nom) | AUCUN EFFET VISIBLE | SANS EFFET |
| Aperçu | Calendrier | api 500 GET /api/dashboard/universite | ÉCHEC API |
| Facultés | Ajouter une faculté | navigation /universite/facultes | réagit |
|  | Ajouter une faculté | navigation /universite/facultes | réagit |
|  | Ajouter un étudiant | navigation /universite/etudiants | réagit |
| Planning | Actualiser | désactivé | non exécuté (désactivé) |
| Planning | (sans nom) | api 500 GET /api/dashboard/universite | ÉCHEC API |
| Planning | (sans nom) | AUCUN EFFET VISIBLE | SANS EFFET |
| Planning | Calendrier | AUCUN EFFET VISIBLE | SANS EFFET |

## EL001

### `/eleve/dashboard` — Mon espace élève

| Vue | Bouton | Effet observé | Verdict |
|---|---|---|---|
| Aperçu | Actualiser | api 200 GET /api/dashboard/eleve | réagit |
| Mes notes | Actualiser | api 200 GET /api/dashboard/eleve | réagit |
| Emploi du temps | Exporter | navigation /emploi-du-temps | réagit |
| Emploi du temps | Ajouter un cours | navigation /emploi-du-temps | réagit |
|  | Exporter | navigation /emploi-du-temps (clic déclenché par script : bouton masqué par un autre élément) | réagit |

### `/notes` — Notes

| Vue | Bouton | Effet observé | Verdict |
|---|---|---|---|
| vue initiale | (sans nom) | api 200 GET /api/notes/eleve | réagit |
| vue initiale | Exporter | popup: http://localhost:3002/api/notes/export | réagit |
| vue initiale | Importer | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Nouvelle note | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Notes | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Classement | changement d’affichage | réagit |
| vue initiale | Bulletins | changement d’affichage | réagit |

### `/paiements` — Paiements

| Vue | Bouton | Effet observé | Verdict |
|---|---|---|---|
| vue initiale | (sans nom) | api 403 GET /api/comptable/paiements | ÉCHEC API |
| vue initiale | Factures | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Exporter | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Nouveau paiement | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Paiements | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Échéancier | changement d’affichage | réagit |

### `/communications` — Communications

| Vue | Bouton | Effet observé | Verdict |
|---|---|---|---|
| vue initiale | Nouvelle publication | changement d’affichage | réagit |
| vue initiale | Publier | api 403 POST /api/communications | ÉCHEC API |
| vue initiale | Annuler | changement d’affichage | réagit |
| vue initiale | Informations | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Événements | AUCUN EFFET VISIBLE | SANS EFFET |

### `/emploi-du-temps` — Emploi du temps

| Vue | Bouton | Effet observé | Verdict |
|---|---|---|---|
| vue initiale | Exporter | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Ajouter un cours | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | (sans nom) | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | (sans nom) | AUCUN EFFET VISIBLE | SANS EFFET |

### `/parametres` — Paramètres

| Vue | Bouton | Effet observé | Verdict |
|---|---|---|---|
| vue initiale | Profil | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Notifications | changement d’affichage | réagit |
| vue initiale | Sécurité | changement d’affichage | réagit |
| vue initiale | Apparence | changement d’affichage | réagit |
| vue initiale | Préférences | changement d’affichage | réagit |

### `/messagerie` — 

| Vue | Bouton | Effet observé | Verdict |
|---|---|---|---|
| vue initiale | Boîte | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Favoris | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Archive | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Nouvelle conversation | api 200 GET /api/messages/contacts | réagit |

### `/paiement/callback` — Confirmation indisponible

| Vue | Bouton | Effet observé | Verdict |
|---|---|---|---|
| vue initiale | Retour à l'échéancier | navigation /paiements + api 403 GET /api/comptable/paiements | ÉCHEC API |

### `/eleve/tutor` — Tuteur IA

| Vue | Bouton | Effet observé | Verdict |
|---|---|---|---|
| vue initiale | Chat IA | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Analyses | changement d’affichage | réagit |
| vue initiale | Analyser | api 403 GET /api/v1/ia/predictive | ÉCHEC API |

## enseignant_ecole1

### `/enseignant/dashboard` — Mon espace enseignant

| Vue | Bouton | Effet observé | Verdict |
|---|---|---|---|
| Aperçu | Actualiser | api 200 GET /api/dashboard/enseignant | réagit |
| Aperçu | (sans nom) | AUCUN EFFET VISIBLE | SANS EFFET |
| Aperçu | (sans nom) | AUCUN EFFET VISIBLE | SANS EFFET |
| Aperçu | Voir la semaine | AUCUN EFFET VISIBLE | SANS EFFET |
| Aperçu | Nouveau | AUCUN EFFET VISIBLE | SANS EFFET |

### `/eleves` — Élèves

| Vue | Bouton | Effet observé | Verdict |
|---|---|---|---|
| vue initiale | (sans nom) | api 200 GET /api/eleves | réagit |
| vue initiale | Exporter | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Nouvel élève | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Plus d'actions | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Retirer des effectifs | confirm: Retirer AGBODJAN Yèhossou des effectifs ? Son dossier (notes, paiements…) reste  | réagit |
| vue initiale | Plus d'actions | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Retirer des effectifs | confirm: Retirer HOUNGBO Fifamè des effectifs ? Son dossier (notes, paiements…) reste con | réagit |
| vue initiale | Plus d'actions | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Retirer des effectifs | confirm: Retirer ADJOVI Koffi des effectifs ? Son dossier (notes, paiements…) reste consu | réagit |
| vue initiale | Plus d'actions | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Retirer des effectifs | confirm: Retirer AHOUANSOU Mirabelle des effectifs ? Son dossier (notes, paiements…) rest | réagit |
| vue initiale | Plus d'actions | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Retirer des effectifs | confirm: Retirer AKPOVI Joël des effectifs ? Son dossier (notes, paiements…) reste consul | réagit |
| vue initiale | Plus d'actions | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Retirer des effectifs | confirm: Retirer BOKO Urbain des effectifs ? Son dossier (notes, paiements…) reste consul | réagit |
| vue initiale | Plus d'actions | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Retirer des effectifs | confirm: Retirer CHABI Ornella des effectifs ? Son dossier (notes, paiements…) reste cons | réagit |
| vue initiale | Plus d'actions | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Retirer des effectifs | confirm: Retirer DEGBEGNI Ruth des effectifs ? Son dossier (notes, paiements…) reste cons | réagit |
| vue initiale | Plus d'actions | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Retirer des effectifs | confirm: Retirer EGBETOKO Sylvère des effectifs ? Son dossier (notes, paiements…) reste c | réagit |
| vue initiale | Plus d'actions | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Retirer des effectifs | confirm: Retirer FIGNON Bérenger des effectifs ? Son dossier (notes, paiements…) reste co | réagit |
| vue initiale | Plus d'actions | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Retirer des effectifs | confirm: Retirer GBAGUIDI Carmelle des effectifs ? Son dossier (notes, paiements…) reste  | réagit |
| vue initiale | Plus d'actions | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Retirer des effectifs | confirm: Retirer HESSOU Fernand des effectifs ? Son dossier (notes, paiements…) reste con | réagit |
| vue initiale | Plus d'actions | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Retirer des effectifs | confirm: Retirer HOUNKPATIN Déborah des effectifs ? Son dossier (notes, paiements…) reste | réagit |
| vue initiale | Plus d'actions | AUCUN EFFET VISIBLE | SANS EFFET |

### `/notes` — Notes

| Vue | Bouton | Effet observé | Verdict |
|---|---|---|---|
| vue initiale | (sans nom) | api 200 GET /api/notes/eleve | réagit |
| vue initiale | Exporter | popup: http://localhost:3002/api/notes/export | réagit |
| vue initiale | Importer | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Nouvelle note | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Notes | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Classement | changement d’affichage | réagit |
| vue initiale | Bulletins | changement d’affichage | réagit |

### `/communications` — Communications

| Vue | Bouton | Effet observé | Verdict |
|---|---|---|---|
| vue initiale | Nouvelle publication | changement d’affichage | réagit |
| vue initiale | Publier | api 403 POST /api/communications | ÉCHEC API |
| vue initiale | Annuler | changement d’affichage | réagit |
| vue initiale | Informations | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Événements | AUCUN EFFET VISIBLE | SANS EFFET |

### `/emploi-du-temps` — Emploi du temps

| Vue | Bouton | Effet observé | Verdict |
|---|---|---|---|
| vue initiale | Exporter | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Ajouter un cours | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | (sans nom) | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | (sans nom) | AUCUN EFFET VISIBLE | SANS EFFET |

### `/parametres` — Paramètres

| Vue | Bouton | Effet observé | Verdict |
|---|---|---|---|
| vue initiale | Profil | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Notifications | changement d’affichage | réagit |
| vue initiale | Sécurité | changement d’affichage | réagit |
| vue initiale | Apparence | changement d’affichage | réagit |
| vue initiale | Préférences | changement d’affichage | réagit |

### `/messagerie` — 

| Vue | Bouton | Effet observé | Verdict |
|---|---|---|---|
| vue initiale | Boîte | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Favoris | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Archive | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Nouvelle conversation | api 200 GET /api/messages/contacts | réagit |

### `/enseignant/ai-assistant` — Assistant pédagogique IA

| Vue | Bouton | Effet observé | Verdict |
|---|---|---|---|
| vue initiale | Chat IA | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Analyses | changement d’affichage | réagit |
| vue initiale | Analyser | api 403 GET /api/v1/ia/predictive | ÉCHEC API |

## infirmier_ecole1

### `/infirmier/dashboard` — Infirmerie

| Vue | Bouton | Effet observé | Verdict |
|---|---|---|---|
| Aperçu | Actualiser | api 200 GET /api/dashboard/infirmier | réagit |
| Aperçu | État des lieux | changement d’affichage | réagit |
| Soins | Nouveau soin | navigation /infirmier/soins | réagit |
| Soins | Détails | navigation /infirmier/soins | réagit |
| Soins | Détails | navigation /infirmier/soins | réagit |
| Soins | Détails | navigation /infirmier/soins | réagit |
| Soins | Détails | navigation /infirmier/soins | réagit |
| Soins | Détails | navigation /infirmier/soins | réagit |
| Soins | Détails | navigation /infirmier/soins | réagit |
| Soins | Détails | navigation /infirmier/soins | réagit |
| Soins | Détails | navigation /infirmier/soins | réagit |
| Soins | Détails | navigation /infirmier/soins | réagit |
| Soins | Détails | navigation /infirmier/soins | réagit |
| Soins | Détails | navigation /infirmier/soins | réagit |
| Soins | Détails | navigation /infirmier/soins | réagit |
|  | Nouveau soin | navigation /infirmier/soins | réagit |
|  | Dossiers médicaux | navigation /infirmier/dossiers | réagit |

### `/eleves` — Élèves

| Vue | Bouton | Effet observé | Verdict |
|---|---|---|---|
| vue initiale | (sans nom) | api 403 GET /api/eleves | ÉCHEC API |
| vue initiale | Exporter | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Nouvel élève | AUCUN EFFET VISIBLE | SANS EFFET |

### `/notes` — Notes

| Vue | Bouton | Effet observé | Verdict |
|---|---|---|---|
| vue initiale | (sans nom) | api 403 GET /api/notes/eleve | ÉCHEC API |
| vue initiale | Exporter | popup: http://localhost:3002/api/notes/export | réagit |
| vue initiale | Importer | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Nouvelle note | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Notes | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Classement | changement d’affichage | réagit |
| vue initiale | Bulletins | changement d’affichage | réagit |

### `/communications` — Communications

| Vue | Bouton | Effet observé | Verdict |
|---|---|---|---|
| vue initiale | Nouvelle publication | changement d’affichage | réagit |
| vue initiale | Publier | api 403 POST /api/communications | ÉCHEC API |
| vue initiale | Annuler | changement d’affichage | réagit |
| vue initiale | Informations | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Événements | AUCUN EFFET VISIBLE | SANS EFFET |

### `/parametres` — Paramètres

| Vue | Bouton | Effet observé | Verdict |
|---|---|---|---|
| vue initiale | Profil | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Notifications | changement d’affichage | réagit |
| vue initiale | Sécurité | changement d’affichage | réagit |
| vue initiale | Apparence | changement d’affichage | réagit |
| vue initiale | Préférences | changement d’affichage | réagit |

### `/messagerie` — 

| Vue | Bouton | Effet observé | Verdict |
|---|---|---|---|
| vue initiale | Boîte | AUCUN EFFET VISIBLE (clic déclenché par script : bouton masqué par un autre élément) | SANS EFFET |
| vue initiale | Favoris | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Archive | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Nouvelle conversation | api 200 GET /api/messages/contacts | réagit |

### `/infirmier/soins` — Soins infirmiers

| Vue | Bouton | Effet observé | Verdict |
|---|---|---|---|
| vue initiale | Nouveau soin | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Détails | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Détails | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Détails | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Détails | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Détails | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Détails | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Détails | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Détails | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Détails | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Détails | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Détails | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Détails | AUCUN EFFET VISIBLE | SANS EFFET |

### `/infirmier/dossiers` — Dossiers médicaux

| Vue | Bouton | Effet observé | Verdict |
|---|---|---|---|
| vue initiale | Nouveau dossier | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Dossiers médicaux | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Vaccinations | changement d’affichage | réagit |
| vue initiale | 3ème · 1 vaccin(s) | changement d’affichage | réagit |
| vue initiale | 3ème · 1 vaccin(s) | changement d’affichage | réagit |
| vue initiale | Petite Section · 1 vaccin(s) | changement d’affichage | réagit |
| vue initiale | Moyenne Section · 1 vaccin(s) | changement d’affichage | réagit |
| vue initiale | Grande Section · 1 vaccin(s) | changement d’affichage | réagit |
| vue initiale | CP · 1 vaccin(s) | changement d’affichage (clic déclenché par script : bouton masqué par un autre élément) | réagit |
| vue initiale | CE1 · 1 vaccin(s) | changement d’affichage | réagit |
| vue initiale | CE2 · 1 vaccin(s) | changement d’affichage | réagit |
| vue initiale | CM1 · 1 vaccin(s) | changement d’affichage | réagit |
| vue initiale | CM2 · 1 vaccin(s) | changement d’affichage | réagit |
| vue initiale | 6ème · 1 vaccin(s) | changement d’affichage | réagit |
| vue initiale | 5ème · 1 vaccin(s) | changement d’affichage | réagit |
| vue initiale | 4ème · 1 vaccin(s) | changement d’affichage | réagit |
| vue initiale | 2nde A · 1 vaccin(s) | changement d’affichage | réagit |
| vue initiale | 2nde C · 1 vaccin(s) | changement d’affichage | réagit |

## PAR001

### `/parent/dashboard` — Espace parent

| Vue | Bouton | Effet observé | Verdict |
|---|---|---|---|
| Aperçu | Actualiser | api 200 GET /api/dashboard/parent | réagit |
| Aperçu | Voir tous les échanges | AUCUN EFFET VISIBLE | SANS EFFET |
| Notes | (sans nom) | navigation /notes + api 200 GET /api/notes/eleve | réagit |
| Notes | Exporter | navigation /notes + popup: http://localhost:3002/api/notes/export | réagit |
| Notes | Importer | navigation /notes | réagit |
| Notes | Nouvelle note | navigation /notes | réagit |
| Notes | Notes | navigation /notes | réagit |
| Notes | Classement | navigation /notes | réagit |
| Notes | Bulletins | navigation /notes | réagit |
|  | (sans nom) | navigation /notes + api 200 GET /api/notes/eleve | réagit |
|  | Ajouter un cours | navigation /emploi-du-temps | réagit |
|  | (sans nom) | navigation /emploi-du-temps | réagit |
|  | (sans nom) | navigation /emploi-du-temps | réagit |
|  | Exporter | navigation /emploi-du-temps | réagit |
|  | Factures | navigation /paiements | réagit |
|  | Exporter | navigation /paiements | réagit |
|  | Nouveau paiement | navigation /paiements | réagit |
|  | (sans nom) | navigation /paiements + api 403 GET /api/comptable/paiements | ÉCHEC API |
|  | Tout | navigation /communications | réagit |
|  | Important | navigation /communications | réagit |
|  | Informations | navigation /communications | réagit |
|  | Événements | navigation /communications | réagit |

### `/eleves` — Élèves

| Vue | Bouton | Effet observé | Verdict |
|---|---|---|---|
| vue initiale | (sans nom) | api 403 GET /api/eleves | ÉCHEC API |
| vue initiale | Exporter | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Nouvel élève | AUCUN EFFET VISIBLE | SANS EFFET |

### `/notes` — Notes

| Vue | Bouton | Effet observé | Verdict |
|---|---|---|---|
| vue initiale | (sans nom) | api 200 GET /api/notes/eleve | réagit |
| vue initiale | Exporter | popup: http://localhost:3002/api/notes/export | réagit |
| vue initiale | Importer | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Nouvelle note | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Notes | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Classement | changement d’affichage | réagit |
| vue initiale | Bulletins | changement d’affichage | réagit |

### `/paiements` — Paiements

| Vue | Bouton | Effet observé | Verdict |
|---|---|---|---|
| vue initiale | (sans nom) | api 403 GET /api/comptable/paiements | ÉCHEC API |
| vue initiale | Factures | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Exporter | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Nouveau paiement | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Paiements | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Échéancier | changement d’affichage | réagit |

### `/communications` — Communications

| Vue | Bouton | Effet observé | Verdict |
|---|---|---|---|
| vue initiale | Nouvelle publication | changement d’affichage | réagit |
| vue initiale | Publier | api 403 POST /api/communications | ÉCHEC API |
| vue initiale | Annuler | changement d’affichage | réagit |
| vue initiale | Informations | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Événements | AUCUN EFFET VISIBLE | SANS EFFET |

### `/parametres` — Paramètres

| Vue | Bouton | Effet observé | Verdict |
|---|---|---|---|
| vue initiale | Profil | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Notifications | changement d’affichage | réagit |
| vue initiale | Sécurité | changement d’affichage | réagit |
| vue initiale | Apparence | changement d’affichage | réagit |
| vue initiale | Préférences | changement d’affichage | réagit |

### `/messagerie` — 

| Vue | Bouton | Effet observé | Verdict |
|---|---|---|---|
| vue initiale | Boîte | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Favoris | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Archive | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Nouvelle conversation | api 200 GET /api/messages/contacts | réagit |

### `/paiement/callback` — Confirmation indisponible

| Vue | Bouton | Effet observé | Verdict |
|---|---|---|---|
| vue initiale | Retour à l'échéancier | navigation /paiements + api 403 GET /api/comptable/paiements | ÉCHEC API |

### `/parent/ai-report` — Assistant parental

| Vue | Bouton | Effet observé | Verdict |
|---|---|---|---|
| vue initiale | Chat IA | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Analyses | changement d’affichage | réagit |
| vue initiale | Analyser | api 403 GET /api/v1/ia/predictive | ÉCHEC API |

## perso_bossou-marcellin

### `/notes` — Notes

| Vue | Bouton | Effet observé | Verdict |
|---|---|---|---|
| vue initiale | (sans nom) | api 403 GET /api/notes/eleve | ÉCHEC API |
| vue initiale | Exporter | popup: http://localhost:3002/api/notes/export | réagit |
| vue initiale | Importer | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Nouvelle note | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Notes | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Classement | changement d’affichage | réagit |
| vue initiale | Bulletins | changement d’affichage | réagit |

### `/communications` — Communications

| Vue | Bouton | Effet observé | Verdict |
|---|---|---|---|
| vue initiale | Nouvelle publication | changement d’affichage | réagit |
| vue initiale | Publier | api 403 POST /api/communications | ÉCHEC API |
| vue initiale | Annuler | changement d’affichage | réagit |
| vue initiale | Informations | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Événements | AUCUN EFFET VISIBLE | SANS EFFET |

### `/parametres` — Paramètres

| Vue | Bouton | Effet observé | Verdict |
|---|---|---|---|
| vue initiale | Profil | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Notifications | changement d’affichage | réagit |
| vue initiale | Sécurité | changement d’affichage | réagit |
| vue initiale | Apparence | changement d’affichage | réagit |
| vue initiale | Préférences | changement d’affichage | réagit |

### `/messagerie` — 

| Vue | Bouton | Effet observé | Verdict |
|---|---|---|---|
| vue initiale | Boîte | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Favoris | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Archive | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Nouvelle conversation | api 200 GET /api/messages/contacts | réagit |

### `/universite/taches` — Tâches

| Vue | Bouton | Effet observé | Verdict |
|---|---|---|---|
| vue initiale | Nouvelle tâche | AUCUN EFFET VISIBLE | SANS EFFET |

### `/universite/planning` — Planning

| Vue | Bouton | Effet observé | Verdict |
|---|---|---|---|
| vue initiale | Nouvel événement | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Cours | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | TD | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | TP | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Examen | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Soutenance | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Conférence | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Réunion | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Événement | AUCUN EFFET VISIBLE | SANS EFFET |

### `/universite/dashboard` — Université

| Vue | Bouton | Effet observé | Verdict |
|---|---|---|---|
| Aperçu | Actualiser | désactivé | non exécuté (désactivé) |
| Aperçu | (sans nom) | AUCUN EFFET VISIBLE | SANS EFFET |
| Aperçu | (sans nom) | api 500 GET /api/dashboard/universite | ÉCHEC API |
| Aperçu | Calendrier | AUCUN EFFET VISIBLE | SANS EFFET |

## prof_agbodjan-fifame

### `/notes` — Notes

| Vue | Bouton | Effet observé | Verdict |
|---|---|---|---|
| vue initiale | (sans nom) | api 403 GET /api/notes/eleve | ÉCHEC API |
| vue initiale | Exporter | popup: http://localhost:3002/api/notes/export | réagit |
| vue initiale | Importer | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Nouvelle note | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Notes | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Classement | changement d’affichage | réagit |
| vue initiale | Bulletins | changement d’affichage | réagit |

### `/communications` — Communications

| Vue | Bouton | Effet observé | Verdict |
|---|---|---|---|
| vue initiale | Nouvelle publication | changement d’affichage | réagit |
| vue initiale | Publier | api 403 POST /api/communications | ÉCHEC API |
| vue initiale | Annuler | changement d’affichage | réagit |
| vue initiale | Informations | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Événements | AUCUN EFFET VISIBLE | SANS EFFET |

### `/parametres` — Paramètres

| Vue | Bouton | Effet observé | Verdict |
|---|---|---|---|
| vue initiale | Profil | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Notifications | changement d’affichage | réagit |
| vue initiale | Sécurité | changement d’affichage | réagit |
| vue initiale | Apparence | changement d’affichage | réagit |
| vue initiale | Préférences | changement d’affichage | réagit |

### `/messagerie` — 

| Vue | Bouton | Effet observé | Verdict |
|---|---|---|---|
| vue initiale | Boîte | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Favoris | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Archive | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Nouvelle conversation | api 200 GET /api/messages/contacts | réagit |

### `/universite/etudiants` — Étudiants

| Vue | Bouton | Effet observé | Verdict |
|---|---|---|---|
| vue initiale | Ajouter un étudiant | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Tous | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | — | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Voir | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Voir | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Voir | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Voir | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Voir | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Voir | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Voir | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Voir | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Voir | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Voir | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Voir | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Voir | AUCUN EFFET VISIBLE | SANS EFFET |

### `/universite/cours` — Erreur serveur

| Vue | Bouton | Effet observé | Verdict |
|---|---|---|---|
| vue initiale | Réessayer | AUCUN EFFET VISIBLE | SANS EFFET |

### `/universite/mes-cours` — Mes cours

| Vue | Bouton | Effet observé | Verdict |
|---|---|---|---|
| vue initiale | Détails | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Notes | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Détails | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Notes | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Détails | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Notes | AUCUN EFFET VISIBLE | SANS EFFET |

### `/universite/notes` — Notes

| Vue | Bouton | Effet observé | Verdict |
|---|---|---|---|
| vue initiale | Exporter | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Ajouter une note | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Voir | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Voir | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Voir | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Voir | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Voir | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Voir | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Voir | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Voir | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Voir | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Voir | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Voir | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Voir | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Voir | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Voir | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Voir | AUCUN EFFET VISIBLE | SANS EFFET |

### `/universite/dashboard` — Université

| Vue | Bouton | Effet observé | Verdict |
|---|---|---|---|
| Aperçu | Actualiser | désactivé | non exécuté (désactivé) |
| Aperçu | (sans nom) | AUCUN EFFET VISIBLE | SANS EFFET |
| Aperçu | (sans nom) | api 500 GET /api/dashboard/universite | ÉCHEC API |
| Aperçu | Calendrier | AUCUN EFFET VISIBLE | SANS EFFET |

## recteur_universite

### `/notes` — Notes

| Vue | Bouton | Effet observé | Verdict |
|---|---|---|---|
| vue initiale | (sans nom) | api 403 GET /api/notes/eleve | ÉCHEC API |
| vue initiale | Exporter | popup: http://localhost:3002/api/notes/export | réagit |
| vue initiale | Importer | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Nouvelle note | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Notes | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Classement | changement d’affichage | réagit |
| vue initiale | Bulletins | changement d’affichage | réagit |

### `/communications` — Communications

| Vue | Bouton | Effet observé | Verdict |
|---|---|---|---|
| vue initiale | Nouvelle publication | changement d’affichage | réagit |
| vue initiale | Publier | api 403 POST /api/communications | ÉCHEC API |
| vue initiale | Annuler | changement d’affichage | réagit |
| vue initiale | Informations | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Événements | AUCUN EFFET VISIBLE | SANS EFFET |

### `/parametres` — Paramètres

| Vue | Bouton | Effet observé | Verdict |
|---|---|---|---|
| vue initiale | Profil | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Notifications | changement d’affichage | réagit |
| vue initiale | Sécurité | changement d’affichage | réagit |
| vue initiale | Apparence | changement d’affichage | réagit |
| vue initiale | Préférences | changement d’affichage | réagit |

### `/universite/facultes` — Facultés

| Vue | Bouton | Effet observé | Verdict |
|---|---|---|---|
| vue initiale | Ajouter une faculté | AUCUN EFFET VISIBLE | SANS EFFET |

### `/universite/etudiants` — Étudiants

| Vue | Bouton | Effet observé | Verdict |
|---|---|---|---|
| vue initiale | Ajouter un étudiant | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Tous | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | — | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Voir | AUCUN EFFET VISIBLE (clic déclenché par script : bouton masqué par un autre élément) | SANS EFFET |
| vue initiale | Voir | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Voir | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Voir | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Voir | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Voir | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Voir | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Voir | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Voir | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Voir | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Voir | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Voir | AUCUN EFFET VISIBLE | SANS EFFET |

### `/universite/enseignants` — Enseignants

| Vue | Bouton | Effet observé | Verdict |
|---|---|---|---|
| vue initiale | Ajouter un enseignant | AUCUN EFFET VISIBLE | SANS EFFET |

### `/universite/cours` — Erreur serveur

| Vue | Bouton | Effet observé | Verdict |
|---|---|---|---|
| vue initiale | Réessayer | AUCUN EFFET VISIBLE | SANS EFFET |

### `/universite/dashboard` — Université

| Vue | Bouton | Effet observé | Verdict |
|---|---|---|---|
| Aperçu | Actualiser | désactivé | non exécuté (désactivé) |
| Aperçu | (sans nom) | AUCUN EFFET VISIBLE | SANS EFFET |
| Aperçu | (sans nom) | api 500 GET /api/dashboard/universite | ÉCHEC API |
| Aperçu | Calendrier | AUCUN EFFET VISIBLE | SANS EFFET |
| Facultés | Ajouter une faculté | navigation /universite/facultes | réagit |
|  | Ajouter une faculté | navigation /universite/facultes (clic déclenché par script : bouton masqué par un autre élément) | réagit |
|  | Ajouter un étudiant | navigation /universite/etudiants | réagit |
| Planning | Actualiser | désactivé | non exécuté (désactivé) |
| Planning | (sans nom) | api 500 GET /api/dashboard/universite (clic déclenché par script : bouton masqué par un autre élément) | ÉCHEC API |
| Planning | (sans nom) | AUCUN EFFET VISIBLE | SANS EFFET |
| Planning | Calendrier | api 500 GET /api/dashboard/universite (clic déclenché par script : bouton masqué par un autre élément) | ÉCHEC API |

## secretaire_ecole1

### `/secretaire/dashboard` — Secrétariat

| Vue | Bouton | Effet observé | Verdict |
|---|---|---|---|
| Aperçu | Actualiser | api 200 GET /api/dashboard/secretaire | réagit |
| Aperçu | Tableau de bord | changement d’affichage | réagit |
|  | Nouvelle inscription | navigation /secretaire/inscriptions (clic déclenché par script : bouton masqué par un autre élément) | réagit |

### `/eleves` — Élèves

| Vue | Bouton | Effet observé | Verdict |
|---|---|---|---|
| vue initiale | (sans nom) | api 403 GET /api/eleves | ÉCHEC API |
| vue initiale | Exporter | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Nouvel élève | AUCUN EFFET VISIBLE | SANS EFFET |

### `/notes` — Notes

| Vue | Bouton | Effet observé | Verdict |
|---|---|---|---|
| vue initiale | (sans nom) | api 403 GET /api/notes/eleve | ÉCHEC API |
| vue initiale | Exporter | popup: http://localhost:3002/api/notes/export | réagit |
| vue initiale | Importer | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Nouvelle note | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Notes | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Classement | changement d’affichage | réagit |
| vue initiale | Bulletins | changement d’affichage | réagit |

### `/paiements` — Paiements

| Vue | Bouton | Effet observé | Verdict |
|---|---|---|---|
| vue initiale | (sans nom) | api 403 GET /api/comptable/paiements | ÉCHEC API |
| vue initiale | Factures | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Exporter | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Nouveau paiement | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Paiements | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Échéancier | changement d’affichage | réagit |

### `/communications` — Communications

| Vue | Bouton | Effet observé | Verdict |
|---|---|---|---|
| vue initiale | Nouvelle publication | changement d’affichage | réagit |
| vue initiale | Publier | api 422 POST /api/communications | ÉCHEC API |
| vue initiale | Annuler | changement d’affichage | réagit |
| vue initiale | Informations | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Événements | AUCUN EFFET VISIBLE | SANS EFFET |

### `/emploi-du-temps` — Emploi du temps

| Vue | Bouton | Effet observé | Verdict |
|---|---|---|---|
| vue initiale | Exporter | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Ajouter un cours | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | (sans nom) | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | (sans nom) | AUCUN EFFET VISIBLE | SANS EFFET |

### `/parametres` — Paramètres

| Vue | Bouton | Effet observé | Verdict |
|---|---|---|---|
| vue initiale | Profil | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Notifications | changement d’affichage | réagit |
| vue initiale | Sécurité | changement d’affichage | réagit |
| vue initiale | Apparence | changement d’affichage | réagit |
| vue initiale | Préférences | changement d’affichage | réagit |

### `/messagerie` — 

| Vue | Bouton | Effet observé | Verdict |
|---|---|---|---|
| vue initiale | Boîte | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Favoris | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Archive | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Nouvelle conversation | api 200 GET /api/messages/contacts | réagit |

### `/secretaire/documents` — Courriers

| Vue | Bouton | Effet observé | Verdict |
|---|---|---|---|
| vue initiale | Dossiers | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Nouveau courrier | AUCUN EFFET VISIBLE | SANS EFFET |

### `/paiement/callback` — Confirmation indisponible

| Vue | Bouton | Effet observé | Verdict |
|---|---|---|---|
| vue initiale | Retour à l'échéancier | navigation /paiements + api 403 GET /api/comptable/paiements | ÉCHEC API |

## super-admin@ecole.bj

### `/admin/dashboard` — Administration système

| Vue | Bouton | Effet observé | Verdict |
|---|---|---|---|
| Aperçu | Actualiser | api 200 GET /api/dashboard/admin | réagit |
| Aperçu | Alertes | AUCUN EFFET VISIBLE | SANS EFFET |
| Aperçu | Paramètres | AUCUN EFFET VISIBLE | SANS EFFET |
| Aperçu | Actualiser | api 200 GET /api/dashboard/admin | réagit |
| Aperçu | Voir tous les logs | AUCUN EFFET VISIBLE | SANS EFFET |
| Utilisateurs | Désactiver | navigation /admin/utilisateurs | réagit |
| Utilisateurs | Ajouter | navigation /admin/utilisateurs | réagit |
|  | Désactiver | navigation /admin/utilisateurs | réagit |
|  | Général Paramètres généraux de l'application | navigation /admin/configuration | réagit |
|  | Enregistrer | navigation /admin/configuration | réagit |
|  | Alertes | AUCUN EFFET VISIBLE | SANS EFFET |
|  | Paramètres | AUCUN EFFET VISIBLE | SANS EFFET |
|  | Exporter | impression (window.print) | réagit |
|  | Tous | AUCUN EFFET VISIBLE | SANS EFFET |
|  | INFO | AUCUN EFFET VISIBLE | SANS EFFET |
| Sauvegardes | Actualiser | api 200 GET /api/dashboard/admin | réagit |
| Sauvegardes | Alertes | AUCUN EFFET VISIBLE | SANS EFFET |
| Sauvegardes | Paramètres | AUCUN EFFET VISIBLE | SANS EFFET |
| Sauvegardes | Sauvegarder | AUCUN EFFET VISIBLE | SANS EFFET |

### `/notes` — Notes

| Vue | Bouton | Effet observé | Verdict |
|---|---|---|---|
| vue initiale | (sans nom) | api 403 GET /api/notes/eleve | ÉCHEC API |
| vue initiale | Exporter | popup: http://localhost:3002/api/notes/export | réagit |
| vue initiale | Importer | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Nouvelle note | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Notes | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Classement | changement d’affichage | réagit |
| vue initiale | Bulletins | changement d’affichage | réagit |

### `/parametres` — Paramètres

| Vue | Bouton | Effet observé | Verdict |
|---|---|---|---|
| vue initiale | Profil | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Notifications | changement d’affichage | réagit |
| vue initiale | Sécurité | changement d’affichage | réagit |
| vue initiale | Apparence | changement d’affichage | réagit |
| vue initiale | Préférences | changement d’affichage | réagit |

### `/messagerie` — 

| Vue | Bouton | Effet observé | Verdict |
|---|---|---|---|
| vue initiale | Boîte | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Favoris | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Archive | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Nouvelle conversation | api 200 GET /api/messages/contacts | réagit |

### `/admin/ecoles` — Écoles

| Vue | Bouton | Effet observé | Verdict |
|---|---|---|---|
| vue initiale | Provisionner | dialogue — dialogue « Provisionner une école », 6 champ(s) | réagit |
| vue initiale | Ajouter une école | dialogue — dialogue « Ajouter une école », 5 champ(s) | réagit |
| vue initiale | Actualiser | api 200 GET /api/ecoles | réagit |
| vue initiale | Voir | AUCUN EFFET VISIBLE | SANS EFFET |

### `/admin/utilisateurs` — Utilisateurs

| Vue | Bouton | Effet observé | Verdict |
|---|---|---|---|
| vue initiale | Désactiver | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Ajouter | AUCUN EFFET VISIBLE | SANS EFFET |

### `/admin/configuration` — Configuration

| Vue | Bouton | Effet observé | Verdict |
|---|---|---|---|
| vue initiale | Enregistrer | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Général Paramètres généraux de l'application | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Scolarité Configuration des cycles et niveaux | changement d’affichage | réagit |
| vue initiale | Notifications Configuration des alertes et rappels | changement d’affichage | réagit |
| vue initiale | Sécurité Politiques de sécurité et d'accès | changement d’affichage | réagit |
| vue initiale | Paiements Configuration des moyens de paiement | changement d’affichage | réagit |
| vue initiale | Modifier | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | (sans nom) | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Modifier | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Modifier | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Réinitialiser | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Enregistrer | AUCUN EFFET VISIBLE | SANS EFFET |

### `/admin/journal-audit` — Journal d'audit

| Vue | Bouton | Effet observé | Verdict |
|---|---|---|---|
| vue initiale | Réinitialiser les filtres | AUCUN EFFET VISIBLE | SANS EFFET |

### `/admin/plans` — Plans d'abonnement

| Vue | Bouton | Effet observé | Verdict |
|---|---|---|---|
| vue initiale | Nouveau plan | AUCUN EFFET VISIBLE | SANS EFFET |

### `/admin/billing` — Facturation

| Vue | Bouton | Effet observé | Verdict |
|---|---|---|---|
| vue initiale | Exporter | AUCUN EFFET VISIBLE | SANS EFFET |

### `/admin/modules` — Modules

| Vue | Bouton | Effet observé | Verdict |
|---|---|---|---|
| vue initiale | Nouveau module | AUCUN EFFET VISIBLE | SANS EFFET |

### `/admin/white-label` — White-Label

| Vue | Bouton | Effet observé | Verdict |
|---|---|---|---|
| vue initiale | Enregistrer | désactivé | non exécuté (désactivé) |
| vue initiale | Indigo | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Emerald | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Rose | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Amber | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Sky | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Violet | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Choisir un fichier | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Choisir un fichier | AUCUN EFFET VISIBLE | SANS EFFET |

## surveillant_ecole1

### `/surveillant/dashboard` — Surveillance

| Vue | Bouton | Effet observé | Verdict |
|---|---|---|---|
| Aperçu | Actualiser | api 200 GET /api/dashboard/surveillant | réagit |
| Aperçu | Mon service | AUCUN EFFET VISIBLE | SANS EFFET |
| Présences | Exporter | navigation /surveillant/presences | réagit |
| Présences | Modifier | navigation /surveillant/presences | réagit |
| Présences | Modifier | navigation /surveillant/presences | réagit |
| Présences | Modifier | navigation /surveillant/presences | réagit |
| Présences | Modifier | navigation /surveillant/presences | réagit |
| Présences | Modifier | navigation /surveillant/presences | réagit |
| Présences | Modifier | navigation /surveillant/presences | réagit |
| Présences | Modifier | navigation /surveillant/presences | réagit |
| Présences | Modifier | navigation /surveillant/presences | réagit |
| Présences | Modifier | navigation /surveillant/presences | réagit |
| Présences | Modifier | navigation /surveillant/presences | réagit |
| Présences | Modifier | navigation /surveillant/presences | réagit |
| Présences | Modifier | navigation /surveillant/presences | réagit |
| Présences | Modifier | navigation /surveillant/presences | réagit |
| Présences | Modifier | navigation /surveillant/presences | réagit |
| Présences | Modifier | navigation /surveillant/presences | réagit |
|  | Exporter | navigation /surveillant/presences | réagit |
|  | Détails | navigation /surveillant/surveillance | réagit |
|  | Détails | navigation /surveillant/surveillance | réagit |
|  | Détails | navigation /surveillant/surveillance | réagit |

### `/eleves` — Élèves

| Vue | Bouton | Effet observé | Verdict |
|---|---|---|---|
| vue initiale | (sans nom) | api 403 GET /api/eleves | ÉCHEC API |
| vue initiale | Exporter | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Nouvel élève | AUCUN EFFET VISIBLE | SANS EFFET |

### `/communications` — Communications

| Vue | Bouton | Effet observé | Verdict |
|---|---|---|---|
| vue initiale | Nouvelle publication | changement d’affichage | réagit |
| vue initiale | Publier | api 403 POST /api/communications | ÉCHEC API |
| vue initiale | Annuler | changement d’affichage | réagit |
| vue initiale | Informations | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Événements | AUCUN EFFET VISIBLE | SANS EFFET |

### `/emploi-du-temps` — Emploi du temps

| Vue | Bouton | Effet observé | Verdict |
|---|---|---|---|
| vue initiale | Exporter | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Ajouter un cours | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | (sans nom) | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | (sans nom) | AUCUN EFFET VISIBLE | SANS EFFET |

### `/parametres` — Paramètres

| Vue | Bouton | Effet observé | Verdict |
|---|---|---|---|
| vue initiale | Profil | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Notifications | changement d’affichage | réagit |
| vue initiale | Sécurité | changement d’affichage | réagit |
| vue initiale | Apparence | changement d’affichage | réagit |
| vue initiale | Préférences | changement d’affichage | réagit |

### `/messagerie` — 

| Vue | Bouton | Effet observé | Verdict |
|---|---|---|---|
| vue initiale | Boîte | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Favoris | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Archive | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Nouvelle conversation | api 200 GET /api/messages/contacts | réagit |

### `/surveillant/surveillance` — Surveillance

| Vue | Bouton | Effet observé | Verdict |
|---|---|---|---|
| vue initiale | Nouvel incident | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Détails | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Détails | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Détails | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Détails | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Détails | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Détails | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Détails | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Détails | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Détails | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Détails | AUCUN EFFET VISIBLE | SANS EFFET |

### `/surveillant/presences` — Présences

| Vue | Bouton | Effet observé | Verdict |
|---|---|---|---|
| vue initiale | Exporter | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Modifier | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Modifier | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Modifier | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Modifier | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Modifier | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Modifier | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Modifier | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Modifier | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Modifier | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Modifier | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Modifier | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Modifier | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Modifier | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Modifier | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Modifier | AUCUN EFFET VISIBLE | SANS EFFET |

## uac2024001

### `/notes` — Notes

| Vue | Bouton | Effet observé | Verdict |
|---|---|---|---|
| vue initiale | (sans nom) | api 403 GET /api/notes/eleve | ÉCHEC API |
| vue initiale | Exporter | popup: http://localhost:3002/api/notes/export | réagit |
| vue initiale | Importer | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Nouvelle note | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Notes | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Classement | changement d’affichage | réagit |
| vue initiale | Bulletins | changement d’affichage | réagit |

### `/communications` — Communications

| Vue | Bouton | Effet observé | Verdict |
|---|---|---|---|
| vue initiale | Nouvelle publication | changement d’affichage | réagit |
| vue initiale | Publier | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Annuler | changement d’affichage | réagit |
| vue initiale | Informations | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Événements | AUCUN EFFET VISIBLE | SANS EFFET |

### `/parametres` — Paramètres

| Vue | Bouton | Effet observé | Verdict |
|---|---|---|---|
| vue initiale | Profil | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Notifications | changement d’affichage | réagit |
| vue initiale | Sécurité | changement d’affichage | réagit |
| vue initiale | Apparence | changement d’affichage | réagit |
| vue initiale | Préférences | changement d’affichage | réagit |

### `/messagerie` — 

| Vue | Bouton | Effet observé | Verdict |
|---|---|---|---|
| vue initiale | Boîte | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Favoris | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Archive | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Nouvelle conversation | api 200 GET /api/messages/contacts | réagit |

### `/universite/mes-cours` — Mes cours

| Vue | Bouton | Effet observé | Verdict |
|---|---|---|---|
| vue initiale | Détails | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Notes | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Détails | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Notes | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Détails | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Notes | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Détails | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Notes | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Détails | AUCUN EFFET VISIBLE | SANS EFFET |
| vue initiale | Notes | AUCUN EFFET VISIBLE | SANS EFFET |


# Parcours métier de bout en bout

> Scénarios joués à la main dans Google Chrome visible (scripts `wf-a` à `wf-e`). Un cas en « ERREUR » est un cas que le script de test n'a pas su mener à bien : il compte comme **non exécuté**, pas comme un défaut du produit.

| ID | Parcours | Verdict | Constat |
|---|---|---|---|
| A1 | Formulaire de connexion vide | **VALIDÉ** | messages: Veuillez entrer votre identifiant ou email / Veuillez entrer votre mot de passe ; appels API: 0 |
| A2 | Mauvais mot de passe | **VALIDÉ** | reste sur /connexion ; message: « Identifiants incorrects » |
| A3 | Identifiant inconnu : le message ne révèle pas si le compte existe | **VALIDÉ** | compte existant: « Identifiants incorrects » ; compte inconnu: « Identifiants incorrects » |
| A4 | Route protégée sans session | **VALIDÉ** | arrivée /connexion |
| A5 | Mot de passe oublié | **VALIDÉ** | API: 200 POST /api/auth/forgot-password ; écran: Français English العربية Email envoyé Si un compte existe avec l'adresse enseignantecole1@gmail.cj, vous recevrez un email contenant un lien pour réinitialiser votre mot de passe. Vérifiez votre boîte de réception et vos |
| A6 | Déconnexion puis bouton « Précédent » | **VALIDÉ** | après déconnexion: /connexion ; après « Précédent »: /connexion |
| A7 | Expiration de session en cours d’utilisation | **VALIDÉ** | arrivée /connexion ; écran: École UNE ÉCOLE, UN LIEN COMMUN La vie de l’école, au même endroit. Notes, bulletins, paiements et messages : un espace clair pour les familles et les équipes é |
| B1 | Publication vide refusée | **VALIDÉ** | API: 422 /api/communications ; message affiché: « The titre field is required. / The contenu field is required. / The titre field is required. (and 1 more error) » ; BOUTONS: Nouvelle publication \| Publier \| Annuler \| Tout \| Important \| Informations \| Événements \|\| CHAMPS: input#:r3:[Titre de la publication] \| textarea#communication-contenu[Que souhaitez-vous \| select#communication-categorie[categ |
| B2 | Publier une annonce (accents, apostrophe) | **VALIDÉ** | POST: 201 (double-clic → 1 envoi(s)) ; occurrences à l'écran: 1 ; message:  |
| B3 | L’annonce persiste après rechargement | **VALIDÉ** | occurrences après rechargement: 1 |
| B4 | L’annonce est visible par PAR001 | **VALIDÉ** | occurrences: 1 ; bouton « Nouvelle publication » proposé à ce rôle: OUI |
| B5 | L’annonce est visible par EL001 | **VALIDÉ** | occurrences: 1 ; bouton « Nouvelle publication » proposé à ce rôle: OUI |
| C1 | Modifier son téléphone (numéro béninois à 10 chiffres) | **VALIDÉ** | API: 200 PUT /api/auth/profile ; message: « Profil mis à jour » ; valeur après rechargement: « 0197123456 » |
| C2 | Changer de langue : anglais puis arabe | **PARTIEL** | langues: fr,en,ar ; menu en anglais: Dashboard \| Classes \| Students \| Grades \| Schedule \| Announcements \| \| \| ; h1: Settings ; arabe: dir=rtl, lang=ar, débordement -4px, conservé après rechargement: ar ; textes latins restants: Paramètres, Profil, Notifications, Sécurité, Apparence, Préférences, Mathématiques, Français |
| C3 | Thème sombre conservé après rechargement | **VALIDÉ** | sombre après clic: true ; après rechargement: true |
| C4 | Recherche globale (Ctrl+K) | **ÉCHEC** | La palette s'ouvre (Ctrl+K ou bouton « Rechercher »), mais disparaît dès la première lettre saisie quand un élève correspond. Console : « Objects are not valid as a React child (found: object with keys {id, nom_classe}) ». Cause : CommandPalette.jsx:218 et :459 affichent `el.classe`, qui est un objet. Capture : captures/parcours/C4-apres-frappe.jpg |
| C5 | Notifications et menu du compte | **ERREUR** | locator.click: Timeout 4000ms exceeded. |
| D1 | Coupure réseau : bandeau et page déjà ouverte | **VALIDÉ** | bandeau: « Hors connexion. Les informations affichées peuvent ne plus être à jour. Vérifiez le statut d’enregistrement avant de quitter une saisie. » |
| D2 | Publier pendant la coupure, puis retour du réseau | **VALIDÉ** | pendant la coupure: « AUCUN MESSAGE » ; saisie conservée à l’écran: oui ; annonce présente après retour du réseau: oui |
| D3 | Naviguer vers une autre page pendant la coupure | **OBSERVÉ** | page /eleves ; contenu:  |
| F1 | Messagerie : un parent écrit à un enseignant | **VALIDÉ** | contacts proposés au parent: 87 dont 0 élèves et 0 autres parents ; API: 201 POST /api/messages, 200 PUT /api/messages/conversation/26/read ; message affiché: oui ; visible après rechargement (liste des conversations): oui |
| G1 | Écoles : envoi du formulaire vide | **VALIDÉ** | API: 422 POST /api/ecoles ; messages: « * / The nom field is required. / * / The email field is required. » ; BOUTONS: Fermer \| Annuler \| Créer l'école \|\| CHAMPS: input#:rf:[Ex: Complexe scolaire Lumière] \| input#:rh:[contact@ecole.bj] \| input#:rj:[+229 01 02 03 04] \| input#:rl:[Cotonou, Bénin] \| input#:rn:[Cotonou] |
| G2 | Écoles : créer une école (nom accentué, téléphone à 10 chiffres) | **VALIDÉ** | API: 201 POST /api/ecoles ; message: « » ; comptes créés affichés: non ; visible après rechargement: oui |
| H1 | Élèves : recherche par nom | **VALIDÉ** | 32 lignes → 1 pour « AGBODJAN » (AY AGBODJAN Yèhossou 3ème BEN2024001 actif ) ; recherche sans résultat: « Aucun élève trouvé » |
| H2 | Élèves : état affiché de l’élève retiré (DJOKO Yvette) | **ÉCHEC** | en base: statut = inactive ; ligne affichée: « DY DJOKO Yvette 4ème SCO2025030 actif » ; actions proposées: \|  |
| H3 | Élèves : créer un élève | **ÉCHEC** | clic sur « Nouvel élève » : rien ne se passe ; aucun appel d’écriture ; le bouton n’a aucune action dans le code (ElevesPage.jsx:97) |
| I1 | Notes : filtres, classement, bulletins, export | **OBSERVÉ** | 1 lignes ; filtre « — » → 1 ; CLASSEMENT: BOUTONS: ∅ \| Exporter \| Importer \| Nouvelle note \| Notes \| Classement \| Bulletins \| ∅ \|\| CHAMPS: select#[Sélectionner une classe] \| select#[Filtrer par période] ; BULLETINS: BOUTONS: ∅ \| Exporter \| Importer \| Nouvelle note \| Notes \| Classement \| Bulletins \| Recalculer l'instantané \| Verrouiller le bulletin \|\| CHAMPS: select#[Sélectionner une classe] \| sele |
| I2 | Enseignant : onglet « Notes » et saisie | **OBSERVÉ** | élément: BUTTON ; après clic → /enseignant/dashboard ; dialogue: 0 ; aucun appel d’écriture ; BOUTONS: Actualiser \| Aperçu \| Ma classe \| Notes \| Cahier de textes \| Emploi du temps \| Messages \| Saisir des notes \|\| CHAMPS: input#:rd:[Rechercher...] ; APRÈS: BOUTONS: Actualiser \| Aperçu \| Ma classe \| Notes \| Cahier de textes \| Emploi du temps \| Messages \| Saisir des notes \|\| CHAMPS: input#:rd:[Recher |
| I3 | Enseignant : page « Mes classes » | **OBSERVÉ** | Accueil Enseignant Mes Classes Mes classes Gérez vos classes et suivez vos élèves Aucune classe assignée ; BOUTONS: \|\| CHAMPS:  |
| J1 | Paiements (parent) : échéancier et paiement en ligne | **OBSERVÉ** | LISTE: Accueil Paiements Paiements Gestion des transactions financières Factures Exporter Nouveau paiement Revenus encaissés 0 F CFA Transactions 0 Taux d'Encaisse 0% Impayés 100% Paiements Échéancier Tous les statuts Payé Partiel En attente Erreur : Unauthorized - R ; ÉCHÉANCIER: BOUTONS: ∅ \| Factures \| Exporter \| Nouveau paiement \| Paiements \| Échéancier \|\| CHAMPS: input#:r5:[Rechercher un élève |
| J2 | Parent : page « Mes enfants » | **ÉCHEC** | contenu: « Accueil Parent Mes Enfants Mes enfants Suivez la scolarité de vos enfants Aucun enfant lié à votre compte » ; API en erreur: 401 /api/auth/me, 401 /api/auth/me, 403 /api/comptable/paiements |
| J3 | Comptable : liste des paiements, filtres et reçu | **OBSERVÉ** | 42 lignes ; filtre statut → 6 ; Accueil Paiements Paiements Gestion des transactions financières Factures Exporter Nouveau paiement Revenus encaissés 602 076 F CFA Transactions 42 Taux d'Encaisse 14% Impayés 86% Paiements Échéancier Tous les statuts Payé Partiel En attente RÉFÉRENCE ÉLÈVE TY ; bouton « » → http://localhost:3002/api/comptable/paiements/24/recu :: Complexe Scolaire Excellence Cotono |
| J4 | Comptable : échéancier et paiement en ligne (sans déclencher FedaPay) | **BLOQUÉ** | BOUTONS: ∅ \| Factures \| Exporter \| Nouveau paiement \| Paiements \| Échéancier \|\| CHAMPS: input#:r2:[Rechercher un élève...] ; après sélection d’un élève: Accueil Paiements Paiements Gestion des transactions financières Factures Exporter Nouveau paiement Revenus encaissés 602 076 F CFA Transactions 42 Taux d'Encaisse 14% Impayés 86% Paiements Échéancier Aucun élève trouvé Sélectionnez un élève pour  |
| K1 | Affectations : affecter un enseignant à une classe de lycée | **BLOQUÉ** | séries: 0 ; matières: 0 ; bouton désactivé ; API: aucun appel d’écriture ; message: « » ; après rechargement: 1ère D Tle A Tle C Tle D Série Choisissez d’abord une classe Matière Choisissez d’abord une série Affecter Cours de l’enseignant 0 affectation Sélectionnez un enseignant pour afficher ses affectations |
| L1 | Mobile 360 px : menu, navigation, zones tactiles (parent) | **PARTIEL** | menu: 8 liens ; arrivée /notes ; débordement horizontal 53px ; zones tactiles < 44 px: 7/18 ; plus petite police: 12px |
| N1 | Directeur : page « Notes » (volume de données) | **OBSERVÉ** | Accueil Notes Notes Consultez et gérez les notes des élèves Exporter Importer Nouvelle note Moyenne générale —/20 Total évaluations 0 Taux de réussite 0% Échecs 100% Notes Classement Bulletins Toutes les classes Toutes les matières ÉLÈVE CLASSE MATIÈRE NOTE TYPE PÉRIODE DATE STATUT ACTION Aucune note trouvée ; lignes: 1 (641 notes en base) |
| N2 | Page « Notes » : cause de l'affichage vide | **ÉCHEC** | GET /api/notes/eleve répond 200 avec les notes dans `data.data` (réponse paginée, 641 notes en base), mais la page affiche « Total évaluations 0 » et « Aucune note trouvée ». Cause : NotesPage.jsx:38 n'accepte qu'un tableau dans `notesData.data`. |
| P1 | Parent (avec enfant) : tableau de bord | **OBSERVÉ** | arrivée /parent/dashboard ; Accueil Parent Espace parent Suivi de vos enfants — mercredi 11 novembre 2026 Actualiser Aperçu Notes Emploi du temps Paiements Échanges Enfants scolarisés 1 Moyenne générale 11.39 Assiduité 100% Solde 171 934 FCFA Évolution des notes Suivi trimestriel Koffi Juin Juil Août Sep Oct Nov 9 10 11 12 13 Mes enfants Vue rapide A ADJOVI Koffi Petite Section père Contact princi |
| P2-Échanges | Parent : onglet « Échanges » du tableau de bord | **ERREUR** | locator.click: Timeout 30000ms exceeded. |
| P2-Emploi du temps | Parent : onglet « Emploi du temps » du tableau de bord | **ERREUR** | locator.click: Timeout 30000ms exceeded. |
| P2-Notes | Parent : onglet « Notes » du tableau de bord | **OBSERVÉ** | nt Bulletins Toutes les classes Toutes les matières ÉLÈVE CLASSE MATIÈRE NOTE TYPE PÉRIODE DATE STATUT ACTION Aucune note trouvée ; erreurs API: aucune ; BOUTONS: ∅ \| Exporter \| Importer \| Nouvelle note \| Notes \| Classement \| Bulletins \|\| CHAMPS: input#:rb:[Rechercher un élève...] \| select#[Filtrer par classe] \| select#[Filtrer par matière] |
| P2-Paiements | Parent : onglet « Paiements » du tableau de bord | **ERREUR** | locator.click: Timeout 30000ms exceeded. |
| P3 | Parent : « Mes enfants » | **VALIDÉ** | Accueil Parent Mes Enfants Mes enfants Suivez la scolarité de vos enfants A ADJOVI Petite Section 0.0 Rang: 1e Moyenne générale 0.0 Rang 1e Absences 0 Frais scolarité — Notes Emploi du temps Absences Paiements Mathématiques 1ère evaluation 8/20 Moy. classe: — Mathématiques 2ème evaluation 11.2/20 Moy. classe: — Mathématiques 2ème evaluation 7.2/20 Moy. classe: — Français Devoir ; erreurs API: aucu |
| P4 | Parent : page « Paiements » et échéancier | **ÉCHEC** | LISTE: Accueil Paiements Paiements Gestion des transactions financières Factures Exporter Nouveau paiement Revenus encaissés 0 F CFA Transactions 0 Taux d'Encaisse 0% Impayés 100% Paiements Échéancier Tous les statuts Payé Partiel En attente Erreur : Unauthorized - Role required: directeur, comptable RÉFÉRENCE ÉLÈVE TYPE MONTANT DATE STATUT REÇU Aucun paiement trouvé ; ÉCHÉANCIER: Accueil Paiement |
| P5 | Parent : page « Notes » | **OBSERVÉ** | Accueil Notes Notes Consultez et gérez les notes des élèves Exporter Importer Nouvelle note Moyenne générale —/20 Total évaluations 0 Taux de réussite 0% Échecs 100% Notes Classement Bulletins Toutes les classes Toutes les matières ÉLÈVE CLASSE MATIÈRE NOTE TYPE PÉRIODE DATE STATUT ACTION Aucune note trouvée ; lignes: 1 ; erreurs API: aucune |
| P6 | Parent : assistant IA | **OBSERVÉ** | Accueil Parent Ai report Assistant parental Suivi intelligent de la scolarité Chat IA Analyses EduPilot IA Posez une question ou choisissez une suggestion ci-dessous Rapport de mon enfant Progrès récents Conseil éducatif Objectifs trimestre ; erreurs API: aucune ; BOUTONS: Chat IA \| Analyses \| Rapport de mon enfant \| Progrès récents \| Conseil éducatif \| Objectifs trimestre \| ∅ \|\| CHAMPS: input#[Po |
| X1 | Accessibilité (axe-core) : page de connexion | **VALIDÉ** | aucune violation détectée |
| X2 | Clavier : parcourir la connexion sans souris | **PARTIEL** | ordre: select[Français English ا] !SANS-FOCUS-VISIBLE → input#login-email[] → input#login-password[] → button[Afficher le mot de] → a[Mot de passe oubli] → button[Se connecter] !SANS-FOCUS-VISIBLE → body[École UNE ÉCOLE, ] !SANS-FOCUS-VISIBLE → select[Français English ا] !SANS-FOCUS-VISIBLE ; Entrée dans le mot de passe → /enseignant/dashboard |
| X3 | Clavier : lien d’évitement et menu | **PARTIEL** | premier élément au Tab: « Aller au contenu principal École Espace » ; après Entrée, focus sur # |
| X4/messagerie | Accessibilité (axe-core) : /messagerie | **VALIDÉ** | aucune violation détectée |
| X4/parent/dashboard | Accessibilité (axe-core) : /parent/dashboard | **ÉCHEC** | button-name (critical, 1) |
| X4/parent/enfants | Accessibilité (axe-core) : /parent/enfants | **ÉCHEC** | color-contrast (serious, 14) |
| X5/directeur/dashboard | Accessibilité (axe-core) : /directeur/dashboard | **ÉCHEC** | svg-img-alt (serious, 4) |
| X5/eleves | Accessibilité (axe-core) : /eleves | **ÉCHEC** | button-name (critical, 1) ; color-contrast (serious, 32) |
| X5/emploi-du-temps | Accessibilité (axe-core) : /emploi-du-temps | **ÉCHEC** | button-name (critical, 2) ; color-contrast (serious, 8) |
| X5/notes | Accessibilité (axe-core) : /notes | **ÉCHEC** | button-name (critical, 1) |
| X5/parametres | Accessibilité (axe-core) : /parametres | **ÉCHEC** | color-contrast (serious, 1) ; label (critical, 4) |
| X6/comptable/dashboard | Accessibilité (axe-core) : /comptable/dashboard | **ÉCHEC** | svg-img-alt (serious, 1) |
| X6/comptable/transactions | Accessibilité (axe-core) : /comptable/transactions | **ÉCHEC** | button-name (critical, 42) ; color-contrast (serious, 42) |
| X6/paiements | Accessibilité (axe-core) : /paiements | **ÉCHEC** | button-name (critical, 1) |
| X7 | Accessibilité (axe-core) en thème sombre : /directeur/dashboard | **ÉCHEC** | svg-img-alt (serious, 4) |
