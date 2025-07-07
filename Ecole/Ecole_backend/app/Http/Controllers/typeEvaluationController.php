<?php

namespace App\Http\Controllers;

use App\Models\TypeEvaluation;
use Illuminate\Http\Request;

class typeEvaluationController extends Controller
{
    //
    public function store(Request $request){
        $validated = $request->validate([
            'nom' => 'string|required'
        ]);
        $evals = TypeEvaluation::create($validated);

        return response()->json($evals, 201);
    }
}
