<!-- resources/views/emails/parent_invitation.blade.php -->
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1a1a1a; line-height: 1.6; }
        .container { max-width: 600px; margin: 0 auto; padding: 32px; }
        .header { text-align: center; margin-bottom: 24px; }
        .btn { display: inline-block; background-color: #1A3A3C; color: #ffffff; text-decoration: none; padding: 12px 32px; border-radius: 8px; font-weight: 600; margin: 16px 0; }
        .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e7eb; font-size: 13px; color: #6b7280; }
        .info { background-color: #f6f3ee; padding: 16px; border-radius: 8px; margin: 16px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 style="color: #1A3A3C; margin: 0;">École</h1>
        </div>

        <p>Bonjour,</p>

        <p>
            Vous avez été invité(e) à rejoindre l'établissement
            <strong>{{ $ecole->nom ?? 'votre établissement' }}</strong>
            en tant que parent de l'élève
            <strong>{{ $eleve->user->prenom ?? '' }} {{ $eleve->user->name ?? '' }}</strong>.
        </p>

        <div class="info">
            <p style="margin: 0;"><strong>Élève :</strong> {{ $eleve->user->prenom ?? '' }} {{ $eleve->user->name ?? '' }}</p>
            <p style="margin: 4px 0 0 0;"><strong>Établissement :</strong> {{ $ecole->nom ?? '' }}</p>
        </div>

        <p>Cliquez sur le bouton ci-dessous pour accepter l'invitation et créer votre compte :</p>

        <div style="text-align: center;">
            <a href="{{ $acceptUrl }}" class="btn">Accepter l'invitation</a>
        </div>

        <p style="font-size: 14px; color: #6b7280;">
            Ce lien expirera dans {{ $invitation->expires_at->diffForHumans() }}.
        </p>

        <div class="footer">
            <p>Si vous n'avez pas demandé cette invitation, vous pouvez ignorer cet email.</p>
        </div>
    </div>
</body>
</html>
