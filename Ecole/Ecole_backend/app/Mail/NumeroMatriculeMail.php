<?php

namespace App\Mail;

use App\Models\Eleve;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class NumeroMatriculeMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public $eleve;

    public function __construct(Eleve $eleve)
    {
        $this->eleve = $eleve;
    }

    public function build()
    {
        return $this->view('emails.numero_matricule')
                    ->with([
                        'numeroMatricule' => $this->eleve->numero_matricule,
                    ]);
    }
}
