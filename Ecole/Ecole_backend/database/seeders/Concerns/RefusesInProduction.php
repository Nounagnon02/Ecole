<?php

namespace Database\Seeders\Concerns;

/**
 * Comptes créés avec un mot de passe unique et prévisible (`password`) : rien
 * ne les empêchait de tourner en production, que ce soit via `migrate:fresh
 * --seed`, `db:seed` ou `db:seed --class=...` isolé. `credentials.md` en
 * décrit l'ampleur — un annuaire complet de comptes, tous rôles confondus,
 * avec ce mot de passe unique. Fail-closed : le seeder refuse, il ne dépend
 * pas de la discipline de qui l'invoque.
 */
trait RefusesInProduction
{
    protected function abortIfProduction(): bool
    {
        if (! app()->environment('production')) {
            return false;
        }

        $this->command?->error(
            static::class . ' crée des comptes à mot de passe faible et prévisible : refusé en production.'
        );

        return true;
    }
}
