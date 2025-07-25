<?php

namespace App\Http\Controllers;

use App\Models\periodes;
use Illuminate\Http\Request;

class periodesController extends Controller
{
    //
    public function store(Request $request){
        $validated = $request->validate([
            'nom' => 'string|required',
            'date_debut' => 'date|required',
            'date_fin' => 'date|required',
        ]);
        $periodes = periodes::create($validated);

        return response()->json($periodes, 201);
    }

    public function setActive($id)


    {
        // Désactive toutes les périodes
        periodes::query()->update(['is_active' => false]);
        // Active celle voulue
        $periode = periodes::findOrFail($id);
        $periode->is_active = true;
        $periode->save();

        return response()->json($periode);
    }

    public function getActive()
    {
        $periode = periodes::where('is_active', true)->first();
        return response()->json($periode);
    }

    public function Index()
    {
        $periodes = periodes::all();
        return response()->json($periodes);
    }

    // Récupérer toutes les périodes d'une classe spécifique
    public function getPeriodesByClasse($classeId)
    {
        $periodes = periodes::whereHas('typeEvaluations', function($query) use ($classeId) {
            $query->whereHas('classes', function($q) use ($classeId) {
                $q->where('classes.id', $classeId);
            });
        })->get();

        return response()->json($periodes);
    }

    // Récupérer toutes les périodes d'une catégorie de classe
    public function getPeriodesByCategorie($categorie)
    {
        $periodes = periodes::whereHas('typeEvaluations', function($query) use ($categorie) {
            $query->whereHas('classes', function($q) use ($categorie) {
                $q->where('classes.categorie_classe', $categorie);
            });
        })->get();

        return response()->json($periodes);
    }

    // Récupérer toutes les périodes de la marternelle
    public function getPeriodesMaternelle()
    {
        $periodes = periodes::whereHas('typeEvaluations', function($query) {
            $query->whereHas('classes', function($q) {
                $q->where('classes.categorie_classe', 'maternelle');
            });
        })->get();
        return response()->json($periodes);
    }

    public function getPeriodesPrimaire()
    {
        $periodes = periodes::whereHas('typeEvaluations', function($query) {
            $query->whereHas('classes', function($q) {
                $q->where('classes.categorie_classe', 'primaire');
            });
        })->get();
        return response()->json($periodes);
    }

    public function getPeriodesSecondaire()
    {
        $periodes = periodes::whereHas('typeEvaluations', function($query) {
            $query->whereHas('classes', function($q) {
                $q->where('classes.categorie_classe', 'secondaire');
            });
        })->get();
        return response()->json($periodes);
    }

    // Récupérer les périodes actives par catégorie
    public function getActivePeriodesByCategorie($categorie)
    {
        $periodes = periodes::where('is_active', true)
            ->whereHas('typeEvaluations', function($query) use ($categorie) {
                $query->whereHas('classes', function($q) use ($categorie) {
                    $q->where('classes.categorie_classe', $categorie);
                });
            })->get();

        return response()->json($periodes);
    }

}