import React, { useState, useEffect } from 'react';
import { PieChart, Pie, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { Edit2, Trash2, Save, RefreshCcw, X, Plus, Menu, Home, Users, Book, User, Settings, LogOut, Bell, Calendar, ChevronDown, ChevronUp, ClipboardList } from 'lucide-react';
import axios from 'axios';
import './Mes_CSS_directeur/dashboard_directeur.css';
import { NavLink } from 'react-router-dom';
import * as XLSX from 'xlsx';
import * as pdfjsLib from 'pdfjs-dist';
import api from '../api';



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

export default function DashboardP() {
  const [matieres, setMatieres] = useState([]);
  const [classes, setClasses] = useState([]);
  const [series, setSeries] = useState([]);
  const [evenements, setEvenements] = useState([]);
  const [notifications, setNotifications] = useState([]);
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
  const [studentData, setStudentData] = useState([]);
  const [gradeData, setGradeData] = useState([]);
  const [elevesMaternelle, setElevesMaternelle] = useState([]);
  const [serieSeules, setSereSeules] = useState([]);
  const [previewData, setPreviewData] = useState([]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [classes1, setClasses1]= useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('aperçu');
  const [showNotifications, setShowNotifications] = useState(false);
  const [expandedSection, setExpandedSection] = useState('statistiques');
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
  const [classesS, setClassesS] = useState([]);
  
  const [effectif, setEffectif] = useState();
  const [effectifE , setEffectifE] = useState();
  const [elevesET, setElevesET] = useState();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

const effectifEP = async () => {
  try{
    setLoading(true);
    const res = await api.get(`/enseignants/effectif/primaire`);
    setEffectifE(res.data);  
  }catch (err){
    console.err(err);
    setError("erreur lors du chargement de l'effectif des  enseignants du Primaire");
    setLoading(false);
  }
}

const effectifM = async () => {
  try{
    setLoading(true);
    const res = await  api.get(`/classes/effectif/primaire`);
    setEffectif(res.data);
  }catch (err) {
    console.error(err);
      setError('Erreur lors du chargement des effectifs du primaire');
      setLoading(false);
  }
}

// Fonction pour récupérer la série d'une classe


// Gardez uniquement cette version
const [matieresFiltered, setMatieresFiltered] = useState([]);

const getMatieresBySerie = (serieId) => {
    if (!serieId) return [];
    
    const serie = series.find(s => s.id == serieId);
    return serie && serie.matieres ? serie.matieres : [];
  };

  // Fonction pour récupérer les séries depuis l'API
const fetchSeries = async () => {
    try {
      setLoading(true);
      const [res, result] = await Promise.all([
        api.get(`/series`),
        api.get(`/matieres-with-series`),
      ]);

      setSeries(res.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError('Erreur lors du chargement des séries');
      setLoading(false);
    }
  };

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
                          const classe = classesS.find(c => c.id == filters.classe_id);
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
                        {filters.classe_id && getMatieresBySerie(filters.serie_id).map(matiere => (
                          <option key={matiere.id} value={matiere.id}>
                            {matiere.nom}
                          </option>
                        ))}
                      </select>
      </div>

      <div className="filter-item">
        <label>Type d'évaluation</label>
        <select 
          name="type_evaluation"
          value={filters.type_evaluation}
          onChange={handleFilterChange}
          className="filter-select"
        >
          <option value="">Tous les types</option>
          <option value="Devoir1">Devoir 1</option>
          <option value="Devoir2">Devoir 2</option>
          <option value="Interrogation">Interrogation</option>
        </select>
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
    let url = `/notes/filterP?`;
    const params = new URLSearchParams();
    
    // Ajouter uniquement les filtres non vides
    for (const [key, value] of Object.entries(filters)) {
      if (value) {
        params.append(key, value);
      }
    }
    
    url += params.toString();
    
    const response = await api.get(url);
    
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
    fetchEleves(); // Utilisez cette fonction pour charger les matières avec leurs séries
    fetchMatieres();
    fetchSeries();
    effectifM ();
    effectifEP();
    fetchGradeData();
    fetchStudentData();
    fetchClassesSeries();
    applyFilters(); // Charger les classes avec leurs séries
    fetchClassesAvecEffectifMaternelle();
    fetchElevesParClasseMaternelle();
    
}, []);

  useEffect(() => {
  const handleClick = (e) => {
    if (!e.target.closest('.profile-container')) setShowProfileMenu(false);
  };
  if (showProfileMenu) document.addEventListener('mousedown', handleClick);
  return () => document.removeEventListener('mousedown', handleClick);
}, [showProfileMenu]);

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
//// Fonction pour récupérer les classes avec leurs séries
const fetchClassesSeries = async () => {
  try {
    setLoading(true);
    const res = await api.get(`/classes-with-series`);
    console.log('Données reçues de l\'API:', res.data); 
    setClassesS(res.data); //  Vous utilisez setClasses, pas setSeries
    console.log("Classes avec séries:", res.data);
    setLoading(false);
  } catch (err) {
    console.error(err);
    setError('Erreur lors du chargement des séries');
    setLoading(false);
  }
};

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
    const response = await api.post(`/notes/import`, formData, {
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


const fetchMatieres = async () => {
  try {
    setLoading(true);
    const res = await api.get(`/matieresP`);
    // On aplatit le tableau de tableaux et on enlève les doublons par id
    const allMatieres = res.data.data.flat();
    const uniqueMatieres = Array.from(
      new Map(allMatieres.map(m => [m.id, m])).values()
    );
    setMatieres(uniqueMatieres);
    console.log("Matieres du Primaire:", uniqueMatieres);
    setLoading(false);
  } catch (err) {
    console.error(err);
    setError('Erreur lors du chargement des matières');
    setLoading(false);
  }
};

// Fonction pour récupérer les classes depuis l'API
  const fetchClasses = async () => {
    try {
      const res = await api.get(`/classesP`);
      setClasses(res.data);
    } catch (err) {
      console.error(err);
      setError('Erreur lors du chargement des classes');
    }
  };

//Fonction pour recuperer les classes avec leur effectif et categorie
const fetchClassesAvecEffectifMaternelle = async () => {
  const res = await api.get(`/classes/effectifParClassedePrimaire`);
  try {
    setClasses1(res.data);
    console.log("Classes avec effectif et catégorie:", res.data);
  } catch (err) {
    console.error("Erreur lors de la récupération des classes:", err);
    setError('Erreur lors du chargement des classes avec effectif et catégorie');
  }
}

//Recuperer les eleves par classes 

const fetchElevesParClasseMaternelle = async () => {
  try{
    const res = await api.get(`/eleves/listeChaqueClassePrimaire`);
    setElevesMaternelle(res.data);
    console.log("Élèves par classe de maternelle:", res.data);
  } catch (err) {
    console.error("Erreur lors de la récupération des élèves par classe:", err);
    setError('Erreur lors du chargement des élèves par classe de maternelle');
  }
}

// Fonction pour récupérer les élèves depuis l'API
const fetchEleves = async () => {
  try {
    const res = await api.get(`/elevesP`);
    
    // Accès sécurisé aux données avec vérifications
    const elevesData = res.data?.data?.par_classe?.[""] || [];
    const eleveseffectifTotal = res.data?.data?.total_eleves || 0;

    setElevesET(eleveseffectifTotal);
    setEleves(elevesData);
    console.log("Élèves chargés:", elevesData);
  } catch (err) {
    console.error("Erreur détaillée:", err.response?.data || err.message);
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
      const res = await api.post(`/matieres/store`, { nom: newMatiere }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });       
      
      setMatieres([...matieres, res.data]);
      setNewMatiere('');
      setError('');
      setMessage('Matière ajoutée avec succès');
      setLoading(false);
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Erreur lors de l'ajout";
      const errorDetails = err.response?.data?.errors || err.response?.data?.error || err.message;
      setMessage(`${errorMessage}: ${JSON.stringify(errorDetails)}`);
      console.error('Erreur détaillée:', err.response?.data || err.message);
      setLoading(false);
    }
  };
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
            const res = await api.post(`/classes/store`, {
                nom_classe: newClassName,
                categorie_classe: newClassCategory,
            }, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            setClasses([...classes, res.data]);
            setNewnom_classe('');
            setNewcategorie_classe('');
            setError('');
            setLoading(false);
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
      setLoading(false);
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
      await fetchMatieres();
      setMessage('Classe modifiée avec succès');      
      setEditingId(null);
      setEditValue('');
      setError('');
      setLoading(false);
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
      fetchMatieres();
      setMessage('Matière supprimée avec succès');
      setLoading(false);
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
      fetchMatieres();
      setMessage('Classe supprimée avec succès');
      setLoading(false);
    } catch (err) {
      setError('Erreur lors de la suppression');
      setLoading(false);
    }
  };

  const handleAddNote = async () => {
  try {
    setLoading(true);
    const res = await api.post(`/notes`, newNote);
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


const fetchStudentData = async () => {
  try {
    const res = await api.get(`/stats/effectifs-primaire`);
    setStudentData(res.data);
  } catch (err) {
    console.error('Erreur lors du chargement des effectifs:', err);
  }
};

const fetchGradeData = async () => {
  try {
    const res = await api.get(`/stats/repartition-notes-primaire`);
    setGradeData(res.data);
  } catch (err) {
    console.error('Erreur lors du chargement des notes:', err);
  }
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


// Regroupe les élèves par nom de classe
const groupElevesByClasse = (eleves) => {
  if (!Array.isArray(eleves)) return {};
  return eleves.reduce((acc, eleve) => {
    const classeNom = eleve.classe?.nom_classe || 'Classe inconnue';
    if (!acc[classeNom]) acc[classeNom] = [];
    acc[classeNom].push(eleve);
    return acc;
  }, {});
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
            className={`sidebar-item ${activeTab === 'notes' ? 'active' : ''}`} 
            onClick={() => setActiveTab('notes')}
          >
            <ClipboardList size={20} />
            {sidebarOpen && <span className="sidebar-item-text">Notes</span>}
          </div>
          
          <div 
            className={`sidebar-item ${activeTab === 'LiaisonMatieresAvecCoefficientEtSerieClasses' ? 'active' : ''}`} 
            onClick={() => setActiveTab('LiaisonMatieresAvecCoefficientEtSerieClasses')}
          >
            <Calendar size={20} />
            {sidebarOpen && <span className="sidebar-item-text">Lier Matieres Classes</span>}
          </div>

          <div 
            className={`sidebar-item ${activeTab === 'enseignantsauxclasses' ? 'active' : ''}`} 
            onClick={() => setActiveTab('enseignantsauxclasses')}
          >
            <Calendar size={20} />
            {sidebarOpen && <span className="sidebar-item-text">Lier enseignant classes</span>}
          </div>
          <div 
            className={`sidebar-item ${activeTab === 'Types' ? 'active' : ''}`} 
            onClick={() => setActiveTab('Types')}
          >
            <User size={20} />
            {sidebarOpen && <span className="sidebar-item-text">Types d'evaluation</span>}
          </div>
          <div 
            className={`sidebar-item ${activeTab === 'LiaisonClassesPeriodeTypesEvaluation' ? 'active' : ''}`} 
            onClick={() => setActiveTab('LiaisonClassesPeriodeTypesEvaluation')}
          >
            <Settings size={20} />
            {sidebarOpen && <span className="sidebar-item-text">Liaison des Classes aux evaluations</span>}
          </div>
          <div className="sidebar-logout">
                      <LogOut size={20} />
                      <button
                        className="profile-menu-item"
                        style={{ width: '100%', padding: '8px', border: 'none', background: 'none', textAlign: 'left', cursor: 'pointer' }}
                        onClick={() => {
                          setShowProfileMenu(false);
                          // Déconnexion : efface le token/session et redirige
                          localStorage.clear();
                          window.location.href = '/connexion';
                        }}
                      >
                        Déconnexion
                      </button>
                      
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
              <button 
                onClick={() => setShowNotifications(!showNotifications)} 
                className="notifications-button"
              >
                <Bell size={20} />
                <span className="notification-badge">4</span>
              </button>
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
            <div className="profile-container" style={{ position: 'relative' }}>
              <img
                src="/api/placeholder/40/40"
                alt="Profile"
                className="profile-image"
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                style={{ cursor: 'pointer' }}
              />
              <span className="profile-name"></span>
              {showProfileMenu && (
                <div className="profile-menu" style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  background: '#fff',
                  border: '1px solid #ddd',
                  borderRadius: 4,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  zIndex: 10,
                  minWidth: 140
                }}>
                  <button
                    className="profile-menu-item"
                    style={{ width: '100%', padding: '8px', border: 'none', background: 'none', textAlign: 'left', cursor: 'pointer' }}
                    onClick={() => {
                      setShowProfileMenu(false);
                      setActiveTab('profil'); // ou navigate('/profil') si tu utilises react-router
                    }}
                  >
                    Profil
                  </button>
                  <button
                    className="profile-menu-item"
                    style={{ width: '100%', padding: '8px', border: 'none', background: 'none', textAlign: 'left', cursor: 'pointer' }}
                    onClick={() => {
                      setShowProfileMenu(false);
                      // Déconnexion : efface le token/session et redirige
                      localStorage.clear();
                      window.location.href = '/connexion';
                    }}
                  >
                    Déconnexion
                  </button>
                </div>
              )}
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
                  <p className="stat-value">{elevesET}</p>
                </div>
                
                <div className="stat-card">
                  <h3 className="stat-title">Enseignants du Primaire</h3>
                  <p className="stat-value">{effectifE}</p>
                  <p className="stat-trend neutral">Stable depuis le mois dernier</p>
                </div>
                <div className="stat-card">
                  <h3 className="stat-title">Classes</h3>
                  <p className="stat-value">{effectif}</p>
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

          {activeTab === 'élèves' && (
            <div className="eleves-container">  
              <h2 className="section-title">Gestion des Élèves</h2>
              <div className="eleves-list">
                <div className="list-header">
                  <h2 className="list-title">Liste des Élèves</h2>
                  <button
                    onClick={fetchElevesParClasseMaternelle}
                    disabled={loading}
                    className="btn btn-secondary refresh-button"  
                  >
                    <RefreshCcw size={16} />
                    Rafraîchir
                  </button>
                </div>
                {error && <div className="error-message">{error}</div>}
                {message && <div className="success-message">{message}</div>}
                {loading ? (
                  <div className="empty-state">
                    Chargement des élèves...
                  </div>
                ) : !Array.isArray(elevesMaternelle.data) ? (
                  <div className="empty-state error">
                    Erreur: Impossible de charger les élèves
                  </div>
                ) : elevesMaternelle.data.length === 0 ? (
                  <div className="empty-state">
                    Aucun élève trouvé. Ajoutez-en un ci-dessus.
                  </div>
                ) : (
                  // Regroupement par classe
                  Object.entries(groupElevesByClasse(elevesMaternelle.data)).map(([classeNom, eleves]) => (
                    <div key={classeNom} className="classe-group">
                      <h2 className="classe-title">{classeNom}</h2>
                      <div className="eleves-items">
                        {eleves.map((eleve) => (
                          <div key={eleve.id} className="eleve-item">
                            <div className="eleve-content">
                              <div className="eleve-details">
                                <div className="eleve-display">
                                  <div className="eleve-info">
                                    <h3 className="eleve-name">{eleve.nom} {eleve.prenom}</h3>
                                    <p className="eleve-id">ID: {eleve.id}</p>
                                    <p className="eleve-serie">Série : {eleve.serie?.nom}</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
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
                          
                          {loading && !Array.isArray(matieres) ? (
                            <div className="empty-state">
                              Chargement des matières...
                            </div>
                          ) : !Array.isArray(matieres) ? (
                            <div className="empty-state error">
                              Erreur: Impossible de charger les matières
                            </div>
                          ) : matieres.length === 0 ? (
                            <div className="empty-state">
                              Aucune matière trouvée. Ajoutez-en une ci-dessus.
                            </div>
                          ) : (
                            <div className="matieres-items">
                              {matieres.map((matiere) => (
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
                            const classe = classesS.find(c => c.id == importData.classe_id);
                            console.log(classesS)
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
                      <select
                        name="type_evaluation"
                        value={importData.type_evaluation}
                        onChange={handleImportChange}
                        className="form-input"
                        required
                      >
                        <option value="">Sélectionner un type</option>
                        <option value="1ère évaluation">1ère évaluation</option>
                        <option value="2ème évaluation">2ème évaluation</option>
                        <option value="3ème évaluation">3ème évaluation </option>
                        <option value="4ème évaluation">4ème évaluation </option>
                        <option value="5ème évaluation">5ème évaluation </option>
                      </select>
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
                        <option value="1ère evaluation">1ère evaluation</option>
                        <option value="2ème evaluation">2ème evaluation</option>
                        <option value="3ème evaluation">3ème evaluation</option>
                        <option value="4ème evaluation">4ème evaluation</option>
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
                          console.log('ID classe de l\'élève:', selectedEleve.classe.id);
                          console.log('Classes disponibles:', classes);
                          
                          // Trouver la classe correspondante
                          const classeCorrespondante = classes.find(c => c.id == selectedEleve.classe.id);
                          console.log('Classe trouvée:', classeCorrespondante);
                          
                          // Mettre à jour la classe avec l'ID correct
                          handleNoteChange({
                            target: {
                              name: 'classe_id',
                              value: selectedEleve.classe.id
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
                        const eleveClasse = classes.find(c => c.id == selectedEleve.classe.id);
                        console.log('Classe de l\'élève:', eleveClasse);
                        if (!eleveClasse) return null;
                        
                        // Trouver la série de la classe
                        const serie = series.find(s => s.id == selectedEleve.serie.id);
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
                    <select
                      type="text"
                      name="type_evaluation"
                      value={newNote.type_evaluation}
                      onChange={handleNoteChange}
                      className="form-input"
                      >
                          <option value="">Sélectionner un type</option>
                          <option value="1ère evaluation">1ère évaluation</option>
                          <option value="2ème evaluation">2ème évaluation</option>
                          <option value="3ème evaluation">3ème évaluation </option>
                          <option value="4ème evaluation">4ème évaluation </option>
                          <option value="5ème evaluation">5ème évaluation </option>
                    </select>
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
                
                <div className="input-field">
                    <select
                      type="text"
                      name=""
                      value={newClassCategory}
                      onChange={(e) => setNewClassCategory(e.target.value)}
                      
                      >
                          <option value="">Sélectionner une categorie</option>
                          <option value="primaire">Primaire</option>
                    </select>
                </div>
                
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
              
              {loading && classesList.length === 0 ? (
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
                            classe.nom
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
                            classe.categorie
                          )}
                        </td>
                        <td>{classe.effectif}</td>
                        <td>{classe.enseignants.map(e =>(
                            <p key={e.id} className="">{e.nom} {e.prenom}</p>
                        ) )}</td>
                        
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


          {activeTab === 'LiaisonMatieresAvecCoefficientEtSerieClasses' && (
            <LierMatieresauxClasses />
          )}

        
          {activeTab === 'enseignantsauxclasses' && (
            <LierEnseignantsAuxMatieres/>
          )}

          {activeTab === 'Types' && (
            <TypeEvas2/>
          )}

          {activeTab === 'LiaisonClassesPeriodeTypesEvaluation' && (
            <LierTypeClassePeriode/>
          )}

          {(activeTab !== 'aperçu' && activeTab !== 'élèves' && activeTab !== 'classes' && activeTab !== 'matieres' && activeTab !== 'LiaisonSeriesClass'  && activeTab !== 'LiaisonMatieresAvecCoefficientEtSerieClasses' && activeTab !== 'notes' && activeTab !== 'enseignantsauxclasses') && (
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
          api.get(`/classesP?with_series=true&with_matieres=true`),
          api.get(`/with-series-matieresPrimaire`),
          api.get(`/matieres-with-series`),
          api.get(`/matieres`),
          api.get(`/series`),
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
        `/with-series-matieres`
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

    // Vérifier si c'est une classe du secondaire
    const classesSecondaire = ['2nde', 'seconde', '1ère', 'première', 'terminale', 'tle'];
    if (classesSecondaire.some(niveau => classeNom.includes(niveau))) {
        return series;
    }

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

    // Filtrer les séries selon le niveau
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
                  <h3>Classe: {classe.nom}</h3> 
                  
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
  const [classesS, setClassesS] = useState([]);
  const [error, setError] = useState(null);

  // Charger les données initiales
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [classesRes, matieresRes, enseignantsRes, seriesRes] = await Promise.all([
          api.get(`/classesP?with_series=true&with_matieres=true&with_enseignants=true`),
          api.get(`/matieres`),
          api.get(`/enseignants/MP`),
          
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

  //// Fonction pour récupérer les classes avec leurs séries
  const fetchClassesSeries = async () => {
  try {
    setLoading(true);
    const res = await api.get(`/classes-with-series`);
    console.log('Données reçues de l\'API:', res.data); 
    setClassesS(res.data); //  Vous utilisez setClasses, pas setSeries
    console.log("Classes avec séries:", res.data);
    setLoading(false);
  } catch (err) {
    console.error(err);
    setError('Erreur lors du chargement des séries');
    setLoading(false);
  }
  };

  useEffect(() =>{
    fetchClassesSeries();
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
          
          const classesData = response.data;
          setSelectedMatieres(classesData.map(classe => classe.id));
          
          // Initialiser les enseignants par matière
          const enseignantsData = {};
          classesData.forEach(classe => {
            enseignantsData[classe.id] = classe.enseignants?.map(e => e.id) || [];
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

    const handleEnseignantChange = (classeId, enseignantId) => {
      setEnseignantsParMatiere(prev => ({
        ...prev,
        [classeId]: [...(prev[classeId] || []), enseignantId]
      }));
    };

    const handleRemoveEnseignant = (classeId, enseignantId) => {
      setEnseignantsParMatiere(prev => ({
        ...prev,
        [classeId]: (prev[classeId] || []).filter(id => id !== enseignantId)
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
        const classesData = [
          {
            classe_id: selectedClass,
            enseignants: enseignantsParMatiere[selectedClass] || []
          }
        ];

          const response = await api.put(
            `/classes/${selectedClass}/enseignantsMP`,
            { classes: classesData }
          );

        
        
        if (response.data.success) {
          // Rafraîchir les données
          const classesRes = await api.get(
            `/classesP?with_series=true&with_matieres=true&with_enseignants=true`
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
    const classe = classesS.find(c => c.id == selectedClass);
    return classe && Array.isArray(classe.series) ? classe.series : [];
  };

    // Obtenir les enseignants qui enseignent une matière spécifique
    const getEnseignantsForClasse = (classeId) => {
      return enseignants.filter(enseignant => 
        enseignant.classe_id == classeId
      );
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

            {selectedClass && (
              <div className="form-group">
                <label>Enseignants pour cette classe</label>
                <div className="enseignants-selection">
                  {enseignants.map(enseignant => (
                    <div key={enseignant.id} className="enseignant-item">
                      <input
                        type="checkbox"
                        checked={(enseignantsParMatiere[selectedClass] || []).includes(enseignant.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setEnseignantsParMatiere(prev => ({
                              ...prev,
                              [selectedClass]: [...(prev[selectedClass] || []), enseignant.id]
                            }));
                          } else {
                            setEnseignantsParMatiere(prev => ({
                              ...prev,
                              [selectedClass]: (prev[selectedClass] || []).filter(id => id !== enseignant.id)
                            }));
                          }
                        }}
                        disabled={loading}
                      />
                      <label>
                        {enseignant.nom} {enseignant.prenom}
                      </label>
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
          <h2>Enseignants par matière/série/classe</h2>
          
          {classesWithData.length === 0 ? (
            <p>Aucune donnée disponible</p>
          ) : (
            <div className="classes-list">
              {classesWithData.map(classe => (
                <div key={classe.id} className="class-item">
                  <h3>{classe.nom_classe}</h3>
                  {Array.isArray(classe.enseignants_m_p) && classe.enseignants_m_p.length > 0 ? (
                    <ul>
                      {classe.enseignants_m_p.map(ens => (
                        <li key={ens.id}>{ens.nom} {ens.prenom}</li>
                      ))}
                    </ul>
                  ) : (
                    <p>Aucun enseignant associé</p>
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

const TypeEvas2 = () => {
  const [newTypeName, setNewTypeName] = useState('');
  const [newDebutDName, setNewDebutDName] = useState('');
  const [newDebutFName, setNewDebutFName] = useState('');
  const [newPeriodeName, setNewPeriodeName] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [types, setTypes] = useState([]);
  const [periodes, setPeriodes] = useState([]);
  const [showAllTypes, setShowAllTypes] = useState(false);
  const [showAllPeriodes, setShowAllPeriodes] = useState(false);

  // Charger les types et périodes au montage ou après ajout
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [typesRes, periodesRes] = await Promise.all([
          api.get(`/types`),
          api.get(`/periodes`),
        ]);
        setTypes(typesRes.data);
        setPeriodes(periodesRes.data);
      } catch (err) {
        setError("Erreur lors du chargement des types ou périodes");
      }
    };
    fetchData();
  }, []);

  const AjouterType = async () => {
    if (!newTypeName.trim()) {
      setError("Le nom de l'évaluation ne peut pas être vide");
      return;
    }
    try {
      setLoading(true);
      setError('');
      await api.post(`/types/store`, {
        nom: newTypeName,
      }, {
        headers: { 'Content-Type': 'application/json' }
      });
      setNewTypeName('');
      setMessage("Type d'évaluation ajouté !");
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Erreur lors de l'ajout";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const AjouterPeriode = async () => {
    if (!newPeriodeName.trim()) {
      setError("Le nom de la période ne peut pas être vide");
      return;
    }
    if (!newDebutDName || !newDebutFName) {
      setError("Les dates de début et de fin ne peuvent pas être vides");
      return;
    }
    if (newDebutDName > newDebutFName) {
      setError("La date de début ne peut pas être postérieure à la date de fin");
      return;
    }
    try {
      setLoading(true);
      setError('');
      await api.post(`/periodes/store`, {
        nom: newPeriodeName,
        date_debut: newDebutDName,
        date_fin: newDebutFName,
      }, {
        headers: { 'Content-Type': 'application/json' }
      });
      setNewPeriodeName('');
      setNewDebutDName('');
      setNewDebutFName('');
      setMessage("Période ajoutée !");
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Erreur lors de l'ajout";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {error && <div style={{ color: 'red', marginBottom: 8 }}>{error}</div>}
      {message && <div style={{ color: 'green', marginBottom: 8 }}>{message}</div>}

      <div className="add-form">
        <h2 className="form-title">Ajouter un nouveau type d'évaluation</h2>
        <div className="form-controls">
          <input
            type="text"
            value={newTypeName}
            onChange={(e) => setNewTypeName(e.target.value)}
            placeholder="Nom du type d'évaluation"
            className="input-field"
          />
          <button
            onClick={AjouterType}
            disabled={loading}
            className="btn btn-primary"
          >
            <Plus size={18} />
            Ajouter
          </button>
        </div>
      </div>

      {/* Liste des types d'évaluation */}
      <div className="list-section">
        <h3>Types d'évaluation</h3>
        <ul>
          {(showAllTypes ? types : types.slice(0, 3)).map(type => (
            <li key={type.id}>{type.nom}</li>
          ))}
        </ul>
        {types.length > 3 && (
          <button
            className="btn btn-link"
            onClick={() => setShowAllTypes(v => !v)}
          >
            {showAllTypes ? 'Réduire' : 'Voir plus'}
          </button>
        )}
      </div>

      <div className="add-form">
        <h2 className="form-title">Ajouter une nouvelle période</h2>
        <div className="form-controls">
          <input
            type="text"
            value={newPeriodeName}
            onChange={(e) => setNewPeriodeName(e.target.value)}
            placeholder="Nom de la période"
            className="input-field"
          />
          <input
            type="date"
            value={newDebutDName}
            onChange={(e) => setNewDebutDName(e.target.value)}
            className="input-field"
          />
          <input
            type="date"
            value={newDebutFName}
            onChange={(e) => setNewDebutFName(e.target.value)}
            className="input-field"
          />
          <button
            onClick={AjouterPeriode}
            disabled={loading}
            className="btn btn-primary"
          >
            <Plus size={18} />
            Ajouter
          </button>
        </div>
      </div>

      {/* Liste des périodes */}
      <div className="list-section">
        <h3>Périodes</h3>
        <ul>
          {(showAllPeriodes ? periodes : periodes.slice(0, 3)).map(periode => (
            <li key={periode.id}>
              {periode.nom} ({periode.date_debut} - {periode.date_fin})
            </li>
          ))}
        </ul>
        {periodes.length > 3 && (
          <button
            className="btn btn-link"
            onClick={() => setShowAllPeriodes(v => !v)}
          >
            {showAllPeriodes ? 'Réduire' : 'Voir plus'}
          </button>
        )}
      </div>
    </div>
  );
};


/*const LierTypeClassePeriode = () => {
  const [classes, setClasses] = useState([]);
  const [periodes, setPeriodes] = useState([]);
  const [types, setTypes] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedPeriode, setSelectedPeriode] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [liaisons, setLiaisons] = useState([]);

  // Charger les données initiales
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [classesRes, periodesRes, typesRes, liaisonsRes] = await Promise.all([
          api.get(`/classesP'),
          api.get(`/periodes'),
          api.get(`/types'),
          api.get(`/typeevaluationETclasseP'),
        ]);
        setClasses(classesRes.data);
        setPeriodes(periodesRes.data);
        setTypes(typesRes.data);
        setLiaisons(liaisonsRes.data);
        setMessage({ text: '', type: '' });
      } catch (error) {
        setMessage({ text: 'Erreur lors du chargement des données', type: 'error' });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedClass || !selectedPeriode || !selectedType) {
      setMessage({ text: 'Veuillez sélectionner une classe, une période et un type', type: 'error' });
      return;
    }
    try {
      setLoading(true);
      await api.post(`/typeevaluation-classe/attach', {
        classe_id: selectedClass,
        periode_id: selectedPeriode,
        typeevaluation_id: selectedType,
      });
      setMessage({ text: 'Liaison ajoutée avec succès', type: 'success' });
    } catch (error) {
      setMessage({ text: error.response?.data?.message || 'Erreur lors de la liaison', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Afficher les liaisons existantes
  const filteredLiaisons = liaisons.filter(liaison =>
    (!selectedClass || liaison.classe_id == selectedClass)
  );

  return (
    <div className="link-type-classe-periode-container">
      <h1 className="section-title">Lier Classe, Période et Type d'évaluation</h1>
      {message.text && (
        <div className={`message ${message.type === 'error' ? 'error-message' : 'success-message'}`}>
          {message.text}
          <button className="message-close" onClick={() => setMessage({ text: '', type: '' })}>×</button>
        </div>
      )}

      <div className="form-grid">
        <div className="form-card">
          <h2 className="form-title">Créer une liaison</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Classe</label>
              <select
                value={selectedClass}
                onChange={e => { setSelectedClass(e.target.value); }}
                disabled={loading}
              >
                <option value="">Sélectionnez une classe</option>
                {classes.map(classe => (
                  <option key={classe.id} value={classe.id}>{classe.nom_classe}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Période</label>
              <select
                value={selectedPeriode}
                onChange={e => setSelectedPeriode(e.target.value)}
                disabled={loading}
              >
                <option value="">Sélectionnez une période</option>
                {periodes.map(periode => (
                  <option key={periode.id} value={periode.id}>
                    {periode.nom} ({periode.date_debut} - {periode.date_fin})
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Type d'évaluation</label>
              <select
                value={selectedType}
                onChange={e => setSelectedType(e.target.value)}
                disabled={loading}
              >
                <option value="">Sélectionnez un type</option>
                {types.map(type => (
                  <option key={type.id} value={type.id}>{type.nom}</option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              disabled={loading || !selectedClass || !selectedPeriode || !selectedType}
              className="submit-button"
            >
              {loading ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </form>
        </div>

        <div className="relationships-card">
          <h2>Liaisons existantes</h2>
          {filteredLiaisons.length === 0 ? (
            <p>Aucune liaison trouvée</p>
          ) : (
            <table className="liaisons-table">
              <thead>
                <tr>
                  <th>Classe</th>
                  <th>Période</th>
                  <th>Type d'évaluation</th>
                </tr>
              </thead>
              <tbody>
                {filteredLiaisons.map(liaison => (
                  <tr key={liaison.id || `${liaison.classe_id}-${liaison.periode_id}-${liaison.typeevaluation_id}`}>
                    <td>{classes.find(c => c.id == liaison.classe_id)?.nom_classe || liaison.classe_id}</td>
                    <td>{periodes.find(p => p.id == liaison.periode_id)?.nom || liaison.periode_id}</td>
                    <td>{types.find(t => t.id == liaison.typeevaluation_id)?.nom || liaison.typeevaluation_id}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};*/


const LierTypeClassePeriode = () => {
  const [classes, setClasses] = useState([]);
  const [periodes, setPeriodes] = useState([]);
  const [types, setTypes] = useState([]);
  const [classesWithSeries, setClassesWithSeries] = useState([]);
  const [liaisons, setLiaisons] = useState([]);
  const [editingLiaison, setEditingLiaison] = useState(null);

  // États pour les sélections
  const [selectedClasses, setSelectedClasses] = useState([]);
  const [selectedPeriodes, setSelectedPeriodes] = useState([]);
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [selectedSeries, setSelectedSeries] = useState({});

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  // Gestionnaire générique pour les cases à cocher
  const handleCheckboxChange = (setter, currentSelection, id) => {
    setter(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Gestionnaire spécifique pour les classes
  const handleClassCheckboxChange = (id) => {
    setSelectedClasses(prev => {
      const newSelection = prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id];
      if (!newSelection.includes(id)) {
        setSelectedSeries(prevSeries => {
          const newSeries = { ...prevSeries };
          delete newSeries[id];
          return newSeries;
        });
      }
      return newSelection;
    });
  };

  // Gestionnaire spécifique pour les séries
  const handleSeriesCheckboxChange = (classId, serieId) => {
    setSelectedSeries(prev => {
      const currentSeriesForClass = prev[classId] || [];
      const newSeriesForClass = currentSeriesForClass.includes(serieId)
        ? currentSeriesForClass.filter(item => item !== serieId)
        : [...currentSeriesForClass, serieId];
      return {
        ...prev,
        [classId]: newSeriesForClass,
      };
    });
  };

  // Charger les données initiales
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [classesRes, periodesRes, typesRes, liaisonsRes, classesSeriesRes] = await Promise.all([
          api.get(`/classesP?with_series=true`),
          api.get(`/periodes`),
          api.get(`/types`),
          api.get(`/typeevaluationETclasseP`),
          api.get(`/classes-with-series`),
        ]);

        setClasses(classesRes.data);
        setPeriodes(periodesRes.data);
        setTypes(typesRes.data);
        setLiaisons(liaisonsRes.data);
        setClassesWithSeries(classesSeriesRes.data);
      } catch (error) {
        setMessage({ text: 'Erreur lors du chargement des données', type: 'error' });
        console.error("Erreur:", error.response?.data || error.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Gérer la suppression d'une liaison
  const handleDeleteLiaison = async (liaisonId) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cette liaison ?")) return;

    try {
      setLoading(true);
      await api.delete(`/typeevaluation-classe/${liaisonId}`);
      
      setMessage({ text: 'Liaison supprimée avec succès', type: 'success' });
      const liaisonsRes = await api.get(`/typeevaluationETclasseP`);
      setLiaisons(liaisonsRes.data);
    } catch (error) {
      setMessage({ 
        text: error.response?.data?.message || 'Erreur lors de la suppression', 
        type: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  // Préparer l'édition d'une liaison
  const handleEditLiaison = (liaison) => {
    setEditingLiaison(liaison);
    setSelectedPeriodes([liaison.periode_id]);
    setSelectedTypes([liaison.typeevaluation_id]);
    setSelectedClasses([liaison.classe_id]);
    
    if (liaison.serie_id) {
      setSelectedSeries({
        [liaison.classe_id]: [liaison.serie_id]
      });
    }
  };

  // Annuler l'édition
  const cancelEdit = () => {
    setEditingLiaison(null);
    setSelectedClasses([]);
    setSelectedPeriodes([]);
    setSelectedTypes([]);
    setSelectedSeries({});
  };

  // Soumettre le formulaire
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (selectedPeriodes.length === 0 || selectedTypes.length === 0 || selectedClasses.length === 0) {
      setMessage({ text: 'Veuillez sélectionner au moins une période, un type et une classe.', type: 'error' });
      return;
    }

    const liaisonsToCreate = [];

    for (const classId of selectedClasses) {
      const seriesForClass = selectedSeries[classId] || [];

      if (seriesForClass.length === 0) {
        for (const periodeId of selectedPeriodes) {
          for (const typeId of selectedTypes) {
            liaisonsToCreate.push({
              classe_id: classId,
              periode_id: periodeId,
              typeevaluation_id: typeId,
              serie_id: null,
            });
          }
        }
      } else {
        for (const serieId of seriesForClass) {
          for (const periodeId of selectedPeriodes) {
            for (const typeId of selectedTypes) {
              liaisonsToCreate.push({
                classe_id: classId,
                serie_id: serieId,
                periode_id: periodeId,
                typeevaluation_id: typeId,
              });
            }
          }
        }
      }
    }

    try {
      setLoading(true);
      
      if (editingLiaison) {
        await api.put(`/typeevaluation-classe/${editingLiaison.id}`, liaisonsToCreate[0]);
        setMessage({ text: 'Liaison mise à jour avec succès', type: 'success' });
      } else {
        await api.post(`/typeevaluation-classe/attach-multiple`, {
          liaisons: liaisonsToCreate,
        });
        setMessage({ text: 'Liaisons ajoutées avec succès', type: 'success' });
      }

      const liaisonsRes = await api.get(`/typeevaluationETclasseP`);
      setLiaisons(liaisonsRes.data);
      cancelEdit();
    } catch (error) {
      setMessage({ text: error.response?.data?.message || 'Erreur lors de la liaison', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Organiser les liaisons pour l'affichage
  const getOrganizedLiaisons = () => {
    const organized = {};

    // Vérifier que liaisons est un tableau
    if (!Array.isArray(liaisons)) {
      console.error("Les liaisons ne sont pas un tableau:", liaisons);
      return organized;
    }

    // Initialiser avec les classes
    classes.forEach(classe => {
      organized[classe.id] = {
        nom: classe.nom_classe,
        periodes: {}
      };
    });

    // Initialiser avec les périodes
    periodes.forEach(periode => {
      Object.values(organized).forEach(classe => {
        classe.periodes[periode.id] = {
          nom: periode.nom,
          date_debut: periode.date_debut,
          date_fin: periode.date_fin,
          types: []
        };
      });
    });

    // Ajouter les liaisons existantes
    liaisons.forEach(classeData => {
      if (!classeData || !classeData.liaisons) return;

      classeData.liaisons.forEach(liaison => {
        if (organized[classeData.id]?.periodes[liaison.periode_id]) {
          const typeExists = organized[classeData.id].periodes[liaison.periode_id].types.some(
            t => t.id === liaison.typeevaluation_id
          );
          
          if (!typeExists) {
            const type = types.find(t => t.id === liaison.typeevaluation_id);
            if (type) {
              organized[classeData.id].periodes[liaison.periode_id].types.push({
                id: type.id,
                nom: type.nom,
                liaisonId: liaison.id,
                serieId: liaison.serie_id,
                serieNom: liaison.serie_nom || 'Général'
              });
            }
          }
        }
      });
    });

    return organized;
  };

  const organizedLiaisons = getOrganizedLiaisons();

  return (
    <div className="link-type-classe-periode-container">
      <div className="form-card">
        <h2>{editingLiaison ? 'Modifier une liaison' : 'Créer une liaison'}</h2>
        
        {message.text && (
          <div className={`message ${message.type}`}>{message.text}</div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Périodes */}
          <div className="form-group">
            <label>Période(s)</label>
            <div className="checkbox-group">
              {periodes.map(periode => (
                <label key={periode.id}>
                  <input
                    type="checkbox"
                    checked={selectedPeriodes.includes(periode.id)}
                    onChange={() => handleCheckboxChange(setSelectedPeriodes, selectedPeriodes, periode.id)}
                  />
                  {periode.nom} ({periode.date_debut} - {periode.date_fin})
                </label>
              ))}
            </div>
          </div>

          {/* Types d'évaluation */}
          <div className="form-group">
            <label>Type(s) d'évaluation</label>
            <div className="checkbox-group">
              {types.map(type => (
                <label key={type.id}>
                  <input
                    type="checkbox"
                    checked={selectedTypes.includes(type.id)}
                    onChange={() => handleCheckboxChange(setSelectedTypes, selectedTypes, type.id)}
                  />
                  {type.nom}
                </label>
              ))}
            </div>
          </div>

          {/* Classes */}
          <div className="form-group">
            <label>Classe(s)</label>
            <div className="checkbox-group">
              {classes.map(classe => (
                <label key={classe.id}>
                  <input
                    type="checkbox"
                    checked={selectedClasses.includes(classe.id)}
                    onChange={() => handleClassCheckboxChange(classe.id)}
                  />
                  {classe.nom_classe}
                </label>
              ))}
            </div>
          </div>

          {/* Séries */}
          {selectedClasses.length > 0 && (
            <div className="form-group">
              <label>Série(s) par Classe</label>
              {selectedClasses.map(classId => {
                const classe = classesWithSeries.find(c => c.id == classId);
                if (!classe?.series?.length) return null;
                
                return (
                  <div key={`series-${classId}`} className="series-group">
                    <h4>{classe.nom_classe}</h4>
                    {classe.series.map(serie => (
                      <label key={serie.id}>
                        <input
                          type="checkbox"
                          checked={(selectedSeries[classId] || []).includes(serie.id)}
                          onChange={() => handleSeriesCheckboxChange(classId, serie.id)}
                        />
                        {serie.nom}
                      </label>
                    ))}
                  </div>
                );
              })}
            </div>
          )}

          <div className="form-actions">
            <button type="submit" disabled={loading}>
              {loading ? 'Enregistrement...' : editingLiaison ? 'Mettre à jour' : 'Enregistrer'}
            </button>
            {editingLiaison && (
              <button type="button" onClick={cancelEdit}>Annuler</button>
            )}
          </div>
        </form>
      </div>

      <div className="relationships-card">
        <h2>Liaisons existantes</h2>
        
        {loading ? (
          <p>Chargement...</p>
        ) : Object.keys(organizedLiaisons).length === 0 ? (
          <p>Aucune liaison trouvée</p>
        ) : (
          <div className="classes-accordion">
            {Object.entries(organizedLiaisons).map(([classId, classeData]) => (
              <div key={`class-${classId}`} className="class-group">
                <h3>{classeData.nom}</h3>
                
                {Object.entries(classeData.periodes)
                  .filter(([_, periodeData]) => periodeData.types.length > 0)
                  .map(([periodeId, periodeData]) => (
                    <div key={`periode-${periodeId}`} className="periode-group">
                      <h4>{periodeData.nom} ({periodeData.date_debut} - {periodeData.date_fin})</h4>
                      
                      <table className="liaisons-table">
                        <thead>
                          <tr>
                            <th>Type</th>
                            <th>Série</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {periodeData.types.map(type => (
                            <tr key={`type-${type.id}-${periodeId}`}>
                              <td>{type.nom}</td>
                              <td>{type.serieNom}</td>
                              <td>
                                <button onClick={() => handleEditLiaison({
                                  id: type.liaisonId,
                                  classe_id: parseInt(classId),
                                  periode_id: parseInt(periodeId),
                                  typeevaluation_id: type.id,
                                  serie_id: type.serieId
                                })}>
                                  Modifier
                                </button>
                                <button onClick={() => handleDeleteLiaison(type.liaisonId)}>
                                  Supprimer
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
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

