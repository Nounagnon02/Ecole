<?php

namespace App\Http\Controllers;

use App\Models\{User, Eleve, Classes, Notes, Matieres, Message};
use App\Support\Roles;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class DashboardController extends Controller
{
    /**
     * Rôles habilités à consulter le référentiel consolidé de l'école.
     *
     * Les chefs de cycle sont ajoutés par `Roles::expand()` : la liste ne les
     * énumère plus, sinon elle redivergerait de celle des routes.
     */
    private function directoryRoles(): array
    {
        return Roles::expand([Roles::DIRECTOR, 'censeur', 'secretaire', Roles::SUPER_ADMIN]);
    }

    /** Clé de cache du référentiel, par école. */
    private function directoryCacheKey(): string
    {
        return 'dashboard_directeur_' . (auth()->user()?->ecole_id ?? 'global');
    }

    public function directeur()
    {
        return response()->json([
            'success' => true,
            'data' => [
                'total_eleves' => Eleve::count(),
                'total_classes' => Classes::count(),
                'total_enseignants' => User::where('role', 'enseignant')->where('ecole_id', auth()->user()?->ecole_id)->count(),
                // Compteurs plutôt que collections complètes : `with(['eleves',
                // 'enseignants'])` chargeait tout l'effectif de l'école (P3).
                'classes' => Classes::withCount(['eleves', 'enseignants'])->get(),
            ]
        ]);
    }

    /**
     * Endpoint consolidé pour le dashboard directeur
     * Retourne toutes les données en une seule requête avec cache de 5 minutes
     */
    public function getDashboardData()
    {
        // Cet endpoint expose le référentiel complet de l'école (élèves,
        // classes, matières). Il n'avait aucun contrôle de rôle : un élève ou
        // un parent pouvait le lire intégralement (cf. audit S8).
        if (!in_array(auth()->user()?->role, $this->directoryRoles(), true)) {
            return response()->json(['success' => false, 'message' => 'Accès refusé'], 403);
        }

        $data = Cache::remember($this->directoryCacheKey(), 300, function () {
            return [
                'classes' => Classes::with('series')->get(),
                'classes_effectif' => Classes::withCount('eleves')->get()->map(function ($c) {
                    $c->effectif = $c->eleves_count;
                    return $c;
                }),
                'eleves' => Eleve::select('id', 'user_id', 'classe_id', 'numero_matricule', 'ecole_id')->get(),
                // `coefficient` vit sur le pivot serie_matieres et `code`
                // n'existe pas : le select d'origine levait une erreur SQL.
                'matieres' => Matieres::select('id', 'nom', 'ecole_id')->get(),
                'matieres_series' => Matieres::with('series')->get(),
                'series' => \App\Models\Series::with('matieres')->get(),
                'stats' => [
                    'total_eleves' => Eleve::count(),
                    'total_classes' => Classes::count(),
                    'total_enseignants' => User::where('role', 'enseignant')->where('ecole_id', auth()->user()?->ecole_id)->count(),
                    'evolution_effectifs' => $this->computeMonthlyEnrollment(),
                    'repartition_notes' => $this->computeGradeDistribution(),
                ]
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $data,
            'cached' => true
        ]);
    }

    /**
     * Invalide le cache du dashboard
     */
    public function invalidateCache()
    {
        // La clé doit être la même que celle utilisée en écriture : le
        // `forget('dashboard_directeur')` d'origine ne supprimait rien, et le
        // dashboard restait figé 5 minutes après chaque saisie (cf. audit P2).
        Cache::forget($this->directoryCacheKey());

        return response()->json(['success' => true, 'message' => 'Cache invalidé']);
    }

    public function enseignant(Request $request)
    {
        $enseignant = $request->user()->enseignant;

        // Récupérer les classes et matières de l'enseignant
        $matiereIds = $enseignant->matieres()->pluck('matieres.id');
        $classeIds = $enseignant->classes()->pluck('classes.id');

        // Notes liées à l'enseignant via ses classes et matières
        $notes = Notes::whereIn('classe_id', $classeIds)
            ->whereIn('matiere_id', $matiereIds)
            ->with(['eleve', 'matiere'])
            ->latest()
            ->take(10)
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'classes' => $enseignant->classes()->with('eleves')->get(),
                'matieres' => $enseignant->matieres,
                'notes_recentes' => $notes,
            ]
        ]);
    }

    public function parent(Request $request)
    {
        $user = $request->user();

        if (!$user || $user->role !== 'parent') {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        $parent = $user->parent;

        if (!$parent) {
            return response()->json(['success' => true, 'data' => ['parent' => $user, 'enfants' => [], 'children' => [], 'stats' => [], 'evolution' => [], 'communications' => []]]);
        }

        // `user` doit être préchargé : il est lu dans le map ci-dessous, ce qui
        // déclenchait une requête par enfant (cf. audit P4).
        $children = $parent->eleves()->with(['user:id,name,prenom', 'classe', 'notes.matiere'])->get();

        // Rangs : une requête par classe distincte, partagée par tous ses élèves.
        $rangsParClasse = $children->pluck('classe_id')
            ->filter()
            ->unique()
            ->mapWithKeys(fn ($classeId) => [$classeId => Eleve::classRanks($classeId)]);

        $enfants = $children->map(function ($child) use ($rangsParClasse) {
            $moyenne = $this->calculateAverage($child->notes);

            return [
                'id'           => $child->id,
                'nom'          => $child->user->name ?? 'N/A',
                'prenom'       => $child->user->prenom ?? '',
                'matricule'    => $child->numero_matricule ?? 'N/A',
                'classe'       => $child->classe->nom_classe ?? $child->classe->nom ?? 'N/A',
                'classe_id'    => $child->classe_id,
                'moyenne'      => $moyenne !== null ? round($moyenne, 2) : null,
                'rang'         => $rangsParClasse[$child->classe_id][$child->id] ?? null,
                // Filiation enrichie (point B) : rôle du parent, contact de
                // référence (`is_primary`), tuteur légal.
                'role'         => $child->pivot?->role ?? null,
                'is_primary'   => (bool) ($child->pivot?->is_primary ?? false),
                'is_guardian'  => (bool) ($child->pivot?->is_guardian ?? false),
                'filiation'    => [
                    'role'        => $child->pivot?->role ?? null,
                    'is_primary'  => (bool) ($child->pivot?->is_primary ?? false),
                    'is_guardian' => (bool) ($child->pivot?->is_guardian ?? false),
                ],
            ];
        });

        // ─── Stats ──────────────────────────────────────────────────
        $moyenneGenerale = $enfants->pluck('moyenne')->filter()->avg();
        $absencesMois = $children->isNotEmpty()
            ? \App\Models\Absence::whereIn('eleve_id', $children->pluck('id'))
                ->whereMonth('date', now()->month)
                ->whereYear('date', now()->year)
                ->count()
            : 0;
        $assiduite = $children->isNotEmpty()
            ? max(0, 100 - (int) round(($absencesMois / ($children->count() * 22)) * 100))
            : 100;
        $solde = \App\Models\PaiementEleve::whereIn('eleve_id', $children->pluck('id'))
            ->where('montant_restant', '>', 0)
            ->sum('montant_restant');

        $stats = [
            ['title' => 'Enfants Scolarisés', 'value' => $children->count()],
            ['title' => 'Moyenne Générale', 'value' => $moyenneGenerale !== null ? round($moyenneGenerale, 2) : '—'],
            ['title' => 'Assiduité', 'value' => $assiduite . '%'],
            ['title' => 'Solde', 'value' => $solde > 0 ? number_format($solde, 0, ',', ' ') . ' FCFA' : '0 FCFA'],
        ];

        // ─── Évolution des notes (6 derniers mois, par enfant) ───────
        $evolution = $this->parentEvolution($children);

        // ─── Communications récentes adressées au parent ─────────────
        $communications = Message::where(function ($q) use ($user) {
            $q->where('destinataire', $user->name)
                ->orWhere('destinataire', $user->email)
                ->orWhere('destinataire', $user->identifiant ?? '');
        })
            ->latest()
            ->take(5)
            ->get()
            ->map(fn ($msg) => [
                'id'      => $msg->id,
                'from'    => $msg->expediteur ?? 'École',
                'role'    => 'École',
                'sujet'   => $msg->sujet,
                'date'    => $msg->created_at?->format('d/m/Y'),
                'urgent'  => false,
            ]);

        return response()->json([
            'success' => true,
            'data' => [
                'parent'         => $user,
                // Contrat frontend (cf. C4) : `enfants` est la clé attendue,
                // `children` reste en alias pour l'application mobile.
                'enfants'        => $enfants,
                'children'       => $children->map(function ($child) use ($rangsParClasse) {
                    return [
                        'id'      => $child->id,
                        'name'    => $child->user->name ?? 'N/A',
                        'class'   => $child->classe->nom_classe ?? 'N/A',
                        'matricule' => $child->numero_matricule ?? 'N/A',
                        'role'    => $child->pivot?->role ?? null,
                        'is_primary'  => (bool) ($child->pivot?->is_primary ?? false),
                        'is_guardian' => (bool) ($child->pivot?->is_guardian ?? false),
                        'moyenne_generale' => $this->calculateAverage($child->notes),
                        'rang'    => $rangsParClasse[$child->classe_id][$child->id] ?? null,
                    ];
                }),
                'stats'          => $stats,
                'evolution'      => $evolution,
                'communications' => $communications,
            ],
        ]);
    }

    /**
     * Moyenne par mois et par enfant sur les 6 derniers mois.
     * Retourne des lignes `{ mois, <prénom de l'enfant>: moyenne }` — le front
     * construit ses aires de façon dynamique sur ces clés.
     */
    private function parentEvolution($children)
    {
        $moisCourts = [1 => 'Jan', 2 => 'Fév', 3 => 'Mar', 4 => 'Avr', 5 => 'Mai', 6 => 'Juin',
                       7 => 'Juil', 8 => 'Août', 9 => 'Sep', 10 => 'Oct', 11 => 'Nov', 12 => 'Déc'];

        $rows = [];
        for ($i = 5; $i >= 0; $i--) {
            $mois = now()->startOfMonth()->subMonths($i);
            $rows[$mois->format('Y-m')] = ['mois' => $moisCourts[(int) $mois->format('n')]];
        }

        foreach ($children as $child) {
            $prenom = $child->user->prenom ?: $child->user->name ?: 'Enfant ' . $child->id;
            $parMois = $child->notes
                ->filter(fn ($note) => $note->created_at && $note->created_at->gte(now()->startOfMonth()->subMonths(6)))
                ->groupBy(fn ($note) => $note->created_at->format('Y-m'));

            foreach ($parMois as $cle => $groupe) {
                if (!isset($rows[$cle])) {
                    continue;
                }
                $rows[$cle][$prenom] = round($groupe->avg('note'), 2);
            }
        }

        return array_values($rows);
    }

    /**
     * Dashboard Élève — données réelles
     */
    public function eleve(Request $request)
    {
        $user = $request->user();
        $eleve = $user->eleve;

        if (!$eleve) {
            return response()->json(['success' => false, 'message' => 'Profil élève non trouvé'], 404);
        }

        $notes = \App\Models\Notes::where('eleve_id', $eleve->id)
            ->with('matiere')
            ->get();

        $moyenneGenerale = $notes->avg('note');
        $absences = \App\Models\Absence::where('eleve_id', $eleve->id)
            ->whereMonth('date', now()->month)
            ->count();

        $notesByMatiere = $notes->groupBy('matiere.nom')->map(function ($group, $nom) {
            return [
                'name' => $nom,
                'note' => round($group->avg('note'), 2),
                'coeff' => $group->first()->matiere->coefficient ?? 1,
            ];
        })->values();

        $emploiDuTemps = \App\Models\EmploiDuTemps::where('classe_id', $eleve->classe_id)
            ->with(['matiere', 'enseignant.user'])
            ->orderBy('jour')
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'eleve' => [
                    'id' => $eleve->id,
                    'nom' => $user->name,
                    'prenom' => $user->prenom,
                    'classe' => $eleve->classe->nom_classe ?? null,
                    'matricule' => $eleve->numero_matricule,
                ],
                'stats' => [
                    'moyenne_generale' => $moyenneGenerale ? round($moyenneGenerale, 2) : null,
                    'total_notes' => $notes->count(),
                    'absences_mois' => $absences,
                ],
                'matieres' => $notesByMatiere,
                'emploi_du_temps' => $emploiDuTemps,
            ],
        ]);
    }

    /**
     * Dashboard Admin — données réelles
     */
    public function admin()
    {
        $ecoleId = auth()->user()?->ecole_id ?? 'global';
        $data = \Illuminate\Support\Facades\Cache::remember('dashboard_admin_' . $ecoleId, 120, function () {
            $totalEcoles = \App\Models\Ecole::count();
            $totalUsers = User::count();
            $activeUsers = User::where('is_active', true)->count();
            $tauxActivite = $totalUsers > 0 ? round(($activeUsers / $totalUsers) * 100) : 0;

            $nouveautesSemaine = User::where('created_at', '>=', now()->subWeek())->count();
            $plansActifs = class_exists(\App\Models\SaaS\Plan::class) ? \App\Models\SaaS\Plan::where('is_active', true)->count() : 0;
            $modulesActifs = class_exists(\App\Models\SaaS\Module::class) ? \App\Models\SaaS\Module::where('is_active', true)->count() : 0;

            $revenus = 0;
            if (class_exists(\App\Models\Universite\Paiement::class)) {
                $revenus = \App\Models\Universite\Paiement::whereMonth('created_at', now()->month)
                    ->whereYear('created_at', now()->year)
                    ->sum('montant');
            }

            $repartitionRoles = User::selectRaw('role, COUNT(*) as total')
                ->groupBy('role')
                ->pluck('total', 'role')
                ->map(fn($v, $k) => ['name' => ucfirst($k), 'value' => $v])
                ->values();

            $activitesRecentes = collect();
            if (class_exists(\App\Models\AuditLog::class)) {
                $activitesRecentes = \App\Models\AuditLog::with('user')->latest()->take(10)->get()->map(function ($log) {
                    return [
                        'id'          => $log->id,
                        'type'        => $log->event ?? 'action',
                        'description' => $log->description ?? ($log->event . ' par ' . ($log->user->name ?? 'inconnu')),
                        'date'        => $log->created_at?->toISOString(),
                    ];
                });
            }

            return [
                'stats' => [
                    ['title' => 'Total Ecoles', 'value' => (string) $totalEcoles, 'trend' => 0, 'trendLabel' => 'etablissements'],
                    ['title' => 'Utilisateurs', 'value' => number_format($totalUsers), 'trend' => 0, 'trendLabel' => 'inscrits'],
                    ['title' => "Taux d'Activite", 'value' => "{$tauxActivite}%", 'trend' => 0, 'trendLabel' => 'actifs'],
                ],
                'repartition_roles' => $repartitionRoles,
                'ecoles'            => $totalEcoles,
                'utilisateurs'      => $totalUsers,
                'taux_activite'     => $tauxActivite,
                'plans_actifs'      => $plansActifs,
                'modules_actifs'    => $modulesActifs,
                'revenus'           => $revenus,
                'nouveautes_semaine' => $nouveautesSemaine,
                'activites_recentes' => $activitesRecentes,
            ];
        });

        return response()->json(['success' => true, 'data' => $data]);
    }

    /**
     * Dashboard Université — données réelles depuis les tables universitaires
     */
    public function universite()
    {
        $ecoleId = auth()->user()?->ecole_id ?? 'global';
        $data = \Illuminate\Support\Facades\Cache::remember('dashboard_universite_' . $ecoleId, 300, function () {
            $facultesModel = \App\Models\Universite\Faculte::class;
            $departementsModel = \App\Models\Universite\Departement::class;
            $etudiantsModel = \App\Models\Universite\Etudiant::class;
            $enseignantsModel = \App\Models\Universite\Enseignant::class;
            $inscriptionsModel = \App\Models\Universite\Inscription::class;

            $facultesCount = $facultesModel::count();
            $departementsCount = $departementsModel::count();
            $enseignantsCount = $enseignantsModel::count();
            $etudiantsCount = $etudiantsModel::count();

            $totalInscrits = $inscriptionsModel::count();

            // Inscriptions par année académique
            $anneeModel = \App\Models\Universite\AnneeAcademique::class;
            $inscriptionsParAnnee = $anneeModel::withCount('inscriptions')
                ->orderBy('date_debut', 'desc')
                ->take(5)
                ->get()
                ->map(fn($a) => [
                    'annee' => $a->libelle ?? $a->annee,
                    'inscriptions' => $a->inscriptions_count,
                    'diplomes' => $a->diplomes_count ?? null,
                ]);

            // Stats par faculté
            $facultes = $facultesModel::withCount(['departements'])
                ->get()
                ->map(function ($f) use ($etudiantsModel) {
                    $deptIds = $f->departements->pluck('id');
                    $filiereIds = \App\Models\Universite\Filiere::whereIn('departement_id', $deptIds)->pluck('id');
                    $etudiantsCount = $etudiantsModel::whereIn('filiere_id', $filiereIds)->count();
                    return [
                        'nom' => $f->nom,
                        'etudiants' => $etudiantsCount,
                        'enseignants' => $f->enseignants_count ?? 0,
                        'departements' => $f->departements_count,
                    ];
                })->values();

            // Activités récentes (dernières inscriptions)
            $recentInscriptions = $inscriptionsModel::with('etudiant')
                ->latest('date_inscription')
                ->take(5)
                ->get()
                ->map(fn($i) => [
                    'id' => $i->id,
                    'type' => 'inscription',
                    'message' => "Nouvel étudiant inscrit — {$i->etudiant?->prenom} {$i->etudiant?->nom}",
                    'temps' => $i->date_inscription ? $i->date_inscription->diffForHumans() : null,
                ]);

            return [
                'stats' => [
                    ['title' => 'Facultés', 'value' => (string) $facultesCount, 'trend' => 0, 'trendLabel' => 'ce semestre'],
                    ['title' => 'Départements', 'value' => (string) $departementsCount, 'trend' => 0, 'trendLabel' => 'total'],
                    ['title' => 'Enseignants', 'value' => number_format($enseignantsCount), 'trend' => 0, 'trendLabel' => 'en activité'],
                    ['title' => 'Étudiants', 'value' => number_format($etudiantsCount), 'trend' => 0, 'trendLabel' => 'inscrits'],
                ],
                'inscriptions' => $inscriptionsParAnnee->isNotEmpty()
                    ? $inscriptionsParAnnee
                    : [['annee' => 'Aucune donnée', 'inscriptions' => 0, 'diplomes' => null]],
                'facultes' => $facultes->isNotEmpty()
                    ? $facultes
                    : [['nom' => 'Aucune faculté', 'etudiants' => 0, 'enseignants' => 0, 'departements' => 0]],
                'activites' => $recentInscriptions->isNotEmpty()
                    ? $recentInscriptions
                    : [['id' => 0, 'type' => 'info', 'message' => 'Aucune activité récente', 'temps' => null]],
            ];
        });

        return response()->json(['success' => true, 'data' => $data, 'cached' => true]);
    }

    // ─── STAFF DASHBOARDS (6 rôles — R4) ────────────────────────────

    /** Libellés courts français des mois, indexés 1..12. */
    private function moisLabels(): array
    {
        return ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
    }

    /** Les 6 derniers mois glissants au format Y-m, avec leur libellé. */
    private function sixDerniersMois(): array
    {
        $labels = $this->moisLabels();
        $mois = [];
        for ($i = 5; $i >= 0; $i--) {
            $m = now()->startOfMonth()->subMonths($i);
            $mois[$m->format('Y-m')] = $labels[$m->month - 1];
        }

        return $mois;
    }

    /** Prénom + nom d'un élève, proprement concaténés. */
    private function nomEleve($eleve): string
    {
        if (!$eleve) {
            return '—';
        }

        return trim(($eleve->user?->name ?? '') . ' ' . ($eleve->user?->prenom ?? ''));
    }

    /**
     * Dashboard Comptable — données réelles
     */
    public function comptable()
    {
        $data = \Illuminate\Support\Facades\Cache::remember('dashboard_comptable_' . auth()->id(), 120, function () {
            $moisActuel = now()->month;
            $anneeActuelle = now()->year;

            $revenusMois = (float) \App\Models\PaiementEleve::whereMonth('date_paiement', $moisActuel)
                ->whereYear('date_paiement', $anneeActuelle)
                ->where('statut_global', \App\Models\PaiementEleve::PAID)
                ->sum('montant');

            $enAttente = \App\Models\PaiementEleve::whereIn('statut_global', [
                \App\Models\PaiementEleve::PENDING,
                \App\Models\PaiementEleve::PARTIAL,
            ])->count();

            $totalPaiements = \App\Models\PaiementEleve::whereMonth('date_paiement', $moisActuel)->count();
            $payes = \App\Models\PaiementEleve::whereMonth('date_paiement', $moisActuel)
                ->where('statut_global', \App\Models\PaiementEleve::PAID)->count();
            $tauxRecouvrement = $totalPaiements > 0 ? round(($payes / $totalPaiements) * 100) : 0;

            $depensesMois = (float) \App\Models\Depense::whereMonth('date_depense', $moisActuel)
                ->whereYear('date_depense', $anneeActuelle)->sum('montant');

            // Évolution des finances — 6 derniers mois (revenus + dépenses)
            $paiements = \App\Models\PaiementEleve::whereBetween('date_paiement', [
                now()->startOfMonth()->subMonths(5), now()->endOfMonth(),
            ])->where('statut_global', \App\Models\PaiementEleve::PAID)->get();

            $depenses = \App\Models\Depense::whereBetween('date_depense', [
                now()->startOfMonth()->subMonths(5), now()->endOfMonth(),
            ])->get();

            $revenusParMois = $paiements->groupBy(fn ($p) => $p->date_paiement?->format('Y-m'))
                ->map(fn ($g) => (float) $g->sum('montant'));

            $depensesParMois = $depenses->groupBy(fn ($d) => $d->date_depense?->format('Y-m'))
                ->map(fn ($g) => (float) $g->sum('montant'));

            $donneesMensuelles = [];
            foreach ($this->sixDerniersMois() as $cle => $label) {
                $donneesMensuelles[] = [
                    'mois' => $label,
                    'revenus' => $revenusParMois->get($cle, 0),
                    'depenses' => $depensesParMois->get($cle, 0),
                ];
            }

            // Répartition par type de paiement (en %)
            $types = \App\Models\PaiementEleve::select('type_paiement')
                ->whereNotNull('type_paiement')
                ->get()
                ->groupBy('type_paiement');

            $totalTypes = max($types->flatten()->count(), 1);
            $repartition = $types->map(fn ($g, $nom) => [
                'name' => $nom,
                'value' => round(($g->count() / $totalTypes) * 100),
            ])->values();

            $statutsFR = [
                \App\Models\PaiementEleve::PAID => 'Payée',
                \App\Models\PaiementEleve::PARTIAL => 'Partiel',
                \App\Models\PaiementEleve::PENDING => 'En attente',
            ];

            $dernieresPaiements = \App\Models\PaiementEleve::with(['eleve.user', 'eleve.classe'])
                ->latest('date_paiement')
                ->take(10)
                ->get()
                ->map(fn ($p) => [
                    'id' => $p->id,
                    'eleve' => $this->nomEleve($p->eleve),
                    'classe' => $p->eleve?->classe?->nom_classe,
                    'montant' => (float) $p->montant,
                    'statut' => $statutsFR[$p->statut_global] ?? 'En attente',
                    'echeance' => $p->date_paiement?->format('d/m/Y'),
                ]);

            return [
                'stats' => [
                    ['title' => 'Revenus du Mois', 'value' => number_format($revenusMois, 0, ',', ' ') . ' F', 'trend' => 0, 'trendLabel' => 'ce mois'],
                    ['title' => 'Factures en Attente', 'value' => (string) $enAttente, 'trend' => 0, 'trendLabel' => 'non soldées'],
                    ['title' => 'Taux Recouvrement', 'value' => "{$tauxRecouvrement}%", 'trend' => 0, 'trendLabel' => 'ce mois'],
                    ['title' => 'Dépenses du Mois', 'value' => number_format($depensesMois, 0, ',', ' ') . ' F', 'trend' => 0, 'trendLabel' => 'ce mois'],
                ],
                'donnes_ca' => $donneesMensuelles,
                'repartition' => $repartition,
                'factures' => $dernieresPaiements,
            ];
        });

        return response()->json(['success' => true, 'data' => $data]);
    }

    /**
     * Dashboard Surveillant — données réelles
     */
    public function surveillant()
    {
        $data = \Illuminate\Support\Facades\Cache::remember('dashboard_surveillant_' . auth()->id(), 60, function () {
            $totalEleves = \App\Models\Eleve::count();

            $absentsAujourdhui = \App\Models\Absence::whereDate('date', today())
                ->where('type', 'absence')->count();
            $presents = max($totalEleves - $absentsAujourdhui, 0);

            $alertes = \App\Models\Incident::whereIn('statut', ['ouvert', 'en_cours'])->count();

            // Présences de la semaine (lundi → dimanche)
            $joursSemaine = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
            $absencesSemaine = \App\Models\Absence::where('type', 'absence')
                ->whereBetween('date', [now()->startOfWeek(), now()->endOfWeek()])
                ->get()
                ->groupBy(fn ($a) => $a->date?->format('Y-m-d'));

            $presencesSemaine = [];
            foreach (range(0, 6) as $i) {
                $jour = now()->startOfWeek()->addDays($i)->format('Y-m-d');
                $absentsJour = $absencesSemaine->get($jour)?->count() ?? 0;
                $presencesSemaine[] = [
                    'jour' => $joursSemaine[$i],
                    'presents' => max($totalEleves - $absentsJour, 0),
                    'absents' => $absentsJour,
                ];
            }

            // Points de surveillance : une zone par cycle réellement présent
            $points = \App\Models\Classes::select('categorie_classe')
                ->distinct()
                ->get()
                ->map(function ($classe) {
                    $personnels = \App\Models\Enseignant::whereHas('classes', fn ($q) => $q->where('categorie_classe', $classe->categorie_classe))->count();

                    return [
                        'zone' => $classe->categorie_classe,
                        'personnels' => $personnels,
                        'etat' => $personnels > 0 ? 'Actif' : 'Inactif',
                    ];
                })->values();

            $derniersRetards = \App\Models\Absence::with(['eleve.user', 'eleve.classe'])
                ->where('type', 'retard')
                ->latest('date')
                ->take(10)
                ->get()
                ->map(function ($a) {
                    $recurrent = \App\Models\Absence::where('eleve_id', $a->eleve_id)
                        ->where('type', 'retard')
                        ->where('date', '>=', now()->subDays(30))
                        ->count() >= 2;

                    return [
                        'id' => $a->id,
                        'eleve' => $this->nomEleve($a->eleve),
                        'classe' => $a->eleve?->classe?->nom_classe,
                        'temps' => $a->date?->format('d/m/Y'),
                        'motif' => $a->motif,
                        'recurrent' => $recurrent,
                    ];
                });

            return [
                'stats' => [
                    ['title' => 'Total Élèves', 'value' => (string) $totalEleves, 'trend' => 0],
                    ['title' => 'Présents Aujourd\'hui', 'value' => (string) $presents, 'trend' => 0],
                    ['title' => 'Absents', 'value' => (string) $absentsAujourdhui, 'trend' => 0],
                    ['title' => 'Alertes', 'value' => (string) $alertes, 'trend' => 0],
                ],
                'presences_semaine' => $presencesSemaine,
                'points_surveillance' => $points,
                'retards' => $derniersRetards,
            ];
        });

        return response()->json(['success' => true, 'data' => $data]);
    }

    /**
     * Dashboard Censeur — données réelles
     */
    public function censeur()
    {
        $data = \Illuminate\Support\Facades\Cache::remember('dashboard_censeur_' . auth()->id(), 120, function () {
            $totalEleves = \App\Models\Eleve::count();
            $sanctionsMois = \App\Models\Sanction::whereMonth('date', now()->month)
                ->whereYear('date', now()->year)->count();
            $absencesNonJustifiees = \App\Models\Absence::where('justifiee', false)
                ->where('type', 'absence')
                ->whereMonth('date', now()->month)->count();
            $avertissements = \App\Models\Sanction::where('type_sanction', 'like', '%Avertissement%')
                ->whereMonth('date', now()->month)->count();

            // Évolution disciplinaire — 6 derniers mois (sanctions + avertissements)
            $sanctions = \App\Models\Sanction::whereBetween('date', [
                now()->startOfMonth()->subMonths(5), now()->endOfMonth(),
            ])->get()->groupBy(fn ($s) => $s->date?->format('Y-m'));

            $evolution = [];
            foreach ($this->sixDerniersMois() as $cle => $label) {
                $groupe = $sanctions->get($cle, collect());
                $evolution[] = [
                    'mois' => $label,
                    'sanctions' => $groupe->count(),
                    'avertissements' => $groupe->filter(fn ($s) => str_contains($s->type_sanction, 'Avertissement'))->count(),
                ];
            }

            // Répartition par type de sanction (en %)
            $types = \App\Models\Sanction::select('type_sanction')->get()->groupBy('type_sanction');
            $totalTypes = max($types->flatten()->count(), 1);
            $typesSanctions = $types->map(fn ($g, $nom) => [
                'name' => $nom,
                'value' => round(($g->count() / $totalTypes) * 100),
            ])->values();

            $statutsFR = [
                'active' => 'En cours',
                'terminee' => 'Exécuté',
                'levee' => 'Levée',
            ];

            $dernieresSanctions = \App\Models\Sanction::with(['eleve.user', 'eleve.classe'])
                ->latest('date')
                ->take(10)
                ->get()
                ->map(fn ($s) => [
                    'id' => $s->id,
                    'eleve' => $this->nomEleve($s->eleve),
                    'classe' => $s->eleve?->classe?->nom_classe,
                    'motif' => $s->motif,
                    'sanction' => $s->type_sanction,
                    'date' => $s->date?->format('d/m/Y'),
                    'statut' => $statutsFR[$s->statut] ?? 'En cours',
                ]);

            return [
                'stats' => [
                    ['title' => 'Total Élèves', 'value' => (string) $totalEleves, 'trend' => 0],
                    ['title' => 'Sanctions du Mois', 'value' => (string) $sanctionsMois, 'trend' => 0],
                    ['title' => 'Absences Non Justifiées', 'value' => (string) $absencesNonJustifiees, 'trend' => 0],
                    ['title' => 'Avertissements', 'value' => (string) $avertissements, 'trend' => 0],
                ],
                'evolution' => $evolution,
                'types_sanctions' => $typesSanctions,
                'sanctions' => $dernieresSanctions,
            ];
        });

        return response()->json(['success' => true, 'data' => $data]);
    }

    /**
     * Dashboard Infirmier — données réelles
     */
    public function infirmier()
    {
        $data = \Illuminate\Support\Facades\Cache::remember('dashboard_infirmier_' . auth()->id(), 60, function () {
            $visitesMois = \App\Models\ConsultationMedicale::whereMonth('date', now()->month)
                ->whereYear('date', now()->year)->count();
            $visitesAujourdhui = \App\Models\ConsultationMedicale::whereDate('date', today())->count();
            $casUrgents = \App\Models\ConsultationMedicale::where('urgence', true)
                ->whereMonth('date', now()->month)->count();
            $consultations = \App\Models\ConsultationMedicale::count();

            // Fréquentation — 6 derniers mois (visites + urgences)
            $visites = \App\Models\ConsultationMedicale::whereBetween('date', [
                now()->startOfMonth()->subMonths(5), now()->endOfMonth(),
            ])->get()->groupBy(fn ($c) => $c->date?->format('Y-m'));

            $frequentation = [];
            foreach ($this->sixDerniersMois() as $cle => $label) {
                $groupe = $visites->get($cle, collect());
                $frequentation[] = [
                    'mois' => $label,
                    'visites' => $groupe->count(),
                    'urgences' => $groupe->filter(fn ($c) => $c->urgence)->count(),
                ];
            }

            // Motifs les plus fréquents — 5 derniers ce mois-ci
            $motifs = \App\Models\ConsultationMedicale::select('motif')
                ->whereMonth('date', now()->month)
                ->selectRaw('COUNT(*) as total')
                ->groupBy('motif')
                ->orderByDesc('total')
                ->take(5)
                ->get()
                ->map(fn ($m) => ['motif' => $m->motif, 'count' => $m->total]);

            $dernieresVisites = \App\Models\ConsultationMedicale::with(['eleve.user', 'eleve.classe'])
                ->latest('date')
                ->take(10)
                ->get()
                ->map(fn ($c) => [
                    'id' => $c->id,
                    'eleve' => $this->nomEleve($c->eleve),
                    'classe' => $c->eleve?->classe?->nom_classe,
                    'motif' => $c->motif,
                    'soin' => $c->traitement,
                    'statut' => $c->traitement ? 'Traité' : 'En cours',
                    'heure' => $c->date?->format('H:i'),
                ]);

            return [
                'stats' => [
                    ['title' => 'Visites du Mois', 'value' => (string) $visitesMois, 'trend' => 0, 'trendLabel' => 'ce mois'],
                    ['title' => 'En Cours', 'value' => (string) $visitesAujourdhui, 'trend' => 0, 'trendLabel' => 'aujourd\'hui'],
                    ['title' => 'Cas Urgents', 'value' => (string) $casUrgents, 'trend' => 0, 'trendLabel' => 'ce mois'],
                    ['title' => 'Consultations', 'value' => (string) $consultations, 'trend' => 0, 'trendLabel' => 'total'],
                ],
                'frequentation' => $frequentation,
                'motifs' => $motifs,
                'visites' => $dernieresVisites,
            ];
        });

        return response()->json(['success' => true, 'data' => $data]);
    }

    /**
     * Dashboard Bibliothécaire — données réelles
     */
    public function bibliothecaire()
    {
        $data = \Illuminate\Support\Facades\Cache::remember('dashboard_bibliothecaire_' . auth()->id(), 120, function () {
            $totalLivres = \App\Models\Livre::count();
            $empruntsEnCours = \App\Models\Emprunt::whereNull('date_retour_effective')->count();
            $retards = \App\Models\Emprunt::whereNull('date_retour_effective')
                ->where('date_retour_prevue', '<', today())->count();
            $membresActifs = \App\Models\Emprunt::distinct('eleve_id')->count('eleve_id');

            // Activité — 6 derniers mois (emprunts + retours)
            $emprunts = \App\Models\Emprunt::whereBetween('date_emprunt', [
                now()->startOfMonth()->subMonths(5), now()->endOfMonth(),
            ])->get();

            $empruntsParMois = $emprunts->groupBy(fn ($e) => $e->date_emprunt?->format('Y-m'))
                ->map(fn ($g) => $g->count());

            $retoursParMois = $emprunts->filter(fn ($e) => $e->date_retour_effective)
                ->groupBy(fn ($e) => $e->date_retour_effective->format('Y-m'))
                ->map(fn ($g) => $g->count());

            $activite = [];
            foreach ($this->sixDerniersMois() as $cle => $label) {
                $activite[] = [
                    'mois' => $label,
                    'emprunts' => $empruntsParMois->get($cle, 0),
                    'retours' => $retoursParMois->get($cle, 0),
                ];
            }

            // Répartition par catégorie d'ouvrage (en %)
            $categories = \App\Models\Livre::select('categorie')
                ->get()->groupBy('categorie');
            $totalCategories = max($categories->flatten()->count(), 1);
            $repartitionCategories = $categories->map(fn ($g, $nom) => [
                'name' => $nom,
                'value' => round(($g->count() / $totalCategories) * 100),
            ])->values();

            $derniersEmprunts = \App\Models\Emprunt::with(['eleve.user', 'eleve.classe', 'livre'])
                ->latest('date_emprunt')
                ->take(10)
                ->get()
                ->map(function ($e) {
                    $statut = $e->date_retour_effective
                        ? 'Retourné'
                        : ($e->date_retour_prevue?->lt(today()) ? 'En retard' : 'En cours');

                    return [
                        'id' => $e->id,
                        'eleve' => $this->nomEleve($e->eleve),
                        'classe' => $e->eleve?->classe?->nom_classe,
                        'ouvrage' => $e->livre?->titre,
                        'dateEmprunt' => $e->date_emprunt?->format('d/m/Y'),
                        'dateRetour' => $e->date_retour_prevue?->format('d/m/Y'),
                        'statut' => $statut,
                    ];
                });

            return [
                'stats' => [
                    ['title' => 'Total Ouvrages', 'value' => (string) $totalLivres, 'trend' => 0, 'trendLabel' => 'au catalogue'],
                    ['title' => 'Emprunts en Cours', 'value' => (string) $empruntsEnCours, 'trend' => 0],
                    ['title' => 'Retards', 'value' => (string) $retards, 'trend' => 0],
                    ['title' => 'Membres Actifs', 'value' => (string) $membresActifs, 'trend' => 0, 'trendLabel' => 'emprunteurs'],
                ],
                'activite' => $activite,
                'categories' => $repartitionCategories,
                'emprunts' => $derniersEmprunts,
            ];
        });

        return response()->json(['success' => true, 'data' => $data]);
    }

    /**
     * Dashboard Secrétaire — données réelles
     */
    public function secretaire()
    {
        $data = \Illuminate\Support\Facades\Cache::remember('dashboard_secretaire_' . auth()->id(), 120, function () {
            $totalInscriptions = \App\Models\Eleve::count();
            $nouveauxMois = \App\Models\Eleve::whereMonth('created_at', now()->month)->count();
            $dossiersEnCours = \App\Models\Certificat::where('delivre', false)->count();
            $documentsGeneres = \App\Models\Certificat::count();

            // Flux d'inscriptions — 6 derniers mois (nouveaux + transferts)
            $eleves = \App\Models\Eleve::whereBetween('created_at', [
                now()->startOfMonth()->subMonths(5), now()->endOfMonth(),
            ])->get()->groupBy(fn ($e) => $e->created_at?->format('Y-m'));

            $fluxInscriptions = [];
            foreach ($this->sixDerniersMois() as $cle => $label) {
                $fluxInscriptions[] = [
                    'mois' => $label,
                    'nouveaux' => $eleves->get($cle)?->count() ?? 0,
                    'transferts' => 0,
                ];
            }

            $statutsFR = [
                'programmé' => 'Programmé',
                'confirmé' => 'Confirmé',
                'annulé' => 'Annulé',
            ];

            $rendezVous = \App\Models\RendezVous::with(['parent.user', 'eleve.user', 'enseignant.user'])
                ->whereDate('date', today())
                ->latest()
                ->take(10)
                ->get()
                ->map(function ($r) {
                    $visiteur = $r->parent?->user
                        ?? $r->eleve?->user
                        ?? $r->enseignant?->user;

                    $statutsFR = ['programmé' => 'Programmé', 'confirmé' => 'Confirmé', 'annulé' => 'Annulé'];

                    return [
                        'id' => $r->id,
                        'visiteur' => trim(($visiteur?->name ?? '') . ' ' . ($visiteur?->prenom ?? '')) ?: 'Visiteur',
                        'motif' => $r->motif,
                        'heure' => $r->heure,
                        'statut' => $statutsFR[$r->statut] ?? $r->statut,
                    ];
                });

            $dernieresInscriptions = \App\Models\Eleve::with(['user', 'classe'])
                ->latest()
                ->take(10)
                ->get()
                ->map(fn ($e) => [
                    'id' => $e->id,
                    'nom' => trim(($e->user?->name ?? '') . ' ' . ($e->user?->prenom ?? '')),
                    'classe' => $e->classe?->nom_classe,
                    'type' => $e->created_at?->gte(now()->startOfMonth()) ? 'Nouveau' : 'Régulier',
                    'date' => $e->created_at?->format('d/m/Y'),
                    'statut' => 'Complété',
                ]);

            return [
                'stats' => [
                    ['title' => 'Inscriptions', 'value' => (string) $totalInscriptions, 'trend' => 0, 'trendLabel' => 'total'],
                    ['title' => 'Nouveaux ce Mois', 'value' => (string) $nouveauxMois, 'trend' => 0],
                    ['title' => 'Dossiers en Cours', 'value' => (string) $dossiersEnCours, 'trend' => 0, 'trendLabel' => 'certificats'],
                    ['title' => 'Documents Générés', 'value' => (string) $documentsGeneres, 'trend' => 0, 'trendLabel' => 'émis'],
                ],
                'flux_inscriptions' => $fluxInscriptions,
                'rendez_vous' => $rendezVous,
                'inscriptions' => $dernieresInscriptions,
            ];
        });

        return response()->json(['success' => true, 'data' => $data]);
    }

    private function calculateAverage($notes)
    {
        if ($notes->isEmpty()) return null;

        return $notes->avg('note');
    }

    private function computeMonthlyEnrollment(): array
    {
        // Tente de récupérer les inscriptions par mois depuis la base
        try {
            $eleves = \App\Models\Eleve::selectRaw('MONTH(created_at) as mois, COUNT(*) as total')
                ->whereYear('created_at', now()->year)
                ->groupBy('mois')
                ->pluck('total', 'mois')
                ->toArray();

            $months = ['Sept', 'Oct', 'Nov', 'Déc', 'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août'];

            return array_map(function ($i) use ($months, $eleves) {
                return [
                    'name' => $months[$i - 1] ?? "Mois $i",
                    'students' => $eleves[$i] ?? 0,
                ];
            }, range(1, 12));
        } catch (\Exception $e) {
            $this->rethrowIfMeaningful($e);
            return [
                ['name' => 'Aucune', 'students' => 0],
            ];
        }
    }

    private function computeGradeDistribution(): array
    {
        try {
            $excellent = \App\Models\Notes::where('note', '>=', 16)->count();
            $bien = \App\Models\Notes::whereBetween('note', [14, 15.99])->count();
            $moyen = \App\Models\Notes::whereBetween('note', [10, 13.99])->count();
            $insuffisant = \App\Models\Notes::where('note', '<', 10)->count();

            return [
                ['name' => 'Excellent', 'value' => $excellent ?: 0],
                ['name' => 'Bien', 'value' => $bien ?: 0],
                ['name' => 'Moyen', 'value' => $moyen ?: 0],
                ['name' => 'Insuffisant', 'value' => $insuffisant ?: 0],
            ];
        } catch (\Exception $e) {
            $this->rethrowIfMeaningful($e);
            return [
                ['name' => 'Aucune donnée', 'value' => 0],
            ];
        }
    }
}