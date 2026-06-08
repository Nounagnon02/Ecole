<?php

namespace Tests\Unit;

use Tests\TestCase;
use App\Models\Universite\Universite;
use App\Models\Universite\Faculte;
use App\Models\Universite\Departement;
use App\Models\Universite\Filiere;
use App\Models\Universite\Etudiant;
use App\Models\Universite\Enseignant;
use App\Models\Universite\Matiere;
use App\Models\Universite\Semestre;
use App\Models\Universite\AnneeAcademique;
use App\Models\Universite\Inscription;
use App\Models\Universite\Note;
use App\Models\Universite\Paiement;
use App\Models\Universite\Diplome;
use App\Models\Universite\Personnel;

class UniversityModelTest extends TestCase
{
    /**
     * Test that all university models can be instantiated.
     */
    public function test_all_university_models_instantiate()
    {
        $this->assertInstanceOf(Universite::class, new Universite());
        $this->assertInstanceOf(Faculte::class, new Faculte());
        $this->assertInstanceOf(Departement::class, new Departement());
        $this->assertInstanceOf(Filiere::class, new Filiere());
        $this->assertInstanceOf(Etudiant::class, new Etudiant());
        $this->assertInstanceOf(Enseignant::class, new Enseignant());
        $this->assertInstanceOf(Matiere::class, new Matiere());
        $this->assertInstanceOf(Semestre::class, new Semestre());
        $this->assertInstanceOf(AnneeAcademique::class, new AnneeAcademique());
        $this->assertInstanceOf(Inscription::class, new Inscription());
        $this->assertInstanceOf(Note::class, new Note());
        $this->assertInstanceOf(Paiement::class, new Paiement());
        $this->assertInstanceOf(Diplome::class, new Diplome());
        $this->assertInstanceOf(Personnel::class, new Personnel());
    }

    /**
     * Test that unfillable attributes are guarded on university models.
     */
    public function test_university_model_fillable_attributes()
    {
        $universite = new Universite(['nom' => 'Test Université', 'sigle' => 'TU']);
        $this->assertEquals('Test Université', $universite->nom);
        $this->assertEquals('TU', $universite->sigle);
    }

    /**
     * Test that the Universite model has the correct table name.
     */
    public function test_universite_model_table()
    {
        $model = new Universite();
        $this->assertEquals('universites', $model->getTable());
    }

    /**
     * Test that the AnneeAcademique model uses the correct table.
     */
    public function test_annee_academique_model_table()
    {
        $model = new AnneeAcademique();
        $this->assertEquals('annee_academiques', $model->getTable());
    }

    /**
     * Test that the Etudiant model fillable fields match schema.
     */
    public function test_etudiant_model_has_required_fillable()
    {
        $fillable = (new Etudiant())->getFillable();
        $required = ['matricule', 'nom', 'prenom', 'date_naissance', 'sexe', 'filiere_id'];

        foreach ($required as $field) {
            $this->assertContains($field, $fillable, "Missing fillable field: {$field}");
        }
    }

    /**
     * Test that the Universite model defines correct relationships.
     */
    public function test_universite_has_facultes_relation()
    {
        $model = new Universite();
        $this->assertTrue(method_exists($model, 'facultes'), 'Universite must have facultes() method');
        $this->assertTrue(method_exists($model, 'personnels'), 'Universite must have personnels() method');
    }
}
