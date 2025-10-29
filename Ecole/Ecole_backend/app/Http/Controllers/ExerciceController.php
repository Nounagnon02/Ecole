<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ExerciceController extends Controller
{
    public function index(Request $request)
    {
        $enseignantId = $request->query('enseignant_id');
        
        $query = DB::table('exercices')
            ->join('classes', 'exercices.classe_id', '=', 'classes.id')
            ->select('exercices.*', 'classes.nom_classe as classe');
        
        if ($enseignantId) {
            $query->where('exercices.enseignant_id', $enseignantId);
        }
        
        $exercices = $query->orderBy('exercices.date_limite', 'desc')->get();
        
        return response()->json(['success' => true, 'data' => $exercices]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'classe_id' => 'required|integer',
            'enseignant_id' => 'required|integer',
            'titre' => 'required|string',
            'description' => 'required|string',
            'date_limite' => 'required|date'
        ]);

        $id = DB::table('exercices')->insertGetId(array_merge($validated, [
            'created_at' => now(),
            'updated_at' => now()
        ]));

        return response()->json(['success' => true, 'data' => ['id' => $id]], 201);
    }

    public function update(Request $request, $id)
    {
        $validated = $request->validate([
            'titre' => 'string',
            'description' => 'string',
            'date_limite' => 'date'
        ]);

        DB::table('exercices')->where('id', $id)->update(array_merge($validated, ['updated_at' => now()]));

        return response()->json(['success' => true]);
    }

    public function destroy($id)
    {
        DB::table('exercices')->where('id', $id)->delete();
        return response()->json(['success' => true]);
    }
}
