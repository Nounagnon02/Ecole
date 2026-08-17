<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: sans-serif; font-size: 12px; margin: 30px; }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 15px; }
        .header h1 { margin: 0; font-size: 20px; }
        .header .logo { width: 80px; height: 80px; margin: 0 auto 10px; background: #eee; border: 1px solid #ccc; display: flex; align-items: center; justify-content: center; color: #999; font-size: 10px; }
        .info { margin-bottom: 20px; }
        .info p { margin: 4px 0; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
        th, td { border: 1px solid #333; padding: 8px 10px; text-align: center; }
        th { background-color: #f0f0f0; font-weight: bold; }
        .footer { margin-top: 40px; text-align: right; }
        .footer .signature { border-top: 1px solid #333; width: 200px; display: inline-block; text-align: center; padding-top: 5px; }
    </style>
</head>
<body>
    <div class="header">
        <div class="logo">Logo</div>
        <h1>{{ $ecole ?? 'Nom de l\'école' }}</h1>
        <p>Bulletin Scolaire</p>
    </div>

    <div class="info">
        <p><strong>Élève :</strong> {{ $eleve['nom'] ?? '' }} {{ $eleve['prenom'] ?? '' }}</p>
        <p><strong>Classe :</strong> {{ $classe['nom'] ?? $classe ?? '' }}</p>
        <p><strong>Période :</strong> {{ $periode ?? '' }}</p>
    </div>

    <table>
        <thead>
            <tr>
                <th>Matière</th>
                <th>Coeff</th>
                <th>Note</th>
                <th>Moyenne</th>
            </tr>
        </thead>
        <tbody>
            @foreach($matieres as $matiere)
            <tr>
                <td>{{ $matiere['nom'] ?? '' }}</td>
                <td>{{ $matiere['coefficient'] ?? '' }}</td>
                <td>{{ $matiere['note'] ?? '' }}</td>
                <td>{{ $matiere['moyenne'] ?? round(($matiere['note'] ?? 0) * ($matiere['coefficient'] ?? 1) / ($matiere['coefficient'] ?? 1), 2) }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>

    @if(!empty($mention))
    <p><strong>Mention :</strong> {{ $mention }}</p>
    @endif

    <div class="footer">
        <div class="signature">
            <p>Signature</p>
        </div>
    </div>
</body>
</html>
