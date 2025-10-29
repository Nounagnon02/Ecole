import React, { useState, useEffect } from 'react';
import { PieChart, Pie, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { Edit2, Trash2, Save, X, Plus, Menu, Home, Users, Book, User, Settings, LogOut, Bell, Calendar, ChevronDown, ChevronUp, ClipboardList, MessageSquare } from 'lucide-react';
import './Mes_CSS_directeur/dashboard.css';
import { NavLink } from 'react-router-dom';
import * as XLSX from 'xlsx';
import * as pdfjsLib from 'pdfjs-dist';
import api from '../api';
import Messagerie from '../components/Messagerie';
import NotificationBell from '../components/NotificationBell';
import EmploiDuTemps from './EmploiDuTemps';



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
  const [editClassCategory,setEditClassCategory] = useState('');
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
  const [sidebarOpen, setSidebarOpen] = useState(true);
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

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

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
    switch(categorie.toLowerCase()) {
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
          <option key="3"  value="Interrogation">Interrogation écrite</option>
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
    <div className="dashboard-container">
      {/* Sidebar */}
      <div className={`sidebar ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        <div className="sidebar-header">
          {sidebarOpen && <h1 className="sidebar-title">EcoleGestion</h1>}
          <button onClick={toggleSidebar} className="sidebar-toggle">
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
        <nav className="sidebar-nav">
          <div 
            className={`sidebar-item ${activeTab === 'aperçu' ? 'active' : ''}`} 
            onClick={() => setActiveTab('aperçu')}
          >
            <Home size={20} />
            {sidebarOpen && <span className="sidebar-item-text">Aperçu</span>}
          </div>
          <div 
            className={`sidebar-item ${activeTab === 'élèves' ? 'active' : ''}`} 
            onClick={() => setActiveTab('élèves')}
          >
            <Users size={20} />
            {sidebarOpen && <span className="sidebar-item-text">Élèves</span>}
          </div>
          <div 
            className={`sidebar-item ${activeTab === 'classes' ? 'active' : ''}`} 
            onClick={() => setActiveTab('classes')}
          >
            <Book size={20} />
            {sidebarOpen && <span className="sidebar-item-text">Classes</span>}
          </div>
          <div 
            className={`sidebar-item ${activeTab === 'matieres' ? 'active' : ''}`} 
            onClick={() => setActiveTab('matieres')}
          >
            <Book size={20} />
            {sidebarOpen && <span className="sidebar-item-text">Matières</span>}
          </div>
          <div 
            className={`sidebar-item ${activeTab === 'series' ? 'active' : ''}`} 
            onClick={() => setActiveTab('series')}
          >
            <Book size={20} />
            {sidebarOpen && <span className="sidebar-item-text">Séries</span>}
          </div>
          <div 
            className={`sidebar-item ${activeTab === 'notes' ? 'active' : ''}`} 
            onClick={() => setActiveTab('notes')}
          >
            <ClipboardList size={20} />
            {sidebarOpen && <span className="sidebar-item-text">Notes</span>}
          </div>
          <div 
            className={`sidebar-item ${activeTab === 'LiaisonSeriesClass' ? 'active' : ''}`} 
            onClick={() => setActiveTab('LiaisonSeriesClass')}
          >
            <Calendar size={20} />
            {sidebarOpen && <span className="sidebar-item-text">Lier Series Classes</span>}
          </div>
          <div 
            className={`sidebar-item ${activeTab === 'LiaisonMatieresAvecCoefficientEtSerieClasses' ? 'active' : ''}`} 
            onClick={() => setActiveTab('LiaisonMatieresAvecCoefficientEtSerieClasses')}
          >
            <Calendar size={20} />
            {sidebarOpen && <span className="sidebar-item-text">Lier Matieres Classes</span>}
          </div>

          <div 
            className={`sidebar-item ${activeTab === 'LierElevesAuxParents' ? 'active' : ''}`} 
            onClick={() => setActiveTab('LierElevesAuxParents')}
          >
            <Calendar size={20} />
            {sidebarOpen && <span className="sidebar-item-text">Lier Parents Eleves</span>}
          </div>

          <div 
            className={`sidebar-item ${activeTab === 'enseignantsauxclasses' ? 'active' : ''}`} 
            onClick={() => setActiveTab('enseignantsauxclasses')}
          >
            <Calendar size={20} />
            {sidebarOpen && <span className="sidebar-item-text">Lier enseignant classes</span>}
          </div>
          <div 
            className={`sidebar-item ${activeTab === 'emploi' ? 'active' : ''}`} 
            onClick={() => setActiveTab('emploi')}
          >
            <Calendar size={20} />
            {sidebarOpen && <span className="sidebar-item-text">Emploi du temps</span>}
          </div>
          <div 
            className={`sidebar-item ${activeTab === 'messages' ? 'active' : ''}`} 
            onClick={() => setActiveTab('messages')}
          >
            <MessageSquare size={20} />
            {sidebarOpen && <span className="sidebar-item-text">Messages</span>}
          </div>
          <div 
            className={`sidebar-item ${activeTab === 'personnel' ? 'active' : ''}`} 
            onClick={() => setActiveTab('personnel')}
          >
            <User size={20} />
            {sidebarOpen && <span className="sidebar-item-text">Personnel</span>}
          </div>
          <div 
            className={`sidebar-item ${activeTab === 'paramètres' ? 'active' : ''}`} 
            onClick={() => setActiveTab('paramètres')}
          >
            <Settings size={20} />
            {sidebarOpen && <span className="sidebar-item-text">Paramètres</span>}
          </div>
          <div className="sidebar-logout">
            <LogOut size={20} />
            {sidebarOpen && <NavLink to='/connexion' className="sidebar-item-text">Déconnexion</NavLink>}
          </div>
        </nav>
      </div>

      {/* Main content */}
      <div className="main-content">
        {/* Header */}
        <header className="main-header">
          <h2 className="header-title">{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</h2>
          <div className="header-actions">
            <div className="notifications-container">
              <NotificationBell userId={localStorage.getItem('userId')} />
              {showNotifications && (
                <div className="notifications-dropdown">
                  <h3 className="notifications-header">Notifications</h3>
                  {notifications.map(notif => (
                    <div key={notif.id} className="notification-item">
                      <p className="notification-message">{notif.message}</p>
                      <span className="notification-date">{notif.date}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="profile-container">
              <img src="/api/placeholder/40/40" alt="Profile" className="profile-image" />
              {sidebarOpen && <span className="profile-name">Directeur</span>}
            </div>
          </div>
        </header>

        {/* Content area */}
        <main className="content-area">
          {activeTab === 'aperçu' && (
            <>
              <div className="stats-grid">
                <div className="stat-card">
                  <h3 className="stat-title">Total Élèves</h3>
                  <p className="stat-value">350</p>
                  <p className="stat-trend positive">+2,8% depuis le mois dernier</p>
                </div>
                <div className="stat-card">
                  <h3 className="stat-title">Présence Moyenne</h3>
                  <p className="stat-value">92%</p>
                  <p className="stat-trend negative">-1,5% depuis la semaine dernière</p>
                </div>
                <div className="stat-card">
                  <h3 className="stat-title">Enseignants</h3>
                  <p className="stat-value">24</p>
                  <p className="stat-trend neutral">Stable depuis le mois dernier</p>
                </div>
                <div className="stat-card">
                  <h3 className="stat-title">Classes</h3>
                  <p className="stat-value">15</p>
                  <p className="stat-trend neutral">Stable depuis la rentrée</p>
                </div>
              </div>

              <div className="section-container">
                <div className="section-header">
                  <h3 className="section-title">Statistiques</h3>
                  <button 
                    className="section-toggle"
                    onClick={() => toggleSection('statistiques')}
                  >
                    {expandedSection === 'statistiques' ? (
                      <>Réduire <ChevronUp size={16} /></>
                    ) : (
                      <>Voir plus <ChevronDown size={16} /></>
                    )}
                  </button>
                </div>
                
                {expandedSection === 'statistiques' && (
                  <div className="charts-grid">
                    <div className="chart-card">
                      <h4 className="chart-title">Évolution des effectifs</h4>
                      <ResponsiveContainer width="100%" height={250}>
                        <LineChart data={studentData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Line type="monotone" dataKey="students" stroke="#2563eb" activeDot={{ r: 8 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="chart-card">
                      <h4 className="chart-title">Répartition des notes</h4>
                      <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                          <Pie
                            data={gradeData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          >
                            {gradeData.map((entry, index) => (
                              <React.Fragment key={`cell-${index}`}>
                                {index === 0 && <Cell fill="#bfdbfe" />}
                                {index === 1 && <Cell fill="#93c5fd" />}
                                {index === 2 && <Cell fill="#60a5fa" />}
                                {index === 3 && <Cell fill="#2563eb" />}
                              </React.Fragment>
                            ))}
                          </Pie>
                          <Tooltip />
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

              <div className="grid-container">
                <div className="events-card">
                  <h3 className="card-title">Événements à venir</h3>
                  {evenements.map(event => (
                    <div key={event.id} className="event-item">
                      <h4 className="event-title">{event.titre}</h4>
                      <div className="event-date">
                        <Calendar size={14} className="icon" />
                        {event.date}
                      </div>
                      <div className="event-location">{event.lieu}</div>
                    </div>
                  ))}
                </div>

                <div className="messages-card">
                  <h3 className="card-title">Messages récents</h3>
                  {notifications.slice(0, 3).map(notif => (
                    <div key={notif.id} className="message-item">
                      <p className="message-text">{notif.message}</p>
                      <span className="message-date">{notif.date}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {activeTab === 'matieres' && (
            <div className="matieres-container">
              {error && <div className="error-message">{error}</div>}
              {message && <div className="success-message">{message}</div>}
              
              <div className="add-form">
                <h2 className="form-title">Ajouter une nouvelle matière</h2>
                <div className="form-controls">
                  <input
                    type="text"
                    value={newMatiere}
                    onChange={(e) => setNewMatiere(e.target.value)}
                    placeholder="Nom de la matière"
                    className="input-field"
                    onKeyPress={(e) => e.key === 'Enter' && AjouterMatiere()}
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
      
              <div className="matieres-list">
                <div className="list-header">
                  <h2 className="list-title">Liste des Matières</h2>
                </div>
                
                {loading && matieres1.length === 0 ? (
                  <div className="empty-state">
                    Chargement des matières...
                  </div>
                ) : matieres1.length === 0 ? (
                  <div className="empty-state">
                    Aucune matière trouvée. Ajoutez-en une ci-dessus.
                  </div>
                ) : (
                  <div className="matieres-items">
                    {matieres1.map((matiere) => (
                      <div key={matiere.id} className="matiere-item">
                        <div className="matiere-content">
                          <div className="matiere-details">
                            {editingId === matiere.id ? (
                              <div className="edit-form">
                                <input
                                  type="text"
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  className="edit-input"
                                  onKeyPress={(e) => e.key === 'Enter' && Modification(matiere.id)}
                                  autoFocus
                                />
                                <div className="edit-actions">
                                  <button
                                    onClick={() => Modification(matiere.id)}
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
                              <div className="matiere-display">
                                <div className="matiere-info">
                                  <h3 className="matiere-name">{matiere.nom}</h3>
                                  <p className="matiere-id">ID: {matiere.id}</p>
                                </div>
                                <div className="matiere-actions">
                                  <button
                                    onClick={() => handleEdit(matiere)}
                                    disabled={loading || editingId !== null}
                                    className="btn btn-edit"
                                    title="Modifier"
                                  >
                                    <Edit2 size={16} />
                                    Modifier
                                  </button>
                                  <button
                                    onClick={() => handleDelete(matiere.id)}
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
              
              <div className="add-note-form">
                <h3 className="form-title">Ajouter une nouvelle note</h3>
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
                      className="form-input"
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
                      className="form-input"
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
                      className="form-input"
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
                >
                            Ajouter la note
                </button>
              </div>
              
              
              <div className="notes-list">
                <FilterSection />
                <h3 className="list-title">Liste des Notes</h3>
                
                {loading ? (
                  <div className="loading-state">Chargement des notes...</div>
                ) : error ? (
                  <div className="error-state">{error}</div>
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
                              className="btn btn-edit" 
                              onClick={() => handleEditNote(note)}
                              title="Modifier"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button 
                              className="btn btn-danger" 
                              onClick={() => handleDeleteNote(note.id)}
                              title="Supprimer"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="empty-state">
                    Aucune note ne correspond aux critères de filtrage
                  </div>
                ))}
              </div>
            </div>
  
          )}

          {activeTab === 'classes' && (
          <div className="classes-container">
            {error && <div className="error-message">{error}</div>}
            {message && <div className="success-message">{message}</div>}
            
            <div className="add-form">
              <h2 className="form-title">Ajouter une nouvelle classe</h2>
              <div className="form-controls">
                <input
                  type="text"
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  placeholder="Nom de la classe"
                  className="input-field"
                />
                <input
                  type="text"
                  value={newClassCategory}
                  onChange={(e) => setNewClassCategory(e.target.value)}
                  placeholder="Catégorie de la classe"
                  className="input-field"
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

            <div className="classes-list">
              <div className="list-header">
                <h2 className="section-title">Liste des classes</h2>
              </div>
              
              {loading && classes1.length === 0 ? (
                <div className="empty-state">
                  Chargement des classes...
                </div>
              ) : classes1.length === 0 ? (
                <div className="empty-state">
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
                              className="edit-input-table"
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
                              className="edit-input-table"
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
                            <div className="table-edit-actions">
                              <button
                                onClick={() => ModificationClasse(classe.id)}
                                disabled={loading}
                                className="btn btn-success btn-sm"
                                title="Sauvegarder"
                              >
                                <Save size={14} />
                              </button>
                              <button
                                onClick={handleCancel}
                                className="btn btn-secondary btn-sm"
                                title="Annuler"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          ) : (
                            <div className="table-actions">
                              <button
                                onClick={() => handleEditClass(classe)}
                                disabled={loading || editingId !== null}
                                className="btn btn-edit btn-sm"
                                title="Modifier"
                              >
                                <Edit2 size={14} />
                              </button>
                              <button
                                onClick={() => handleDeleteClass(classe.id)}
                                disabled={loading || editingId !== null}
                                className="btn btn-danger btn-sm"
                                title="Supprimer"
                              >
                                <Trash2 size={14} />
                              </button>
                              <button className="btn btn-details btn-sm">
                                Détails
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

          {activeTab === 'messages' && (
            <Messagerie userId={localStorage.getItem('userId')} userName={localStorage.getItem('userName') || 'Directeur'} />
          )}

          {(activeTab !== 'aperçu' && activeTab !== 'classes' && activeTab !== 'matieres' && activeTab !== 'LiaisonSeriesClass'  && activeTab !== 'LiaisonMatieresAvecCoefficientEtSerieClasses' && activeTab !== 'notes' && activeTab !== 'enseignantsauxclasses' && activeTab !== 'emploi' && activeTab !== 'messages') && (
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
    <div className="link-series-container">
      <h1 className="section-title">Gérer les séries par classe</h1>
      
      {message.text && (
        <div className={`message ${message.type === 'error' ? 'error-message' : 'success-message'}`}>
          {message.text}
        </div>
      )}

      <div className="form-grid">

        {/* Display current relationships */}
        <div className="relationships-card">
          <h2 className="form-title">Séries par classe</h2>
          
          {classesWithSeries.length === 0 ? (
            <div className="empty-state">Aucune classe disponible</div>
          ) : (
            <div className="classes-list">
              {classesWithSeries.map(classe => (
                <div key={classe.id} className="class-item">
                  <h3 className="class-name">{classe.nom_classe}</h3>
                  <p className="class-category">{classe.categorie_classe}</p>
                  
                  {classe.series && classe.series.length > 0 ? (
                    <div className="series-tags">
                      {classe.series.map(serie => (
                        <span key={serie.id} className="series-tag">
                          {serie.nom}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="no-series">Aucune série associée</p>
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
  const [classesMat, setClassesMat] = useState ([]); 
  const [matieres1 , setMatieres1] = useState([]);
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
        const [classesRes,classesMatieresRes, matieresRes, matieres1Res, seriesRes] = await Promise.all([
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
      
      const newCoefficients = {...matieresCoefficients};
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
    <div className="link-series-container">
      <h1 className="section-title">Gérer les matières et coefficients par série/classe</h1>
      
      {message.text && (
        <div className={`message ${message.type === 'error' ? 'error-message' : 'success-message'}`}>
          {message.text}
          <button 
            className="message-close" 
            onClick={() => setMessage({ text: '', type: '' })}
            aria-label="Fermer le message"
          >
            ×
          </button>
        </div>
      )}

      <div className="form-grid">
        <div className="form-card">
          <h2 className="form-title">Associer des matières</h2>
          
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
                <div className="matieres-checkboxes">
                  {matieres1.map(matiere => (
                    <div key={matiere.id} className="matiere-item">
                      <div className="checkbox-item">
                        <input
                          type="checkbox"
                          checked={selectedMatieres.includes(matiere.id)}
                          onChange={() => handleMatiereToggle(matiere.id)}
                          disabled={loading}
                        />
                        <label>{matiere.nom}</label>
                      </div>
                      
                      {selectedMatieres.includes(matiere.id) && (
                        <div className="coefficient-input">
                          <label>Coefficient:</label>
                          <input
                            type="number"
                            min="1"
                            value={matieresCoefficients[matiere.id] || 1}
                            onChange={(e) => handleCoefficientChange(matiere.id, e.target.value)}
                            disabled={loading}
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
              className="submit-button"
            >
              {loading ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </form>
        </div>

        <div className="relationships-card">
          <h2>Matières et coefficients par série/classe</h2>
          
          {classesWithData.length === 0 ? (
            <p>Aucune donnée disponible</p>
          ) : (
            <div className="classes-list">
              {classesWithData.map(classe => (
                <div key={classe.id} className="class-item">
                  <h3>Classe: {classe.nom_classe}</h3> 
                  
                  {classe.series?.length > 0 ? (
                    groupUniqueSeries(classe.series).map(serie => (
                      <div key={serie.id} className="serie-item">
                        <h4>Série: {serie.nom}</h4>
                        
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
                                    {matiere.coefficient || 1}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        ) : (
                          <p>Aucune matière associée à cette série</p>
                        )}
                      </div>
                    ))
                  ) : (
                    <p>Aucune série associée à cette classe</p>
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
    <div className="link-eleves-container">
      <h1 className="section-title">Gérer les élèves par parent</h1>
      
      {message.text && (
        <div className={`message ${message.type === 'error' ? 'error-message' : 'success-message'}`}>
          {message.text}
        </div>
      )}

      <div className="form-grid">
        {/* Form to link eleves to parent */}
        <div className="form-card">
          <h2 className="form-title">Associer des élèves à un parent</h2>
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="parent">Parent</label>
              <select
                id="parent"
                className="form-input"
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
                <label className="eleves-label">
                  Élèves disponibles 
                  <span className="selected-count">
                    ({selectedEleves.length} sélectionné{selectedEleves.length > 1 ? 's' : ''})
                  </span>
                </label>
                
                {/* Search input */}
                <div className="search-container">
                  <input
                    type="text"
                    placeholder="Rechercher un élève (nom, prénom, matricule, classe...)"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                    disabled={loading}
                  />
                  {searchTerm && (
                    <button
                      type="button"
                      onClick={() => setSearchTerm('')}
                      className="clear-search-btn"
                      disabled={loading}
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Results info */}
                <div className="search-info">
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
                      className="show-more-btn"
                      disabled={loading}
                    >
                      Afficher tous les résultats
                    </button>
                  )}
                </div>

                <div className="eleves-checkboxes">
                  {elevesToDisplay.length === 0 ? (
                    <div className="no-results">Aucun élève trouvé</div>
                  ) : (
                    elevesToDisplay.map(eleve => (
                      <div key={eleve.id} className="checkbox-item">
                        <input
                          type="checkbox"
                          id={`eleve-${eleve.id}`}
                          checked={selectedEleves.includes(eleve.id)}
                          onChange={() => handleEleveToggle(eleve.id)}
                          className="checkbox-input"
                          disabled={loading}
                        />
                        <label htmlFor={`eleve-${eleve.id}`} className="checkbox-label">
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
                    className="show-less-btn"
                    disabled={loading}
                  >
                    Afficher moins de résultats
                  </button>
                )}
              </div>
            )}

            <div className="form-actions">
              <button
                className={`btn btn-primary ${loading ? 'btn-loading' : ''}`}
                type="submit"
                disabled={loading || !selectedParent || selectedEleves.length === 0}
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
        <div className="relationships-card">
          <h2 className="form-title">Élèves par parent</h2>
          
          {parentsWithEleves.length === 0 ? (
            <div className="empty-state">Aucun parent disponible</div>
          ) : (
            <div className="parents-list">
              {parentsWithEleves.map(parent => (
                <div key={parent.id} className="parent-item">
                  <h3 className="parent-name">{parent.nom} {parent.prenom}</h3>
                  {parent.telephone && (
                    <p className="parent-contact">📞 {parent.numero_telephone}</p>
                  )}
                  {parent.email && (
                    <p className="parent-contact">✉️ {parent.email}</p>
                  )}
                  
                  {parent.eleves && parent.eleves.length > 0 ? (
                    <div className="eleves-list">
                      <h4 className="eleves-title">
                        Enfants ({parent.eleves.length})
                      </h4>
                      {parent.eleves.map(eleve => (
                        <div key={eleve.id} className="eleve-item">
                          <span className="eleve-name">
                            {eleve.prenom} {eleve.nom}
                          </span>   

                          {eleve.matricule && (
                            <span className="eleve-matricule">
                              {eleve.matricule}
                            </span>
                          )}
                            
                          {eleve.classe && (
                            <span className="eleve-classe">
                              {eleve.classe.nom_classe}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="no-eleves">Aucun enfant associé</p>
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
    <div className="link-enseignants-container">
      <h1 className="section-title">Gérer les enseignants par classe</h1>
      
      {message.text && (
        <div className={`message ${message.type === 'error' ? 'error-message' : 'success-message'}`}>
          {message.text}
        </div>
      )}

      <div className="form-grid">
        {/* Form to link enseignants to class */}
        <div className="form-card">
          <h2 className="form-title">Associer des enseignants à une classe</h2>
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="class">Classe</label>
              <select
                id="class"
                className="form-input"
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
                <label className="enseignants-label">
                  Enseignants disponibles 
                  <span className="selected-count">
                    ({selectedEnseignants.length} sélectionné{selectedEnseignants.length > 1 ? 's' : ''})
                  </span>
                </label>
                
                <div className="enseignants-checkboxes">
                  {enseignants.map(enseignant => (
                    <div key={enseignant.id} className="checkbox-item">
                      <input
                        type="checkbox"
                        id={`enseignant-${enseignant.id}`}
                        checked={selectedEnseignants.includes(enseignant.id)}
                        onChange={() => handleEnseignantToggle(enseignant.id)}
                        className="checkbox-input"
                        disabled={loading}
                      />
                      <label htmlFor={`enseignant-${enseignant.id}`} className="checkbox-label">
                        {enseignant.nom} {enseignant.prenom}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="form-actions">
              <button
                className={`btn btn-primary ${loading ? 'btn-loading' : ''}`}
                type="submit"
                disabled={loading || !selectedClass || selectedEnseignants.length === 0}
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
        <div className="relationships-card">
          <h2 className="form-title">Enseignants par classe</h2>
          
          {classesWithEnseignants.length === 0 ? (
            <div className="empty-state">Aucune classe disponible</div>
          ) : (
            <div className="classes-list">
              {classesWithEnseignants.map(classe => (
                <div key={classe.id} className="class-item">
                  <h3 className="class-name">{classe.nom_classe} ({classe.categorie_classe})</h3>
                  {classe.enseignants && classe.enseignants.length > 0 ? (
                    <div className="enseignants-list">
                      {classe.enseignants.map(enseignant => (
                        <span key={enseignant.id} className="enseignant-tag">
                          {enseignant.nom} {enseignant.prenom}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="no-enseignants">Aucun enseignant associé</p>
                  )}
                  
                  {classe.series && classe.series.length > 0 && (
                    <div className="series-list">
                      <h4 className="series-title">Séries associées</h4>
                      {classe.series.map(serie => (
                        <span key={serie.id} className="serie-tag">
                          {serie.nom}
                        </span>
                      ))}
                    </div>
                  )}
                  {classe.matieres && classe.matieres.length > 0 && (
                    <div className="matieres-list">
                      <h4 className="matieres-title">Matières associées</h4>
                      {classe.matieres.map(matiere => (
                        <span key={matiere.id} className="matiere-tag">
                          {matiere.nom} (Coeff: {matiere.pivot?.coefficient || 1})
                        </span>
                      ))}
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
    <div className="link-enseignants-container">
      <h1 className="section-title">Gérer les enseignants par matière/série/classe</h1>
      
      {message.text && (
        <div className={`message ${message.type === 'error' ? 'error-message' : 'success-message'}`}>
          {message.text}
          <button 
            className="message-close" 
            onClick={() => setMessage({ text: '', type: '' })}
            aria-label="Fermer le message"
          >
            ×
          </button>
        </div>
      )}

      <div className="form-grid">
        <div className="form-card">
          <h2 className="form-title">Associer des enseignants</h2>
          
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
                <div className="matieres-enseignants-list">
                  {selectedMatieres.map(matiereId => {
                    const matiere = matieres.find(m => m.id == matiereId);
                    const enseignantsMatiere = getEnseignantsForMatiere(matiereId);
                    const selectedEnseignants = enseignantsParMatiere[matiereId] || [];
                    
                    return (
                      <div key={matiereId} className="matiere-enseignants-item">
                        <h4>{matiere?.nom || 'Matière inconnue'}</h4>
                        
                        {enseignantsMatiere.length > 0 ? (
                          <div className="enseignants-selection">
                            {enseignantsMatiere.map(enseignant => (
                              <div key={enseignant.id} className="enseignant-item">
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
                                />
                                <label>
                                  {enseignant.nom} {enseignant.prenom}
                                  {enseignant.matieres.length > 1 && (
                                    <span className="matieres-count"> ({enseignant.matieres.length} matières)</span>
                                  )}
                                </label>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="no-enseignants">Aucun enseignant disponible pour cette matière</p>
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
              className="submit-button"
            >
              {loading ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </form>
        </div>

        <div className="relationships-card">
          <h2>Enseignants par matière/série/classe</h2>
          
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
                          <table className="matieres-enseignants-table">
                            <thead>
                              <tr>
                                <th>Matière</th>
                                <th>Enseignants</th>
                              </tr>
                            </thead>
                            <tbody>
                              {serie.matieres.map(matiere => (
                                <tr key={matiere.id}>
                                  <td>{matiere.nom}</td>
                                  <td>
                                    {matiere.enseignants?.length > 0 ? (
                                      <ul className="enseignants-list">
                                        {matiere.enseignants.map(enseignant => (
                                          <li key={enseignant.id}>
                                            {enseignant.nom} {enseignant.prenom}
                                          </li>
                                        ))}
                                      </ul>
                                    ) : (
                                      <span className="no-enseignants">Aucun enseignant</span>
                                    )}
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
      
      const newCoefficients = {...matieresCoefficients};
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
      <h1>Matières par classe et série</h1>
      
      {message.text && (
        <div className={`alert ${message.type}`}>
          {message.text}
        </div>
      )}

      {loading ? (
        <div>Chargement...</div>
      ) : (
        <div className="classes-container">
          {organizeData().map(classe => (
            <div key={classe.id} className="class-card">
              <h2>Classe: {classe.nom_classe}</h2>
              
              {classe.series?.length > 0 ? (
                <div className="series-container">
                  {classe.series.map(serie => (
                    <div key={serie.id} className="serie-card">
                      <h3>Série: {serie.nom}</h3>
                      
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
                                <td>{matiere.coefficient}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : (
                        <p>Aucune matière associée</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p>Aucune série associée</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};