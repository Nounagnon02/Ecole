<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class NotificationController extends Controller
{
    public function index(Request $request)
    {
        $userId = $request->user_id;
        $notifications = DB::table('notifications')
            ->where('user_id', $userId)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json(['success' => true, 'data' => $notifications]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'user_id' => 'required|string',
            'type' => 'required|string',
            'titre' => 'required|string',
            'message' => 'required|string'
        ]);

        $id = DB::table('notifications')->insertGetId(array_merge($validated, [
            'lu' => false,
            'created_at' => now(),
            'updated_at' => now()
        ]));

        return response()->json(['success' => true, 'data' => ['id' => $id]], 201);
    }

    public function markAsRead($id)
    {
        DB::table('notifications')->where('id', $id)->update(['lu' => true, 'updated_at' => now()]);
        return response()->json(['success' => true]);
    }

    public function markAllAsRead(Request $request)
    {
        $userId = $request->user_id;
        DB::table('notifications')->where('user_id', $userId)->update(['lu' => true, 'updated_at' => now()]);
        return response()->json(['success' => true]);
    }

    public function unreadCount(Request $request)
    {
        $userId = $request->user_id;
        $count = DB::table('notifications')
            ->where('user_id', $userId)
            ->where('lu', false)
            ->count();

        return response()->json(['success' => true, 'count' => $count]);
    }

    public function destroy($id)
    {
        DB::table('notifications')->where('id', $id)->delete();
        return response()->json(['success' => true]);
    }
}
