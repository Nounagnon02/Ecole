<?php

namespace App\Http\Controllers;

use App\Models\Message;
use App\Models\User;
use Illuminate\Http\Request;

/**
 * MessageController — Messagerie interne
 *
 * Règle non négociable : l'identité de l'utilisateur vient TOUJOURS de
 * `auth()->id()`, jamais d'un champ de la requête. Le contrôleur passe par le
 * modèle Message (et non par DB::table) pour bénéficier du global scope
 * BelongsToEcole, qui assure l'isolation inter-établissements (cf. audit S4).
 */
class MessageController extends Controller
{
    /** Identifiant de l'utilisateur courant, au format stocké en base (string). */
    private function moi(): string
    {
        return (string) auth()->id();
    }

    /**
     * Résout les noms d'affichage pour un lot d'identifiants, en une requête.
     *
     * @param  iterable<string>  $ids
     * @return array<string, string>
     */
    private function nomsParId(iterable $ids): array
    {
        $ids = collect($ids)->filter()->unique()->values();

        if ($ids->isEmpty()) {
            return [];
        }

        return User::whereIn('id', $ids)
            ->where('ecole_id', auth()->user()?->ecole_id)
            ->get(['id', 'name', 'prenom'])
            ->mapWithKeys(fn($u) => [(string) $u->id => trim($u->prenom . ' ' . $u->name)])
            ->all();
    }

    /**
     * Messages reçus par l'utilisateur connecté.
     */
    public function index(Request $request)
    {
        $messages = Message::where('destinataire', $this->moi())
            ->orderByDesc('created_at')
            ->paginate((int) $request->input('per_page', 30));

        $noms = $this->nomsParId($messages->pluck('expediteur'));
        $messages->getCollection()->transform(function ($m) use ($noms) {
            $m->expediteur_nom = $noms[$m->expediteur] ?? 'Utilisateur ' . $m->expediteur;
            return $m;
        });

        return response()->json(['success' => true, 'data' => $messages]);
    }

    /**
     * Messages envoyés par l'utilisateur connecté.
     */
    public function sent(Request $request)
    {
        $messages = Message::where('expediteur', $this->moi())
            ->orderByDesc('created_at')
            ->paginate((int) $request->input('per_page', 30));

        $noms = $this->nomsParId($messages->pluck('destinataire'));
        $messages->getCollection()->transform(function ($m) use ($noms) {
            $m->destinataire_nom = $noms[$m->destinataire] ?? 'Utilisateur ' . $m->destinataire;
            return $m;
        });

        return response()->json(['success' => true, 'data' => $messages]);
    }

    /**
     * Envoi d'un message. L'expéditeur n'est jamais fourni par le client.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'destinataire' => 'required|string',
            'sujet'        => 'required|string|max:255',
            'contenu'      => 'required|string|max:10000',
        ]);

        // Le destinataire doit exister et appartenir à la même école.
        $destinataire = User::where('id', $validated['destinataire'])
            ->where('ecole_id', auth()->user()?->ecole_id)
            ->first();

        if (!$destinataire) {
            return response()->json([
                'success' => false,
                'message' => 'Destinataire introuvable dans votre établissement',
            ], 422);
        }

        $message = Message::create([
            'expediteur'   => $this->moi(),
            'destinataire' => (string) $destinataire->id,
            'sujet'        => $validated['sujet'],
            'contenu'      => $validated['contenu'],
            'lu'           => false,
        ]);

        return response()->json(['success' => true, 'data' => ['id' => $message->id]], 201);
    }

    /**
     * Marque un message comme lu — seul son destinataire le peut.
     */
    public function markAsRead($id)
    {
        $message = Message::findOrFail($id);

        if ($message->destinataire !== $this->moi()) {
            return response()->json(['success' => false, 'message' => 'Accès refusé'], 403);
        }

        $message->update(['lu' => true]);

        return response()->json(['success' => true]);
    }

    /**
     * Nombre de messages non lus de l'utilisateur connecté.
     */
    public function unreadCount()
    {
        $count = Message::where('destinataire', $this->moi())
            ->where('lu', false)
            ->count();

        return response()->json(['success' => true, 'count' => $count]);
    }

    /**
     * Contacts joignables — utilisateurs actifs de la même école.
     */
    public function getUsers()
    {
        $users = User::where('ecole_id', auth()->user()?->ecole_id)
            ->where('is_active', true)
            ->where('id', '!=', auth()->id())
            ->orderBy('name')
            ->get(['id', 'name', 'prenom', 'role'])
            ->map(fn($u) => [
                'id'   => $u->id,
                'name' => trim($u->prenom . ' ' . $u->name),
                'role' => $u->role,
            ]);

        return response()->json(['success' => true, 'data' => $users]);
    }

    /**
     * Liste des conversations de l'utilisateur connecté.
     */
    public function getConversations()
    {
        $moi = $this->moi();

        $conversations = Message::query()
            ->selectRaw('CASE WHEN expediteur = ? THEN destinataire ELSE expediteur END as contact_id', [$moi])
            ->selectRaw('MAX(created_at) as derniere_date')
            ->selectRaw('SUM(CASE WHEN destinataire = ? AND lu = 0 THEN 1 ELSE 0 END) as non_lus', [$moi])
            ->where(fn($q) => $q->where('expediteur', $moi)->orWhere('destinataire', $moi))
            ->groupBy('contact_id')
            ->orderByDesc('derniere_date')
            ->get();

        // Un seul aller-retour pour tous les noms, au lieu d'une requête par
        // conversation comme précédemment (cf. audit P4).
        $noms = $this->nomsParId($conversations->pluck('contact_id'));

        $conversations->transform(function ($c) use ($noms) {
            $c->contact_nom = $noms[(string) $c->contact_id] ?? 'Utilisateur ' . $c->contact_id;
            return $c;
        });

        return response()->json(['success' => true, 'data' => $conversations]);
    }

    /**
     * Fil de discussion avec un contact donné.
     */
    public function getConversation(Request $request, $contactId)
    {
        $moi = $this->moi();
        $contactId = (string) $contactId;

        $messages = Message::where(function ($q) use ($moi, $contactId) {
            $q->where(fn($sub) => $sub->where('expediteur', $moi)->where('destinataire', $contactId))
              ->orWhere(fn($sub) => $sub->where('expediteur', $contactId)->where('destinataire', $moi));
        })
            ->orderBy('created_at')
            ->paginate((int) $request->input('per_page', 50));

        return response()->json(['success' => true, 'data' => $messages]);
    }
}
