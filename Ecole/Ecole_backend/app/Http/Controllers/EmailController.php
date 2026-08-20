<?php

namespace App\Http\Controllers;
use Illuminate\Support\Facades\Mail;
use App\Models\Eleve;
use Illuminate\Http\Request;

class EmailController extends Controller
{
    public function envoyerEmailCandidats(Request $request)
    {
        $eleves = Eleve::whereHas('user', function ($q) {
            $q->whereNotNull('email');
        })->get();

        foreach ($eleves as $eleve) {
            Mail::to($eleve->user->email)->queue(new \App\Mail\NumeroMatriculeMail($eleve));
        }

        return response()->json(['message' => 'Emails en cours d\'envoi !'], 202);
    }
}
