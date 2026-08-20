<?php

namespace App\Mail;

use App\Models\ParentInvitation;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class ParentInvitationMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public ParentInvitation $invitation;
    public string $acceptUrl;

    public function __construct(ParentInvitation $invitation, string $acceptUrl)
    {
        $this->invitation = $invitation;
        $this->acceptUrl = $acceptUrl;
    }

    public function build()
    {
        return $this->subject('Invitation à rejoindre l\'établissement')
            ->view('emails.parent_invitation')
            ->with([
                'invitation' => $this->invitation,
                'acceptUrl' => $this->acceptUrl,
                'eleve' => $this->invitation->eleve,
                'ecole' => $this->invitation->ecole,
            ]);
    }
}
