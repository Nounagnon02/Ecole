<?php

namespace App\Mail;

use App\Models\Candidats;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class NumeroMatriculeMail extends Mailable
{
    use Queueable, SerializesModels;

    public $candidat;

    public function __construct(Candidats $candidat)
    {
        $this->candidat = $candidat;
    }

    public function build()
    {
        return $this->view('emails.numero_matricule')
                    ->with([
                        'numeroMatricule' => $this->candidat->numero_matricule,
                    ]);
    }
}
