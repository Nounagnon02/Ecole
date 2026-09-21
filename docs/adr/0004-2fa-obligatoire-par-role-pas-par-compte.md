# ADR-0004 : 2FA obligatoire par rôle, pas par compte individuel

**Statut** : Acceptée
**Date** : 2026-09-20

## Contexte

L'authentification à deux facteurs (TOTP) fonctionnait déjà, mais restait
entièrement facultative : un compte pouvait manipuler paiements et
dossiers médicaux sans jamais l'activer. Deux façons de rendre la 2FA
obligatoire étaient possibles : un indicateur par compte (« ce compte
précis doit activer la 2FA », décidé au cas par cas par un administrateur)
ou une règle par rôle (« tout compte comptable/directeur/admin/super-admin
doit l'activer »).

## Décision

L'obligation est portée par le rôle (`Roles::requiresTwoFactor()`), pas
par un indicateur individuel. Quatre rôles la déclenchent : comptable,
directeur, admin, super-admin — ceux qui manipulent des paiements ou des
dossiers médicaux. Un compte qui ne l'a pas encore activée est bloqué sur
toute route sauf celles nécessaires pour l'activer (`VerifyTwoFactor`,
liste explicite de chemins autorisés).

Une règle par compte aurait permis plus de finesse (exempter un compte
précis), mais aurait aussi permis d'oublier de l'activer sur un nouveau
compte comptable créé après coup — exactement le trou que ce chantier
voulait fermer. La règle par rôle est automatiquement à jour pour tout
nouveau compte du rôle concerné, sans action humaine supplémentaire.

## Conséquences

Ce choix s'est révélé bien plus gros que prévu à l'estimation initiale
(1-2 jours visés) : aucun écran de challenge ni d'enrôlement n'existait
côté frontend, la session n'était jamais établie après vérification côté
backend (`Auth::login()` nu échouait sur un garde Sanctum déjà résolu), et
196 tests existants se sont cassés d'un coup en supposant implicitement
des comptes des quatre rôles sans 2FA activée — corrigé au niveau de la
fabrique de test (`UserFactory`) plutôt qu'en éditant 196 fichiers.

Toute évolution de la liste des rôles obligatoires (`Roles::MANDATORY_2FA`)
s'applique immédiatement à tous les comptes existants du rôle ajouté, sans
migration de données — c'est le principe même du mécanisme, mais cela veut
dire qu'ajouter un rôle à la liste bloque potentiellement des comptes
existants dès le déploiement suivant, pas seulement les nouveaux.

À revoir si : un besoin réel d'exemption individuelle apparaît (un compte
comptable qui ne doit temporairement pas être bloqué) — la règle par rôle
ne le permet pas nativement aujourd'hui.
