<?php

namespace App\Http\Controllers;

use App\Models\Ecole;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class EcoleController extends Controller
{
    /** Values of `ecoles.status`. A school is deactivated, never deleted. */
    public const STATUS_ACTIVE   = 'active';
    public const STATUS_INACTIVE = 'inactive';

    /**
     * `Ecole` est la racine du tenant : elle échappe par nature au global scope
     * BelongsToEcole. L'isolation doit donc être explicite ici, sinon un
     * directeur liste et modifie toutes les écoles clientes (cf. audit S5).
     */
    private function isSuperAdmin(): bool
    {
        return auth()->user()?->role === 'super-admin';
    }

    /** Refuse l'accès si l'école visée n'est pas celle de l'utilisateur. */
    private function assertWithinScope(Ecole $ecole): void
    {
        if ($this->isSuperAdmin()) {
            return;
        }

        if (auth()->user()?->ecole_id !== $ecole->id) {
            abort(403, 'Accès refusé à cet établissement');
        }
    }

    public function index()
    {
        // Un directeur ne voit que son école ; le super-admin voit la plateforme.
        $query = Ecole::query();

        if (!$this->isSuperAdmin()) {
            $query->where('id', auth()->user()?->ecole_id);
        }

        return response()->json([
            'success' => true,
            'data' => $query->paginate(50),
        ]);
    }

    public function store(Request $request)
    {
        // Créer un établissement relève de la plateforme, pas d'un directeur.
        if (!$this->isSuperAdmin()) {
            return response()->json(['success' => false, 'message' => 'Accès refusé'], 403);
        }

        $validated = $request->validate([
            'nom' => 'required|string|max:255',
            'email' => 'required|email|unique:ecoles',
            'telephone' => 'nullable|string',
            'adresse' => 'required|string',
            'ville' => 'nullable|string',
            'status' => 'nullable|string|in:active,inactive',
            'slug' => 'nullable|unique:ecoles',
        ]);

        // Mapper telephone → phone pour correspondre au modèle
        if (isset($validated['telephone'])) {
            $validated['phone'] = $validated['telephone'];
            unset($validated['telephone']);
        }

        // Générer slug automatiquement si non fourni
        if (empty($validated['slug'])) {
            $validated['slug'] = Str::slug($validated['nom']);
        }

        $ecole = Ecole::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'École créée avec succès',
            'data' => $ecole
        ], 201);
    }

    public function show(Ecole $ecole)
    {
        $this->assertWithinScope($ecole);

        // On renvoie des compteurs, pas les collections complètes : le `load`
        // précédent dumpait tous les utilisateurs et élèves d'un coup (P3).
        return response()->json([
            'success' => true,
            'data' => $ecole->loadCount(['users', 'eleves', 'enseignants', 'classes']),
        ]);
    }

    public function update(Request $request, Ecole $ecole)
    {
        $this->assertWithinScope($ecole);

        $validated = $request->validate([
            'nom' => 'string|max:255',
            'email' => 'email|unique:ecoles,email,' . $ecole->id,
            'telephone' => 'nullable|string',
            'adresse' => 'string',
            'ville' => 'nullable|string',
            'status' => 'nullable|string|in:active,inactive',
            'slug' => 'nullable|unique:ecoles,slug,' . $ecole->id,
        ]);

        if (isset($validated['telephone'])) {
            $validated['phone'] = $validated['telephone'];
            unset($validated['telephone']);
        }

        $ecole->update($validated);
        
        return response()->json([
            'success' => true,
            'message' => 'École mise à jour avec succès',
            'data' => $ecole
        ]);
    }

    /**
     * A school is never deleted — only deactivated.
     *
     * Product rule: an establishment holds pupil records, marks, report cards
     * and payment history that must remain auditable. Deletion is therefore not
     * offered at all; DELETE on this resource deactivates instead, and the
     * `ecole_id` foreign keys are RESTRICT so that a stray delete elsewhere
     * fails loudly rather than erasing an establishment.
     */
    public function destroy(Ecole $ecole)
    {
        if (!$this->isSuperAdmin()) {
            return response()->json(['success' => false, 'message' => 'Accès refusé'], 403);
        }

        return $this->deactivate($ecole);
    }

    /**
     * Deactivate a school: its users can no longer sign in, its data is kept.
     * POST /api/ecoles/{ecole}/deactivate
     */
    public function deactivate(Ecole $ecole)
    {
        if (!$this->isSuperAdmin()) {
            return response()->json(['success' => false, 'message' => 'Accès refusé'], 403);
        }

        if ($ecole->status === self::STATUS_INACTIVE) {
            return response()->json([
                'success' => true,
                'message' => 'Cet établissement est déjà désactivé',
                'data'    => $ecole,
            ]);
        }

        $ecole->update(['status' => self::STATUS_INACTIVE]);

        return response()->json([
            'success' => true,
            'message' => 'Établissement désactivé. Ses données sont conservées et '
                . 'ses utilisateurs ne peuvent plus se connecter.',
            'data'    => $ecole->fresh(),
        ]);
    }

    /**
     * Reactivate a school.
     * POST /api/ecoles/{ecole}/activate
     */
    public function activate(Ecole $ecole)
    {
        if (!$this->isSuperAdmin()) {
            return response()->json(['success' => false, 'message' => 'Accès refusé'], 403);
        }

        $ecole->update(['status' => self::STATUS_ACTIVE]);

        return response()->json([
            'success' => true,
            'message' => 'Établissement réactivé',
            'data'    => $ecole->fresh(),
        ]);
    }

    // Statistiques d'une école
    public function stats(Ecole $ecole)
    {
        $this->assertWithinScope($ecole);

        return response()->json([
            'success' => true,
            'data' => [
                'nom' => $ecole->nom,
                'total_eleves' => $ecole->eleves()->count(),
                'total_enseignants' => $ecole->enseignants()->count(),
                'total_classes' => $ecole->classes()->count(),
                'total_parents' => $ecole->parents()->count(),
            ]
        ]);
    }

    /**
     * Provisionner une école avec tous ses comptes utilisateurs en une requête.
     * POST /api/ecoles/provision
     */
    public function provision(Request $request)
    {
        $validated = $request->validate([
            'nom' => 'required|string|max:255',
            'email' => 'required|email|unique:ecoles',
            'adresse' => 'required|string',
            'telephone' => 'nullable|string',
            'ville' => 'nullable|string',
            'password' => 'nullable|string|min:6',
        ]);

        $password = $validated['password'] ?? Str::password(16);

        // Créer l'école
        $data = [
            'nom' => $validated['nom'],
            'email' => $validated['email'],
            'adresse' => $validated['adresse'],
            'slug' => Str::slug($validated['nom']),
            'status' => 'active',
        ];
        if (isset($validated['telephone'])) {
            $data['phone'] = $validated['telephone'];
        }
        if (isset($validated['ville'])) {
            $data['ville'] = $validated['ville'];
        }

        $ecole = Ecole::create($data);
        $prefix = Str::slug($validated['nom']);

        // Créer les comptes utilisateurs
        $roles = [
            'directeur'    => 'Directeur Général',
            'directeurM'   => 'Directeur Maternelle',
            'directeurP'   => 'Directeur Primaire',
            'directeurS'   => 'Directeur Secondaire',
            'censeur'      => 'Censeur',
            'secretaire'   => 'Secrétaire',
            'comptable'    => 'Comptable',
            'surveillant'  => 'Surveillant',
            'infirmier'    => 'Infirmier',
            'bibliothecaire' => 'Bibliothécaire',
        ];

        $users = [];
        foreach ($roles as $role => $label) {
            $user = User::create([
                'name'      => "{$label} - {$ecole->nom}",
                'prenom'    => $label,
                'email'     => "{$role}.{$prefix}@ecole.bj",
                'identifiant' => "{$role}_{$prefix}",
                'password'  => Hash::make($password),
                'role'      => $role,
                'ecole_id'  => $ecole->id,
                'is_active' => true,
            ]);
            $users[] = [
                'role'       => $label,
                'email'      => $user->email,
                'identifiant' => $user->identifiant,
            ];
        }

        return response()->json([
            'success' => true,
            'message' => 'École provisionnée avec succès',
            'data' => [
                'ecole' => $ecole,
                'users' => $users,
                'password' => $password,
            ],
        ], 201);
    }
}
