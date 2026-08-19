<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use App\Models\User;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function index(Request $request)
    {
        $notifications = Notification::where('user_id', auth()->id())
            ->latest()
            ->paginate(min((int) $request->input('per_page', 50), 50));

        return response()->json($notifications);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
            'type' => 'required|string',
            'title' => 'required|string',
            'message' => 'required|string',
            'data' => 'nullable|array',
        ]);

        $destinataire = User::findOrFail($validated['user_id']);

        $notification = Notification::create([
            'user_id' => $destinataire->id,
            'type' => $validated['type'],
            'title' => $validated['title'],
            'message' => $validated['message'],
            'data' => $validated['data'] ?? null,
            'ecole_id' => $destinataire->ecole_id,
        ]);

        return response()->json(['success' => true, 'id' => $notification->id], 201);
    }

    public function markAsRead($id)
    {
        $notification = Notification::where('id', $id)
            ->where('user_id', auth()->id())
            ->firstOrFail();

        $notification->markAsRead();

        return response()->json(['success' => true]);
    }

    public function markAllAsRead()
    {
        Notification::where('user_id', auth()->id())
            ->unread()
            ->update(['read_at' => now()]);

        return response()->json(['success' => true]);
    }

    public function unreadCount()
    {
        $count = Notification::where('user_id', auth()->id())
            ->unread()
            ->count();

        return response()->json(['success' => true, 'count' => $count]);
    }
}
