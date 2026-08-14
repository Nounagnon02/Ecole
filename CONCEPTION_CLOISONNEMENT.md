# Cloisonnement par cycle — conception

**Statut** — implémenté, 26 tests. `App\Support\CycleAccess`,
`App\Traits\ScopedToCycle`, `App\Exceptions\OutsideCycleException`.

---

## Le problème

Un établissement fait tourner trois cycles — Maternelle, Primaire, Secondaire —
et chacun a son chef. `SchoolProvision` crée un compte `directeurM`,
`directeurP` et `directeurS` pour chaque école, `AdminUsersSeeder` leur attribue
un mot de passe.

Cette autorité n'existait que comme étiquette. Deux constats, mesurés :

1. **Aucune des 87 routes gardées ne nommait ces rôles.** Toutes lisent
   `role:directeur`. Les trois comptes étaient provisionnés puis refusés par
   chaque endpoint et chaque policy.
2. **Aucune route nommée par cycle n'existe**, et le front n'en appelle aucune.
   Les méthodes `getClassesPrimaire`, `getClassesSecondaire` etc. existent sans
   route. Le cloisonnement ne reposait donc pas sur le choix des endpoints — il
   ne reposait sur rien.

Le front, lui, avait déjà le bon modèle : `ROLE_NORMALIZATION` mappe les trois
sous-rôles vers `directeur`, avec le commentaire « les sous-rôles n'ont pas de
dashboard distinct ». L'intention était donc : **même interface, données
cloisonnées par le serveur**. C'est la moitié serveur qui manquait.

---

## Le principe

> Le cycle est une propriété de la **classe**.

Ce n'est pas un choix, c'est ce que dit le schéma. Sur les 107 tables :

| | |
|---|---|
| **16** portent une clé de classe (`class_id`/`classe_id`), ou le cycle lui-même (`classes.categorie_classe`) | atteignent le cycle en **un saut** |
| **14** portent `eleve_id` sans clé de classe | l'atteignent **via l'élève** |
| **54** n'ont aucun chemin vers un cycle | personnel, bibliothèque, périodes, méthodes de paiement, module universitaire |

Les 54 dernières sont des **ressources d'établissement**. Un chef de cycle doit
les voir : une période scolaire, un livre, un mode de règlement n'appartiennent à
aucun cycle. Les cloisonner serait une régression déguisée en sécurité.

La frontière se ramène donc à un seul ensemble — **les classes de mon cycle** —
résolu une fois par requête et réutilisé par chaque requête SQL.

---

## Ce qui est cloisonné, et pourquoi

Onze modèles : *les classes de mon cycle, leurs élèves, et ce qui est consigné
sur leur scolarité.*

| Modèle | Chemin déclaré | Raison |
|---|---|---|
| `Classes` | `['self' => 'categorie_classe']` | La classe **est** le porteur du cycle : l'ancre. |
| `Eleve` | `['class' => 'class_id']` | Un élève appartient au cycle de sa classe. |
| `Notes` | `['class' => 'classe_id']` | La note porte la classe où l'évaluation a eu lieu. |
| `EmploiDuTemps` | `['class' => 'classe_id']` | Un créneau appartient à une classe. |
| `Devoir` | `['class' => 'classe_id']` | Un devoir est donné à une classe. |
| `CahierDeTexte` | `['class' => 'classe_id']` | Suit la progression d'une classe. |
| `ConseilClasse` | `['class' => 'classe_id']` | Porte sur une classe précise. |
| `Absence` | `['pupil' => 'eleve_id']` | Ne connaît que l'élève ; la classe vient de lui. |
| `Sanction` | `['pupil' => 'eleve_id']` | Vise un élève. |
| `Certificat` | `['pupil' => 'eleve_id']` | Délivré à un élève. |
| `PaiementEleve` | `['pupil' => 'eleve_id']` | La scolarité relève du cycle d'inscription. Le comptable, sans cycle, voit tout. |

**Volontairement non cloisonnés** — `Enseignant` (un enseignant peut tenir des
classes dans plusieurs cycles ; sa portée est déjà bornée par
`enseignant_matiere`), `UserParent` (un parent peut avoir des enfants dans
plusieurs cycles), `Matieres`, `periodes`, `Series`, `TypeEvaluation`
(configuration d'établissement), et les dossiers médicaux (déjà réservés à
l'infirmier par la garde de rôle).

---

## Décisions de conception

### 1. La restriction est l'exception, pas la règle

`CycleAccess::cycle()` renvoie `null` pour presque tout le monde : directeur
général, enseignants, élèves, parents, comptable, super-admin. `null` signifie
**aucun filtre**.

C'est la convention **inverse** de `BelongsToEcole`, qui échoue en fermé quand il
ne peut pas déterminer d'école. Cette asymétrie est délibérée :

- une école est toujours connaissable pour un utilisateur connecté, donc son
  absence signale un problème et refuser est juste ;
- un cycle n'est connaissable que pour trois rôles, donc refuser par défaut
  verrouillerait tous les autres.

### 2. `cyclePath()` est abstraite

Un modèle qui adopte le trait **doit** déclarer son chemin, sinon PHP échoue au
chargement de la classe. Pour une frontière d'accès, une erreur fatale en
développement vaut mieux qu'une porte ouverte en production. Un scope qui ne
s'applique pas silencieusement est le pire des deux mondes.

Un test vérifie en outre que chaque colonne déclarée **existe** dans le schéma —
et il a immédiatement trouvé que `EmploiDuTemps` déclarait `class_id` quand la
table porte `classe_id`, mon erreur, plus la même faute préexistante dans son
`$fillable`.

### 3. Les écritures ont leur propre garde

Un global scope filtre ce que renvoie un `select` et ne fait **rien** sur un
`insert`. Sans le hook `saving`, un chef du primaire ne pourrait pas *voir* une
classe du secondaire mais pourrait y inscrire un élève.

Seules les clés **modifiées** sont contrôlées : corriger une faute de frappe sur
un enregistrement antérieur à la frontière doit rester possible.

### 4. Le cache vit dans le conteneur, pas dans une statique

Première version : propriétés statiques. Elles ont fuité entre tests — un test
échouait dans la suite et passait en isolation. Le conteneur est reconstruit à
chaque requête HTTP et à chaque test, donc rien ne survit à l'appelant suivant.

Un objet enveloppe plutôt que deux entrées brutes : `null` est une réponse
signifiante ici, et `Container::bound()` ne peut pas la représenter —
`instance($clé, null)` laisse `bound()` à `false`, si bien que « résolu à
non-restreint » serait indistinguable de « pas encore résolu ».

Un écouteur sur `Authenticated` invalide en plus le cache quand l'identité change
*à l'intérieur* d'une requête ou d'un test.

### 5. 403, pas 404

Pour une lecture inter-**écoles**, on répond 404 : un 403 confirmerait
l'existence de l'enregistrement. Un chef de cycle, lui, est un collègue du même
établissement. Les classes du secondaire ne sont pas un secret pour le chef du
primaire ; elles ne sont simplement pas les siennes à modifier. Le dire
franchement est plus utile que de feindre l'inexistence.

---

## Ajouter un modèle cloisonné

```php
use App\Traits\ScopedToCycle;

class ConseilDiscipline extends Model
{
    use HasFactory, BelongsToEcole, ScopedToCycle;

    protected static function cyclePath(): array
    {
        return ['class' => 'classe_id'];   // ou ['pupil' => 'eleve_id']
    }
}
```

Puis ajouter la classe à `every_scoped_model_declares_a_column_that_exists`
(`tests/Feature/Api/CycleBoundaryTest.php`), qui vérifie la déclaration contre le
schéma réel.

---

## Ce qui reste ouvert

**Les sous-rôles enseignants** — `enseignement`, `enseignementM`,
`enseignementP` sont déclarés par le front et nommés dans le brief projet, mais
**aucun code backend ne les attribue**. Ils sont déclarés dans `Roles` avec leur
cycle, pour que le jour où l'un est attribué il hérite de la famille et de son
cycle au lieu de reproduire le verrouillage de `directeurP`. Tant qu'aucun
formulaire ne les propose, ils restent inertes.

**Les 54 tables sans cycle** — si l'une doit un jour être cloisonnée (un examen
propre à un cycle, par exemple), il lui faut d'abord un chemin vers une classe.
Ajouter le trait sans chemin échoue au chargement, ce qui est l'intention.
