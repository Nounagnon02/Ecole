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
}
