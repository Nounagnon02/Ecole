<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\{Paiement, Bourse, Absence, Incident, Sanction, ConsultationMedicale, DossierMedical, Vaccination, Livre, Emprunt, Reservation, RendezVous, Certificat, Message, Devoir, EmploiDuTemps, ConseilClasse, Examen, Eleves, Classes, Matieres, Enseignants, Parents};

class CompleteDataSeeder extends Seeder
{
    public function run()
    {
        // Paiements
        $eleves = Eleves::all();
        foreach ($eleves->take(20) as $eleve) {
            Paiement::create([
                'eleve_id' => $eleve->id,
                'montant' => rand(50000, 200000),
                'type_paiement' => 'Scolarité',
                'date_paiement' => now()->subDays(rand(1, 30)),
                'statut' => ['payé', 'en_attente', 'annulé'][rand(0, 2)],
                'reference' => 'PAY-' . rand(1000, 9999)
            ]);
        }

        // Bourses
        foreach ($eleves->take(5) as $eleve) {
            Bourse::create([
                'eleve_id' => $eleve->id,
                'type_bourse' => ['Excellence', 'Sociale', 'Mérite'][rand(0, 2)],
                'montant' => rand(25000, 100000),
                'pourcentage' => [25, 50, 75, 100][rand(0, 3)],
                'periode' => '2024-2025',
                'statut' => ['active', 'suspendue', 'terminée'][rand(0, 2)]
            ]);
        }

        // Absences
        foreach ($eleves->take(15) as $eleve) {
            Absence::create([
                'eleve_id' => $eleve->id,
                'date' => now()->subDays(rand(1, 15)),
                'type' => ['absence', 'retard'][rand(0, 1)],
                'justifiee' => rand(0, 1),
                'motif' => ['Maladie', 'Rendez-vous médical', 'Problème familial'][rand(0, 2)]
            ]);
        }

        // Incidents
        for ($i = 0; $i < 10; $i++) {
            Incident::create([
                'description' => 'Incident ' . ($i + 1) . ' - Description détaillée',
                'date' => now()->subDays(rand(1, 30)),
                'gravite' => ['faible', 'moyenne', 'grave'][rand(0, 2)],
                'statut' => ['ouvert', 'en_cours', 'resolu'][rand(0, 2)]
            ]);
        }

        // Sanctions
        foreach ($eleves->take(8) as $eleve) {
            Sanction::create([
                'eleve_id' => $eleve->id,
                'type_sanction' => ['Avertissement', 'Exclusion temporaire', 'Travaux d\'intérêt général'][rand(0, 2)],
                'motif' => 'Comportement inapproprié',
                'date' => now()->subDays(rand(1, 20)),
                'duree' => rand(1, 7),
                'statut' => ['active', 'levee', 'terminee'][rand(0, 2)]
            ]);
        }

        // Consultations médicales
        foreach ($eleves->take(12) as $eleve) {
            ConsultationMedicale::create([
                'eleve_id' => $eleve->id,
                'motif' => ['Mal de tête', 'Fièvre', 'Blessure', 'Malaise'][rand(0, 3)],
                'diagnostic' => 'Diagnostic médical détaillé',
                'date' => now()->subDays(rand(1, 30)),
                'traitement' => 'Traitement prescrit',
                'urgence' => rand(0, 1)
            ]);
        }

        // Dossiers médicaux
        foreach ($eleves->take(20) as $eleve) {
            DossierMedical::create([
                'eleve_id' => $eleve->id,
                'groupe_sanguin' => ['A+', 'B+', 'AB+', 'O+', 'A-', 'B-', 'AB-', 'O-'][rand(0, 7)],
                'allergies' => rand(0, 1) ? 'Allergie aux arachides' : null,
                'maladies_chroniques' => rand(0, 1) ? 'Asthme' : null,
                'contact_urgence' => '+225 07 ' . rand(10, 99) . ' ' . rand(10, 99) . ' ' . rand(10, 99),
                'derniere_visite' => now()->subDays(rand(30, 365)),
                'vaccins_a_jour' => rand(0, 1),
                'aptitude_sport' => rand(0, 1)
            ]);
        }

        // Vaccinations
        foreach ($eleves->take(15) as $eleve) {
            Vaccination::create([
                'eleve_id' => $eleve->id,
                'nom_vaccin' => ['BCG', 'DTC', 'Polio', 'ROR', 'Hépatite B'][rand(0, 4)],
                'date_vaccination' => now()->subDays(rand(30, 365)),
                'numero_lot' => 'LOT-' . rand(1000, 9999),
                'date_rappel' => now()->addMonths(rand(6, 24)),
                'effets_secondaires' => rand(0, 1)
            ]);
        }

        // Livres
        $livres = [
            ['titre' => 'Les Misérables', 'auteur' => 'Victor Hugo', 'categorie' => 'Littérature'],
            ['titre' => 'Le Petit Prince', 'auteur' => 'Antoine de Saint-Exupéry', 'categorie' => 'Jeunesse'],
            ['titre' => 'Mathématiques 6ème', 'auteur' => 'Collectif', 'categorie' => 'Scolaire'],
            ['titre' => 'Histoire de l\'Afrique', 'auteur' => 'Joseph Ki-Zerbo', 'categorie' => 'Histoire'],
            ['titre' => 'Sciences Physiques', 'auteur' => 'Marie Curie', 'categorie' => 'Sciences']
        ];

        foreach ($livres as $livre) {
            Livre::create([
                'titre' => $livre['titre'],
                'auteur' => $livre['auteur'],
                'isbn' => '978-' . rand(1000000000, 9999999999),
                'categorie' => $livre['categorie'],
                'annee_publication' => rand(2000, 2024),
                'nombre_exemplaires' => rand(1, 5),
                'disponible' => rand(0, 1)
            ]);
        }

        // Emprunts
        $livres = Livre::all();
        foreach ($eleves->take(10) as $eleve) {
            Emprunt::create([
                'livre_id' => $livres->random()->id,
                'eleve_id' => $eleve->id,
                'date_emprunt' => now()->subDays(rand(1, 30)),
                'date_retour_prevue' => now()->addDays(rand(7, 21)),
                'date_retour_effective' => rand(0, 1) ? now()->subDays(rand(1, 10)) : null
            ]);
        }

        // Réservations
        foreach ($eleves->take(5) as $eleve) {
            Reservation::create([
                'livre_id' => $livres->random()->id,
                'eleve_id' => $eleve->id,
                'date_reservation' => now()->subDays(rand(1, 10)),
                'date_limite' => now()->addDays(rand(3, 7)),
                'statut' => ['en_attente', 'confirmée', 'expirée'][rand(0, 2)]
            ]);
        }

        // Rendez-vous
        $parents = Parents::all();
        $enseignants = Enseignants::all();
        foreach ($parents->take(8) as $parent) {
            RendezVous::create([
                'motif' => 'Suivi scolaire',
                'parent_id' => $parent->id,
                'eleve_id' => $parent->eleves->first()->id ?? null,
                'enseignant_id' => $enseignants->random()->id,
                'date' => now()->addDays(rand(1, 30)),
                'heure' => rand(8, 17) . ':00',
                'statut' => ['programmé', 'confirmé', 'annulé'][rand(0, 2)]
            ]);
        }

        // Certificats
        foreach ($eleves->take(6) as $eleve) {
            Certificat::create([
                'type_certificat' => ['Scolarité', 'Assiduité', 'Bonne conduite'][rand(0, 2)],
                'eleve_id' => $eleve->id,
                'date_emission' => now()->subDays(rand(1, 15)),
                'numero_certificat' => 'CERT-2024-' . str_pad(rand(1, 999), 3, '0', STR_PAD_LEFT),
                'delivre' => rand(0, 1)
            ]);
        }

        // Messages
        for ($i = 0; $i < 15; $i++) {
            Message::create([
                'sujet' => 'Message ' . ($i + 1),
                'contenu' => 'Contenu du message ' . ($i + 1),
                'expediteur' => 'Direction',
                'destinataire' => 'Parent ' . rand(1, 10),
                'lu' => rand(0, 1)
            ]);
        }

        // Devoirs
        $classes = Classes::all();
        $matieres = Matieres::all();
        foreach ($enseignants->take(10) as $enseignant) {
            Devoir::create([
                'titre' => 'Devoir de ' . $matieres->random()->nom,
                'description' => 'Description détaillée du devoir à faire',
                'classe_id' => $classes->random()->id,
                'matiere_id' => $matieres->random()->id,
                'enseignant_id' => $enseignant->id,
                'date_limite' => now()->addDays(rand(3, 14))
            ]);
        }

        // Emplois du temps
        $jours = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi'];
        foreach ($classes->take(5) as $classe) {
            foreach ($jours as $jour) {
                for ($h = 8; $h < 16; $h += 2) {
                    EmploiDuTemps::create([
                        'classe_id' => $classe->id,
                        'matiere_id' => $matieres->random()->id,
                        'enseignant_id' => $enseignants->random()->id,
                        'jour' => $jour,
                        'heure_debut' => sprintf('%02d:00', $h),
                        'heure_fin' => sprintf('%02d:00', $h + 2),
                        'salle' => 'Salle ' . rand(1, 20)
                    ]);
                }
            }
        }

        // Conseils de classe
        foreach ($classes->take(3) as $classe) {
            ConseilClasse::create([
                'classe_id' => $classe->id,
                'date' => now()->addDays(rand(10, 60)),
                'trimestre' => '1er trimestre',
                'participants' => ['Directeur', 'Enseignants', 'Délégués'],
                'decisions' => ['Félicitations', 'Encouragements', 'Avertissements'],
                'statut' => ['programmé', 'en_cours', 'terminé'][rand(0, 2)]
            ]);
        }

        // Examens
        for ($i = 0; $i < 3; $i++) {
            Examen::create([
                'nom' => 'Examen ' . ($i + 1),
                'type' => ['Contrôle continu', 'Examen final', 'Rattrapage'][rand(0, 2)],
                'date_debut' => now()->addDays(rand(30, 90)),
                'date_fin' => now()->addDays(rand(35, 95)),
                'classes' => $classes->take(3)->pluck('nom_classe')->toArray(),
                'matieres' => $matieres->take(5)->pluck('nom')->toArray(),
                'statut' => ['programmé', 'en_cours', 'terminé'][rand(0, 2)]
            ]);
        }
    }
}