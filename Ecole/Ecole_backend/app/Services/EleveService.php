<?php

namespace App\Services;

use App\Models\Eleve;
use App\Models\User;

/**
 * EleveService — Gestion des élèves
 */
class EleveService extends BaseService
{
    protected function model(): string
    {
        return Eleve::class;
    }

    protected function creationRules(): array
    {
        return [
            'nom' => 'required|string|max:255',
            'prenom' => 'required|string|max:255',
            'date_naissance' => 'required|date',
            'lieu_naissance' => 'nullable|string|max:255',
            'sexe' => 'required|in:M,F',
            'classe_id' => 'required|exists:classes,id',
            'matricule' => 'required|string|unique:eleves,matricule',
            'email' => 'nullable|email|max:255',
            'telephone' => 'nullable|string|max:20',
            'adresse' => 'nullable|string',
            'tuteur_nom' => 'nullable|string|max:255',
            'tuteur_telephone' => 'nullable|string|max:20',
        ];
    }

    protected function defaultRelations(): array
    {
        return ['classe', 'user', 'paiements'];
    }

    /**
     * Inscrit un élève avec création du compte utilisateur
     */
    public function inscrire(array $data): Eleve
    {
        // La logique de création de compte utilisateur + eleve
        // sera dans le contrôleur pour l'instant
        return $this->create($data);
    }

    /**
     * Récupère les élèves d'une classe
     */
    public function getByClasse(int $classeId)
    {
        return Eleve::with($this->defaultRelations())
            ->where('classe_id', $classeId)
            ->orderBy('nom')
            ->get();
    }

    /**
     * Récupère les élèves avec leurs notes pour un bulletin
     */
    public function getWithNotes(int $classeId, int $periodeId)
    {
        return Eleve::with(['classe', 'notes' => function ($q) use ($periodeId) {
            $q->where('periode_id', $periodeId);
        }])
            ->where('classe_id', $classeId)
            ->orderBy('nom')
            ->get();
    }

    /**
     * Recherche d'élèves (pour la CommandPalette)
     */
    public function search(string $query, int $limit = 10)
    {
        return Eleve::with('classe')
            ->where('nom', 'like', "%{$query}%")
            ->orWhere('prenom', 'like', "%{$query}%")
            ->orWhere('matricule', 'like', "%{$query}%")
            ->limit($limit)
            ->get();
    }
}
