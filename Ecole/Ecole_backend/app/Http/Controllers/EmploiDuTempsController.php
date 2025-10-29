<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class EmploiDuTempsController extends Controller
{
    public function index(Request $request)
    {
        $query = DB::table('emplois_du_temps')
            ->join('classes', 'emplois_du_temps.classe_id', '=', 'classes.id')
            ->join('matieres', 'emplois_du_temps.matiere_id', '=', 'matieres.id')
            ->select('emplois_du_temps.*', 'classes.nom_classe', 'matieres.nom as nom_matiere');

        if ($request->has('classe_id')) {
            $query->where('emplois_du_temps.classe_id', $request->class_id);
        }

        if ($request->has('enseignant_id')) {
            $query->where('emplois_du_temps.enseignant_id', $request->enseignant_id);
        }

        $emplois = $query->orderBy('jour')->orderBy('heure_debut')->get();
        return response()->json(['success' => true, 'data' => $emplois]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'classe_id' => 'required|exists:classes,id',
            'matiere_id' => 'required|exists:matieres,id',
            'enseignant_id' => 'required',
            'jour' => 'required|string',
            'heure_debut' => 'required',
            'heure_fin' => 'required',
            'salle' => 'nullable|string'
        ]);

        $id = DB::table('emplois_du_temps')->insertGetId(array_merge($validated, [
            'created_at' => now(),
            'updated_at' => now()
        ]));

        return response()->json(['success' => true, 'data' => ['id' => $id]], 201);
    }

    public function update(Request $request, $id)
    {
        $validated = $request->validate([
            'classe_id' => 'exists:classes,id',
            'matiere_id' => 'exists:matieres,id',
            'enseignant_id' => 'string',
            'jour' => 'string',
            'heure_debut' => 'string',
            'heure_fin' => 'string',
            'salle' => 'nullable|string'
        ]);

        DB::table('emplois_du_temps')->where('id', $id)->update(array_merge($validated, [
            'updated_at' => now()
        ]));

        return response()->json(['success' => true]);
    }

    public function destroy($id)
    {
        DB::table('emplois_du_temps')->where('id', $id)->delete();
        return response()->json(['success' => true]);
    }

    public function getByClasse($classeId)
    {
        $emplois = DB::table('emplois_du_temps')
            ->join('matieres', 'emplois_du_temps.matiere_id', '=', 'matieres.id')
            ->leftJoin('enseignants', 'emplois_du_temps.enseignant_id', '=', DB::raw('CAST(enseignants.id AS CHAR)'))
            ->where('emplois_du_temps.classe_id', $classeId)
            ->select(
                'emplois_du_temps.*',
                'matieres.nom as matiere',
                DB::raw('CONCAT(enseignants.nom, " ", enseignants.prenom) as professeur')
            )
            ->orderBy('jour')
            ->orderBy('heure_debut')
            ->get();

        return response()->json(['success' => true, 'data' => $emplois]);
    }
}
