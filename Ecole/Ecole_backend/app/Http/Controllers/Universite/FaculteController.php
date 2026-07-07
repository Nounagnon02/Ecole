<?php

namespace App\Http\Controllers\Universite;

use App\Http\Controllers\Controller;
use App\Models\Universite\Faculte;
use Illuminate\Http\Request;

class FaculteController extends Controller
{
    public function index()
    {
        $facultes = Faculte::with('universite')->paginate(15);
        return response()->json($facultes);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'nom' => 'required|string|max:100',
            'sigle' => 'required|string|max:10',
            'universite_id' => 'required|exists:universites,id'
        ]);

        $faculte = Faculte::create($validated);
        return response()->json($faculte, 201);
    }

    public function show(Faculte $faculte)
    {
        return response()->json($faculte->load('universite', 'departements'));
    }

    public function update(Request $request, Faculte $faculte)
    {
        $validated = $request->validate([
            'nom' => 'sometimes|required|string|max:100',
            'sigle' => 'sometimes|required|string|max:10',
            'universite_id' => 'sometimes|required|exists:universites,id'
        ]);

        $faculte->update($validated);
        return response()->json($faculte);
    }

    public function destroy(Faculte $faculte)
    {
        $faculte->delete();
        return response()->json(null, 204);
    }
}
