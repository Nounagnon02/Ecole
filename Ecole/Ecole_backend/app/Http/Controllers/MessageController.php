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
    private function currentUserId(): string
    {
        return (string) auth()->id();
    }

    /**
     * Résout les noms d'affichage pour un lot d'identifiants, en une requête.
     *
     * @param  iterable<string>  $ids
     * @return array<string, string>
     */
    private function namesById(iterable $ids): array
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
     * Noms ET rôles pour un lot d'identifiants, en une requête.
     *
     * La liste des conversations a besoin du rôle du contact — la page
     * l'affiche sous le nom (« Enseignant », « Directeur »…). Le filtre
     * `ecole_id` est un filet de sécurité : un contact d'un autre
     * établissement ne doit jamais ressortir avec son nom ici.
     *
     * @param  iterable<string>  $ids
     * @return array<string, array{nom: string, role: ?string}>
     */
    private function usersById(iterable $ids): array
    {
        $ids = collect($ids)->filter()->unique()->values();

        if ($ids->isEmpty()) {
            return [];
        }

        return User::whereIn('id', $ids)
            ->where('ecole_id', auth()->user()?->ecole_id)
            ->get(['id', 'name', 'prenom', 'role'])
            ->mapWithKeys(fn($u) => [
                (string) $u->id => [
                    'nom' => trim($u->prenom . ' ' . $u->name) ?: ('Utilisateur ' . $u->id),
                    'role' => $u->role,
                ],
            ])
            ->all();
    }

    /**
     * Messages reçus par l'utilisateur connecté.
     */
    public function index(Request $request)
    {
        $messages = Message::where('destinataire', $this->currentUserId())
            ->orderByDesc('created_at')
            ->paginate((int) $request->input('per_page', 30));

        $noms = $this->namesById($messages->pluck('expediteur'));
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
        $messages = Message::where('expediteur', $this->currentUserId())
            ->orderByDesc('created_at')
            ->paginate((int) $request->input('per_page', 30));

        $noms = $this->namesById($messages->pluck('destinataire'));
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
        // `sujet` est facultatif : l'interface de messagerie est un fil de
        // discussion, sans champ objet. La colonne est NOT NULL, on retombe
        // donc sur une valeur par défaut plutôt que d'imposer le champ au
        // client. Les envois « courrier » (avec objet) restent possibles.
        $validated = $request->validate([
            'destinataire' => 'required|string',
            'sujet'        => 'nullable|string|max:255',
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
            'expediteur'   => $this->currentUserId(),
            'destinataire' => (string) $destinataire->id,
            'sujet'        => $validated['sujet'] ?? '(sans objet)',
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

        if ($message->destinataire !== $this->currentUserId()) {
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
        $count = Message::where('destinataire', $this->currentUserId())
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
     *
     * Contrat de la page de messagerie : chaque ligne porte un identifiant
     * stable (`id`), le nom du contact (`contact_nom`), son rôle, l'aperçu
     * du dernier message (`dernier_message`) — sans lui l'aperçu restait
     * « Aucun message » — et le compte non lu (`non_lus`).
     */
    public function getConversations()
    {
        $me = $this->currentUserId();

        $conversations = Message::query()
            ->selectRaw('CASE WHEN expediteur = ? THEN destinataire ELSE expediteur END as contact_id', [$me])
            ->selectRaw('MAX(created_at) as derniere_date')
            ->selectRaw('SUM(CASE WHEN destinataire = ? AND lu = 0 THEN 1 ELSE 0 END) as non_lus', [$me])
            ->where(fn($q) => $q->where('expediteur', $me)->orWhere('destinataire', $me))
            ->groupBy('contact_id')
            ->orderByDesc('derniere_date')
            ->get();

        // Dernier message de chaque fil, en un seul aller-retour : les
        // messages sont triés du plus récent au plus ancien, donc le premier
        // de chaque groupe est le dernier échangé avec le contact.
        $derniers = Message::where(fn($q) => $q->where('expediteur', $me)->orWhere('destinataire', $me))
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->get(['id', 'expediteur', 'destinataire', 'contenu', 'created_at'])
            ->groupBy(fn($m) => $m->expediteur === $me ? $m->destinataire : $m->expediteur)
            ->map(fn($groupe) => $groupe->first());

        $contacts = $this->usersById($conversations->pluck('contact_id'));

        $conversations->transform(function ($c) use ($contacts, $derniers) {
            $key = (string) $c->contact_id;
            $contact = $contacts[$key] ?? ['nom' => 'Utilisateur ' . $key, 'role' => null];
            $dernier = $derniers[$key] ?? null;

            $c->id = (int) $c->contact_id;
            $c->contact_id = (int) $c->contact_id;
            $c->contact_nom = $contact['nom'];
            $c->role = $contact['role'];
            $c->dernier_message = $dernier ? mb_strimwidth($dernier->contenu, 0, 120, '…') : null;

            return $c;
        });

        return response()->json(['success' => true, 'data' => $conversations]);
    }

    /**
     * Fil de discussion avec un contact donné.
     */
    public function getConversation(Request $request, $contactId)
    {
        $me = $this->currentUserId();
        $contactId = (string) $contactId;

        $messages = Message::where(function ($q) use ($me, $contactId) {
            $q->where(fn($sub) => $sub->where('expediteur', $me)->where('destinataire', $contactId))
              ->orWhere(fn($sub) => $sub->where('expediteur', $contactId)->where('destinataire', $me));
        })
            ->orderBy('created_at')
            ->paginate((int) $request->input('per_page', 50));

        // Même enrichissement que la boîte de réception : le fil doit pouvoir
        // afficher l'auteur d'un message sans requête supplémentaire.
        $noms = $this->namesById($messages->pluck('expediteur')->merge($messages->pluck('destinataire')));
        $messages->getCollection()->transform(function ($m) use ($noms) {
            $m->expediteur_nom = $noms[$m->expediteur] ?? 'Utilisateur ' . $m->expediteur;
            $m->destinataire_nom = $noms[$m->destinataire] ?? 'Utilisateur ' . $m->destinataire;
            return $m;
        });

        return response()->json(['success' => true, 'data' => $messages]);
    }

    /**
     * Marque comme lue toute la conversation avec un contact : chaque
     * message reçu de ce contact, et non lu, passe à lu. La page l'appelle
     * à l'ouverture d'un fil pour faire redescendre les badges non-lus.
     */
    public function markConversationRead($contactId)
    {
        $me = $this->currentUserId();
        $contactId = (string) $contactId;

        $marked = Message::where('destinataire', $me)
            ->where('expediteur', $contactId)
            ->where('lu', false)
            ->update(['lu' => true]);

        return response()->json(['success' => true, 'data' => ['marked' => $marked]]);
    }
}
