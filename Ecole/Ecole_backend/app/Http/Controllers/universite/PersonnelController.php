<?php

namespace App\Http\Controllers\Universite;

use App\Http\Controllers\Controller;
use App\Models\Universite\Personnel;
use Illuminate\Http\Request;

class PersonnelController extends Controller
{
    public function index()
    {
        $personnels = Personnel::with('universite')->get();
        return response()->json($personnels);
    }

    public function store(Request $request)
    {
        $request->validate([
            'nom' => 'required|string|max:100',
            'prenom' => 'required|string|max:100',
            'poste' => 'required|string|max:100',
            'telephone' => 'nullable|string|max:20',
            'email' => 'nullable|email',
            'universite_id' => 'required|exists:universites,id'
        ]);

        $personnel = Personnel::create($request->all());
        return response()->json($personnel, 201);
    }

    public function show(Personnel $personnel)
    {
        return response()->json($personnel->load('universite'));
    }

    public function update(Request $request, Personnel $personnel)
    {
        $request->validate([
            'nom' => 'sometimes|required|string|max:100',
            'prenom' => 'sometimes|required|string|max:100',
            'poste' => 'sometimes|required|string|max:100',
            'universite_id' => 'sometimes|required|exists:universites,id'
        ]);

        $personnel->update($request->all());
        return response()->json($personnel);
    }

    public function destroy(Personnel $personnel)
    {
        $personnel->delete();
        return response()->json(null, 204);
    }
}
