<?php

namespace App\Services;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * BaseService — Service de base avec CRUD générique
 *
 * Centralise les patterns communs à tous les services métier :
 * - CRUD complet avec pagination
 * - Gestion des erreurs et rollbacks
 * - Réponses unifiées
 * - Logging automatique
 *
 * @template T
 */
abstract class BaseService
{
    /**
     * Le modèle Eloquent associé au service
     * @return class-string<Model>
     */
    abstract protected function model(): string;

    /**
     * Règles de validation pour la création
     */
    abstract protected function creationRules(): array;

    /**
     * Règles de validation pour la mise à jour
     */
    protected function updateRules(): array
    {
        return $this->creationRules();
    }

    /**
     * Relations à charger par défaut
     */
    protected function defaultRelations(): array
    {
        return [];
    }

    /**
     * Liste paginée avec filtres optionnels
     */
    public function paginate(int $perPage = 15, array $filters = []): LengthAwarePaginator
    {
        $query = $this->model()::query();

        foreach ($filters as $field => $value) {
            if ($value !== null && $value !== '') {
                $query->where($field, $value);
            }
        }

        return $query
            ->with($this->defaultRelations())
            ->orderBy('created_at', 'desc')
            ->paginate($perPage);
    }

    /**
     * Récupère tous les enregistrements
     */
    public function all(array $filters = [])
    {
        $query = $this->model()::query();

        foreach ($filters as $field => $value) {
            if ($value !== null && $value !== '') {
                $query->where($field, $value);
            }
        }

        return $query
            ->with($this->defaultRelations())
            ->orderBy('created_at', 'desc')
            ->get();
    }

    /**
     * Trouve un enregistrement par son ID
     */
    public function find(int|string $id): ?Model
    {
        return $this->model()::with($this->defaultRelations())->find($id);
    }

    /**
     * Trouve ou échoue
     */
    public function findOrFail(int|string $id): Model
    {
        return $this->model()::with($this->defaultRelations())->findOrFail($id);
    }

    /**
     * Crée un nouvel enregistrement
     */
    public function create(array $data): Model
    {
        return DB::transaction(function () use ($data) {
            $model = $this->model()::create($data);
            $this->afterCreate($model, $data);
            Log::info($this->model() . ' créé', ['id' => $model->id, 'data' => $data]);
            return $model->load($this->defaultRelations());
        });
    }

    /**
     * Met à jour un enregistrement
     */
    public function update(Model|int|string $model, array $data): Model
    {
        if (!($model instanceof Model)) {
            $model = $this->findOrFail($model);
        }

        return DB::transaction(function () use ($model, $data) {
            $model->update($data);
            $this->afterUpdate($model, $data);
            Log::info($this->model() . ' mis à jour', ['id' => $model->id]);
            return $model->fresh($this->defaultRelations());
        });
    }

    /**
     * Supprime un enregistrement (soft delete si disponible)
     */
    public function delete(Model|int|string $model): bool
    {
        if (!($model instanceof Model)) {
            $model = $this->findOrFail($model);
        }

        return DB::transaction(function () use ($model) {
            $this->beforeDelete($model);
            $result = $model->delete();
            Log::info($this->model() . ' supprimé', ['id' => $model->id]);
            return $result;
        });
    }

    /**
     * Hook après création
     */
    protected function afterCreate(Model $model, array $data): void {}

    /**
     * Hook après mise à jour
     */
    protected function afterUpdate(Model $model, array $data): void {}

    /**
     * Hook avant suppression
     */
    protected function beforeDelete(Model $model): void {}

    /**
     * Compte le nombre d'enregistrements
     */
    public function count(array $conditions = []): int
    {
        $query = $this->model()::query();
        foreach ($conditions as $field => $value) {
            $query->where($field, $value);
        }
        return $query->count();
    }

    /**
     * Met à jour ou crée un enregistrement
     */
    public function updateOrCreate(array $attributes, array $values = []): Model
    {
        return DB::transaction(function () use ($attributes, $values) {
            $model = $this->model()::updateOrCreate($attributes, $values);
            Log::info($this->model() . ' mis à jour ou créé', ['id' => $model->id]);
            return $model->load($this->defaultRelations());
        });
    }

    /**
     * Récupère les derniers enregistrements
     */
    public function latest(int $limit = 10)
    {
        return $this->model()::with($this->defaultRelations())
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get();
    }

    /**
     * Récupère les enregistrements récents pour un utilisateur
     */
    public function recentForUser(int $userId, int $limit = 5)
    {
        return $this->model()::with($this->defaultRelations())
            ->where('user_id', $userId)
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get();
    }
}
