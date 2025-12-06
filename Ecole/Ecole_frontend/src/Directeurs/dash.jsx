import React, { useState, useEffect } from 'react';
import { PieChart, Pie, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { Edit2, Trash2, Save, X, Plus, Menu, Home, Users, Book, User, Settings, LogOut, Bell, Calendar, ChevronDown, ChevronUp, ClipboardList, MessageSquare, CheckCircle, GraduationCap, UserCheck, Shield, DollarSign, Heart, BookOpen, Link } from 'lucide-react';
import '../styles/GlobalStyles.css';
import { NavLink } from 'react-router-dom';
import * as XLSX from 'xlsx';
import * as pdfjsLib from 'pdfjs-dist';
import api from '../api';
import Messagerie from '../components/Messagerie';
import NotificationBell from '../components/NotificationBell';
import EmploiDuTemps from './EmploiDuTemps';
import MarquagePresence from '../components/MarquagePresence';



const attendanceData = [
  { name: 'Lundi', présent: 92, absent: 8 },
  { name: 'Mardi', présent: 95, absent: 5 },
  { name: 'Mercredi', présent: 90, absent: 10 },
  { name: 'Jeudi', présent: 88, absent: 12 },
  { name: 'Vendredi', présent: 85, absent: 15 },
];


const classesList = [
  { id: 1, nom: "CP", effectif: 28, enseignant: "Mme Dupont", salle: "A101" },
  { id: 2, nom: "CE1", effectif: 25, enseignant: "M. Martin", salle: "A102" },
  { id: 3, nom: "CE2", effectif: 26, enseignant: "Mme Robert", salle: "A103" },
  { id: 4, nom: "CM1", effectif: 24, enseignant: "M. Bernard", salle: "A201" },
  { id: 5, nom: "CM2", effectif: 22, enseignant: "Mme Thomas", salle: "A202" },
];

const notifications = [
  { id: 1, message: "Réunion des enseignants demain à 14h", date: "Aujourd'hui, 10:30" },
  { id: 2, message: "Sortie scolaire prévue pour le CM1 vendredi", date: "Hier, 15:45" },
  { id: 3, message: "Rappel: retour des bulletins à signer", date: "21/04, 09:15" },
  { id: 4, message: "Maintenance système informatique samedi", date: "20/04, 16:00" },
];

const evenements = [
  { id: 1, titre: "Conseil de classe", date: "30 Avril, 2025", lieu: "Salle des professeurs" },
  { id: 2, titre: "Fête de l'école", date: "15 Mai, 2025", lieu: "Cour principale" },
  { id: 3, titre: "Réunion parents-profs", date: "10 Mai, 2025", lieu: "Amphithéâtre" },
];

export default function Dashboard() {
  const [matieres, setMatieres] = useState([]);
  const [matieres1, setMatieres1] = useState([]);
  const [series, setSeries] = useState([]);
  const [classes, setClasses] = useState([]);
  const [evenements, setEvenements] = useState([
    { id: 1, titre: "Conseil de classe", date: "30 Avril, 2025", lieu: "Salle des professeurs" },
    { id: 2, titre: "Fête de l'école", date: "15 Mai, 2025", lieu: "Cour principale" },
    { id: 3, titre: "Réunion parents-profs", date: "10 Mai, 2025", lieu: "Amphithéâtre" },
  ]);
  const [notifications, setNotifications] = useState([
    { id: 1, message: "Réunion des enseignants demain à 14h", date: "Aujourd'hui, 10:30" },
    { id: 2, message: "Sortie scolaire prévue pour le CM1 vendredi", date: "Hier, 15:45" },
    { id: 3, message: "Rappel: retour des bulletins à signer", date: "21/04, 09:15" },
    { id: 4, message: "Maintenance système informatique samedi", date: "20/04, 16:00" },
  ]);
  const [editClassCategory, setEditClassCategory] = useState('');
  const [newClassName, setNewClassName] = useState('');
  const [newnom_classe, setNewnom_classe] = useState('');
  const [newcategorie_classe, setNewcategorie_classe] = useState('');
  const [newClassCategory, setNewClassCategory] = useState('');
  const [editClassName, setEditClassName] = useState('');
  const [eleves, setEleves] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [newMatiere, setNewMatiere] = useState('');
  const [newSerie, setNewSerie] = useState('');
  const [newNote, setNewNote] = useState({
    eleve_id: '',
    classe_id: '',
    matiere_id: '',
    note: '',
    note_sur: 20,
    type_evaluation: '',
    commentaire: '',
    date_evaluation: new Date().toISOString().split('T')[0],
    periode: ''
  });
  const [previewData, setPreviewData] = useState([]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [studentData, setStudentData] = useState([]);
  const [gradeData, setGradeData] = useState([]);
  const [activeTab, setActiveTab] = useState('aperçu');
  const [showNotifications, setShowNotifications] = useState(false);
  const [expandedSection, setExpandedSection] = useState('statistiques');
  const [classes1, setClasses1] = useState([])
  // État pour les notes et les filtres
  const [notes, setNotes] = useState([]);
  const [filteredNotes, setFilteredNotes] = useState([]);
  const [filters, setFilters] = useState({
    classe_id: '',
    serie_id: '',
    matiere_id: '',
    type_evaluation: '',
    periode: ''
  });



  // Gardez uniquement cette version
  const [matieresFiltered, setMatieresFiltered] = useState([]);

  const getSerieByClasse = (classe_id) => {
    const classe = classes.find(c => c.id == classe_id);
    return classe ? classe.serie_id : '';
  }

  // Gérer les changements de filtres
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const FilterSection = () => (
    <div className="filters-section">
      <div className="filters-grid">
        <div className="filter-item">
          <label>Classe</label>
          <select
            name="classe_id"
            value={filters.classe_id}
            onChange={handleFilterChange}
            className="filter-select"
            required
          >
            <option value="">Sélectionner une classe</option>
            {classes.map(classe => (
              <option key={classe.id} value={classe.id}>
                {classe.nom_classe}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-item">
          <label>Séries</label>
          <select
            name="serie_id"
            value={filters.serie_id}
            onChange={handleFilterChange}
            className="filter-select"
            required
          >
            <option value="">Sélectionner une série</option>
            {filters.classe_id && (() => {
              const classe = classes.find(c => c.id == filters.classe_id);
              if (!classe || !classe.series) return null;

              return classe.series.map(serie => (
                <option key={serie.id} value={serie.id}>
                  {serie.nom}
                </option>
              ));
            })()}
          </select>
        </div>

        <div className="filter-item">
          <label>Matière</label>
          <select
            name="matiere_id"
            value={filters.matiere_id}
            onChange={handleFilterChange}
            className="filter-select"
            disabled={!filters.serie_id}
            required
          >
            <option value="">Sélectionner une matière</option>
            {filters.serie_id && getMatieresBySerie(filters.serie_id).map(matiere => (
              <option key={matiere.id} value={matiere.id}>
                {matiere.nom}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Type d'évaluation</label>
          {filters.classe_id && (
            <TypeEvaluationSelect
              value={newNote.type_evaluation}
              onChange={handleNoteChange}
              categorie={getClasseCategorie(filters.classe_id)}
            />
          )}
        </div>

        <div className="filter-item">
          <label>Période</label>
          <select
            name="periode"
            value={filters.periode}
            onChange={handleFilterChange}
            className="filter-select"
          >
            <option value="">Toutes les périodes</option>
            <option value="Semestre 1">Semestre 1</option>
            <option value="Semestre 2">Semestre 2</option>
          </select>
        </div>

        <div className="filter-item">
          <button
            onClick={applyFilters}
            className="btn-filter"
            disabled={loading}
          >
            {loading ? 'Chargement...' : 'Rechercher'}
          </button>
        </div>
      </div>
    </div>
  );
  // Fonction pour appliquer les filtres
  const applyFilters = async () => {
    try {
      setLoading(true);

      // Construction de l'URL avec les paramètres de filtrage
      let url = '/notes/filter?';
      const params = new URLSearchParams();

      // Ajouter uniquement les filtres non vides
      for (const [key, value] of Object.entries(filters)) {
        if (value) {
          params.append(key, value);
        }
      }

      url += params.toString();

      const response = await api.post('notes/filter?');

      if (response.data.success) {
        setFilteredNotes(response.data.data);
        console.log('Notes filtrées:', response.data.data);
      } else {
        throw new Error(response.data.message || 'Erreur lors du filtrage');
      }
    } catch (error) {
      console.error('Erreur lors du filtrage:', error);
      setError(error.message || 'Erreur lors du filtrage des notes');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    if (filters.classe_id || filters.matiere_id || filters.type_evaluation || filters.periode) {
      applyFilters();
    }
  }, [filters]);
  // Dans le useEffect qui charge les données initiales, ajoutez :
  useEffect(() => {
    fetchClasses();
    fetchEleves();
    fetchMatieresSeries(); // Utilisez cette fonction pour charger les matières avec leurs séries
    fetchSeries();
    fetchMatieres();
    applyFilters();
    fetchStudentData();
    fetchGradeData();
    fetchClassesSeries();
    fetchClassesAvecEffectiftoutesclasses();
  }, []);

  //Fonction pour recuperer les classes avec leur effectif et categorie
  const fetchClassesAvecEffectiftoutesclasses = async () => {
    try {
      const res = await api.get(`/classes/effectifParClasse`);
      setClasses1(res.data);
      console.log("Classes avec effectif et catégorie:", res.data);
    } catch (err) {
      console.error("Erreur lors de la récupération des classes:", err);
      setError('Erreur lors du chargement des classes avec effectif et catégorie');
    }
  }

  // Modifiez la fonction handleNoteChange :
  const handleNoteChange = (e) => {
    const { name, value } = e.target;

    if (name === 'eleve_id') {
      const selectedEleve = eleves.find(eleve => eleve.id == value);
      if (selectedEleve) {
        // Trouver la classe de l'élève
        const eleveClasse = classes.find(c => c.id == selectedEleve.class_id);

        // Filtrer les matières selon la série de la classe
        if (eleveClasse && eleveClasse.serie_id) {
          const matieresForSerie = matieres.filter(matiere =>
            matiere.series.some(serie => serie.id == eleveClasse.serie_id)
          );
          setMatieresFiltered(matieresForSerie);
        }

        setNewNote(prev => ({
          ...prev,
          eleve_id: value,
          classe_id: selectedEleve.class_id,
          matiere_id: ''
        }));
      }
    } else {
      setNewNote(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Fonction  pour récupérer les matières depuis l'API
  const fetchMatieres = async () => {
    try {
      setLoading(true);
      const res = await api.get('/matieres');
      setMatieres1(res.data);
    } catch (err) {
      console.error(err);
      setError('Erreur lors du chargement des matières');
    } finally {
      setLoading(false);
    }
  };
  // Fonction pour récupérer les matières avec leurs séries depuis l'API
  const fetchMatieresSeries = async () => {
    try {
      setLoading(true);
      const res = await api.get('/matieres-with-series');
      setMatieres(res.data);
    } catch (err) {
      console.error(err);
      setError('Erreur lors du chargement des matières');
    } finally {
      setLoading(false);
    }
  };
  // Fonction pour récupérer les classes avec leurs séries depuis l'API
  const fetchClassesSeries = async () => {
    try {
      setLoading(true);
      const res = await api.get('/classes-with-series');
      console.log('Données reçues de l\'API:', res.data); // 👈 Ajoutez ceci
      setClasses(res.data); //  Vous utilisez setClasses, pas setSeries
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError('Erreur lors du chargement des séries');
      setLoading(false);
    }
  };


  // Fonction pour récupérer les séries depuis l'API
  const fetchSeries = async () => {
    try {
      setLoading(true);
      const res = await api.get('/series');
      setSeries(res.data);
    } catch (err) {
      console.error(err);
      setError('Erreur lors du chargement des séries');
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour récupérer les classes depuis l'API
  const fetchClasses = async () => {
    try {
      const res = await api.get('/classes');
      setClasses(res.data);
    } catch (err) {
      console.error(err);
      setError('Erreur lors du chargement des classes');
    }
  };
  // Fonction pour récupérer les élèves depuis l'API
  const fetchEleves = async () => {
    try {
      const res = await api.get('/eleves');
      setEleves(res.data);
    } catch (err) {
      console.error(err);
      setError('Erreur lors du chargement des élèves');
    }
  };

  //Fonction pour ajouter une nouvelle matière
  const AjouterMatiere = async () => {
    if (!newMatiere.trim()) {
      setError('Le nom de la matière ne peut pas être vide');
      return;
    }

    try {
      setLoading(true);
      const res = await api.post('/matieres/store', { nom: newMatiere }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      setMatieres1([...matieres1, res.data]);
      setNewMatiere('');
      setError('');
      setMessage('Matière ajoutée avec succès');
      await fetchMatieres();
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Erreur lors de l'ajout";
      const errorDetails = err.response?.data?.errors || err.response?.data?.error || err.message;
      setMessage(`${errorMessage}: ${JSON.stringify(errorDetails)}`);
      console.error('Erreur détaillée:', err.response?.data || err.message);
      setLoading(false);
    }
  };
  // Fonction pour ajouter une nouvelle série
  const AjouterSerie = async () => {
    if (!newSerie.trim()) {
      setError('Le nom de la série ne peut pas être vide');
      return;
    }

    try {
      setLoading(true);
      const res = await api.post('/series', {
        nom: newSerie
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      setSeries([...series, res.data]);
      setNewSerie('');
      setError('');
      setMessage('Série ajoutée avec succès');
      setLoading(false);
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Erreur lors de l'ajout";
      setError(errorMessage);
      setLoading(false);
    }
  };;
  // Fonction pour ajouter une nouvelle classe
  const AjouterClasse = async () => {
    if (!newClassName.trim()) {
      setError('Le nom de la classe ne peut pas être vide');
      return;
    }
    if (!newClassCategory.trim()) {
      setError('La catégorie de la classe ne peut pas être vide');
      return;
    }

    try {
      setLoading(true);
      const res = await api.post('/classes/store', {
        nom_classe: newClassName,
        categorie_classe: newClassCategory,
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      setClasses1([...classes1, res.data]);
      setNewClassName('');
      setNewClassCategory('');
      setError('');
      await fetchClassesAvecEffectiftoutesclasses();
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Erreur lors de l'ajout";
      const errorDetails = err.response?.data?.errors || err.response?.data?.error || err.message;
      setMessage(`${errorMessage}: ${JSON.stringify(errorDetails)}`);
      setError(true);
      setLoading(false);
    }
  };

  // État pour le formulaire d'importation
  const [importData, setImportData] = useState({
    classe_id: '',
    serie_id: '', // Utilisé pour filtrer les matières mais pas envoyé
    matiere_id: '',
    fichier: null,
    type_evaluation: '',
    date_evaluation: '',
    periode: ''
  });

  const [loading, setLoading] = useState(false);

  // Fonction pour gérer l'édition d'une matière
  const handleEdit = (matiere) => {
    setEditingId(matiere.id);
    setEditValue(matiere.nom);
  };
  //Fonction pour gérer l'édition d'une classe
  const handleEditClass = (classe) => {
    setEditingId(classe.id);
    setEditValue(classe.nom);
  };
  // Fonction pour gérer la modification d'une matieres
  const Modification = async (id) => {
    if (!editValue.trim()) {
      setError('Le nom de la matière ne peut pas être vide');
      return;
    }

    try {
      setLoading(true);
      await api.put(`/matieres/update/${id}`, { nom: editValue }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      await fetchMatieres();
      setMessage('Matière modifiée avec succès');
      setEditingId(null);
      setEditValue('');
      setError('');
    } catch (err) {
      setError('Erreur lors de la modification');
      setLoading(false);
    }
  };
  // Fonction pour gérer la modification d'une série
  const ModificationSerie = async (id) => {
    if (!editValue.trim()) {
      setError('Le nom de la série ne peut pas être vide');
      return;
    }

    try {
      setLoading(true);
      await api.put(`/series/update/${id}`, { nom: editValue }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      await fetchSeries();
      setMessage('Série modifiée avec succès');
      setEditingId(null);
      setEditValue('');
      setError('');
    } catch (err) {
      setError('Erreur lors de la modification');
      setLoading(false);
    }
  };
  //Fonction pour gérer la modification d'une classe
  const ModificationClasse = async (id) => {
    if (!editValue.trim()) {
      setError('Le nom de la classe ne peut pas être vide');
      return;
    }

    try {
      setLoading(true);
      await api.put(`/classes/update/${id}`, { nom: editValue }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      await fetchClassesAvecEffectiftoutesclasses();
      setMessage('Classe modifiée avec succès');
      setEditingId(null);
      setEditValue('');
      setError('');
    } catch (err) {
      setError('Erreur lors de la modification');
      setLoading(false);
    }
  };


  const handleCancel = () => {
    setEditingId(null);
    setEditValue('');
    setError('');
  };
  const handleDelete = async (id) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette matière ?')) {
      return;
    }

    try {
      setLoading(true);
      await api.delete(`/matieres/delete/${id}`);
      await fetchMatieres();
      setMessage('Matière supprimée avec succès');
    } catch (err) {
      setError('Erreur lors de la suppression');
      setLoading(false);
    }
  };
  const handleDeleteClass = async (id) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette classe ?')) {
      return;
    }

    try {
      setLoading(true);
      await api.delete(`/classes/delete/${id}`);
      await fetchClassesAvecEffectiftoutesclasses();
      setMessage('Classe supprimée avec succès');
    } catch (err) {
      setError('Erreur lors de la suppression');
      setLoading(false);
    }
  };

  const handleAddNote = async () => {
    try {
      setLoading(true);
      const res = await api.post('/notes', newNote);
      // Vérifiez que la réponse est valide
      if (res.data && typeof res.data === 'object') {
        setNotes(prev => Array.isArray(prev) ? [...prev, res.data] : [res.data]);
        setMessage('Note ajoutée avec succès');
        // Réinitialiser le formulaire
        setNewNote({
          eleve_id: '',
          classe_id: '',
          matiere_id: '',
          note: '',
          note_sur: 20,
          type_evaluation: '',
          commentaire: '',
          date_evaluation: new Date().toISOString().split('T')[0],
          periode: ''
        });
      }
    } catch (err) {
      console.error('Erreur handleAddNote:', err);
      setError("Erreur lors de l'ajout de la note");
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (section) => {
    if (expandedSection === section) {
      setExpandedSection(null);
    } else {
      setExpandedSection(section);
    }
  };

  ;
  // Fonction pour gérer les changements dans le formulaire
  const handleImportChange = async (e) => {
    const { name, value, files } = e.target;

    if (name === 'fichier') {
      setImportData(prev => ({
        ...prev,
        [name]: files[0]
      }));

      // Prévisualisation des données
      if (files[0]) {
        const preview = await previewImportData(files[0]);
        setPreviewData(preview);
      }
    } else if (name === 'classe_id') {
      // Reset série et matière quand la classe change
      setImportData(prev => ({
        ...prev,
        classe_id: value,
        serie_id: '',
        matiere_id: ''
      }));
    } else if (name === 'serie_id') {
      // Reset matière quand la série change
      setImportData(prev => ({
        ...prev,
        serie_id: value,
        matiere_id: ''
      }));
    } else {
      setImportData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  }
  // Fonction pour traiter le fichier Excel
  const processExcelFile = async (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = e.target.result;
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];

          // Convertir en JSON avec l'option header pour spécifier les colonnes
          const jsonData = XLSX.utils.sheet_to_json(worksheet, {
            header: ['matricule', 'nom', 'prenoms', 'note'], // Colonnes de votre fichier
            range: 1, // Commencer à partir de la deuxième ligne (ignorer l'en-tête)
          });

          // Filtrer et formater les données
          const formattedData = jsonData
            .filter(row => row.matricule && row.nom && row.note !== undefined)
            .map(row => ({
              matricule: row.matricule.toString().trim(),
              nom_etudiant: `${row.nom} ${row.prenoms || ''}`.trim(), // Combine nom et prénoms
              note: parseFloat(row.note)
            }))
            .filter(item => !isNaN(item.note) && item.note >= 0 && item.note <= 20);

          if (formattedData.length === 0) {
            reject(new Error('Le fichier ne contient pas de données valides. Vérifiez le format du fichier.'));
          }

          console.log('Données formatées:', formattedData); // Pour le débogage
          resolve(formattedData);

        } catch (error) {
          console.error('Erreur lors du traitement du fichier:', error);
          reject(new Error('Erreur lors de la lecture du fichier Excel. Vérifiez le format du fichier.'));
        }
      };
      reader.onerror = () => reject(new Error('Erreur lors de la lecture du fichier'));
      reader.readAsArrayBuffer(file);
    });
  };

  // Fonction pour traiter le fichier PDF
  const processPDFFile = async (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const typedarray = new Uint8Array(e.target.result);
          const pdf = await pdfjsLib.getDocument(typedarray).promise;

          let fullText = '';
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map(item => item.str).join(' ');
            fullText += pageText + '\n';
          }

          // Traiter le texte extrait pour récupérer les notes
          const notesData = parseNotesFromText(fullText);
          resolve(notesData);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error('Erreur lors de la lecture du fichier PDF'));
      reader.readAsArrayBuffer(file);
    });
  };

  // Fonction pour parser les notes depuis le texte PDF
  const parseNotesFromText = (text) => {
    const lines = text.split('\n').filter(line => line.trim());
    const notesData = [];

    // Pattern pour identifier les lignes avec nom et note
    const notePattern = /^(.+?)\s+(\d+(?:[.,]\d+)?)\s*$/;

    lines.forEach(line => {
      const match = line.trim().match(notePattern);
      if (match) {
        const nom = match[1].trim();
        const note = parseFloat(match[2].replace(',', '.'));

        if (!isNaN(note) && nom.length > 1) {
          notesData.push({
            nom_etudiant: nom,
            note: note
          });
        }
      }
    });

    return notesData;
  };

  // Fonction pour valider les données des notes
  const validateNotesData = (notesData) => {
    const errors = [];

    if (!Array.isArray(notesData) || notesData.length === 0) {
      errors.push('Aucune donnée de note trouvée dans le fichier');
      return errors;
    }

    notesData.forEach((note, index) => {
      if (!note.nom_etudiant || note.nom_etudiant.trim() === '') {
        errors.push(`Ligne ${index + 1}: Nom de l'étudiant manquant`);
      }

      if (typeof note.note !== 'number' || isNaN(note.note)) {
        errors.push(`Ligne ${index + 1}: Note invalide pour ${note.nom_etudiant}`);
      } else if (note.note < 0 || note.note > 20) {
        errors.push(`Ligne ${index + 1}: Note hors limite (0-20) pour ${note.nom_etudiant}`);
      }
    });

    return errors;
  };

  // Fonction pour prévisualiser les données avant importation
  const previewImportData = async (file) => {
    try {
      const fileExtension = file.name.split('.').pop().toLowerCase();

      if (!['xlsx', 'xls'].includes(fileExtension)) {
        throw new Error('Format de fichier non supporté');
      }

      const data = await processExcelFile(file);
      return data.slice(0, 5); // Retourne les 5 premières lignes pour la prévisualisation
    } catch (error) {
      console.error('Erreur prévisualisation:', error);
      return [];
    }
  };

  // Fonction principale pour gérer la soumission du formulaire
  const handleImportSubmit = async (e) => {
    e.preventDefault();

    if (!importData.classe_id || !importData.serie_id || !importData.matiere_id ||
      !importData.fichier || !importData.type_evaluation || !importData.date_evaluation) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    setLoading(true);

    try {
      // Traitement du fichier
      const fileExtension = importData.fichier.name.split('.').pop().toLowerCase();
      let notesData;

      if (['xlsx', 'xls'].includes(fileExtension)) {
        notesData = await processExcelFile(importData.fichier);
      } else {
        throw new Error('Format de fichier non supporté. Veuillez utiliser un fichier Excel (.xlsx, .xls)');
      }

      if (!notesData || notesData.length === 0) {
        throw new Error('Aucune donnée valide trouvée dans le fichier');
      }

      // Création du FormData
      const formData = new FormData();
      formData.append('classe_id', importData.classe_id);
      formData.append('serie_id', importData.serie_id);
      formData.append('matiere_id', importData.matiere_id);
      formData.append('type_evaluation', importData.type_evaluation);
      formData.append('date_evaluation', importData.date_evaluation);
      formData.append('periode', importData.periode);
      formData.append('notes', JSON.stringify(notesData));
      formData.append('fichier', importData.fichier);

      // Envoi au backend
      const response = await api.post('/notes/import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        }
      });

      if (response.data.success) {
        alert('Notes importées avec succès !');
        // Réinitialiser le formulaire
        setImportData({
          classe_id: '',
          serie_id: '',
          matiere_id: '',
          fichier: null,
          type_evaluation: '',
          date_evaluation: '',
          periode: ''
        });
        setPreviewData([]);

        // Rafraîchir la liste des notes
        applyFilters();
      } else {
        throw new Error(response.data.message || 'Erreur lors de l\'importation');
      }

    } catch (error) {
      console.error('Erreur lors de l\'importation:', error);
      alert(error.message || 'Une erreur est survenue lors de l\'importation');
    } finally {
      setLoading(false);
    }
  };

  // Fonction utilitaire pour obtenir les matières d'une série
  const getMatieresBySerie = (serieId) => {
    if (!serieId) return [];

    const serie = series.find(s => s.id == serieId);
    return serie && serie.matieres ? serie.matieres : [];
  };



  const handleEditNote = (note) => {
    // Préremplir le formulaire avec les données de la note
    setNewNote({
      eleve_id: note.eleve_id,
      classe_id: note.classe_id,
      matiere_id: note.matiere_id,
      note: note.note,
      note_sur: note.note_sur,
      type_evaluation: note.type_evaluation,
      commentaire: note.commentaire,
      date_evaluation: note.date_evaluation,
      periode: note.periode
    });
    // Option : faire défiler jusqu'au formulaire
    document.querySelector('.add-note-form').scrollIntoView({ behavior: 'smooth' });
  };

  const handleDeleteNote = async (noteId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette note ?')) {
      return;
    }

    try {
      setLoading(true);
      await api.delete(`/notes/${noteId}`);
      await applyFilters(); // Recharger les notes
      setMessage('Note supprimée avec succès');
    } catch (err) {
      setError('Erreur lors de la suppression de la note');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getClasseCategorie = (classeId) => {
    const classe = classes.find(c => c.id === parseInt(classeId));
    return classe?.categorie_classe || '';
  };

  const TypeEvaluationSelect = ({ value, onChange, categorie }) => {
    const getOptions = () => {
      switch (categorie.toLowerCase()) {
        case 'maternelle':
          return [
            <option key="empty" value="">Sélectionner un type</option>,
            <option key="1" value="1ère evaluation">1ère évaluation</option>,
            <option key="2" value="2ème evaluation">2ème évaluation</option>,
            <option key="3" value="3ème evaluation">3ème évaluation</option>,
            <option key="4" value="4ème evaluation">4ème évaluation</option>,
            <option Key="5" value="5ème evaluation">5ème évaluation</option>
          ];
        case 'primaire':
          return [
            <option key="empty" value="">Sélectionner un type</option>,
            <option key="1" value="1ère evaluation">1ère évaluation</option>,
            <option key="2" value="2ème evaluation">2ème évaluation</option>,
            <option key="3" value="3ème evaluation">3ème évaluation</option>,
            <option key="4" value="4ème evaluation">4ème évaluation</option>,
            <option Key="5" value="5ème evaluation">5ème évaluation</option>
          ];
        case 'secondaire':
          return [
            <option key="empty" value="">Sélectionner un type</option>,
            <option key="1" value="Devoir1">Devoir 1</option>,
            <option key="2" value="Devoir2">Devoir 2</option>,
            <option key="3" value="Interrogation">Interrogation écrite</option>
          ];
        default:
          return [<option value="">Sélectionner un type</option>];
      }
    };

    return (
      <select
        name="type_evaluation"
        value={value}
        onChange={onChange}
        className="form-input"
        required
      >
        {getOptions()}
      </select>
    );
  };


  const fetchStudentData = async () => {
    try {
      const res = await api.get('/stats/effectifs');
      setStudentData(res.data);
    } catch (err) {
      console.error('Erreur lors du chargement des effectifs:', err);
    }
  };

  const fetchGradeData = async () => {
    try {
      const res = await api.get('/stats/repartition-notes');
      setGradeData(res.data);
    } catch (err) {
      console.error('Erreur lors du chargement des notes:', err);
    }
  };

  return (
    <div className="app-dashboard">
      <div className="sidebar">
        <div className="sidebar-header">
          <h2>EcoleGestion</h2>
        </div>
        <nav className="sidebar-nav">
          <button
            className={activeTab === 'aperçu' ? 'active' : ''}
            onClick={() => setActiveTab('aperçu')}
          >
            <Home size={20} /> Aperçu
          </button>
          <button
            className={activeTab === 'élèves' ? 'active' : ''}
            onClick={() => setActiveTab('élèves')}
          >
            <Users size={20} /> Élèves
          </button>
          <button
            className={activeTab === 'classes' ? 'active' : ''}
            onClick={() => setActiveTab('classes')}
          >
            <Book size={20} /> Classes
          </button>
          <button
            className={activeTab === 'matieres' ? 'active' : ''}
            onClick={() => setActiveTab('matieres')}
          >
            <BookOpen size={20} /> Matières
          </button>
          <button
            className={activeTab === 'series' ? 'active' : ''}
            onClick={() => setActiveTab('series')}
          >
            <GraduationCap size={20} /> Séries
          </button>
          <button
            className={activeTab === 'notes' ? 'active' : ''}
            onClick={() => setActiveTab('notes')}
          >
            <ClipboardList size={20} /> Notes
          </button>
          <button
            className={activeTab === 'LiaisonSeriesClass' ? 'active' : ''}
            onClick={() => setActiveTab('LiaisonSeriesClass')}
          >
            <Link size={20} /> Lier Series Classes
          </button>
          <button
            className={activeTab === 'LiaisonMatieresAvecCoefficientEtSerieClasses' ? 'active' : ''}
            onClick={() => setActiveTab('LiaisonMatieresAvecCoefficientEtSerieClasses')}
          >
            <Link size={20} /> Lier Matieres Classes
          </button>
          <button
            className={activeTab === 'LierElevesAuxParents' ? 'active' : ''}
            onClick={() => setActiveTab('LierElevesAuxParents')}
          >
            <Users size={20} /> Lier Parents Eleves
          </button>
          <button
            className={activeTab === 'enseignantsauxclasses' ? 'active' : ''}
            onClick={() => setActiveTab('enseignantsauxclasses')}
          >
            <UserCheck size={20} /> Lier enseignant classes
          </button>
          <button
            className={activeTab === 'emploi' ? 'active' : ''}
            onClick={() => setActiveTab('emploi')}
          >
            <Calendar size={20} /> Emploi du temps
          </button>
          <button
            className={activeTab === 'presence' ? 'active' : ''}
            onClick={() => setActiveTab('presence')}
          >
            <Users size={20} /> Marquage Présence
          </button>
          <button
            className={activeTab === 'messages' ? 'active' : ''}
            onClick={() => setActiveTab('messages')}
          >
            <MessageSquare size={20} /> Messages
          </button>
          <button
            className={activeTab === 'personnel' ? 'active' : ''}
            onClick={() => setActiveTab('personnel')}
          >
            <UserCheck size={20} /> Personnel
          </button>
          <button
            className={activeTab === 'paramètres' ? 'active' : ''}
            onClick={() => setActiveTab('paramètres')}
          >
            <Settings size={20} /> Paramètres
          </button>
          <div className="sidebar-logout" style={{ marginTop: 'auto', padding: '1rem' }}>
            <NavLink to='/connexion' className="btn btn-danger" style={{ width: '100%', justifyContent: 'center' }}>
              <LogOut size={20} /> Déconnexion
            </NavLink>
          </div>
        </nav>
      </div>

      {/* Main content */}
      <div className="main-content">
        <header className="page-header">
          <h1>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</h1>
          <div className="header-actions">
            <NotificationBell userId={localStorage.getItem('userId')} />
            <div className="profile-container">
              <img src="/api/placeholder/40/40" alt="Profile" className="profile-image" style={{ borderRadius: '50%' }} />
              <span className="profile-name" style={{ marginLeft: '0.5rem', fontWeight: '500' }}>Directeur</span>
            </div>
          </div>
        </header>

        {/* Content area */}
        <main className="content-area">
          {activeTab === 'aperçu' && (
            <>
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon" style={{ background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)' }}>
                    <Users size={24} />
                  </div>
                  <div className="stat-content">
                    <h3>350</h3>
                    <p>Total Élèves</p>
                    <p style={{ fontSize: '0.8rem', color: 'var(--success)' }}>+2,8% depuis le mois dernier</p>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon" style={{ background: 'linear-gradient(135deg, var(--success) 0%, #1aa179 100%)' }}>
                    <CheckCircle size={24} />
                  </div>
                  <div className="stat-content">
                    <h3>92%</h3>
                    <p>Présence Moyenne</p>
                    <p style={{ fontSize: '0.8rem', color: 'var(--error)' }}>-1,5% depuis la semaine dernière</p>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon" style={{ background: 'linear-gradient(135deg, var(--warning) 0%, #e8590c 100%)' }}>
                    <User size={24} />
                  </div>
                  <div className="stat-content">
                    <h3>24</h3>
                    <p>Enseignants</p>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Stable depuis le mois dernier</p>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon" style={{ background: 'linear-gradient(135deg, var(--secondary-1) 0%, #7209b7 100%)' }}>
                    <Book size={24} />
                  </div>
                  <div className="stat-content">
                    <h3>15</h3>
                    <p>Classes</p>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Stable depuis la rentrée</p>
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--text-main)' }}>Statistiques</h3>
                  <button
                    className="btn btn-icon"
                    onClick={() => toggleSection('statistiques')}
                  >
                    {expandedSection === 'statistiques' ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </button>
                </div>

                {expandedSection === 'statistiques' && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
                    <div className="card">
                      <h4 style={{ marginBottom: '1rem', fontWeight: '600' }}>Évolution des effectifs</h4>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={studentData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                          <XAxis dataKey="name" stroke="var(--text-muted)" />
                          <YAxis stroke="var(--text-muted)" />
                          <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: 'var(--shadow-md)' }} />
                          <Line type="monotone" dataKey="students" stroke="var(--primary)" strokeWidth={3} activeDot={{ r: 8 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="card">
                      <h4 style={{ marginBottom: '1rem', fontWeight: '600' }}>Répartition des notes</h4>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={gradeData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="value"
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          >
                            {gradeData.map((entry, index) => (
                              <React.Fragment key={`cell-${index}`}>
                                {index === 0 && <Cell fill="var(--primary-light)" />}
                                {index === 1 && <Cell fill="var(--secondary-3)" />}
                                {index === 2 && <Cell fill="var(--secondary-2)" />}
                                {index === 3 && <Cell fill="var(--primary)" />}
                              </React.Fragment>
                            ))}
                          </Pie>
                          <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: 'var(--shadow-md)' }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
              </div>

              <div className="section-container">
                <div className="section-header">
                  <h3 className="section-title">Présence cette semaine</h3>
                  <button
                    className="section-toggle"
                    onClick={() => toggleSection('presence')}
                  >
                    {expandedSection === 'presence' ? (
                      <>Réduire <ChevronUp size={16} /></>
                    ) : (
                      <>Voir plus <ChevronDown size={16} /></>
                    )}
                  </button>
                </div>

                {expandedSection === 'presence' && (
                  <div className="chart-card">
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={attendanceData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="présent" fill="#60a5fa" />
                        <Bar dataKey="absent" fill="#f87171" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                <div className="card">
                  <h3 style={{ marginBottom: '1rem', fontWeight: '600' }}>Événements à venir</h3>
                  {evenements.map(event => (
                    <div key={event.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '1rem', borderBottom: '1px solid var(--border)' }}>
                      <h4 style={{ fontWeight: '600', color: 'var(--primary)' }}>{event.titre}</h4>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                        <Calendar size={14} />
                        {event.date}
                      </div>
                      <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{event.lieu}</div>
                    </div>
                  ))}
                </div>

                <div className="card">
                  <h3 style={{ marginBottom: '1rem', fontWeight: '600' }}>Messages récents</h3>
                  {notifications.slice(0, 3).map(notif => (
                    <div key={notif.id} className="message" style={{ marginBottom: '1rem' }}>
                      <p style={{ margin: 0 }}>{notif.message}</p>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.5rem' }}>{notif.date}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {activeTab === 'matieres' && (
            <div>
              {error && <div className="message error">{error}</div>}
              {message && <div className="message success">{message}</div>}

              <div className="form-container" style={{ marginBottom: '2rem' }}>
                <h2 style={{ marginBottom: '1.5rem', fontSize: '1.25rem', fontWeight: 'bold' }}>Ajouter une nouvelle matière</h2>
                <div className="form-group" style={{ flexDirection: 'row', gap: '1rem' }}>
                  <input
                    type="text"
                    value={newMatiere}
                    onChange={(e) => setNewMatiere(e.target.value)}
                    placeholder="Nom de la matière"
                    className="form-input"
                    onKeyPress={(e) => e.key === 'Enter' && AjouterMatiere()}
                    style={{ flex: 1 }}
                  />
                  <button
                    onClick={AjouterMatiere}
                    disabled={loading}
                    className="btn btn-primary"
                  >
                    <Plus size={18} />
                    Ajouter
                  </button>
                </div>
              </div>

              <div>
                <h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem', fontWeight: 'bold' }}>Liste des Matières</h2>

                {loading && matieres1.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    Chargement des matières...
                  </div>
                ) : matieres1.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    Aucune matière trouvée. Ajoutez-en une ci-dessus.
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                    {matieres1.map((matiere) => (
                      <div key={matiere.id} className="card">
                        <div>
                          <div>
                            {editingId === matiere.id ? (
                              <div style={{ display: 'flex', gap: '0.5rem', flexDirection: 'column' }}>
                                <input
                                  type="text"
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  className="form-input"
                                  onKeyPress={(e) => e.key === 'Enter' && Modification(matiere.id)}
                                  autoFocus
                                />
                                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                  <button
                                    onClick={() => Modification(matiere.id)}
                                    disabled={loading}
                                    className="btn btn-primary"
                                    title="Sauvegarder"
                                    style={{ padding: '0.5rem 1rem' }}
                                  >
                                    <Save size={16} />
                                  </button>
                                  <button
                                    onClick={handleCancel}
                                    className="btn btn-danger"
                                    title="Annuler"
                                    style={{ padding: '0.5rem 1rem' }}
                                  >
                                    <X size={16} />
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '600' }}>{matiere.nom}</h3>
                                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>ID: {matiere.id}</p>
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                  <button
                                    onClick={() => handleEdit(matiere)}
                                    disabled={loading || editingId !== null}
                                    className="btn btn-icon"
                                    title="Modifier"
                                    style={{ color: 'var(--primary)' }}
                                  >
                                    <Edit2 size={18} />
                                  </button>
                                  <button
                                    onClick={() => handleDelete(matiere.id)}
                                    disabled={loading || editingId !== null}
                                    className="btn btn-icon"
                                    title="Supprimer"
                                    style={{ color: 'var(--error)' }}
                                  >
                                    <Trash2 size={18} />
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
          {activeTab === 'series' && (
            <div className="series-container">
              {error && <div className="error-message">{error}</div>}
              {message && <div className="success-message">{message}</div>}

              <div className="add-form">
                <h2 className="form-title">Ajouter une nouvelle serie</h2>
                <div className="form-controls">
                  <input
                    type="text"
                    value={newSerie}
                    onChange={(e) => setNewSerie(e.target.value)}
                    placeholder="Nom de la série"
                    className="input-field"
                    onKeyPress={(e) => e.key === 'Enter' && AjouterSerie()}
                  />
                  <button
                    onClick={AjouterSerie}
                    disabled={loading}
                    className="btn btn-primary"
                  >
                    <Plus size={18} />
                    Ajouter
                  </button>
                </div>
              </div>

              <div className="series-list">
                <div className="list-header">
                  <h2 className="list-title">Liste des Série</h2>
                </div>

                {loading && series.length === 0 ? (
                  <div className="empty-state">
                    Chargement des séries...
                  </div>
                ) : series.length === 0 ? (
                  <div className="empty-state">
                    Aucune série trouvée. Ajoutez-en une ci-dessus.
                  </div>
                ) : (
                  <div className="series-items">
                    {series.map((serie) => (
                      <div key={serie.id} className="serie-item">
                        <div className="serie-content">
                          <div className="serie-details">
                            {editingId === serie.id ? (
                              <div className="edit-form">
                                <input
                                  type="text"
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  className="edit-input"
                                  onKeyPress={(e) => e.key === 'Enter' && ModificationSerie(serie.id)}
                                  autoFocus
                                />
                                <div className="edit-actions">
                                  <button
                                    onClick={() => ModificationSerie(serie.id)}
                                    disabled={loading}
                                    className="btn btn-success"
                                    title="Sauvegarder"
                                  >
                                    <Save size={16} />
                                  </button>
                                  <button
                                    onClick={handleCancel}
                                    className="btn btn-secondary"
                                    title="Annuler"
                                  >
                                    <X size={16} />
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="serie-display">
                                <div className="serie-info">
                                  <h3 className="serie-name">{serie.nom}</h3>
                                  <p className="serie-id">ID: {serie.id}</p>
                                </div>
                                <div className="serie-actions">
                                  <button
                                    onClick={() => handleEdit(serie)}
                                    disabled={loading || editingId !== null}
                                    className="btn btn-edit"
                                    title="Modifier"
                                  >
                                    <Edit2 size={16} />
                                    Modifier
                                  </button>
                                  <button
                                    onClick={() => handleDelete(serie.id)}
                                    disabled={loading || editingId !== null}
                                    className="btn btn-danger"
                                    title="Supprimer"
                                  >
                                    <Trash2 size={16} />
                                    Supprimer
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'notes' && (
            <div className="notes-container">
              <h2 className="section-title">Gestion des Notes</h2>

              {/* Nouveau formulaire d'import */}
              <div className="import-note-form">
                <h3 className="form-title">Importer des notes depuis un fichier</h3>
                <form onSubmit={handleImportSubmit}>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Classe</label>
                      <select
                        name="classe_id"
                        value={importData.classe_id}
                        onChange={handleImportChange}
                        className="form-input"
                        required
                      >
                        <option value="">Sélectionner une classe</option>
                        {classes.map(classe => (
                          <option key={classe.id} value={classe.id}>
                            {classe.nom_classe}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Serie</label>
                      <select
                        name="serie_id"
                        value={importData.serie_id}
                        onChange={handleImportChange}
                        className="form-input"
                        required
                      >
                        <option value="">Sélectionner une série</option>
                        {importData.classe_id && (() => {
                          const classe = classes.find(c => c.id == importData.classe_id);
                          if (!classe || !classe.series) return null;

                          return classe.series.map(serie => (
                            <option key={serie.id} value={serie.id}>
                              {serie.nom}
                            </option>
                          ));
                        })()}
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Matière</label>
                      <select
                        name="matiere_id"
                        value={importData.matiere_id}
                        onChange={handleImportChange}
                        className="form-input"
                        disabled={!importData.serie_id}
                        required
                      >
                        <option value="">Sélectionner une matière</option>
                        {importData.serie_id && getMatieresBySerie(importData.serie_id).map(matiere => (
                          <option key={matiere.id} value={matiere.id}>
                            {matiere.nom}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Fichier (Excel ou PDF)</label>
                      <input
                        type="file"
                        name="fichier"
                        onChange={handleImportChange}
                        className="form-input"
                        accept=".xlsx,.xls,.pdf"
                        required
                      />
                      {previewData.length > 0 && (
                        <div className="file-preview">
                          <h4>Prévisualisation des données:</h4>
                          <table>
                            <thead>
                              <tr>
                                <th>Nom</th>
                                <th>Note</th>
                              </tr>
                            </thead>
                            <tbody>
                              {previewData.map((item, index) => (
                                <tr key={index}>
                                  <td>{item.nom_etudiant}</td>
                                  <td>{item.note}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>

                    <div className="form-group">
                      <label>Type d'évaluation</label>
                      {importData.classe_id && (
                        <TypeEvaluationSelect
                          value={importData.type_evaluation}
                          onChange={handleImportChange}
                          categorie={getClasseCategorie(importData.classe_id)}
                        />
                      )}
                    </div>


                    <div className="form-group">
                      <label>Date d'évaluation</label>
                      <input
                        type="date"
                        name="date_evaluation"
                        value={importData.date_evaluation}
                        onChange={handleImportChange}
                        className="form-input"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Période</label>
                      <select
                        name="periode"
                        value={importData.periode}
                        onChange={handleImportChange}
                        className="form-input"
                      >
                        <option value="">Sélectionner une période</option>
                        <option value="Semestre 1">Semestre 1</option>
                        <option value="Semestre 2">Semestre 2</option>
                      </select>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="btn btn-primary"
                  >
                    {loading ? 'Importation en cours...' : 'Importer les notes'}
                  </button>
                </form>
              </div>

              <div className="form-container" style={{ marginBottom: '2rem' }}>
                <h3 style={{ marginBottom: '1.5rem', fontSize: '1.25rem', fontWeight: 'bold' }}>Ajouter une nouvelle note</h3>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Élève</label>
                    <select
                      name="eleve_id"
                      value={newNote.eleve_id}
                      onChange={(e) => {
                        const selectedEleve = eleves.find(eleve => eleve.id == e.target.value);

                        console.log('Élève sélectionné:', selectedEleve);
                        handleNoteChange({
                          target: {
                            name: 'eleve_id',
                            value: e.target.value
                          }
                        });

                        if (selectedEleve) {
                          console.log('ID classe de l\'élève:', selectedEleve.class_id);
                          console.log('Classes disponibles:', classes);

                          // Trouver la classe correspondante
                          const classeCorrespondante = classes.find(c => c.id == selectedEleve.class_id);
                          console.log('Classe trouvée:', classeCorrespondante);

                          // Mettre à jour la classe avec l'ID correct
                          handleNoteChange({
                            target: {
                              name: 'classe_id',
                              value: selectedEleve.class_id
                            }
                          });
                          // Réinitialiser la matière
                          handleNoteChange({
                            target: {
                              name: 'matiere_id',
                              value: ''
                            }
                          });
                        }
                      }}
                      className="form-select"
                      required
                    >
                      <option value="">Sélectionner un élève</option>
                      {eleves.map(eleve => (
                        <option key={eleve.id} value={eleve.id}>
                          {eleve.nom} {eleve.prenom}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Classe</label>
                    <input
                      type="text"
                      value={
                        newNote.eleve_id
                          ? classes.find(c => c.id == newNote.classe_id)?.nom_classe || 'Classe non trouvée'
                          : ''
                      }
                      className="form-input"
                      readOnly
                    />
                  </div>

                  <div className="form-group">
                    <label>Matière</label>
                    <select
                      name="matiere_id"
                      value={newNote.matiere_id}
                      onChange={handleNoteChange}
                      className="form-select"
                      disabled={!newNote.eleve_id}
                      required
                    >
                      <option value="">Sélectionner une matière</option>
                      {newNote.eleve_id && (() => {
                        // Trouver l'élève sélectionné
                        const selectedEleve = eleves.find(e => e.id == newNote.eleve_id);

                        if (!selectedEleve) return null;

                        // Trouver la classe de l'élève
                        const eleveClasse = classes.find(c => c.id == selectedEleve.class_id);
                        console.log('Classe de l\'élève:', eleveClasse);
                        if (!eleveClasse) return null;

                        // Trouver la série de la classe
                        const serie = series.find(s => s.id == selectedEleve.serie_id);
                        console.log('Série trouvée:', serie);
                        if (!serie || !serie.matieres) return null;

                        // Retourner les options des matières
                        return serie.matieres.map(matiere => (
                          <option key={matiere.id} value={matiere.id}>
                            {matiere.nom}
                          </option>
                        ));
                      })()}
                    </select>
                  </div>

                  {/* Le reste du formulaire */}
                  <div className="form-group">
                    <label>Note</label>
                    <input
                      type="number"
                      name="note"
                      value={newNote.note}
                      onChange={handleNoteChange}
                      className="form-input"
                      min="0"
                      max="20"
                      step="0.5"
                    />
                  </div>

                  <div className="form-group">
                    <label>Note sur</label>
                    <input
                      type="number"
                      name="note_sur"
                      value={newNote.note_sur}
                      onChange={handleNoteChange}
                      className="form-input"
                      min="1"
                      max="100"
                    />
                  </div>

                  <div className="form-group">
                    <label>Type d'évaluation</label>
                    {newNote.classe_id && (
                      <TypeEvaluationSelect
                        value={newNote.type_evaluation}
                        onChange={handleNoteChange}
                        categorie={getClasseCategorie(newNote.classe_id)}
                      />
                    )}
                  </div>

                  <div className="form-group">
                    <label>Date d'évaluation</label>
                    <input
                      type="date"
                      name="date_evaluation"
                      value={newNote.date_evaluation}
                      onChange={handleNoteChange}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label>Période</label>
                    <select
                      type="text"
                      name="periode"
                      value={newNote.periode}
                      onChange={handleNoteChange}
                      className="form-select"
                    >
                      <option value="">Sélectionner une période</option>
                      <option value="Semestre 1">Semestre 1</option>
                      <option value="Semestre 2">Semestre 2</option>
                    </select>
                  </div>
                </div>

                <button
                  onClick={handleAddNote}
                  disabled={loading || !newNote.eleve_id || !newNote.matiere_id}
                  className="btn btn-primary"
                  style={{ marginTop: '1rem' }}
                >
                  Ajouter la note
                </button>
              </div>


              <div>
                <FilterSection />
                <h3 style={{ marginBottom: '1.5rem', fontSize: '1.5rem', fontWeight: 'bold' }}>Liste des Notes</h3>

                {loading ? (
                  <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Chargement des notes...</div>
                ) : error ? (
                  <div className="message error">{error}</div>
                ) : (filteredNotes.length > 0 ? (
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Élève</th>
                        <th>Classe</th>
                        <th>Matière</th>
                        <th>Note</th>
                        <th>Type</th>
                        <th>Période</th>
                        <th>Date</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredNotes.map(note => (
                        <tr key={note.id}>
                          <td>{note.eleve?.nom} {note.eleve?.prenom}</td>
                          <td>{note.classe?.nom_classe}</td>
                          <td>{note.matiere?.nom}</td>
                          <td>{note.note}/{note.note_sur}</td>
                          <td>{note.type_evaluation}</td>
                          <td>{note.periode}</td>
                          <td>{new Date(note.date_evaluation).toLocaleDateString()}</td>
                          <td className="actions-cell">
                            <button
                              className="btn btn-icon"
                              onClick={() => handleEditNote(note)}
                              title="Modifier"
                              style={{ color: 'var(--primary)' }}
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              className="btn btn-icon"
                              onClick={() => handleDeleteNote(note.id)}
                              title="Supprimer"
                              style={{ color: 'var(--error)' }}
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    Aucune note ne correspond aux critères de filtrage
                  </div>
                ))}
              </div>
            </div>

          )}

          {activeTab === 'classes' && (
            <div>
              {error && <div className="message error">{error}</div>}
              {message && <div className="message success">{message}</div>}

              <div className="form-container" style={{ marginBottom: '2rem' }}>
                <h2 style={{ marginBottom: '1.5rem', fontSize: '1.25rem', fontWeight: 'bold' }}>Ajouter une nouvelle classe</h2>
                <div className="form-group" style={{ flexDirection: 'row', gap: '1rem' }}>
                  <input
                    type="text"
                    value={newClassName}
                    onChange={(e) => setNewClassName(e.target.value)}
                    placeholder="Nom de la classe"
                    className="form-input"
                    style={{ flex: 1 }}
                  />
                  <input
                    type="text"
                    value={newClassCategory}
                    onChange={(e) => setNewClassCategory(e.target.value)}
                    placeholder="Catégorie de la classe"
                    className="form-input"
                    style={{ flex: 1 }}
                  />
                  <button
                    onClick={AjouterClasse}
                    disabled={loading}
                    className="btn btn-primary"
                  >
                    <Plus size={18} />
                    Ajouter
                  </button>
                </div>
              </div>

              <div>
                <h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem', fontWeight: 'bold' }}>Liste des classes</h2>

                {loading && classes1.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    Chargement des classes...
                  </div>
                ) : classes1.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    Aucune classe trouvée. Ajoutez-en une ci-dessus.
                  </div>
                ) : (
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Classe</th>
                        <th>Catégorie</th>
                        <th>Effectif</th>
                        <th>Enseignant</th>
                        <th>Salle</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {classes1.map((classe) => (
                        <tr key={classe.id}>
                          <td>
                            {editingId === classe.id ? (
                              <input
                                type="text"
                                value={editClassName}
                                onChange={(e) => setEditClassName(e.target.value)}
                                className="form-input"
                                onKeyPress={(e) => e.key === 'Enter' && ModificationClasse(classe.id)}
                              />
                            ) : (
                              classe.nom_classe
                            )}
                          </td>
                          <td>
                            {editingId === classe.id ? (
                              <input
                                type="text"
                                value={editClassCategory}
                                onChange={(e) => setEditClassCategory(e.target.value)}
                                className="form-input"
                                onKeyPress={(e) => e.key === 'Enter' && ModificationClasse(classe.id)}
                              />
                            ) : (
                              classe.categorie_classe
                            )}
                          </td>
                          <td>{classe.effectif} élèves</td>
                          <td>{classe.enseignant}</td>
                          <td>{classe.salle}</td>
                          <td>
                            {editingId === classe.id ? (
                              <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button
                                  onClick={() => ModificationClasse(classe.id)}
                                  disabled={loading}
                                  className="btn btn-primary"
                                  title="Sauvegarder"
                                  style={{ padding: '0.5rem' }}
                                >
                                  <Save size={14} />
                                </button>
                                <button
                                  onClick={handleCancel}
                                  className="btn btn-danger"
                                  title="Annuler"
                                  style={{ padding: '0.5rem' }}
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            ) : (
                              <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button
                                  onClick={() => handleEditClass(classe)}
                                  disabled={loading || editingId !== null}
                                  className="btn btn-icon"
                                  title="Modifier"
                                  style={{ color: 'var(--primary)' }}
                                >
                                  <Edit2 size={14} />
                                </button>
                                <button
                                  onClick={() => handleDeleteClass(classe.id)}
                                  disabled={loading || editingId !== null}
                                  className="btn btn-icon"
                                  title="Supprimer"
                                  style={{ color: 'var(--error)' }}
                                >
                                  <Trash2 size={14} />
                                </button>
                                <button className="btn btn-icon" title="Détails" style={{ color: 'var(--text-muted)' }}>
                                  <ClipboardList size={14} />
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {activeTab === 'LiaisonSeriesClass' && (
            <LierSeriesauxClasses />
          )}

          {activeTab === 'LiaisonMatieresAvecCoefficientEtSerieClasses' && (
            <LierMatieresauxClasses />
          )}

          {activeTab === 'LierElevesAuxParents' && (
            <LierElevesAuxParents />
          )}

          {activeTab === 'enseignantsauxclasses' && (
            <LierEnseignantsAuxMatieres />
          )}

          {activeTab === 'emploi' && (
            <EmploiDuTemps />
          )}

          {activeTab === 'presence' && (
            <MarquagePresence />
          )}

          {activeTab === 'messages' && (
            <Messagerie userId={localStorage.getItem('userId')} userName={localStorage.getItem('userName') || 'Directeur'} />
          )}

          {(activeTab !== 'aperçu' && activeTab !== 'classes' && activeTab !== 'matieres' && activeTab !== 'LiaisonSeriesClass' && activeTab !== 'LiaisonMatieresAvecCoefficientEtSerieClasses' && activeTab !== 'notes' && activeTab !== 'enseignantsauxclasses' && activeTab !== 'emploi' && activeTab !== 'presence' && activeTab !== 'messages') && (
            <div className="coming-soon">
              <h3>Section {activeTab} en cours de développement</h3>
              <p>Cette fonctionnalité sera disponible prochainement</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};




const LierSeriesauxClasses = () => {
  const [classes, setClasses] = useState([]);
  const [series, setSeries] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSeries, setSelectedSeries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [classesWithSeries, setClassesWithSeries] = useState([]);

  // Fetch classes and series on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [classesRes, seriesRes] = await Promise.all([
          api.get('/classes?with_series=true'),
          api.get('/series')
        ]);

        setClasses(classesRes.data);
        setSeries(seriesRes.data);
        setClassesWithSeries(classesRes.data); // Stocker les classes avec leurs séries
        setMessage({ text: '', type: '' });
      } catch (error) {
        setMessage({
          text: 'Erreur lors du chargement des données',
          type: 'error'
        });
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Load series for selected class
  useEffect(() => {
    const fetchClassSeries = async () => {
      if (!selectedClass) {
        setSelectedSeries([]);
        return;
      }

      try {
        setLoading(true);
        const response = await api.get(`/classes/${selectedClass}/series`);
        setSelectedSeries(response.data.map(serie => serie.id));
        setMessage({ text: '', type: '' });
      } catch (error) {
        setMessage({
          text: 'Erreur lors du chargement des séries de la classe',
          type: 'error'
        });
        console.error('Error fetching class series:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchClassSeries();
  }, [selectedClass]);

  const handleSeriesToggle = (serieId) => {
    setSelectedSeries(prev => {
      if (prev.includes(serieId)) {
        return prev.filter(id => id !== serieId);
      } else {
        return [...prev, serieId];
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedClass) {
      setMessage({ text: 'Veuillez sélectionner une classe', type: 'error' });
      return;
    }

    try {
      setLoading(true);

      // Mettre à jour les séries de la classe via l'API
      await api.put(`/classes/${selectedClass}/series`, {
        series: selectedSeries
      });

      // Rafraîchir les données
      const [classesRes] = await Promise.all([
        api.get('/classes?with_series=true')
      ]);

      setClassesWithSeries(classesRes.data);
      setClasses(classesRes.data);

      setMessage({
        text: 'Séries mises à jour avec succès',
        type: 'success'
      });

    } catch (error) {
      setMessage({
        text: error.response?.data?.message || 'Erreur lors de la mise à jour des séries',
        type: 'error'
      });
      console.error('Error updating class series:', error);
    } finally {
      setLoading(false);
    }
  };
  const groupUniqueSeries = (series) => {
    const uniqueSeries = {};
    series.forEach(serie => {
      if (!uniqueSeries[serie.id]) {
        uniqueSeries[serie.id] = {
          ...serie,
          // Si vous avez besoin de traiter les matières dupliquées aussi
          matieres: [...serie.matieres]
        };
      }
    });
    return Object.values(uniqueSeries);
  };

  return (
    <div>
      <h2 style={{ marginBottom: '2rem', fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--primary)' }}>Gérer les séries par classe</h2>

      {message.text && (
        <div className={`message ${message.type === 'error' ? 'error' : 'success'}`}>
          {message.text}
        </div>
      )}

      <div className="form-grid">

        {/* Display current relationships */}
        <div className="card">
          <h3 style={{ marginBottom: '1.5rem', fontSize: '1.25rem', fontWeight: 'bold' }}>Séries par classe</h3>

          {classesWithSeries.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Aucune classe disponible</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
              {classesWithSeries.map(classe => (
                <div key={classe.id} style={{ padding: '1rem', border: '1px solid var(--border)', borderRadius: '8px' }}>
                  <h4 style={{ margin: '0 0 0.5rem 0', fontWeight: '600' }}>{classe.nom_classe}</h4>
                  <p style={{ margin: '0 0 1rem 0', fontSize: '0.9rem', color: 'var(--text-muted)' }}>{classe.categorie_classe}</p>

                  {classe.series && classe.series.length > 0 ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                      {classe.series.map(serie => (
                        <span key={serie.id} style={{ background: 'var(--primary-light)', color: 'var(--primary)', padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.85rem', fontWeight: '500' }}>
                          {serie.nom}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>Aucune série associée</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const LierMatieresauxClasses = () => {
  const [classesMat, setClassesMat] = useState([]);
  const [matieres1, setMatieres1] = useState([]);
  const [classes, setClasses] = useState([]);
  const [series, setSeries] = useState([]);
  const [matieres, setMatieres] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSerie, setSelectedSerie] = useState('');
  const [selectedMatieres, setSelectedMatieres] = useState([]);
  const [matieresCoefficients, setMatieresCoefficients] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [classesWithData, setClassesWithData] = useState([]);

  // Charger les données initiales
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [classesRes, classesMatieresRes, matieresRes, matieres1Res, seriesRes] = await Promise.all([
          api.get('/classes-with-series'),
          api.get('/with-series-matieres'),
          api.get('/matieres-with-series'),
          api.get('/matieres'),
          api.get('/series'),
        ]);

        setClasses(classesRes.data);
        setClassesMat(classesMatieresRes.data);
        setMatieres(matieresRes.data);
        setMatieres1(matieres1Res.data);
        setClassesWithData(classesMatieresRes.data);
        setSeries(seriesRes.data);
        setMessage({ text: '', type: '' });
      } catch (error) {
        setMessage({
          text: 'Erreur lors du chargement des données',
          type: 'error'
        });
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Charger les matières et coefficients quand une série est sélectionnée
  useEffect(() => {
    const fetchSeriesMatieres = async () => {
      if (!selectedClass || !selectedSerie) {
        setSelectedMatieres([]);
        setMatieresCoefficients({});
        return;
      }

      try {
        setLoading(true);
        const response = await api.get(
          `/classes/${selectedClass}/series/${selectedSerie}/matieres`
        );

        const matieresData = response.data;
        setSelectedMatieres(matieresData.map(matiere => matiere.id));

        // Initialiser les coefficients
        const coefficients = {};
        matieresData.forEach(matiere => {
          coefficients[matiere.id] = matiere.pivot?.coefficient || 1;
        });
        setMatieresCoefficients(coefficients);

      } catch (error) {
        setMessage({
          text: 'Erreur lors du chargement des matières',
          type: 'error'
        });
        console.error('Error fetching matieres:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSeriesMatieres();
  }, [selectedClass, selectedSerie]);

  // Fonction pour obtenir le coefficient d'une matière dans une classe
  /**
   * Récupère le coefficient d'une matière pour une classe et série données
   * @param {Object} matiere - La matière avec ses relations
   * @param {number} classeId - L'ID de la classe
   * @param {number} serieId - L'ID de la série 
   * @returns {number} - Le coefficient (défaut: 1)
   */
  const getCoefficientForMatiere = (matiere, classeId, serieId) => {
    try {
      // Vérification des paramètres requis
      if (!matiere || !classeId || !serieId) {
        console.warn('Paramètres manquants pour getCoefficientForMatiere:', {
          matiere: !!matiere,
          classeId,
          serieId
        });
        return 1;
      }

      // Vérification de la relation série-matière
      const coefficient = matiere.pivot?.coefficient;

      if (coefficient && matiere.pivot.classe_id === classeId) {
        return parseFloat(coefficient);
      }

      // Log pour debug
      console.debug('Coefficient non trouvé pour:', {
        matiere: matiere.nom,
        classeId,
        serieId,
        coefficient: coefficient || 1
      });

      return 1;
    } catch (error) {
      console.error('Erreur dans getCoefficientForMatiere:', error);
      return 1;
    }
  };

  const handleMatiereToggle = (matiereId) => {
    const id = Number(matiereId); // Conversion en nombre
    setSelectedMatieres(prev => {
      const newSelected = prev.includes(id)
        ? prev.filter(prevId => prevId !== id)
        : [...prev, id];

      const newCoefficients = { ...matieresCoefficients };
      if (!prev.includes(id)) {
        newCoefficients[id] = 1;
      } else {
        delete newCoefficients[id];
      }
      setMatieresCoefficients(newCoefficients);

      return newSelected;
    });
  };

  const handleCoefficientChange = (matiereId, value) => {
    setMatieresCoefficients(prev => ({
      ...prev,
      [matiereId]: Math.max(1, parseInt(value) || 1)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedClass || !selectedSerie) {
      setMessage({ text: 'Veuillez sélectionner une classe et une série', type: 'error' });
      return;
    }

    try {
      setLoading(true);

      // Préparer les données dans le format attendu par le backend
      const matieresData = selectedMatieres.map(id => ({
        matiere_id: Number(id), // Ensure it's a number
        classe_id: Number(selectedClass), // Ensure it's a number
        coefficient: parseFloat(matieresCoefficients[id]) || 1 // Ensure it's a float
      }));

      // Debug: log the data before sending
      console.log('Data being sent:', {
        matieres: matieresData
      });

      // Envoyer les données au backend
      const response = await api.put(
        `/series/${selectedSerie}/matieres/sync`,
        { matieres: matieresData },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        // Rafraîchir les données
        const classesRes = await api.get(
          '/with-series-matieres'
        );

        setClasses(classesRes.data);
        setClassesWithData(classesRes.data);

        setMessage({
          text: 'Matières et coefficients mis à jour avec succès',
          type: 'success'
        });
      } else {
        throw new Error(response.data.message || 'Erreur lors de la mise à jour');
      }

    } catch (error) {
      const errorMsg = error.response?.data?.message ||
        error.response?.data?.errors ||
        error.message ||
        'Erreur lors de la mise à jour';

      setMessage({
        text: typeof errorMsg === 'object' ? JSON.stringify(errorMsg) : errorMsg,
        type: 'error'
      });
      console.error('Error details:', error.response?.data);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredSeries = () => {
    // Vérification des données requises
    if (!series?.length || !selectedClass || !classes?.length) {
      console.log("Données manquantes:", {
        seriesExist: !!series?.length,
        selectedClass: selectedClass,
        classesExist: !!classes?.length
      });
      return [];
    }

    // Récupérer la classe sélectionnée avec vérification
    const selectedClasse = classes.find(classe => classe?.id === parseInt(selectedClass));
    if (!selectedClasse?.nom_classe) {
      console.log("Classe non trouvée ou nom_classe manquant:", selectedClass);
      return [];
    }

    const classeNom = selectedClasse.nom_classe.toLowerCase();
    console.log("Nom de classe trouvé:", classeNom);

    // Mapping des niveaux
    const niveauxMap = {
      'ci': 'ci',
      'maternelle 2': 'maternelle 2',
      'maternelle 1': 'maternelle 1',
      'cp': 'cp',
      'ce1': 'ce1',
      'ce2': 'ce2',
      'cm1': 'cm1',
      'cm2': 'cm2',
      '6ème': '6ème',
      '5ème': '5ème',
      '4ème': '4ème',
      '3ème': '3ème'
    };

    // Vérifier si c'est une classe du secondaire
    const classesSecondaire = ['2nde', 'seconde', '1ère', 'première', 'terminale', 'tle'];
    if (classesSecondaire.some(niveau => classeNom.includes(niveau))) {
      // Pour le secondaire, exclure les séries du niveauxMap
      const seriesExclues = Object.values(niveauxMap).map(s => s.toLowerCase());
      const filteredSeries = series.filter(serie => !seriesExclues.includes(serie?.nom?.toLowerCase()));
      console.log("Séries filtrées pour le secondaire:", filteredSeries);
      return filteredSeries;
    }

    // Filtrer les séries selon le niveau pour le primaire/maternelle
    for (const [niveau, serieNom] of Object.entries(niveauxMap)) {
      if (classeNom.includes(niveau)) {
        const filteredSeries = series.filter(serie =>
          serie?.nom?.toLowerCase().includes(serieNom)
        );
        console.log(`Séries filtrées pour ${niveau}:`, filteredSeries);
        return filteredSeries;
      }
    }

    // Si aucune correspondance n'est trouvée
    console.log("Aucune correspondance trouvée");
    return series;
  };


  const groupUniqueSeries = (series) => {
    const uniqueSeries = {};
    series.forEach(serie => {
      if (!uniqueSeries[serie.id]) {
        uniqueSeries[serie.id] = {
          ...serie,
          // Si vous avez besoin de traiter les matières dupliquées aussi
          matieres: [...serie.matieres]
        };
      }
    });
    return Object.values(uniqueSeries);
  };

  // Obtenir les séries disponibles pour la classe sélectionnée
  const getSeriesForSelectedClass = () => {
    if (!selectedClass) return [];

    const classe = classes.find(c => c.id == selectedClass);
    return classe ? classe.series || [] : [];
  };

  return (
    <div>
      <h2 style={{ marginBottom: '2rem', fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--primary)' }}>Gérer les matières et coefficients par série/classe</h2>

      {message.text && (
        <div className={`message ${message.type === 'error' ? 'error' : 'success'}`}>
          {message.text}
          <button
            style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: 'inherit', marginLeft: 'auto' }}
            onClick={() => setMessage({ text: '', type: '' })}
            aria-label="Fermer le message"
          >
            ×
          </button>
        </div>
      )}

      <div className="form-grid">
        <div className="card">
          <h3 style={{ marginBottom: '1.5rem', fontSize: '1.25rem', fontWeight: 'bold' }}>Associer des matières</h3>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Classe</label>
              <select
                value={selectedClass}
                onChange={(e) => {
                  setSelectedClass(e.target.value);
                  setSelectedSerie('');
                }}
                disabled={loading}
                className="form-select"
              >
                <option value="">Sélectionnez une classe</option>
                {classes.map(classe => (
                  <option key={classe.id} value={classe.id}>
                    {classe.nom_classe}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Série</label>
              <select
                value={selectedSerie}
                onChange={(e) => setSelectedSerie(e.target.value)}
                disabled={loading || !selectedClass}
                className="form-select"
              >
                <option value="">Sélectionnez une série</option>
                {getFilteredSeries().map(serie => (
                  <option key={serie.id} value={serie.id}>
                    {serie.nom}
                  </option>
                ))}
              </select>
            </div>

            {selectedSerie && (
              <div className="form-group">
                <label>Matières disponibles</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem', marginTop: '0.5rem' }}>
                  {matieres1.map(matiere => (
                    <div key={matiere.id} style={{ padding: '0.75rem', border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--bg-light)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <input
                          type="checkbox"
                          checked={selectedMatieres.includes(matiere.id)}
                          onChange={() => handleMatiereToggle(matiere.id)}
                          disabled={loading}
                          style={{ width: '18px', height: '18px' }}
                        />
                        <label style={{ fontWeight: '500' }}>{matiere.nom}</label>
                      </div>

                      {selectedMatieres.includes(matiere.id) && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <label style={{ fontSize: '0.85rem' }}>Coeff:</label>
                          <input
                            type="number"
                            min="1"
                            value={matieresCoefficients[matiere.id] || 1}
                            onChange={(e) => handleCoefficientChange(matiere.id, e.target.value)}
                            disabled={loading}
                            className="form-input"
                            style={{ padding: '0.25rem 0.5rem', width: '60px' }}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !selectedClass || !selectedSerie}
              className="btn btn-primary"
              style={{ marginTop: '1.5rem', width: '100%' }}
            >
              {loading ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </form>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: '1.5rem', fontSize: '1.25rem', fontWeight: 'bold' }}>Matières et coefficients par série/classe</h3>

          {classesWithData.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>Aucune donnée disponible</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {classesWithData.map(classe => (
                <div key={classe.id} style={{ padding: '1rem', border: '1px solid var(--border)', borderRadius: '8px' }}>
                  <h4 style={{ margin: '0 0 1rem 0', fontWeight: 'bold', color: 'var(--primary)' }}>Classe: {classe.nom_classe}</h4>

                  {classe.series?.length > 0 ? (
                    groupUniqueSeries(classe.series).map(serie => (
                      <div key={serie.id} style={{ marginBottom: '1rem', paddingLeft: '1rem', borderLeft: '3px solid var(--secondary)' }}>
                        <h5 style={{ margin: '0 0 0.5rem 0', fontWeight: '600' }}>Série: {serie.nom}</h5>

                        {serie.matieres?.length > 0 ? (
                          <table className="data-table" style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>
                            <thead>
                              <tr>
                                <th style={{ padding: '0.5rem' }}>Matière</th>
                                <th style={{ padding: '0.5rem' }}>Coefficient</th>
                              </tr>
                            </thead>
                            <tbody>
                              {serie.matieres.map(matiere => (
                                <tr key={matiere.id}>
                                  <td style={{ padding: '0.5rem' }}>{matiere.nom}</td>
                                  <td style={{ padding: '0.5rem' }}>
                                    {matiere.coefficient || 1}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        ) : (
                          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>Aucune matière associée à cette série</p>
                        )}
                      </div>
                    ))
                  ) : (
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Aucune série associée à cette classe</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const LierElevesAuxParents = () => {
  const [parents, setParents] = useState([]);
  const [eleves, setEleves] = useState([]);
  const [filteredEleves, setFilteredEleves] = useState([]);
  const [selectedParent, setSelectedParent] = useState('');
  const [selectedEleves, setSelectedEleves] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [parentsWithEleves, setParentsWithEleves] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAllEleves, setShowAllEleves] = useState(false);

  // Fetch parents and eleves on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [parentsRes, elevesRes] = await Promise.all([
          api.get('/parents?with_eleves=true'), // Ajout du paramètre
          api.get('/eleves')
        ]);

        setParents(parentsRes.data);
        setEleves(elevesRes.data);
        setFilteredEleves(elevesRes.data);
        setParentsWithEleves(parentsRes.data);
        setMessage({ text: '', type: '' });
      } catch (error) {
        setMessage({
          text: 'Erreur lors du chargement des données',
          type: 'error'
        });
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter eleves based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredEleves(eleves);
    } else {
      const filtered = eleves.filter(eleve =>
        eleve.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        eleve.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        `${eleve.prenom} ${eleve.nom}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (eleve.matricule && eleve.matricule.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (eleve.classe && eleve.classe.nom_classe && eleve.classe.nom_classe.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredEleves(filtered);
    }
  }, [searchTerm, eleves]);

  // Load eleves for selected parent
  useEffect(() => {
    const fetchParentEleves = async () => {
      if (!selectedParent) {
        setSelectedEleves([]);
        return;
      }

      try {
        setLoading(true);
        const response = await api.get(`/parents/${selectedParent}/eleves`);
        setSelectedEleves(response.data.map(eleve => eleve.id));
        setMessage({ text: '', type: '' });
      } catch (error) {
        setMessage({
          text: 'Erreur lors du chargement des élèves du parent',
          type: 'error'
        });
        console.error('Error fetching parent eleves:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchParentEleves();
  }, [selectedParent]);

  const handleEleveToggle = (eleveId) => {
    setSelectedEleves(prev => {
      if (prev.includes(eleveId)) {
        return prev.filter(id => id !== eleveId);
      } else {
        return [...prev, eleveId];
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedParent) {
      setMessage({ text: 'Veuillez sélectionner un parent', type: 'error' });
      return;
    }

    if (selectedEleves.length === 0) {
      setMessage({ text: 'Veuillez sélectionner au moins un élève', type: 'error' });
      return;
    }

    try {
      setLoading(true);

      // Mettre à jour les élèves du parent via l'API
      await api.put(`/parents/${selectedParent}/eleves`, {
        eleve_ids: selectedEleves
      });

      // Rafraîchir les données
      const [parentsRes] = await Promise.all([
        api.get('/parents?with_eleves=true')
      ]);

      setParentsWithEleves(parentsRes.data);
      setParents(parentsRes.data);

      setMessage({
        text: 'Élèves associés avec succès',
        type: 'success'
      });

    } catch (error) {
      setMessage({
        text: error.response?.data?.message || 'Erreur lors de l\'association des élèves',
        type: 'error'
      });
      console.error('Error updating parent eleves:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSelectedParent('');
    setSelectedEleves([]);
    setSearchTerm('');
    setMessage({ text: '', type: '' });
  };

  const getEleveDisplayName = (eleve) => {
    const name = `${eleve.prenom} ${eleve.nom}`;
    const matricule = eleve.matricule ? ` (${eleve.matricule})` : '';
    const classe = eleve.classe ? ` - ${eleve.classe.nom_classe}` : '';
    return `${name}${matricule}${classe}`;
  };

  const elevesToDisplay = showAllEleves ? filteredEleves : filteredEleves.slice(0, 20);

  return (
    <div>
      <h2 style={{ marginBottom: '2rem', fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--primary)' }}>Gérer les élèves par parent</h2>

      {message.text && (
        <div className={`message ${message.type === 'error' ? 'error' : 'success'}`}>
          {message.text}
        </div>
      )}

      <div className="form-grid">
        {/* Form to link eleves to parent */}
        <div className="card">
          <h3 style={{ marginBottom: '1.5rem', fontSize: '1.25rem', fontWeight: 'bold' }}>Associer des élèves à un parent</h3>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="parent">Parent</label>
              <select
                id="parent"
                className="form-select"
                value={selectedParent}
                onChange={(e) => setSelectedParent(e.target.value)}
                disabled={loading}
              >
                <option value="">Sélectionnez un parent</option>
                {parents.map(parent => (
                  <option key={parent.id} value={parent.id}>
                    {parent.nom} {parent.prenom}
                    {parent.telephone && ` - ${parent.telephone}`}
                  </option>
                ))}
              </select>
            </div>

            {selectedParent && (
              <div className="form-group">
                <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  Élèves disponibles
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 'normal' }}>
                    ({selectedEleves.length} sélectionné{selectedEleves.length > 1 ? 's' : ''})
                  </span>
                </label>

                {/* Search input */}
                <div style={{ position: 'relative', marginBottom: '1rem' }}>
                  <input
                    type="text"
                    placeholder="Rechercher un élève (nom, prénom, matricule, classe...)"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="form-input"
                    disabled={loading}
                    style={{ paddingRight: '2.5rem' }}
                  />
                  {searchTerm && (
                    <button
                      type="button"
                      onClick={() => setSearchTerm('')}
                      style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                      disabled={loading}
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Results info */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  {searchTerm ? (
                    <span>
                      {filteredEleves.length} élève{filteredEleves.length > 1 ? 's' : ''} trouvé{filteredEleves.length > 1 ? 's' : ''}
                    </span>
                  ) : (
                    <span>{eleves.length} élève{eleves.length > 1 ? 's' : ''} au total</span>
                  )}

                  {filteredEleves.length > 20 && !showAllEleves && (
                    <button
                      type="button"
                      onClick={() => setShowAllEleves(true)}
                      style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', textDecoration: 'underline' }}
                      disabled={loading}
                    >
                      Afficher tous les résultats
                    </button>
                  )}
                </div>

                <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: '8px', padding: '0.5rem' }}>
                  {elevesToDisplay.length === 0 ? (
                    <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)' }}>Aucun élève trouvé</div>
                  ) : (
                    elevesToDisplay.map(eleve => (
                      <div key={eleve.id} style={{ display: 'flex', alignItems: 'center', padding: '0.5rem', borderBottom: '1px solid var(--border-light)' }}>
                        <input
                          type="checkbox"
                          id={`eleve-${eleve.id}`}
                          checked={selectedEleves.includes(eleve.id)}
                          onChange={() => handleEleveToggle(eleve.id)}
                          style={{ marginRight: '0.75rem', width: '16px', height: '16px' }}
                          disabled={loading}
                        />
                        <label htmlFor={`eleve-${eleve.id}`} style={{ cursor: 'pointer', flex: 1 }}>
                          {getEleveDisplayName(eleve)}
                        </label>
                      </div>
                    ))
                  )}
                </div>

                {filteredEleves.length > 20 && showAllEleves && (
                  <button
                    type="button"
                    onClick={() => setShowAllEleves(false)}
                    style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', textDecoration: 'underline', marginTop: '0.5rem', fontSize: '0.85rem' }}
                    disabled={loading}
                  >
                    Afficher moins de résultats
                  </button>
                )}
              </div>
            )}

            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
              <button
                className="btn btn-primary"
                type="submit"
                disabled={loading || !selectedParent || selectedEleves.length === 0}
                style={{ flex: 1 }}
              >
                {loading ? 'En cours...' : 'Enregistrer les associations'}
              </button>

              <button
                type="button"
                onClick={handleReset}
                className="btn btn-secondary"
                disabled={loading}
              >
                Réinitialiser
              </button>
            </div>
          </form>
        </div>

        {/* Display current relationships */}
        <div className="card">
          <h3 style={{ marginBottom: '1.5rem', fontSize: '1.25rem', fontWeight: 'bold' }}>Élèves par parent</h3>

          {parentsWithEleves.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Aucun parent disponible</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {parentsWithEleves.map(parent => (
                <div key={parent.id} style={{ padding: '1rem', border: '1px solid var(--border)', borderRadius: '8px' }}>
                  <h4 style={{ margin: '0 0 0.25rem 0', fontWeight: '600' }}>{parent.nom} {parent.prenom}</h4>
                  {parent.telephone && (
                    <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>📞 {parent.numero_telephone}</p>
                  )}
                  {parent.email && (
                    <p style={{ margin: '0 0 1rem 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>✉️ {parent.email}</p>
                  )}

                  {parent.eleves && parent.eleves.length > 0 ? (
                    <div style={{ paddingLeft: '1rem', borderLeft: '3px solid var(--primary-light)' }}>
                      <h5 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', fontWeight: '600', color: 'var(--primary)' }}>
                        Enfants ({parent.eleves.length})
                      </h5>
                      {parent.eleves.map(eleve => (
                        <div key={eleve.id} style={{ fontSize: '0.9rem', marginBottom: '0.25rem' }}>
                          <span style={{ fontWeight: '500' }}>
                            {eleve.prenom} {eleve.nom}
                          </span>

                          {eleve.matricule && (
                            <span style={{ color: 'var(--text-muted)', marginLeft: '0.5rem' }}>
                              ({eleve.matricule})
                            </span>
                          )}

                          {eleve.classe && (
                            <span style={{ background: 'var(--bg-light)', padding: '0.1rem 0.4rem', borderRadius: '4px', fontSize: '0.8rem', marginLeft: '0.5rem', border: '1px solid var(--border)' }}>
                              {eleve.classe.nom_classe}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>Aucun enfant associé</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const LierEnseignantsAuxClasses = () => {
  const [classes, setClasses] = useState([]);
  const [enseignants, setEnseignants] = useState(['']);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedEnseignants, setSelectedEnseignants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [classesWithEnseignants, setClassesWithEnseignants] = useState([]);

  // Fetch classes and enseignants on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [classesRes, enseignantsRes] = await Promise.all([
          api.get('/classes?with_enseignants=true'),
          api.get('/enseignants')
        ]);

        setClasses(classesRes.data);
        setEnseignants(enseignantsRes.data);
        setClassesWithEnseignants(classesRes.data); // Stocker les classes avec leurs enseignants
        setMessage({ text: '', type: '' });
      } catch (error) {
        setMessage({
          text: 'Erreur lors du chargement des données',
          type: 'error'
        });
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Load enseignants for selected class
  useEffect(() => {
    const fetchClassEnseignants = async () => {
      if (!selectedClass) {
        setSelectedEnseignants([]);
        return;
      }

      try {
        setLoading(true);
        const response = await api.get(`/classes/${selectedClass}/enseignants`);
        setSelectedEnseignants(response.data.map(ens => ens.id));
        setMessage({ text: '', type: '' });
      } catch (error) {
        setMessage({
          text: 'Erreur lors du chargement des enseignants de la classe',
          type: 'error'
        });
        console.error('Error fetching class enseignants:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchClassEnseignants();
  }, [selectedClass]);

  const handleEnseignantToggle = (enseignantId) => {
    setSelectedEnseignants(prev => {
      if (prev.includes(enseignantId)) {
        return prev.filter(id => id !== enseignantId);
      } else {
        return [...prev, enseignantId];
      }
    });
  };
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedClass) {
      setMessage({ text: 'Veuillez sélectionner une classe', type: 'error' });
      return;
    }

    if (selectedEnseignants.length === 0) {
      setMessage({ text: 'Veuillez sélectionner au moins un enseignant', type: 'error' });
      return;
    }

    try {
      setLoading(true);

      // Mettre à jour les enseignants de la classe via l'API
      await api.put(`/classes/${selectedClass}/enseignants`, {
        enseignant_ids: selectedEnseignants
      });

      // Rafraîchir les données
      const [classesRes] = await Promise.all([
        api.get('/classes?with_enseignants=true')
      ]);

      setClassesWithEnseignants(classesRes.data);
      setClasses(classesRes.data);

      setMessage({
        text: 'Enseignants associés avec succès',
        type: 'success'
      });

    } catch (error) {
      setMessage({
        text: error.response?.data?.message || 'Erreur lors de l\'association des enseignants',
        type: 'error'
      });
      console.error('Error updating class enseignants:', error);
    } finally {
      setLoading(false);
    }
  };
  const handleReset = () => {
    setSelectedClass('');
    setSelectedEnseignants([]);
    setMessage({ text: '', type: '' });
  };
  return (
    <div>
      <h2 style={{ marginBottom: '2rem', fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--primary)' }}>Gérer les enseignants par classe</h2>

      {message.text && (
        <div className={`message ${message.type === 'error' ? 'error' : 'success'}`}>
          {message.text}
        </div>
      )}

      <div className="form-grid">
        {/* Form to link enseignants to class */}
        <div className="card">
          <h3 style={{ marginBottom: '1.5rem', fontSize: '1.25rem', fontWeight: 'bold' }}>Associer des enseignants à une classe</h3>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="class">Classe</label>
              <select
                id="class"
                className="form-select"
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                disabled={loading}
              >
                <option value="">Sélectionnez une classe</option>
                {classes.map(classe => (
                  <option key={classe.id} value={classe.id}>
                    {classe.nom_classe} ({classe.categorie_classe})
                  </option>
                ))}
              </select>
            </div>

            {selectedClass && (
              <div className="form-group">
                <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  Enseignants disponibles
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 'normal' }}>
                    ({selectedEnseignants.length} sélectionné{selectedEnseignants.length > 1 ? 's' : ''})
                  </span>
                </label>

                <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: '8px', padding: '0.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.5rem' }}>
                  {enseignants.map(enseignant => (
                    <div key={enseignant.id} style={{ display: 'flex', alignItems: 'center', padding: '0.5rem', border: '1px solid var(--border-light)', borderRadius: '4px', background: selectedEnseignants.includes(enseignant.id) ? 'var(--primary-light)' : 'transparent' }}>
                      <input
                        type="checkbox"
                        id={`enseignant-${enseignant.id}`}
                        checked={selectedEnseignants.includes(enseignant.id)}
                        onChange={() => handleEnseignantToggle(enseignant.id)}
                        style={{ marginRight: '0.75rem', width: '16px', height: '16px' }}
                        disabled={loading}
                      />
                      <label htmlFor={`enseignant-${enseignant.id}`} style={{ cursor: 'pointer', flex: 1, fontSize: '0.9rem' }}>
                        {enseignant.nom} {enseignant.prenom}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
              <button
                className="btn btn-primary"
                type="submit"
                disabled={loading || !selectedClass || selectedEnseignants.length === 0}
                style={{ flex: 1 }}
              >
                {loading ? 'En cours...' : 'Enregistrer les associations'}
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="btn btn-secondary"
                disabled={loading}
              >
                Réinitialiser
              </button>
            </div>
          </form>
        </div>
        {/* Display current relationships */}
        <div className="card">
          <h3 style={{ marginBottom: '1.5rem', fontSize: '1.25rem', fontWeight: 'bold' }}>Enseignants par classe</h3>

          {classesWithEnseignants.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Aucune classe disponible</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
              {classesWithEnseignants.map(classe => (
                <div key={classe.id} style={{ padding: '1rem', border: '1px solid var(--border)', borderRadius: '8px' }}>
                  <h4 style={{ margin: '0 0 0.5rem 0', fontWeight: '600' }}>{classe.nom_classe} <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 'normal' }}>({classe.categorie_classe})</span></h4>

                  {classe.enseignants && classe.enseignants.length > 0 ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
                      {classe.enseignants.map(enseignant => (
                        <span key={enseignant.id} style={{ background: 'var(--primary-light)', color: 'var(--primary)', padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.85rem', fontWeight: '500' }}>
                          {enseignant.nom} {enseignant.prenom}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontStyle: 'italic', marginBottom: '1rem' }}>Aucun enseignant associé</p>
                  )}

                  {classe.series && classe.series.length > 0 && (
                    <div style={{ marginBottom: '0.5rem' }}>
                      <h5 style={{ fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.25rem', color: 'var(--text-muted)' }}>Séries associées</h5>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                        {classe.series.map(serie => (
                          <span key={serie.id} style={{ background: 'var(--bg-light)', border: '1px solid var(--border)', padding: '0.1rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem' }}>
                            {serie.nom}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {classe.matieres && classe.matieres.length > 0 && (
                    <div>
                      <h5 style={{ fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.25rem', color: 'var(--text-muted)' }}>Matières associées</h5>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                        {classe.matieres.map(matiere => (
                          <span key={matiere.id} style={{ background: 'var(--bg-light)', border: '1px solid var(--border)', padding: '0.1rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem' }}>
                            {matiere.nom}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


const LierEnseignantsAuxMatieres = () => {
  const [classes, setClasses] = useState([]);
  const [matieres, setMatieres] = useState([]);
  const [enseignants, setEnseignants] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSerie, setSelectedSerie] = useState('');
  const [selectedMatieres, setSelectedMatieres] = useState([]);
  const [enseignantsParMatiere, setEnseignantsParMatiere] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [classesWithData, setClassesWithData] = useState([]);

  // Charger les données initiales
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [classesRes, matieresRes, enseignantsRes] = await Promise.all([
          api.get('/classes?with_series=true&with_matieres=true&with_enseignants=true'),
          api.get('/matieres'),
          api.get('/enseignants?with_matieres=true'),
          api.get('/enseignants/MP?with_matieres=true'),
        ]);

        setClasses(classesRes.data);
        setMatieres(matieresRes.data);
        setEnseignants(enseignantsRes.data);
        setClassesWithData(classesRes.data);
        setMessage({ text: '', type: '' });
      } catch (error) {
        setMessage({
          text: 'Erreur lors du chargement des données',
          type: 'error'
        });
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Charger les matières et enseignants quand une série est sélectionnée
  useEffect(() => {
    const fetchSeriesMatieres = async () => {
      if (!selectedClass || !selectedSerie) {
        setSelectedMatieres([]);
        setEnseignantsParMatiere({});
        return;
      }

      try {
        setLoading(true);
        const response = await api.get(
          `/classes/${selectedClass}/series/${selectedSerie}/matieres?with_enseignants=true`
        );
        console.log('Matieres data:', response.data);

        const matieresData = response.data;
        setSelectedMatieres(matieresData.map(matiere => matiere.id));

        // Initialiser les enseignants par matière
        const enseignantsData = {};
        matieresData.forEach(matiere => {
          enseignantsData[matiere.id] = matiere.enseignants?.map(e => e.id) || [];
        });
        setEnseignantsParMatiere(enseignantsData);

      } catch (error) {
        setMessage({
          text: 'Erreur lors du chargement des données',
          type: 'error'
        });
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSeriesMatieres();
  }, [selectedClass, selectedSerie]);

  const handleEnseignantChange = (matiereId, enseignantId) => {
    setEnseignantsParMatiere(prev => ({
      ...prev,
      [matiereId]: [...(prev[matiereId] || []), enseignantId]
    }));
  };

  const handleRemoveEnseignant = (matiereId, enseignantId) => {
    setEnseignantsParMatiere(prev => ({
      ...prev,
      [matiereId]: (prev[matiereId] || []).filter(id => id !== enseignantId)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedClass || !selectedSerie) {
      setMessage({ text: 'Veuillez sélectionner une classe et une série', type: 'error' });
      return;
    }

    try {
      setLoading(true);

      // Préparer les données dans le format attendu par le backend
      const matieresData = selectedMatieres.map(matiereId => ({
        matiere_id: matiereId,
        enseignants: enseignantsParMatiere[matiereId] || []
      }));

      // Envoyer les données au backend
      const response = await api.put(
        `/classes/${selectedClass}/series/${selectedSerie}/matieres/enseignants`,
        { matieres: matieresData }
      );

      if (response.data.success) {
        // Rafraîchir les données
        const classesRes = await api.get(
          '/classes?with_series=true&with_matieres=true&with_enseignants=true'
        );

        setClassesWithData(classesRes.data);

        setMessage({
          text: 'Enseignants associés avec succès',
          type: 'success'
        });
      } else {
        throw new Error(response.data.message || 'Erreur lors de la mise à jour');
      }

    } catch (error) {
      setMessage({
        text: error.response?.data?.message || error.message || 'Erreur lors de la mise à jour',
        type: 'error'
      });
      console.error('Error updating enseignants:', error);
    } finally {
      setLoading(false);
    }
  };

  // Obtenir les séries disponibles pour la classe sélectionnée
  const getSeriesForSelectedClass = () => {
    if (!selectedClass) return [];
    const classe = classes.find(c => c.id == selectedClass);
    return classe ? classe.series || [] : [];
  };

  // Obtenir les enseignants qui enseignent une matière spécifique
  const getEnseignantsForMatiere = (matiereId) => {
    return enseignants.filter(enseignant => enseignant.matieres?.some(m => m.id == matiereId));
  };

  return (
    <div>
      <h2 style={{ marginBottom: '2rem', fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--primary)' }}>Gérer les enseignants par matière/série/classe</h2>

      {message.text && (
        <div className={`message ${message.type === 'error' ? 'error' : 'success'}`}>
          {message.text}
          <button
            style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: 'inherit', marginLeft: 'auto' }}
            onClick={() => setMessage({ text: '', type: '' })}
            aria-label="Fermer le message"
          >
            ×
          </button>
        </div>
      )}

      <div className="form-grid">
        <div className="card">
          <h3 style={{ marginBottom: '1.5rem', fontSize: '1.25rem', fontWeight: 'bold' }}>Associer des enseignants</h3>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Classe</label>
              <select
                value={selectedClass}
                onChange={(e) => {
                  setSelectedClass(e.target.value);
                  setSelectedSerie('');
                }}
                disabled={loading}
                className="form-select"
              >
                <option value="">Sélectionnez une classe</option>
                {classes.map(classe => (
                  <option key={classe.id} value={classe.id}>
                    {classe.nom_classe}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Série</label>
              <select
                value={selectedSerie}
                onChange={(e) => setSelectedSerie(e.target.value)}
                disabled={loading || !selectedClass}
                className="form-select"
              >
                <option value="">Sélectionnez une série</option>
                {getSeriesForSelectedClass().map(serie => (
                  <option key={serie.id} value={serie.id}>
                    {serie.nom}
                  </option>
                ))}
              </select>
            </div>

            {selectedSerie && (
              <div className="form-group">
                <label>Matières et enseignants</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.5rem' }}>
                  {selectedMatieres.map(matiereId => {
                    const matiere = matieres.find(m => m.id == matiereId);
                    const enseignantsMatiere = getEnseignantsForMatiere(matiereId);
                    const selectedEnseignants = enseignantsParMatiere[matiereId] || [];

                    return (
                      <div key={matiereId} style={{ padding: '1rem', border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--bg-light)' }}>
                        <h4 style={{ margin: '0 0 0.75rem 0', fontWeight: '600' }}>{matiere?.nom || 'Matière inconnue'}</h4>

                        {enseignantsMatiere.length > 0 ? (
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.5rem' }}>
                            {enseignantsMatiere.map(enseignant => (
                              <div key={enseignant.id} style={{ display: 'flex', alignItems: 'center', padding: '0.4rem', background: 'white', borderRadius: '4px', border: '1px solid var(--border-light)' }}>
                                <input
                                  type="checkbox"
                                  checked={selectedEnseignants.includes(enseignant.id)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      handleEnseignantChange(matiereId, enseignant.id);
                                    } else {
                                      handleRemoveEnseignant(matiereId, enseignant.id);
                                    }
                                  }}
                                  disabled={loading}
                                  style={{ marginRight: '0.5rem', width: '16px', height: '16px' }}
                                />
                                <label style={{ fontSize: '0.9rem', cursor: 'pointer', flex: 1 }}>
                                  {enseignant.nom} {enseignant.prenom}
                                  {enseignant.matieres.length > 1 && (
                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}> ({enseignant.matieres.length} matières)</span>
                                  )}
                                </label>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>Aucun enseignant disponible pour cette matière</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !selectedClass || !selectedSerie}
              className="btn btn-primary"
              style={{ marginTop: '1.5rem', width: '100%' }}
            >
              {loading ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </form>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: '1.5rem', fontSize: '1.25rem', fontWeight: 'bold' }}>Enseignants par matière/série/classe</h3>

          {classesWithData.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>Aucune donnée disponible</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {classesWithData.map(classe => (
                <div key={classe.id} style={{ padding: '1rem', border: '1px solid var(--border)', borderRadius: '8px' }}>
                  <h4 style={{ margin: '0 0 1rem 0', fontWeight: 'bold', color: 'var(--primary)' }}>{classe.nom_classe}</h4>
                  {classe.series?.map(serie => (
                    <div key={serie.id} style={{ marginBottom: '1rem', paddingLeft: '1rem', borderLeft: '3px solid var(--secondary)' }}>
                      <h5 style={{ margin: '0 0 0.5rem 0', fontWeight: '600' }}>{serie.nom}</h5>
                      <div className="matieres-list">
                        {serie.matieres?.length > 0 ? (
                          <table className="data-table" style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>
                            <thead>
                              <tr>
                                <th style={{ padding: '0.5rem' }}>Matière</th>
                                <th style={{ padding: '0.5rem' }}>Enseignants</th>
                              </tr>
                            </thead>
                            <tbody>
                              {serie.matieres.map(matiere => (
                                <tr key={matiere.id}>
                                  <td style={{ padding: '0.5rem' }}>{matiere.nom}</td>
                                  <td style={{ padding: '0.5rem' }}>
                                    {matiere.enseignants?.length > 0 ? (
                                      <ul style={{ margin: 0, paddingLeft: '1.2rem' }}>
                                        {matiere.enseignants.map(enseignant => (
                                          <li key={enseignant.id}>
                                            {enseignant.nom} {enseignant.prenom}
                                          </li>
                                        ))}
                                      </ul>
                                    ) : (
                                      <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Aucun enseignant</span>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        ) : (
                          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>Aucune matière associée</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const LierMatieresauxClasses1 = () => {
  const [classes, setClasses] = useState([]);
  const [matieres, setMatieres] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSerie, setSelectedSerie] = useState('');
  const [selectedMatieres, setSelectedMatieres] = useState([]);
  const [matieresCoefficients, setMatieresCoefficients] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [classesWithData, setClassesWithData] = useState([]);

  // Charger les données initiales
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [classesRes, matieresRes] = await Promise.all([
          api.get('/classes?with_series=true&with_matieres=true&with_coefficients=true'),
          api.get('/matieres')
        ]);

        setClasses(classesRes.data);
        setMatieres(matieresRes.data);
        setClassesWithData(classesRes.data);
        setMessage({ text: '', type: '' });
      } catch (error) {
        setMessage({
          text: 'Erreur lors du chargement des données',
          type: 'error'
        });
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Charger les matières et coefficients quand une série et classe sont sélectionnées
  useEffect(() => {
    const fetchSeriesMatieres = async () => {
      if (!selectedClass || !selectedSerie) {
        setSelectedMatieres([]);
        setMatieresCoefficients({});
        return;
      }

      try {
        setLoading(true);
        const response = await api.get(
          `/series/${selectedSerie}/matieres?classe_id=${selectedClass}`
        );

        const matieresData = response.data;
        setSelectedMatieres(matieresData.map(matiere => matiere.id));

        // Initialiser les coefficients
        const coefficients = {};
        matieresData.forEach(matiere => {
          coefficients[matiere.id] = matiere.coefficient || 1;
        });
        setMatieresCoefficients(coefficients);

      } catch (error) {
        setMessage({
          text: 'Erreur lors du chargement des matières',
          type: 'error'
        });
        console.error('Error fetching matieres:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSeriesMatieres();
  }, [selectedClass, selectedSerie]);

  const handleMatiereToggle = (matiereId) => {
    const id = Number(matiereId);
    setSelectedMatieres(prev => {
      const newSelected = prev.includes(id)
        ? prev.filter(prevId => prevId !== id)
        : [...prev, id];

      const newCoefficients = { ...matieresCoefficients };
      if (!prev.includes(id)) {
        newCoefficients[id] = 1;
      } else {
        delete newCoefficients[id];
      }
      setMatieresCoefficients(newCoefficients);

      return newSelected;
    });
  };

  const handleCoefficientChange = (matiereId, value) => {
    setMatieresCoefficients(prev => ({
      ...prev,
      [matiereId]: Math.max(0.1, parseFloat(value) || 1)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedClass || !selectedSerie) {
      setMessage({ text: 'Veuillez sélectionner une classe et une série', type: 'error' });
      return;
    }

    try {
      setLoading(true);

      // Préparer les données dans le nouveau format
      const matieresData = selectedMatieres.map(id => ({
        matiere_id: id,
        classe_id: selectedClass,
        coefficient: matieresCoefficients[id] || 1
      }));

      // Envoyer les données au backend
      const response = await api.put(
        `/series/${selectedSerie}/matieres/sync`,
        { matieres: matieresData }
      );

      if (response.data.success) {
        // Rafraîchir les données
        const classesRes = await api.get(
          '/classes?with_series=true&with_matieres=true&with_coefficients=true'
        );

        setClasses(classesRes.data);
        setClassesWithData(classesRes.data);

        setMessage({
          text: 'Matières et coefficients mis à jour avec succès',
          type: 'success'
        });
      } else {
        throw new Error(response.data.message || 'Erreur lors de la mise à jour');
      }

    } catch (error) {
      setMessage({
        text: error.response?.data?.message || error.message || 'Erreur lors de la mise à jour',
        type: 'error'
      });
      console.error('Error updating matieres:', error);
    } finally {
      setLoading(false);
    }
  };

  // Obtenir les séries disponibles pour la classe sélectionnée
  const getSeriesForSelectedClass = () => {
    if (!selectedClass) return [];
    const classe = classes.find(c => c.id == selectedClass);
    return classe ? classe.series || [] : [];
  };

  // Fonction pour obtenir le coefficient d'une matière dans une classe
  const getCoefficientForMatiere = (matiere, classeId, serieId) => {
    if (!matiere.series) return 1;

    const serieRelation = matiere.series.find(s => s.id == serieId);
    if (!serieRelation) return 1;

    const classeRelation = serieRelation.pivot.classes.find(c => c.id == classeId);
    return classeRelation?.pivot?.coefficient || 1;
  };

  return (
    <div className="link-series-container">
      {/* ... (le reste du JSX reste similaire) ... */}

      {/* Modifier l'affichage des matières associées pour montrer les coefficients par classe */}
      <div className="relationships-card">
        <h2>Matières et coefficients par série/classe</h2>

        {classesWithData.length === 0 ? (
          <p>Aucune donnée disponible</p>
        ) : (
          <div className="classes-list">
            {classesWithData.map(classe => (
              <div key={classe.id} className="class-item">
                <h3>{classe.nom_classe}</h3>
                {classe.series?.map(serie => (
                  <div key={serie.id} className="serie-item">
                    <h4>{serie.nom}</h4>
                    <div className="matieres-list">
                      {serie.matieres?.length > 0 ? (
                        <table className="matieres-table">
                          <thead>
                            <tr>
                              <th>Matière</th>
                              <th>Coefficient</th>
                            </tr>
                          </thead>
                          <tbody>
                            {serie.matieres.map(matiere => (
                              <tr key={matiere.id}>
                                <td>{matiere.nom}</td>
                                <td>
                                  {getCoefficientForMatiere(matiere, classe.id, serie.id)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : (
                        <p>Aucune matière associée</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};


const LierMatieresauxClasses2 = () => {
  const [classes, setClasses] = useState([]);
  const [matieres, setMatieres] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await api.get('/classes-with-series-matieres');
        setClasses(response.data);
        setMessage({ text: '', type: '' });
      } catch (error) {
        setMessage({
          text: 'Erreur lors du chargement des données',
          type: 'error'
        });
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Fonction pour organiser les données par classe et série
  const organizeData = () => {
    return classes.map(classe => ({
      ...classe,
      series: classe.series?.map(serie => ({
        ...serie,
        matieres: serie.matieres?.map(matiere => ({
          ...matiere,
          coefficient: matiere.pivot?.coefficient || 1
        }))
      }))
    }));
  };

  return (
    <div className="container">
      <h1 style={{ marginBottom: '2rem', fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--primary)' }}>Matières par classe et série</h1>

      {message.text && (
        <div className={`message ${message.type === 'error' ? 'error' : 'success'}`}>
          {message.text}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Chargement...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {organizeData().map(classe => (
            <div key={classe.id} className="card">
              <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem', color: 'var(--primary)' }}>Classe: {classe.nom_classe}</h2>

              {classe.series?.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {classe.series.map(serie => (
                    <div key={serie.id} style={{ paddingLeft: '1rem', borderLeft: '3px solid var(--secondary)' }}>
                      <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.5rem' }}>Série: {serie.nom}</h3>

                      {serie.matieres?.length > 0 ? (
                        <table className="data-table" style={{ fontSize: '0.9rem' }}>
                          <thead>
                            <tr>
                              <th style={{ padding: '0.5rem' }}>Matière</th>
                              <th style={{ padding: '0.5rem' }}>Coeff</th>
                            </tr>
                          </thead>
                          <tbody>
                            {serie.matieres.map(matiere => (
                              <tr key={matiere.id}>
                                <td style={{ padding: '0.5rem' }}>{matiere.nom}</td>
                                <td style={{ padding: '0.5rem' }}>{matiere.coefficient}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : (
                        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>Aucune matière</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: 'var(--text-muted)' }}>Aucune série</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};