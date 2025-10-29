<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class MessageController extends Controller
{
    public function index(Request $request)
    {
        $userId = $request->user_id;
        
        $messages = DB::table('messages')
            ->where('messages.destinataire', $userId)
            ->leftJoin('enseignants as e', 'messages.expediteur', '=', DB::raw('CAST(e.id AS CHAR)'))
            ->leftJoin('enseignants_martenel_primaire as emp', 'messages.expediteur', '=', DB::raw('CAST(emp.id AS CHAR)'))
            ->select(
                'messages.*',
                DB::raw('COALESCE(CONCAT(e.nom, " ", e.prenom), CONCAT(emp.nom, " ", emp.prenom), messages.expediteur) as expediteur_nom')
            )
            ->orderBy('messages.created_at', 'desc')
            ->get();

        return response()->json(['success' => true, 'data' => $messages]);
    }

    public function sent(Request $request)
    {
        $userId = $request->user_id;
        
        $messages = DB::table('messages')
            ->where('messages.expediteur', $userId)
            ->leftJoin('enseignants as e', 'messages.destinataire', '=', DB::raw('CAST(e.id AS CHAR)'))
            ->leftJoin('enseignants_martenel_primaire as emp', 'messages.destinataire', '=', DB::raw('CAST(emp.id AS CHAR)'))
            ->select(
                'messages.*',
                DB::raw('COALESCE(CONCAT(e.nom, " ", e.prenom), CONCAT(emp.nom, " ", emp.prenom), messages.destinataire) as destinataire_nom')
            )
            ->orderBy('messages.created_at', 'desc')
            ->get();

        return response()->json(['success' => true, 'data' => $messages]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'expediteur' => 'required|string',
            'destinataire' => 'required|string',
            'sujet' => 'required|string',
            'contenu' => 'required|string'
        ]);

        $id = DB::table('messages')->insertGetId(array_merge($validated, [
            'lu' => false,
            'created_at' => now(),
            'updated_at' => now()
        ]));

        return response()->json(['success' => true, 'data' => ['id' => $id]], 201);
    }

    public function markAsRead($id)
    {
        DB::table('messages')->where('id', $id)->update(['lu' => true, 'updated_at' => now()]);
        return response()->json(['success' => true]);
    }

    public function unreadCount(Request $request)
    {
        $userId = $request->user_id;
        $count = DB::table('messages')
            ->where('destinataire', $userId)
            ->where('lu', false)
            ->count();

        return response()->json(['success' => true, 'count' => $count]);
    }

    public function getUsers(Request $request)
    {
        $currentUserId = $request->user_id;
        $users = [];

        // Récupérer les enseignants
        $enseignants = DB::table('enseignants')
            ->select('id', DB::raw("CONCAT(nom, ' ', prenom) as name"), 'email', DB::raw("'enseignant' as role"))
            ->get();
        $users = array_merge($users, $enseignants->toArray());

        // Récupérer les enseignants maternelle/primaire
        $enseignantsMP = DB::table('enseignants_martenel_primaire')
            ->select('id', DB::raw("CONCAT(nom, ' ', prenom) as name"), 'email', 'role')
            ->get();
        $users = array_merge($users, $enseignantsMP->toArray());

        // Ajouter l'administration
        $users[] = (object)['id' => 0, 'name' => 'Administration', 'email' => 'admin@ecole.bj', 'role' => 'administration'];
        $users[] = (object)['id' => -1, 'name' => 'Directeur', 'email' => 'directeur@ecole.bj', 'role' => 'directeur'];

        return response()->json(['success' => true, 'data' => $users]);
    }

    public function getConversations(Request $request)
    {
        $userId = $request->user_id;
        
        $conversations = DB::select("
            SELECT 
                CASE 
                    WHEN expediteur = ? THEN destinataire 
                    ELSE expediteur 
                END as contact_id,
                MAX(created_at) as derniere_date,
                COUNT(CASE WHEN destinataire = ? AND lu = 0 THEN 1 END) as non_lus
            FROM messages
            WHERE expediteur = ? OR destinataire = ?
            GROUP BY contact_id
            ORDER BY derniere_date DESC
        ", [$userId, $userId, $userId, $userId]);

        foreach ($conversations as $conv) {
            $user = DB::table('enseignants')
                ->where('id', $conv->contact_id)
                ->select(DB::raw("CONCAT(nom, ' ', prenom) as name"))
                ->first();
            
            if (!$user) {
                $user = DB::table('enseignants_martenel_primaire')
                    ->where('id', $conv->contact_id)
                    ->select(DB::raw("CONCAT(nom, ' ', prenom) as name"))
                    ->first();
            }
            
            $conv->contact_nom = $user ? $user->name : 'Utilisateur ' . $conv->contact_id;
        }

        return response()->json(['success' => true, 'data' => $conversations]);
    }

    public function getConversation(Request $request, $contactId)
    {
        $userId = $request->user_id;
        
        $messages = DB::table('messages')
            ->where(function($q) use ($userId, $contactId) {
                $q->where('expediteur', $userId)->where('destinataire', $contactId);
            })
            ->orWhere(function($q) use ($userId, $contactId) {
                $q->where('expediteur', $contactId)->where('destinataire', $userId);
            })
            ->orderBy('created_at', 'asc')
            ->get();

        return response()->json(['success' => true, 'data' => $messages]);
    }
}
