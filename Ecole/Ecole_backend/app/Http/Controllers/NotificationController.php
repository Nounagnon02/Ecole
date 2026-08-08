<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use App\Models\User;
use Illuminate\Http\Request;

/**
 * NotificationController — notifications internes.
 *
 * Toutes les lectures passent par le modèle Notification, qui porte le
 * trait BelongsToEcole : sans lui, une requête `DB::table` retournait les
 * lignes de tous les établissements à la fois — un utilisateur connecté
 * pouvait lire les notifications d'un autre (audit S4). Le scope applique
 * `WHERE notifications.ecole_id = …` sur chaque requête, et l'écriture
 * (`store`) résout l'école depuis le destinataire.
 */
class NotificationController extends Controller
{
    /**
     * Liste des notifications de l'utilisateur connecté
     */
    public function index(Request $request)
    {
        $notifications = Notification::where('user_id', auth()->id())
            ->orderByDesc('created_at')
            ->get();

        return response()->json(['success' => true, 'data' => $notifications]);
    }

    /**
     * Envoi d'une notification (Admin ou Système).
     *
     * `ecole_id` est dérivé de l'utilisateur destinataire : une
     * notification écrite sans école resterait invisible pour tout le monde
     * (le scope exclut les lignes sans école).
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
            'type' => 'required|string',
            'titre' => 'required|string',
            'message' => 'required|string',
            'channel' => 'nullable|in:db,sms,whatsapp,email'
        ]);

        $destinataire = User::findOrFail($validated['user_id']);

        $notification = Notification::create([
            'user_id' => $destinataire->id,
            'type' => $validated['type'],
            'titre' => $validated['titre'],
            'message' => $validated['message'],
            'lu' => false,
            // L'école du destinataire, jamais celle de l'émetteur.
            'ecole_id' => $destinataire->ecole_id,
        ]);

        // Ici on pourrait déclencher le service de SMS/WhatsApp.
        // Log::info("Notification envoyée via " . ($validated['channel'] ?? 'db'));

        return response()->json(['success' => true, 'id' => $notification->id], 201);
    }

    public function markAsRead($id)
    {
        Notification::where('id', $id)
            ->where('user_id', auth()->id())
            ->update(['lu' => true]);

        return response()->json(['success' => true]);
    }

    public function markAllAsRead()
    {
        Notification::where('user_id', auth()->id())
            ->update(['lu' => true]);

        return response()->json(['success' => true]);
    }

    public function unreadCount()
    {
        $count = Notification::where('user_id', auth()->id())
            ->where('lu', false)
            ->count();

        return response()->json(['success' => true, 'count' => $count]);
    }
}