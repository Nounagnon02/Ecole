<?php

use App\Models\Ecole;
use App\Models\Message;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

/*
 * Parcours 5 de la mission (R-31, 16/11/2026) : un message peut porter une
 * pièce jointe. Le fichier est rangé sur le disque privé ; seuls l'expéditeur
 * et le destinataire peuvent le télécharger ; types et taille sont bornés.
 */

beforeEach(function () {
    Storage::fake('local');
    $this->ecole = Ecole::factory()->create(['status' => 'active']);
    $creer = fn (string $role) => User::factory()->create(['role' => $role, 'ecole_id' => $this->ecole->id, 'is_active' => true]);
    $this->secretaire = $creer('secretaire');
    $this->directeur = $creer('directeur');
    $this->comptable = $creer('comptable');
});

function envoyerAvecPiece($test, $fichier, string $contenu = 'Voici le document.')
{
    return $test->actingAs($test->secretaire)->post('/api/messages', [
        'destinataire' => (string) $test->directeur->id, 'contenu' => $contenu, 'piece_jointe' => $fichier,
    ], ['Accept' => 'application/json']);
}

it('envoie un message avec une pièce jointe, que le destinataire télécharge', function () {
    $reponse = envoyerAvecPiece($this, UploadedFile::fake()->create('releve.pdf', 120, 'application/pdf'))->assertCreated();
    $message = Message::findOrFail($reponse->json('data.id'));

    expect($message->piece_jointe_nom)->toBe('releve.pdf');
    Storage::disk('local')->assertExists($message->piece_jointe_chemin);

    $this->actingAs($this->directeur)->get("/api/messages/{$message->id}/piece-jointe")->assertOk()->assertDownload('releve.pdf');
    $this->actingAs($this->secretaire)->get("/api/messages/{$message->id}/piece-jointe")->assertOk();
});

it('refuse la pièce jointe à toute autre personne, même de l’école', function () {
    $id = envoyerAvecPiece($this, UploadedFile::fake()->create('releve.pdf', 120, 'application/pdf'))->json('data.id');

    $this->actingAs($this->comptable)->getJson("/api/messages/{$id}/piece-jointe")->assertStatus(403);
});

it('refuse un type de fichier non autorisé ou trop lourd', function () {
    envoyerAvecPiece($this, UploadedFile::fake()->create('script.exe', 10, 'application/x-msdownload'))->assertStatus(422);
    envoyerAvecPiece($this, UploadedFile::fake()->create('gros.pdf', 6000, 'application/pdf'))->assertStatus(422);
    expect(Message::count())->toBe(0);
});

it('accepte une pièce jointe sans texte, et montre la pièce dans le fil', function () {
    $id = envoyerAvecPiece($this, UploadedFile::fake()->image('photo.jpg'), '')->assertCreated()->json('data.id');

    $this->actingAs($this->directeur)->getJson("/api/messages/conversation/{$this->secretaire->id}")
        ->assertOk()->assertJsonFragment(['piece_jointe' => ['nom' => 'photo.jpg', 'type' => 'image/jpeg', 'taille' => Message::find($id)->piece_jointe_taille]]);
});
