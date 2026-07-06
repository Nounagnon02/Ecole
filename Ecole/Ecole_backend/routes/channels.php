<?php

use App\Models\Conversation;
use Illuminate\Support\Facades\Broadcast;

/*
|--------------------------------------------------------------------------
| Broadcast Channels
|--------------------------------------------------------------------------
|
| Canaux de diffusion temps réel (Laravel Reverb compatible).
| Utilise Spatie Permission pour les vérifications de rôles.
|
*/

// Canal utilisateur privé
Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

// Notifications temps réel
Broadcast::channel('notifications.{userId}', function ($user, $userId) {
    return (int) $user->id === (int) $userId;
});

// Messages privés
Broadcast::channel('messages.{userId}', function ($user, $userId) {
    return (int) $user->id === (int) $userId;
});

// Conversations (vérifier que l'utilisateur est participant)
Broadcast::channel('conversations.{conversationId}', function ($user, $conversationId) {
    $conversation = Conversation::find($conversationId);
    if (!$conversation) return false;
    return $conversation->participants()->where('user_id', $user->id)->exists();
});

// Mises à jour des notes (enseignants et direction seulement)
Broadcast::channel('grades.{classeId}', function ($user, $classeId) {
    return $user->hasAnyRole(['directeur', 'enseignant', 'censeur']);
});
