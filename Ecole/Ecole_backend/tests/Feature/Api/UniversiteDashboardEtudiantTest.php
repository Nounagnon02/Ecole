<?php

use App\Models\Ecole;
use App\Models\User;

/*
 * Revue web du 16/11/2026 : l'étudiant arrivait sur le tableau de bord de
 * l'université — effectifs des facultés, des enseignants, évolution des
 * inscriptions et NOMS des derniers étudiants inscrits. Rien de cela ne le
 * concerne, et les noms d'autres étudiants ne doivent pas lui être montrés.
 */

it('refuse le tableau de bord de l’université à un étudiant', function () {
    $ecole = Ecole::factory()->create(['status' => 'active']);
    $etudiant = User::factory()->create(['role' => 'etudiant', 'ecole_id' => $ecole->id, 'is_active' => true]);

    $this->actingAs($etudiant)->getJson('/api/dashboard/universite')->assertForbidden();
});

it('le sert toujours au recteur', function () {
    $ecole = Ecole::factory()->create(['status' => 'active']);
    $recteur = User::factory()->create(['role' => 'recteur', 'ecole_id' => $ecole->id, 'is_active' => true]);

    $this->actingAs($recteur)->getJson('/api/dashboard/universite')->assertOk();
});
