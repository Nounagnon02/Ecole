# Contribuer

Pour l'installation, les quatre surfaces et les pièges connus du
cloisonnement multi-écoles, voir le [README](./README.md) — ce document ne
couvre que le déroulé d'une contribution.

## Avant de coder

Active le hook de pre-commit une fois par dépôt local :

```bash
git config core.hooksPath .githooks
```

Il lance un scan de secrets (gitleaks) sur ce qui est indexé, reformate le
PHP modifié (Pint) et corrige ce qu'ESLint peut corriger sur le JS/JSX
modifié, en ré-indexant à chaque fois. Rien ne bloque si l'outil n'est pas
installé localement — sauf une vraie fuite de secret, qui bloque toujours.
La CI reste le filet de sécurité pour le reste.

## Style des commits

Les commits suivent [Conventional Commits](https://www.conventionalcommits.org/) :
`type(scope): description au présent, sans majuscule ni point final`.

```
feat(auth): add the 2FA enrollment screen
fix(payments): guard against a replayed webhook crediting twice
perf(frontend): defer the realtime SDK out of the main bundle
```

`type` documente l'intention (`feat`, `fix`, `perf`, `test`, `docs`,
`chore`), `scope` le domaine touché. Le corps du message explique le
*pourquoi* — la contrainte, le bug réel, la décision — pas une paraphrase du
diff : le diff dit déjà ce qui a changé.

## Tests

Un changement de comportement s'accompagne d'un test qui échoue avant et
passe après — pas d'un test écrit après coup pour faire du chiffre. Pour du
code déjà couvert par une ligne de test existante, vérifier que la logique
change vraiment le résultat (mutation manuelle : cassez délibérément la
correction et confirmez que le test rouge le détecte) avant de faire
confiance à la couverture affichée.

Deux divergences d'environnement ont déjà produit des bugs qui passaient
inaperçus en local :

- **SQLite en local, MySQL 8 en CI** — un test qui touche du SQL brut, un
  type `decimal`, une contrainte de clé étrangère doit aussi tourner contre
  MySQL avant d'être considéré fiable (`DB_CONNECTION=mysql
  DB_DATABASE=ecole_test vendor/bin/pest`, voir le README).
- **`QUEUE_CONNECTION=sync` en test, `database` en production** — un test
  qui `actingAs()` avant d'appeler un webhook ou qui laisse la file
  synchrone masque tout bug lié au contexte d'école ambiant
  (`App\Support\SchoolContext`), qui n'existe que dans une vraie requête
  HTTP authentifiée.

## Pull requests

Une PR cible `main`. La description dit ce qu'elle change et pourquoi, pas
seulement quoi — le diff montre déjà le « quoi ». Un changement de
comportement backend touchant un modèle scopé par école doit préciser
comment le cloisonnement a été vérifié (test dédié, ou pourquoi ce n'était
pas nécessaire).

Une décision d'architecture qui ne se justifie pas d'elle-même en lisant le
code (garder une dépendance plutôt que la retirer, choisir un mécanisme
plutôt qu'un autre pour une contrainte non évidente) mérite un
[ADR](./docs/adr/) court, pas seulement un commentaire dans le code.
