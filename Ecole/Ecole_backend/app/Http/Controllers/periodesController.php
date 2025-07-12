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

}