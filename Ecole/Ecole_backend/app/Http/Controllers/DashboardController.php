<?php

namespace App\Http\Controllers;

use App\Models\{User, Eleve, Classes, Notes, Matieres, Message};
use App\Support\CalendrierOfficiel;
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

    /** Clé de cache du référentiel, par école résolue (cf. audit empoisonnement). */
    private function directoryCacheKey(): string
    {
        return 'dashboard_directeur_' . (\App\Models\Eleve::currentEcoleId() ?? 'global');
    }

    public function directeur()
    {
        return response()->json([
            'success' => true,
            'data' => [
                'total_eleves' => Eleve::count(),
                'total_classes' => Classes::count(),
                // Profils enseignants scopés à l'école résolue. L'ancien compte
                // filtrait `users.role = 'enseignant'` sur `user->ecole_id` brut :
                // pour un super-admin (null), il renvoyait 0 enseignant même en
                // ciblant un établissement (cf. audit P3).
                'total_enseignants' => \App\Models\Enseignant::count(),
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
            // ─── KPI financiers du directeur (compteur, pas la compta) ───
            $revenusMois = (float) \App\Models\PaiementEleve::whereMonth('date_paiement', now()->month)
                ->whereYear('date_paiement', now()->year)
                ->where('statut_global', \App\Models\PaiementEleve::PAID)
                ->sum('montant');
            $depensesMois = (float) \App\Models\Depense::whereMonth('date_depense', now()->month)
                ->whereYear('date_depense', now()->year)
                ->sum('montant');
            $impayes = (float) \App\Models\PaiementEleve::where('montant_restant', '>', 0)
                ->sum('montant_restant');

            // ─── Assiduité (taux de présence du jour) ────────────────────
            $totalEleves = Eleve::count();
            $absentsAujourdhui = \App\Models\Absence::whereDate('date', today())
                ->where('type', 'absence')
                ->distinct('eleve_id')
                ->count('eleve_id');
            $tauxPresence = $totalEleves > 0
                ? max(0, 100 - (int) round(($absentsAujourdhui / $totalEleves) * 100))
                : 100;

            // ─── Alertes : incidents ouverts + sanctions du mois ─────────
            $incidentsOuverts = \App\Models\Incident::whereIn('statut', ['ouvert', 'en_cours'])->count();
            $sanctionsMois = \App\Models\Sanction::whereMonth('date', now()->month)
                ->whereYear('date', now()->year)->count();

            // ─── Messages récents adressés à l'établissement ─────────────
            $messagesRecents = \App\Models\Message::latest()
                ->take(5)
                ->get()
                ->map(fn ($m) => [
                    'id'        => $m->id,
                    'sujet'     => $m->sujet,
                    'expediteur'=> $m->expediteur ?? 'École',
                    'date'      => $m->created_at?->format('d/m/Y'),
                ]);

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
                    'total_enseignants' => \App\Models\Enseignant::count(),
                    'evolution_effectifs' => $this->computeMonthlyEnrollment(),
                    'repartition_notes' => $this->computeGradeDistribution(),
                ],
                'finances' => [
                    'revenus_mois' => $revenusMois,
                    'depenses_mois' => $depensesMois,
                    'impayes' => $impayes,
                ],
                'assiduite' => [
                    'taux_presence' => $tauxPresence,
                    'absents_aujourdhui' => $absentsAujourdhui,
                ],
                'alertes' => [
                    'incidents_ouverts' => $incidentsOuverts,
                    'sanctions_mois' => $sanctionsMois,
                ],
                'messages_recents' => $messagesRecents,
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

        if (!$enseignant) {
            return response()->json(['success' => false, 'message' => 'Profil enseignant non trouvé'], 404);
        }

        // Classes et matières de l'enseignant (via le pivot enseignant_matiere)
        $classeIds = $enseignant->classes()->pluck('classes.id');
        $matiereIds = $enseignant->matieres()->pluck('matieres.id');

        // Effectif total = élèves des classes de l'enseignant (distinct)
        $totalEleves = $classeIds->isEmpty()
            ? 0
            : \App\Models\Eleve::whereIn('classe_id', $classeIds)->count();

        // Emploi du temps de la semaine : créneaux de l'enseignant, triés avec
        // aujourd'hui en tête (le front affiche `planning[0]` comme « Aujourd'hui »).
        $jours = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
        $coursSemaine = \App\Models\EmploiDuTemps::with(['matiere:id,nom', 'classe:id,nom_classe'])
            ->where('enseignant_id', $enseignant->id)
            ->orderBy('jour')
            ->orderBy('heure_debut')
            ->get()
            ->groupBy('jour');

        $aujourdhui = $jours[now()->dayOfWeekIso - 1] ?? 'Lundi';
        $emploiTemps = $coursSemaine->keys()->contains($aujourdhui)
            ? collect([$aujourdhui])->merge($coursSemaine->keys()->filter(fn ($j) => $j !== $aujourdhui))
                ->mapWithKeys(fn ($j) => [$j => $coursSemaine->get($j)])
            : $coursSemaine;

        $emploiTemps = $emploiTemps->map(function ($cours, $jour) {
            return [
                'jour' => $jour,
                'cours' => $cours->map(function ($c) {
                    return [
                        'heure' => ($c->heure_debut?->format('H') ?? '') . 'h' . $c->heure_debut?->format('i'),
                        'fin'   => $c->heure_fin?->format('H:i'),
                        'matiere' => $c->matiere?->nom ?? '—',
                        'classe'  => $c->classe?->nom_classe ?? '—',
                        'salle'   => $c->salle,
                    ];
                })->values(),
            ];
        })->values();

        // Notes liées à l'enseignant via ses (classe, matière) — 10 dernières.
        $notes = \App\Models\Notes::with(['eleve.user:id,name,prenom', 'eleve.classe:id,nom_classe', 'matiere:id,nom'])
            ->whereIn('classe_id', $classeIds)
            ->whereIn('matiere_id', $matiereIds)
            ->latest('date_evaluation')
            ->take(10)
            ->get();

        $notesRecentees = $notes->map(function ($note) {
            return [
                'id'           => $note->id,
                'eleve'        => $this->nomEleve($note->eleve),
                'classe'       => $note->eleve?->classe?->nom_classe ?? '—',
                'matiere'      => $note->matiere?->nom ?? '—',
                'note'         => (float) $note->note,
                'date'         => $note->date_evaluation?->format('d/m/Y') ?? $note->created_at?->format('d/m/Y'),
                'appreciation' => $this->appreciationNote($note->note),
            ];
        });

        // Moyenne de classe : moyenne des notes saisies par l'enseignant
        // sur ses (classe, matière) — période en cours.
        $moyenneClasse = $notes->count() > 0 ? round($notes->avg('note'), 2) : null;

        // Devoirs à corriger : devoirs de l'enseignant dont l'échéance est
        // passée ou sans échéance, encore publiés.
        $devoirsACorriger = $classeIds->isEmpty()
            ? collect()
            : \App\Models\Devoir::with(['classe:id,nom_classe'])
                ->where('enseignant_id', $enseignant->id)
                ->whereIn('classe_id', $classeIds)
                ->where('publie', true)
                ->where(function ($q) {
                    $q->whereNull('date_limite')
                        ->orWhere('date_limite', '<=', now());
                })
                ->take(5)
                ->get();

        $devoirs = $devoirsACorriger->map(fn ($d) => [
            'id'     => $d->id,
            'titre'  => $d->titre,
            'classe' => $d->classe?->nom_classe ?? '—',
            'date'   => $d->date_limite?->format('d/m/Y') ?? '—',
            'etat'   => 'à préparer',
        ]);

        // Devoirs à venir cette semaine pour la carte « Devoirs & Évaluations »
        $devoirsAVenir = $classeIds->isEmpty()
            ? collect()
            : \App\Models\Devoir::with(['classe:id,nom_classe'])
                ->where('enseignant_id', $enseignant->id)
                ->whereIn('classe_id', $classeIds)
                ->where('publie', true)
                ->where('date_limite', '>', now())
                ->orderBy('date_limite')
                ->take(5)
                ->get()
                ->map(fn ($d) => [
                    'id'     => $d->id,
                    'titre'  => $d->titre,
                    'classe' => $d->classe?->nom_classe ?? '—',
                    'date'   => $d->date_limite?->format('d/m/Y') ?? '—',
                    'etat'   => 'à venir',
                ]);

        $coursSemaineCount = $coursSemaine->flatten(1)->count();

        return response()->json([
            'success' => true,
            'data' => [
                'stats' => [
                    ['title' => 'Mes Élèves', 'value' => (string) $totalEleves, 'trend' => 0, 'trendLabel' => 'dans mes classes'],
                    ['title' => 'Cours Cette Semaine', 'value' => (string) $coursSemaineCount, 'trend' => 0, 'trendLabel' => 'créneaux planifiés'],
                    ['title' => 'Moyenne Classe', 'value' => $moyenneClasse !== null ? number_format($moyenneClasse, 2, ',', ' ') : '—', 'trend' => 0, 'trendLabel' => 'mes notes'],
                    ['title' => 'Devoirs à Corriger', 'value' => (string) $devoirs->count(), 'trend' => 0, 'trendLabel' => 'échéance atteinte'],
                ],
                'emploi_temps' => $emploiTemps,
                'devoirs' => $devoirsAVenir,
                'notes_recentes' => $notesRecentees,
                'classes' => $enseignant->classes()->with('eleves')->get(),
                'matieres' => $enseignant->matieres,
            ],
        ]);
    }

    /** Appréciation d'une note selon les mêmes seuils que computeGradeDistribution. */
    private function appreciationNote(float $note): string
    {
        return match (true) {
            $note >= 16 => 'Excellent',
            $note >= 14 => 'Bien',
            $note >= 10 => 'Moyen',
            default     => 'À améliorer',
        };
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
        // Assiduité rapportée au nombre réel de jours de classe du mois
        // (calendrier officiel : jours ouvrés moins jours fériés), au lieu de
        // la division arbitraire par 22 jours. Hors période de classe (vacances
        // de juillet/août) la référence est nulle → assiduité indéterminée.
        $joursScolaires = CalendrierOfficiel::joursScolairesDuMois(now()->year, now()->month);
        $assiduite = $children->isNotEmpty() && $joursScolaires > 0
            ? max(0, 100 - (int) round(($absencesMois / ($children->count() * $joursScolaires)) * 100))
            : null;
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
        // Le filtre année manquait : oùMonth seul additionnait le même mois sur
        // toutes les années (cf. audit P3).
        $absences = \App\Models\Absence::where('eleve_id', $eleve->id)
            ->whereMonth('date', now()->month)
            ->whereYear('date', now()->year)
            ->count();

        // Coefficients réels par (matière, classe, série). `matiere->coefficient`
        // n'existe pas (la colonne vit sur `coefficient_matieres`), donc l'ancien
        // code affichait toujours le repli `?? 1` (cf. audit P3).
        $coefficients = \App\Models\Coefficients::where('classe_id', $eleve->classe_id)
            ->where('serie_id', $eleve->serie_id)
            ->pluck('coefficient', 'matiere_id');

        $notesByMatiere = $notes->groupBy('matiere.nom')->map(function ($group, $nom) use ($coefficients) {
            return [
                'name' => $nom,
                'note' => round($group->avg('note'), 2),
                'coeff' => $coefficients[$group->first()->matiere_id] ?? 1,
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
        $ecoleId = \App\Models\Eleve::currentEcoleId() ?? 'global';

        $debut = microtime(true);
        $data = \Illuminate\Support\Facades\Cache::remember('dashboard_admin_' . $ecoleId, 120, function () {
            // ─── Utilisateurs & plateforme ───────────────────────────
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

            // ─── Trafic API (7 derniers jours) ───────────────────────
            // Aucune table de journalisation HTTP n'existe ; on proxifie le
            // trafic par les actions auditées du jour, et le temps de réponse
            // de l'endpoint lui-même est mesuré hors cache (voir ci-dessous).
            $traffic = collect(range(6, 0))->map(function ($offset) {
                $jour = now()->subDays($offset)->format('Y-m-d');
                $req = class_exists(\App\Models\AuditLog::class)
                    ? \App\Models\AuditLog::whereDate('created_at', $jour)->count()
                    : 0;
                return ['jour' => $jour, 'req' => $req, 'temps' => 0];
            })->values();

            // ─── Santé système (valeurs réelles du serveur PHP) ──────
            $freeDisk  = function_exists('disk_free_space') ? disk_free_space(base_path()) : false;
            $totalDisk = function_exists('disk_total_space') ? disk_total_space(base_path()) : false;
            $diskUsage = ($freeDisk && $totalDisk) ? (int) round((1 - $freeDisk / $totalDisk) * 100) : 0;
            $diskLabel = ($freeDisk && $totalDisk) ? number_format($freeDisk / 1024 / 1024, 0, ',', ' ') . ' Mo libres' : '—';

            $memLimit = ini_get('memory_limit');
            $memPct = 0;
            if ($memLimit && strcasecmp($memLimit, '-1') !== 0) {
                $parsed = preg_replace_callback('/(\d+)([GMK])/i', function ($m) {
                    $mul = ['K' => 1024, 'M' => 1024 ** 2, 'G' => 1024 ** 3];
                    return $mul[strtoupper($m[2])] * $m[1];
                }, $memLimit);
                $memPct = $parsed > 0 ? (int) round((memory_get_usage(true) / $parsed) * 100) : 0;
            }

            $uptime = null;
            if (is_readable('/proc/uptime') && ($boot = (float) file_get_contents('/proc/uptime'))) {
                $uptime = floor($boot / 86400) . 'j ' . floor(($boot % 86400) / 3600) . 'h';
            }

            $health = [
                ['label' => 'Disque', 'value' => $diskUsage . '%', 'width' => $diskUsage . '%', 'color' => $diskUsage > 85 ? 'bg-[var(--red)]' : ($diskUsage > 70 ? 'bg-[var(--amber)]' : 'bg-[var(--accent)]')],
                ['label' => 'Mémoire PHP', 'value' => $memPct . '%', 'width' => $memPct . '%', 'color' => $memPct > 85 ? 'bg-[var(--red)]' : ($memPct > 70 ? 'bg-[var(--amber)]' : 'bg-[var(--emerald)]')],
                ['label' => 'Base de données', 'value' => 'connectée', 'width' => '100%', 'color' => 'bg-[var(--emerald)]'],
                ['label' => 'Uptime serveur', 'value' => $uptime ?? '—', 'width' => '100%', 'color' => 'bg-[var(--emerald)]'],
            ];

            // ─── Logs (dernières lignes réelles du journal Laravel) ───
            $logs = $this->tailLaravelLogs(6);
            $erreursApi = $this->countLogErrors();

            // ─── Utilisateurs récents ─────────────────────────────────
            $utilisateurs = User::with('ecole:id,nom')
                ->latest()
                ->take(8)
                ->get(['id', 'name', 'prenom', 'email', 'role', 'ecole_id', 'is_active', 'created_at'])
                ->map(function ($u) {
                    return [
                        'id'         => $u->id,
                        'name'       => trim($u->name . ' ' . $u->prenom),
                        'email'      => $u->email,
                        'role'       => $u->role,
                        'ecole'      => $u->ecole?->nom ?? '—',
                        'is_active'  => (bool) $u->is_active,
                        'created_at' => $u->created_at?->toIso8601String(),
                    ];
                });

            // L'endpoint lui-même apporte une réponse au trafic : le volume du
            // jour est incrémenté de cette requête.
            $traffic = $traffic->map(function ($t) {
                if ($t['jour'] === now()->format('Y-m-d')) {
                    $t['req'] += 1;
                }
                return $t;
            })->values();

            return [
                'stats' => [
                    ['title' => 'Utilisateurs Actifs', 'value' => number_format($activeUsers), 'trend' => $nouveautesSemaine, 'trendLabel' => 'nouveaux / 7j'],
                    ['title' => 'Espace Disque', 'value' => $diskUsage . '%', 'trend' => 0, 'trendLabel' => 'utilisé'],
                    ['title' => 'Erreurs API', 'value' => (string) $erreursApi, 'trend' => 0, 'trendLabel' => 'dans le journal'],
                    ['title' => 'Temps Réponse', 'value' => '—', 'trend' => 0, 'trendLabel' => 'endpoint'],
                    ['title' => 'Uptime', 'value' => $uptime ?? '—', 'trend' => 0, 'trendLabel' => 'serveur'],
                ],
                'traffic'         => $traffic,
                'health'          => $health,
                'logs'            => $logs,
                'utilisateurs'    => $utilisateurs,
                'repartition_roles' => $repartitionRoles,
                'ecoles'            => $totalEcoles,
                'utilisateurs_total' => $totalUsers,
                'taux_activite'     => $tauxActivite,
                'plans_actifs'      => $plansActifs,
                'modules_actifs'    => $modulesActifs,
                'revenus'           => $revenus,
                'nouveautes_semaine' => $nouveautesSemaine,
                'activites_recentes' => $activitesRecentes,
            ];
        });

        // Temps de réponse réel de l'endpoint (non cacheable) — injecté après
        // le cache. Recherche par titre : l'index varie selon les stats retenues.
        $elapsed = round((microtime(true) - $debut) * 1000);
        foreach ($data['stats'] as $i => $stat) {
            if ($stat['title'] === 'Temps Réponse') {
                $data['stats'][$i]['value'] = $elapsed . ' ms';
                break;
            }
        }

        return response()->json(['success' => true, 'data' => $data]);
    }

    /**
     * Les dernières lignes d'un fichier, sans le charger intégralement.
     *
     * `file()` lisait tout le journal Laravel à chaque ouverture du dashboard
     * admin ; un journal de plusieurs centaines de Mo devenait un coût par
     * requête. On lit depuis la fin, par blocs (cf. audit P4).
     */
    private function tailLines(string $path, int $nbLignes): array
    {
        $handle = @fopen($path, 'rb');
        if (!$handle) {
            return [];
        }

        $taille = filesize($path);
        $bloc = 4096;
        $position = $taille;
        $contenu = '';
        $lignes = [];

        while ($position > 0 && count($lignes) < $nbLignes) {
            $lecture = min($bloc, $position);
            $position -= $lecture;
            fseek($handle, $position);
            $contenu = fread($handle, $lecture) . $contenu;

            if (substr_count($contenu, "\n") >= $nbLignes) {
                $lignes = explode("\n", $contenu);
                break;
            }
        }

        if ($lignes === []) {
            $lignes = explode("\n", $contenu);
        }

        fclose($handle);

        $lignes = array_values(array_filter($lignes, fn ($l) => trim($l) !== ''));

        return array_slice($lignes, -$nbLignes);
    }

    /**
     * Les dernières lignes du journal Laravel, parsées en entrées de log.
     */
    private function tailLaravelLogs(int $limit = 6): array
    {
        $logFile = storage_path('logs/laravel.log');
        if (!is_readable($logFile)) {
            return $this->legacyLogsLog($limit);
        }

        $lines = collect($this->tailLines($logFile, $limit * 2));
        $parsed = $lines->filter(function ($line) {
            return preg_match('/^\[[^\]]+\] (production|local)\.(\w+):/', $line);
        })->map(function ($line, $i) {
            preg_match('/\[([^\]]+)\] (production|local)\.(\w+): (.*)/', $line, $m);
            return [
                'id'      => $i,
                'level'   => strtoupper($m[3] ?? 'INFO'),
                'time'    => isset($m[1]) ? date('H:i:s', strtotime($m[1])) : '—',
                'message' => mb_substr($m[4] ?? '', 0, 160),
                'module'  => 'laravel',
            ];
        })->take(-$limit)->values();

        return $parsed->isNotEmpty() ? $parsed->all() : $this->legacyLogsLog($limit);
    }

    /**
     * Nombre de lignes d'erreur dans le journal (lecture bornée à 1000 lignes).
     */
    private function countLogErrors(): int
    {
        $logFile = storage_path('logs/laravel.log');
        if (!is_readable($logFile)) {
            return 0;
        }

        $dernieres = $this->tailLines($logFile, 1000);

        return count(array_filter($dernieres, function ($line) {
            return preg_match('/\.ERROR:/', $line) === 1;
        }));
    }

    /**
     * Repli : dernières actions auditées quand le fichier de log est
     * inaccessible (environnement de test notamment).
     */
    private function legacyLogsLog(int $limit = 6): array
    {
        if (!class_exists(\App\Models\AuditLog::class)) {
            return [];
        }

        return \App\Models\AuditLog::latest()->take($limit)->get()->map(function ($log, $i) {
            return [
                'id'      => $i,
                'level'   => str_contains((string) $log->event, 'error') ? 'ERROR' : 'INFO',
                'time'    => $log->created_at?->format('H:i') ?? '—',
                'message' => mb_substr($log->description ?? $log->event ?? 'action', 0, 160),
                'module'  => 'audit',
            ];
        })->all();
    }

    /**
     * Dashboard Université — données réelles depuis les tables universitaires
     */
    public function universite()
    {
        $ecoleId = \App\Models\Eleve::currentEcoleId() ?? 'global';
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
                ->map(function ($f) use ($etudiantsModel, $enseignantsModel) {
                    $deptIds = $f->departements->pluck('id');
                    $filiereIds = \App\Models\Universite\Filiere::whereIn('departement_id', $deptIds)->pluck('id');
                    $etudiantsCount = $etudiantsModel::whereIn('filiere_id', $filiereIds)->count();
                    // `enseignants_count ?? 0` renvoyait toujours 0 : la relation
                    // n'existe pas sur Faculte. Les enseignants sont rattachés à
                    // un département, lui-même à une faculté (cf. audit P3).
                    $enseignantsCount = $enseignantsModel::whereHas('departement', fn ($q) => $q->where('faculte_id', $f->id))->count();

                    return [
                        'nom' => $f->nom,
                        'etudiants' => $etudiantsCount,
                        'enseignants' => $enseignantsCount,
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
                    'message' => "Nouvel étudiant inscrit — {$i->etudiant?->nom} {$i->etudiant?->prenom}",
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

    /**
     * Expression SQL du mois « Y-m » d'une colonne date, portable SQLite/MySQL.
     *
     * SQLite n'a ni `MONTH()` ni `DATE_FORMAT` : les agrégations mensuelles
     * doivent s'exprimer selon le moteur (cf. audit P4 — les séries de 6 mois
     * chargeaient des collections entières puis les regroupaient en PHP).
     */
    private function monthExpression(string $column): string
    {
        return \Illuminate\Support\Facades\DB::getDriverName() === 'sqlite'
            ? "strftime('%Y-%m', {$column})"
            : "DATE_FORMAT({$column}, '%Y-%m')";
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
        $data = \Illuminate\Support\Facades\Cache::remember('dashboard_comptable_' . (\App\Models\Eleve::currentEcoleId() ?? 'global'), 120, function () {
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

            // Évolution des finances — 6 derniers mois (revenus + dépenses),
            // agrégée en SQL (cf. audit P4) : l'ancien code chargeait toutes les
            // lignes de la fenêtre puis les regroupait en PHP.
            $revenusParMois = \App\Models\PaiementEleve::whereBetween('date_paiement', [
                now()->startOfMonth()->subMonths(5), now()->endOfMonth(),
            ])->where('statut_global', \App\Models\PaiementEleve::PAID)
                ->selectRaw($this->monthExpression('date_paiement') . ' as mois, SUM(montant) as total')
                ->groupBy('mois')
                ->pluck('total', 'mois');

            $depensesParMois = \App\Models\Depense::whereBetween('date_depense', [
                now()->startOfMonth()->subMonths(5), now()->endOfMonth(),
            ])->selectRaw($this->monthExpression('date_depense') . ' as mois, SUM(montant) as total')
                ->groupBy('mois')
                ->pluck('total', 'mois');

            $donneesMensuelles = [];
            foreach ($this->sixDerniersMois() as $cle => $label) {
                $donneesMensuelles[] = [
                    'mois' => $label,
                    'revenus' => (float) ($revenusParMois->get($cle, 0)),
                    'depenses' => (float) ($depensesParMois->get($cle, 0)),
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

            // ─── Impayés : les comptes en cours de solde, les plus lourds en
            // premier — c'est la liste d'action prioritaire de la comptabilité.
            $impayes = \App\Models\PaiementEleve::with(['eleve.user', 'eleve.classe'])
                ->where('montant_restant', '>', 0)
                ->orderByDesc('montant_restant')
                ->take(8)
                ->get()
                ->map(fn ($p) => [
                    'id' => $p->id,
                    'eleve' => $this->nomEleve($p->eleve),
                    'classe' => $p->eleve?->classe?->nom_classe,
                    'montant_restant' => (float) $p->montant_restant,
                    'type' => $p->type_paiement ?? '—',
                ]);

            // ─── Trésorerie du mois : encaissé (réellement versé) − dépenses.
            $encaissementsMois = (float) \App\Models\PaiementEleve::whereMonth('date_paiement', $moisActuel)
                ->whereYear('date_paiement', $anneeActuelle)
                ->sum('montant_paye');

            // ─── Répartition des revenus par type (part du montant, pas du
            // nombre de lignes comme `repartition`).
            $montantParType = \App\Models\PaiementEleve::select('type_paiement')
                ->whereNotNull('type_paiement')
                ->get()
                ->groupBy('type_paiement')
                ->map(fn ($g) => (float) $g->sum('montant'));
            $totalMontant = max($montantParType->sum(), 1);
            $repartitionRevenus = $montantParType->map(fn ($montant, $nom) => [
                'name' => $nom,
                'value' => round(($montant / $totalMontant) * 100),
            ])->values();

            return [
                'stats' => [
                    ['title' => 'Revenus du Mois', 'value' => number_format($revenusMois, 0, ',', ' ') . ' F', 'trend' => 0, 'trendLabel' => 'ce mois'],
                    ['title' => 'Factures en Attente', 'value' => (string) $enAttente, 'trend' => 0, 'trendLabel' => 'non soldées'],
                    ['title' => 'Taux Recouvrement', 'value' => "{$tauxRecouvrement}%", 'trend' => 0, 'trendLabel' => 'ce mois'],
                    ['title' => 'Dépenses du Mois', 'value' => number_format($depensesMois, 0, ',', ' ') . ' F', 'trend' => 0, 'trendLabel' => 'ce mois'],
                ],
                'donnes_ca' => $donneesMensuelles,
                'repartition' => $repartition,
                'repartition_revenus' => $repartitionRevenus,
                'factures' => $dernieresPaiements,
                'impayes' => $impayes,
                'tresorerie' => [
                    'encaissements_mois' => $encaissementsMois,
                    'depenses_mois' => $depensesMois,
                    'solde' => $encaissementsMois - $depensesMois,
                ],
            ];
        });

        return response()->json(['success' => true, 'data' => $data]);
    }

    /**
     * Dashboard Surveillant — données réelles
     */
    public function surveillant()
    {
        $data = \Illuminate\Support\Facades\Cache::remember('dashboard_surveillant_' . (\App\Models\Eleve::currentEcoleId() ?? 'global'), 60, function () {
            $totalEleves = \App\Models\Eleve::count();

            // Un élève absent compte une fois, même avec plusieurs lignes dans
            // la journée — l'ancien `count()` gonflait « Absents » et tirait
            // « Présents » vers le bas (cf. audit P3).
            $absentsAujourdhui = \App\Models\Absence::whereDate('date', today())
                ->where('type', 'absence')
                ->distinct('eleve_id')
                ->count('eleve_id');
            $presents = max($totalEleves - $absentsAujourdhui, 0);

            $alertes = \App\Models\Incident::whereIn('statut', ['ouvert', 'en_cours'])->count();

            // Présences de la semaine (lundi → dimanche), mêmes élèves distincts
            $joursSemaine = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
            $absencesSemaine = \App\Models\Absence::where('type', 'absence')
                ->whereBetween('date', [now()->startOfWeek(), now()->endOfWeek()])
                ->get()
                ->groupBy(fn ($a) => $a->date?->format('Y-m-d'))
                ->map(fn ($jour) => $jour->pluck('eleve_id')->unique()->count());

            $presencesSemaine = [];
            foreach (range(0, 6) as $i) {
                $jour = now()->startOfWeek()->addDays($i)->format('Y-m-d');
                $absentsJour = $absencesSemaine->get($jour) ?? 0;
                $presencesSemaine[] = [
                    'jour' => $joursSemaine[$i],
                    'presents' => max($totalEleves - $absentsJour, 0),
                    'absents' => $absentsJour,
                ];
            }

            // Points de surveillance : une zone par cycle réellement présent.
            // Une seule agrégation pour toutes les zones, au lieu d'un comptage
            // d'enseignants par catégorie (N+1, cf. audit P4) — les deux requêtes
            // restent scopées à l'école résolue.
            $personnelsParCategorie = \App\Models\Enseignant::with('classes:id,categorie_classe')
                ->get()
                ->flatMap(fn ($e) => $e->classes->pluck('categorie_classe'))
                ->countBy()
                ->all();

            $points = \App\Models\Classes::select('categorie_classe')
                ->distinct()
                ->get()
                ->map(function ($classe) use ($personnelsParCategorie) {
                    $personnels = $personnelsParCategorie[$classe->categorie_classe] ?? 0;

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
                ->get();

            // Récurrence (≥ 2 retards sur 30 jours) en une seule requête
            // d'agrégation, au lieu d'un comptage par retard (N+1, cf. audit P4).
            $eleveIds = $derniersRetards->pluck('eleve_id')->filter()->unique()->values();
            $retardsParEleve = \App\Models\Absence::where('type', 'retard')
                ->where('date', '>=', now()->subDays(30))
                ->whereIn('eleve_id', $eleveIds)
                ->selectRaw('eleve_id, COUNT(*) as total')
                ->groupBy('eleve_id')
                ->pluck('total', 'eleve_id');

            $derniersRetards = $derniersRetards->map(function ($a) use ($retardsParEleve) {
                return [
                    'id' => $a->id,
                    'eleve' => $this->nomEleve($a->eleve),
                    'classe' => $a->eleve?->classe?->nom_classe,
                    'temps' => $a->date?->format('d/m/Y'),
                    'motif' => $a->motif,
                    'recurrent' => (int) ($retardsParEleve[$a->eleve_id] ?? 0) >= 2,
                ];
            });

            // ─── Liste nominative des absents du jour (le compteur seul ne
            // permet pas d'agir), incidents ouverts et absences non justifiées.
            $absentsJour = \App\Models\Absence::with(['eleve.user', 'eleve.classe'])
                ->whereDate('date', today())
                ->where('type', 'absence')
                ->latest()
                ->take(10)
                ->get()
                ->map(fn ($a) => [
                    'id' => $a->id,
                    'eleve' => $this->nomEleve($a->eleve),
                    'classe' => $a->eleve?->classe?->nom_classe,
                    'motif' => $a->motif,
                    'justifiee' => (bool) $a->justifiee,
                ]);

            $gravitesFR = ['mineure' => 'Mineure', 'moyenne' => 'Moyenne', 'majeure' => 'Majeure'];
            $incidents = \App\Models\Incident::latest('date')
                ->take(5)
                ->get()
                ->map(fn ($i) => [
                    'id' => $i->id,
                    'description' => $i->description,
                    'date' => $i->date?->format('d/m/Y'),
                    'gravite' => $gravitesFR[$i->gravite] ?? $i->gravite,
                    'statut' => $i->statut,
                ]);

            $absencesNonJustifiees = \App\Models\Absence::with(['eleve.user', 'eleve.classe'])
                ->where('type', 'absence')
                ->where('justifiee', false)
                ->whereMonth('date', now()->month)
                ->whereYear('date', now()->year)
                ->latest('date')
                ->take(5)
                ->get()
                ->map(fn ($a) => [
                    'id' => $a->id,
                    'eleve' => $this->nomEleve($a->eleve),
                    'classe' => $a->eleve?->classe?->nom_classe,
                    'date' => $a->date?->format('d/m/Y'),
                    'motif' => $a->motif,
                ]);

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
                'absents_jour' => $absentsJour,
                'incidents' => $incidents,
                'absences_non_justifiees' => $absencesNonJustifiees,
            ];
        });

        return response()->json(['success' => true, 'data' => $data]);
    }

    /**
     * Dashboard Censeur — données réelles
     */
    public function censeur()
    {
        $data = \Illuminate\Support\Facades\Cache::remember('dashboard_censeur_' . (\App\Models\Eleve::currentEcoleId() ?? 'global'), 120, function () {
            $totalEleves = \App\Models\Eleve::count();
            $sanctionsMois = \App\Models\Sanction::whereMonth('date', now()->month)
                ->whereYear('date', now()->year)->count();
            $absencesNonJustifiees = \App\Models\Absence::where('justifiee', false)
                ->where('type', 'absence')
                ->whereMonth('date', now()->month)
                ->whereYear('date', now()->year)->count();
            $avertissements = \App\Models\Sanction::where('type_sanction', 'like', '%Avertissement%')
                ->whereMonth('date', now()->month)
                ->whereYear('date', now()->year)->count();

            // Évolution disciplinaire — 6 derniers mois (sanctions + avertissements),
            // agrégée en SQL (cf. audit P4).
            $sanctionsParMois = \App\Models\Sanction::whereBetween('date', [
                now()->startOfMonth()->subMonths(5), now()->endOfMonth(),
            ])->selectRaw($this->monthExpression('date') . ' as mois, COUNT(*) as total')
                ->groupBy('mois')
                ->pluck('total', 'mois');

            $avertissementsParMois = \App\Models\Sanction::where('type_sanction', 'like', '%Avertissement%')
                ->whereBetween('date', [
                    now()->startOfMonth()->subMonths(5), now()->endOfMonth(),
                ])->selectRaw($this->monthExpression('date') . ' as mois, COUNT(*) as total')
                ->groupBy('mois')
                ->pluck('total', 'mois');

            $evolution = [];
            foreach ($this->sixDerniersMois() as $cle => $label) {
                $evolution[] = [
                    'mois' => $label,
                    'sanctions' => (int) ($sanctionsParMois->get($cle, 0)),
                    'avertissements' => (int) ($avertissementsParMois->get($cle, 0)),
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

            // ─── Absences non justifiées par classe ce mois-ci (drill-down
            // pour cibler les classes à problème).
            $absencesParClasse = \App\Models\Absence::with('eleve.classe')
                ->where('type', 'absence')
                ->where('justifiee', false)
                ->whereMonth('date', now()->month)
                ->whereYear('date', now()->year)
                ->get()
                ->groupBy(fn ($a) => $a->eleve?->classe?->nom_classe ?? 'Sans classe')
                ->map(fn ($g, $nom) => [
                    'name' => $nom,
                    'absences' => $g->count(),
                ])->sortByDesc('absences')->values();

            // ─── Sanctions encore à exécuter (à notifier / suivre).
            $sanctionsAttente = \App\Models\Sanction::with(['eleve.user', 'eleve.classe'])
                ->whereNotIn('statut', ['terminee', 'levee'])
                ->latest('date')
                ->take(5)
                ->get()
                ->map(fn ($s) => [
                    'id' => $s->id,
                    'eleve' => $this->nomEleve($s->eleve),
                    'classe' => $s->eleve?->classe?->nom_classe,
                    'sanction' => $s->type_sanction,
                    'date' => $s->date?->format('d/m/Y'),
                    'statut' => $statutsFR[$s->statut] ?? 'En cours',
                ]);

            // ─── Récidivistes : élèves ayant reçu au moins deux sanctions.
            $recidivistes = \App\Models\Sanction::with(['eleve.user', 'eleve.classe'])
                ->get()
                ->groupBy('eleve_id')
                ->filter(fn ($g) => $g->count() >= 2)
                ->map(fn ($g) => [
                    'eleve' => $this->nomEleve($g->first()->eleve),
                    'classe' => $g->first()->eleve?->classe?->nom_classe,
                    'sanctions' => $g->count(),
                ])->sortByDesc('sanctions')->take(5)->values();

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
                'absences_par_classe' => $absencesParClasse,
                'sanctions_attente' => $sanctionsAttente,
                'recidivistes' => $recidivistes,
            ];
        });

        return response()->json(['success' => true, 'data' => $data]);
    }

    /**
     * Dashboard Infirmier — données réelles
     */
    public function infirmier()
    {
        $data = \Illuminate\Support\Facades\Cache::remember('dashboard_infirmier_' . (\App\Models\Eleve::currentEcoleId() ?? 'global'), 60, function () {
            // Le filtre année manquait sur ces deux compteurs : le même mois
            // était additionné sur toutes les années (cf. audit P3).
            $visitesMois = \App\Models\ConsultationMedicale::whereMonth('date', now()->month)
                ->whereYear('date', now()->year)->count();
            $visitesAujourdhui = \App\Models\ConsultationMedicale::whereDate('date', today())->count();
            $casUrgents = \App\Models\ConsultationMedicale::where('urgence', true)
                ->whereMonth('date', now()->month)
                ->whereYear('date', now()->year)->count();
            $consultations = \App\Models\ConsultationMedicale::count();

            // Fréquentation — 6 derniers mois (visites + urgences), agrégée en
            // SQL (cf. audit P4).
            $visitesParMois = \App\Models\ConsultationMedicale::whereBetween('date', [
                now()->startOfMonth()->subMonths(5), now()->endOfMonth(),
            ])->selectRaw(
                $this->monthExpression('date') . ' as mois, '
                . 'COUNT(*) as visites, '
                . 'SUM(CASE WHEN urgence = 1 THEN 1 ELSE 0 END) as urgences'
            )->groupBy('mois')->get()->keyBy('mois');

            $frequentation = [];
            foreach ($this->sixDerniersMois() as $cle => $label) {
                $ligne = $visitesParMois->get($cle);
                $frequentation[] = [
                    'mois' => $label,
                    'visites' => (int) ($ligne->visites ?? 0),
                    'urgences' => (int) ($ligne->urgences ?? 0),
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

            // ─── Cas urgents du jour (liste prioritaire, pas seulement un
            // compteur), alertes médicales portées par le dossier et élèves
            // suivis de façon récurrente.
            $urgencesJour = \App\Models\ConsultationMedicale::with(['eleve.user', 'eleve.classe'])
                ->whereDate('date', today())
                ->where('urgence', true)
                ->latest()
                ->take(10)
                ->get()
                ->map(fn ($c) => [
                    'id' => $c->id,
                    'eleve' => $this->nomEleve($c->eleve),
                    'classe' => $c->eleve?->classe?->nom_classe,
                    'motif' => $c->motif,
                    'heure' => $c->date?->format('H:i'),
                ]);

            $alertesMedicales = \App\Models\DossierMedical::with('eleve.user', 'eleve.classe')
                ->where(function ($q) {
                    $q->whereNotNull('allergies')->where('allergies', '!=', '')
                        ->orWhereNotNull('maladies_chroniques')->where('maladies_chroniques', '!=', '');
                })
                ->take(8)
                ->get()
                ->map(fn ($d) => [
                    'id' => $d->id,
                    'eleve' => $this->nomEleve($d->eleve),
                    'classe' => $d->eleve?->classe?->nom_classe,
                    'allergies' => $d->allergies,
                    'maladie' => $d->maladies_chroniques,
                ]);

            $soinsRecurrents = \App\Models\ConsultationMedicale::with(['eleve.user', 'eleve.classe'])
                ->get()
                ->groupBy('eleve_id')
                ->filter(fn ($g) => $g->count() >= 2)
                ->map(fn ($g) => [
                    'eleve' => $this->nomEleve($g->first()->eleve),
                    'classe' => $g->first()->eleve?->classe?->nom_classe,
                    'visites' => $g->count(),
                    'dernier_motif' => $g->last()->motif,
                ])->sortByDesc('visites')->take(5)->values();

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
                'urgences_jour' => $urgencesJour,
                'alertes_medicales' => $alertesMedicales,
                'soins_recurrents' => $soinsRecurrents,
            ];
        });

        return response()->json(['success' => true, 'data' => $data]);
    }

    /**
     * Dashboard Bibliothécaire — données réelles
     */
    public function bibliothecaire()
    {
        $data = \Illuminate\Support\Facades\Cache::remember('dashboard_bibliothecaire_' . (\App\Models\Eleve::currentEcoleId() ?? 'global'), 120, function () {
            $totalLivres = \App\Models\Livre::count();
            $empruntsEnCours = \App\Models\Emprunt::whereNull('date_retour_effective')->count();
            $retards = \App\Models\Emprunt::whereNull('date_retour_effective')
                ->where('date_retour_prevue', '<', today())->count();
            // « Membres Actifs » = emprunteurs de la fenêtre d'activité (6 mois),
            // pas de toute l'histoire : l'ancien comptait un élève ayant emprunté
            // une fois il y a deux ans comme « actif » (cf. audit P3).
            $membresActifs = \App\Models\Emprunt::whereBetween('date_emprunt', [
                now()->startOfMonth()->subMonths(5), now()->endOfMonth(),
            ])->distinct('eleve_id')->count('eleve_id');

            // Activité — 6 derniers mois (emprunts + retours), agrégée en SQL
            // (cf. audit P4). Les retours comptent par leur date de retour :
            // l'ancien code ne voyait que les retours d'ouvrages empruntés dans
            // la fenêtre, et perdait un livre rendu ce mois-ci après un emprunt
            // plus ancien.
            $empruntsParMois = \App\Models\Emprunt::whereBetween('date_emprunt', [
                now()->startOfMonth()->subMonths(5), now()->endOfMonth(),
            ])->selectRaw($this->monthExpression('date_emprunt') . ' as mois, COUNT(*) as total')
                ->groupBy('mois')
                ->pluck('total', 'mois');

            $retoursParMois = \App\Models\Emprunt::whereBetween('date_retour_effective', [
                now()->startOfMonth()->subMonths(5), now()->endOfMonth(),
            ])->selectRaw($this->monthExpression('date_retour_effective') . ' as mois, COUNT(*) as total')
                ->groupBy('mois')
                ->pluck('total', 'mois');

            $activite = [];
            foreach ($this->sixDerniersMois() as $cle => $label) {
                $activite[] = [
                    'mois' => $label,
                    'emprunts' => (int) ($empruntsParMois->get($cle, 0)),
                    'retours' => (int) ($retoursParMois->get($cle, 0)),
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

            // ─── Retards nominatifs (le compteur ne dit pas quel ouvrage ni
            // quel élève), nouveautés au catalogue et ouvrages les plus lus.
            $retardsListe = \App\Models\Emprunt::with(['eleve.user', 'eleve.classe', 'livre'])
                ->whereNull('date_retour_effective')
                ->where('date_retour_prevue', '<', today())
                ->orderBy('date_retour_prevue')
                ->take(8)
                ->get()
                ->map(fn ($e) => [
                    'id' => $e->id,
                    'eleve' => $this->nomEleve($e->eleve),
                    'classe' => $e->eleve?->classe?->nom_classe,
                    'ouvrage' => $e->livre?->titre,
                    'dateRetour' => $e->date_retour_prevue?->format('d/m/Y'),
                    'jours_retard' => (int) today()->diffInDays($e->date_retour_prevue),
                ]);

            $nouveautes = \App\Models\Livre::latest('created_at')
                ->take(5)
                ->get()
                ->map(fn ($l) => [
                    'id' => $l->id,
                    'titre' => $l->titre,
                    'auteur' => $l->auteur,
                    'categorie' => $l->categorie,
                ]);

            $populaires = \App\Models\Emprunt::select('livre_id')
                ->with('livre')
                ->get()
                ->groupBy('livre_id')
                ->map(fn ($g) => [
                    'titre' => $g->first()->livre?->titre ?? 'Inconnu',
                    'emprunts' => $g->count(),
                ])->sortByDesc('emprunts')->take(5)->values();

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
                'retards_liste' => $retardsListe,
                'nouveautes' => $nouveautes,
                'populaires' => $populaires,
            ];
        });

        return response()->json(['success' => true, 'data' => $data]);
    }

    /**
     * Dashboard Secrétaire — données réelles
     */
    public function secretaire()
    {
        $data = \Illuminate\Support\Facades\Cache::remember('dashboard_secretaire_' . (\App\Models\Eleve::currentEcoleId() ?? 'global'), 120, function () {
            $totalInscriptions = \App\Models\Eleve::count();
            // Filtre année manquant : le même mois était additionné sur toutes
            // les années (cf. audit P3).
            $nouveauxMois = \App\Models\Eleve::whereMonth('created_at', now()->month)
                ->whereYear('created_at', now()->year)->count();
            $dossiersEnCours = \App\Models\Certificat::where('delivre', false)->count();
            $documentsGeneres = \App\Models\Certificat::count();

            // Flux d'inscriptions — 6 derniers mois, agrégé en SQL (cf. audit
            // P4). `transferts` a été retiré : aucune table, colonne ni signal ne
            // porte cette donnée (le statut élève ne connaît que actif/inactif,
            // cf. migration enrolment). Un `transferts => 0` codé en dur affichait
            // un faux compteur (audit P3).
            $nouveauxParMois = \App\Models\Eleve::whereBetween('created_at', [
                now()->startOfMonth()->subMonths(5), now()->endOfMonth(),
            ])->selectRaw($this->monthExpression('created_at') . ' as mois, COUNT(*) as total')
                ->groupBy('mois')
                ->pluck('total', 'mois');

            $fluxInscriptions = [];
            foreach ($this->sixDerniersMois() as $cle => $label) {
                $fluxInscriptions[] = [
                    'mois' => $label,
                    'nouveaux' => (int) ($nouveauxParMois->get($cle, 0)),
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

            // ─── Planning complet des 7 prochains jours (le « Rendez-vous du
            // jour » ne montrait que la journée) et certificats à délivrer.
            $planningRendezVous = \App\Models\RendezVous::with(['parent.user', 'eleve.user', 'enseignant.user'])
                ->whereBetween('date', [today(), today()->addDays(6)])
                ->whereNotIn('statut', ['annulé', 'annule'])
                ->orderBy('date')
                ->orderBy('heure')
                ->take(12)
                ->get()
                ->map(function ($r) {
                    $visiteur = $r->parent?->user
                        ?? $r->eleve?->user
                        ?? $r->enseignant?->user;

                    return [
                        'id' => $r->id,
                        'visiteur' => trim(($visiteur?->name ?? '') . ' ' . ($visiteur?->prenom ?? '')) ?: 'Visiteur',
                        'motif' => $r->motif,
                        'date' => $r->date?->format('d/m'),
                        'heure' => $r->heure,
                        'statut' => $statutsFR[$r->statut] ?? $r->statut,
                    ];
                });

            $certificatsAttente = \App\Models\Certificat::with(['eleve.user', 'eleve.classe'])
                ->where('delivre', false)
                ->latest('date_emission')
                ->take(8)
                ->get()
                ->map(fn ($c) => [
                    'id' => $c->id,
                    'eleve' => $this->nomEleve($c->eleve),
                    'classe' => $c->eleve?->classe?->nom_classe,
                    'type' => $c->type_certificat,
                    'date' => $c->date_emission?->format('d/m/Y') ?? '—',
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
                'planning_rendez_vous' => $planningRendezVous,
                'certificats_attente' => $certificatsAttente,
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
            // L'année scolaire commence en septembre : la fenêtre doit courir de
            // septembre à août, pas sur l'année civile. L'ancien code croisait des
            // libellés scolaires avec `whereYear(now()->year)` : en janvier, les
            // inscriptions de septembre-décembre (même année scolaire) disparaissaient
            // du graphique, et le mois en cours portait l'étiquette « Sept » (audit P3).
            $now = now();
            $debutAnneeScolaire = $now->month >= 9
                ? $now->copy()->startOfMonth()->month(9)
                : $now->copy()->startOfMonth()->month(9)->subYear();

            // Regroupement en PHP plutôt que MONTH()/EXTRACT : portable entre
            // MySQL (production) et SQLite (tests).
            $eleves = \App\Models\Eleve::whereBetween('created_at', [
                $debutAnneeScolaire,
                $debutAnneeScolaire->copy()->addYear()->subSecond(),
            ])->pluck('created_at')
                ->countBy(fn ($d) => $d->month)
                ->all();

            $months = ['Sept', 'Oct', 'Nov', 'Déc', 'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août'];

            return array_map(function ($i) use ($months, $eleves) {
                // Le mois scolaire i (0 = Sept) correspond au mois civil (9 + i) % 12.
                $moisCivil = ($i + 9) % 12;
                $moisCivil = $moisCivil === 0 ? 12 : $moisCivil;

                return [
                    'name' => $months[$i],
                    'students' => $eleves[$moisCivil] ?? 0,
                ];
            }, range(0, 11));
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