<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;

class NotificationController extends Controller
{
    /**
     * Liste des notifications de l'utilisateur connecté
     */
    public function index(Request $request)
    {
        $user = Auth::user();
        
        $notifications = DB::table('notifications')
            ->where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json(['success' => true, 'data' => $notifications]);
    }

    /**
     * Envoi d'une notification (Admin ou Système)
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

        $id = DB::table('notifications')->insertGetId([
            'user_id' => $validated['user_id'],
            'type' => $validated['type'],
            'titre' => $validated['titre'],
            'message' => $validated['message'],
            'lu' => false,
            'created_at' => now(),
            'updated_at' => now()
        ]);

        // Ici on pourrait déclencher le service de SMS/WhatsApp
        // Log::info("Notification envoyée via " . ($validated['channel'] ?? 'db'));

        return response()->json(['success' => true, 'id' => $id], 201);
    }

    public function markAsRead($id)
    {
        DB::table('notifications')
            ->where('id', $id)
            ->where('user_id', Auth::id())
            ->update(['lu' => true, 'updated_at' => now()]);
            
        return response()->json(['success' => true]);
    }

    public function markAllAsRead()
    {
        DB::table('notifications')
            ->where('user_id', Auth::id())
            ->update(['lu' => true, 'updated_at' => now()]);
            
        return response()->json(['success' => true]);
    }

    public function unreadCount()
    {
        $count = DB::table('notifications')
            ->where('user_id', Auth::id())
            ->where('lu', false)
            ->count();

        return response()->json(['success' => true, 'count' => $count]);
    }
}
