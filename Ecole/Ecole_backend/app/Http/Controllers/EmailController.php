<?php

namespace App\Http\Controllers;
use Illuminate\Support\Facades\Mail;
use App\Models\Candidats;
use Illuminate\Http\Request;

class EmailController extends Controller
{
    public function envoyerEmailCandidats(Request $request)
    {
        // Récupérer tous les candidats
        $candidats = Candidats::all();

        foreach ($candidats as $candidat) {
            // Envoi de l'email à chaque candidat
            Mail::to($candidat->email)->send(new \App\Mail\NumeroMatriculeMail($candidat));
        }

        return response()->json(['message' => 'Emails envoyés avec succès !'], 200);
    }
}
