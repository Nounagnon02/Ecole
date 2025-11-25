<?php

namespace App\Http\Controllers\Universite;

use App\Http\Controllers\Controller;
use App\Models\Universite\Universite as UniversiteModel;
use Illuminate\Http\Request;

class UniversiteController extends Controller
{
    // app/Http/Controllers/UniversiteController.php



    public function index()
    {
        $universites = UniversiteModel::all();
        return response()->json($universites);
    }

    public function store(Request $request)
    {
        $request->validate([
            'nom' => 'required|string|max:100',
            'sigle' => 'required|string|max:10',
            'adresse' => 'nullable|string',
            'telephone' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:100',
            'site_web' => 'nullable|string|max:100',
        ]);

        $universite = UniversiteModel::create($request->all());
        return response()->json($universite, 201);
    }

    public function show(UniversiteModel $universite)
    {
        return response()->json($universite);
    }

    public function update(Request $request, UniversiteModel $universite)
    {
        $request->validate([
            'nom' => 'sometimes|required|string|max:100',
            'sigle' => 'sometimes|required|string|max:10',
            'adresse' => 'nullable|string',
            'telephone' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:100',
            'site_web' => 'nullable|string|max:100',
        ]);

        $universite->update($request->all());
        return response()->json($universite);
    }

    public function destroy(UniversiteModel $universite)
    {
        $universite->delete();
        return response()->json(null, 204);
    }
}
