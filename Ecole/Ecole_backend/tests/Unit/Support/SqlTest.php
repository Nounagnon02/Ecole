<?php

use App\Support\Sql;
use Illuminate\Support\Facades\DB;

/*
 * Les agrégations par mois écrivaient `MONTH()`, `YEAR()` et `DATE_FORMAT()`,
 * propres à MySQL : la suite de la CI tourne sur SQLite, où ces appels
 * échouent (R-47, `SurveillantController::statistiques`, 16/11/2026). Une
 * seule traduction, vérifiée pilote par pilote, plutôt qu'un `if` par
 * contrôleur.
 */

it('traduit le numéro de mois pour chaque pilote', function () {
    expect(Sql::mois('date_paiement', 'mysql'))->toBe('MONTH(date_paiement)')
        ->and(Sql::mois('date_paiement', 'mariadb'))->toBe('MONTH(date_paiement)')
        ->and(Sql::mois('date_paiement', 'sqlite'))->toBe("CAST(strftime('%m', date_paiement) AS INTEGER)")
        ->and(Sql::mois('date_paiement', 'pgsql'))->toBe('EXTRACT(MONTH FROM date_paiement)::int');
});

it('traduit l’année pour chaque pilote', function () {
    expect(Sql::annee('created_at', 'mysql'))->toBe('YEAR(created_at)')
        ->and(Sql::annee('created_at', 'mariadb'))->toBe('YEAR(created_at)')
        ->and(Sql::annee('created_at', 'sqlite'))->toBe("CAST(strftime('%Y', created_at) AS INTEGER)")
        ->and(Sql::annee('created_at', 'pgsql'))->toBe('EXTRACT(YEAR FROM created_at)::int');
});

it('traduit le mois calendaire AAAA-MM pour chaque pilote', function () {
    expect(Sql::anneeMois('date', 'mysql'))->toBe("DATE_FORMAT(date, '%Y-%m')")
        ->and(Sql::anneeMois('date', 'mariadb'))->toBe("DATE_FORMAT(date, '%Y-%m')")
        ->and(Sql::anneeMois('date', 'sqlite'))->toBe("strftime('%Y-%m', date)")
        ->and(Sql::anneeMois('date', 'pgsql'))->toBe("to_char(date, 'YYYY-MM')");
});

it('prend le pilote de la connexion courante quand on ne le précise pas', function () {
    expect(Sql::mois('x'))->toBe(Sql::mois('x', DB::getDriverName()))
        ->and(Sql::anneeMois('x'))->toBe(Sql::anneeMois('x', DB::getDriverName()));
});

it('refuse un pilote inconnu plutôt que de produire du SQL faux', function () {
    Sql::mois('x', 'sqlsrv');
})->throws(InvalidArgumentException::class, 'sqlsrv');
