import React, { useState, useEffect } from 'react';
import { PieChart, Pie, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { Edit2, Trash2, Save, RefreshCcw, X, Plus, Menu, Home, Users, Book, User, Settings, LogOut, Bell, Calendar, ChevronDown, ChevronUp, ClipboardList } from 'lucide-react';
import api from '../api';
import axios from 'axios';
import './Mes_CSS_directeur/dashboard_directeur.css';
import { NavLink } from 'react-router-dom';
import * as XLSX from 'xlsx';
import * as pdfjsLib from 'pdfjs-dist';
import { Page, Text, View, Document, StyleSheet, PDFViewer, PDFDownloadLink, Image } from '@react-pdf/renderer';
import jsPDF from 'jspdf';
import 'jspdf-autotable';




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

export default function DashboardS() {
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
  const [elevesMaternelle, setElevesMaternelle] = useState([]);
  const [serieSeules, setSereSeules] = useState([]);
  const [previewData, setPreviewData] = useState([]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [classes1, setClasses1]= useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('aperçu');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
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
  const [studentData, setStudentData] = useState([]);
  const [gradeData, setGradeData] = useState([]);
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

const effectifES = async () => {
  try{
    setLoading(true);
    const res = await api.get(`/enseignants/effectif/secondaire`);
    setEffectifE(res.data);  
  }catch (err){
    console.err(err);
    setError("erreur lors du chargement des enseignants du primaire");
    setLoading(false);
  }
}

const effectifS = async () => {
  try{
    setLoading(true);
    const res = await  api.get(`/classes/effectif/secondaire`);
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
        api.get(`/matieres-with-series`),
        api.get(`/series`)
      ])

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
    let url = `/notes/filterS?`;
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
    effectifS ();
    effectifES();
    applyFilters(); // Charger les classes avec leurs séries
    fetchClassesAvecEffectifMaternelle();
    fetchElevesParClasseMaternelle();
    fetchStudentData();
    fetchGradeData();
    fetchClassesSeries();
    
}, []);


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
            [name]: value,
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


// Fonction  pour récupérer les matières depuis l'API
const fetchMatieres = async () => {
  try {
    setLoading(true);
    const res = await api.get(`/matieresS`);
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
      const res = await api.get(`/classesS`);
      setClasses(res.data);
    } catch (err) {
      console.error(err);
      setError('Erreur lors du chargement des classes');
    }
  };

//Fonction pour recuperer les classes avec leur effectif et categorie
const fetchClassesAvecEffectifMaternelle = async () => {
  const res = await api.get(`/classes/effectifParClassedeSecondaire`);
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
    const res = await api.get(`/eleves/listeChaqueClasseSecondaire`);
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
    const res = await api.get(`/elevesS`);
    
    // Accès sécurisé aux données avec vérifications
    const elevesData = res.data?.data?.par_classe?.[""] || [];
    const eleveseffectif = res.data?.data?.total_eleves || 0;
    
    setElevesET(eleveseffectif);
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
      await api.put(`/${id}`, { nom: editValue }, {
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


const fetchStudentData = async () => {
  try {
    const res = await api.get(`/stats/effectifs-secondaire`);
    setStudentData(res.data);
  } catch (err) {
    console.error('Erreur lors du chargement des effectifs:', err);
  }
};

const fetchGradeData = async () => {
  try {
    const res = await api.get(`/stats/repartition-notes-secondaire`);
    setGradeData(res.data);
  } catch (err) {
    console.error('Erreur lors du chargement des notes:', err);
  }
};

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


  useEffect(() => {
  const handleClick = (e) => {
    if (!e.target.closest('.profile-container')) setShowProfileMenu(false);
  };
  if (showProfileMenu) document.addEventListener('mousedown', handleClick);
  return () => document.removeEventListener('mousedown', handleClick);
}, [showProfileMenu]);




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
            className={`sidebar-item ${activeTab === 'Types et Periodes' ? 'active' : ''}`} 
            onClick={() => setActiveTab('Types')}
          >
            <Calendar size={20} />
            {sidebarOpen && <span className="sidebar-item-text">Types et Periodes</span>}
          </div>

          <div 
            className={`sidebar-item ${activeTab === 'Contributions' ? 'active' : ''}`} 
            onClick={() => setActiveTab('Contributions')}
          >
            <Settings size={20} />
            {sidebarOpen && <span className="sidebar-item-text">Contributions</span>}
          </div>

          <div 
            className={`sidebar-item ${activeTab === 'liaisonClassesPeriodesTypes' ? 'active' : ''}`} 
            onClick={() => setActiveTab('liaisonClassesPeriodesTypes')}
          >
            <User size={20} />
            {sidebarOpen && <span className="sidebar-item-text">Liaison Classes aux evaluations</span>}
          </div>
          <div 
            className={`sidebar-item ${activeTab === 'Fichier' ? 'active' : ''}`} 
            onClick={() => setActiveTab('Fichier')}
          >
            <Settings size={20} />
            {sidebarOpen && <span className="sidebar-item-text">Fichier EducMaster</span>}
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
                  <h3 className="stat-title">Enseignants du Secondaire</h3>
                  <p className="stat-value">{effectifE}</p>
                  <p className="stat-trend neutral">Stable depuis le début de l'année</p>
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
                    <option value="secondaire">Secondaire</option>
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
              
              {loading ?(
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
            <LierEnseignantsAuxMatieres />
          )}

          {activeTab === 'Types' && (
            <TypeEvas2 />
          )}

          {activeTab === 'Contributions' && (
            <Contributions />
          )}
          
          {activeTab === 'liaisonClassesPeriodesTypes' && (
            <LierTypeClassePeriode />
          )}

          {activeTab === 'Fichier' && (
            <FilterGenerate />
          )}
          
          {(activeTab !== 'aperçu' && activeTab !== 'élèves' && activeTab !== 'classes' && activeTab !== 'matieres' && activeTab !== 'LiaisonSeriesClass'  && activeTab !== 'LiaisonMatieresAvecCoefficientEtSerieClasses' && activeTab !== 'notes' && activeTab !== 'enseignantsauxclasses'&& activeTab !== 'Types') && (
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
          api.get(`/classesS?with_series=true&with_matieres=true`),
          api.get(`/with-series-matieresSecondaire`),
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
      
        const [classesRes,classesMatieresRes, matieresRes, matieres1Res, seriesRes] = await Promise.all([
          api.get(`/classesS?with_series=true&with_matieres=true`),
          api.get(`/with-series-matieresSecondaire`),
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

/*const LierEnseignantsAuxMatieres = () => {
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
  const [errror, setError] = useState();

  // Charger les données initiales
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [classesRes, matieresRes, enseignantsRes] = await Promise.all([
          api.get(`/classesES?with_series=true&with_matieres=true&with_enseignants=true'),
          api.get(`/matieres'),
          api.get(`/enseignants?with_matieres=true'),
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
    fetchClassesSeries();
  }, []);

  const fetchClassesSeries = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/classes-with-series');
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
          `/classesES?with_series=true&with_matieres=true&with_enseignants=true'
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
  const getEnseignantsForMatiere = (matiereId) => {
    return enseignants.filter(enseignant => 
      enseignant.matiere_id == matiereId
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
};*/


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

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [classesRes, matieresRes, enseignantsRes] = await Promise.all([
          api.get(`/classesES?with_series=true&with_matieres=true&with_enseignants=true`),
          api.get(`/matieres`),
          api.get(`/enseignants?with_matieres=true`),
        ]);
        
        const processedClasses = classesRes.data.map(classe => ({
          ...classe,
          series: classe.series ? [...new Map(classe.series.map(serie => [serie.id, serie])).values()] : []
        }));
        
        setClasses(processedClasses);
        setMatieres(matieresRes.data);
        setEnseignants(enseignantsRes.data);
        setClassesWithData(processedClasses);
        setMessage({ text: '', type: '' });
      } catch (error) {
        setMessage({ text: 'Erreur lors du chargement des données', type: 'error' });
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    fetchClassesSeries();
  }, []);

  const fetchClassesSeries = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/classes-with-series`);
      const processedData = res.data.map(classe => ({
        ...classe,
        series: classe.series ? [...new Map(classe.series.map(serie => [serie.id, serie])).values()] : []
      }));
      setClassesS(processedData);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError('Erreur lors du chargement des séries');
      setLoading(false);
    }
  };

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
        
        const uniqueMatieres = [...new Map(response.data.map(matiere => [matiere.id, matiere])).values()];
        setSelectedMatieres(uniqueMatieres.map(matiere => matiere.id));
        
        const enseignantsData = {};
        uniqueMatieres.forEach(matiere => {
          enseignantsData[matiere.id] = matiere.enseignants?.map(e => e.id) || [];
        });
        setEnseignantsParMatiere(enseignantsData);
      } catch (error) {
        setMessage({ text: 'Erreur lors du chargement des données', type: 'error' });
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
      const matieresData = selectedMatieres.map(matiereId => ({
        matiere_id: matiereId,
        enseignants: enseignantsParMatiere[matiereId] || []
      }));
      
      const response = await api.put(
        `/classes/${selectedClass}/series/${selectedSerie}/matieres/enseignants`,
        { matieres: matieresData }
      );
      
      if (response.data.success) {
        const classesRes = await api.get(
          `/classesES?with_series=true&with_matieres=true&with_enseignants=true`
        );
        
        const processedClasses = classesRes.data.map(classe => ({
          ...classe,
          series: classe.series ? [...new Map(classe.series.map(serie => [serie.id, serie])).values()] : []
        }));
        
        setClassesWithData(processedClasses);
        setMessage({ text: 'Enseignants associés avec succès', type: 'success' });
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

  const getSeriesForSelectedClass = () => {
    if (!selectedClass) return [];
    const classe = classesS.find(c => c.id == selectedClass);
    return classe && Array.isArray(classe.series) ? classe.series : [];
  };

  const getEnseignantsForMatiere = (matiereId) => {
    return enseignants.filter(enseignant => 
      enseignant.matieres?.some(m => m.id == matiereId)
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
                  <option key={`classe-opt-${classe.id}`} value={classe.id}>
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
                  <option key={`serie-opt-${serie.id}`} value={serie.id}>
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
                      <div key={`matiere-block-${matiereId}`} className="matiere-enseignants-item">
                        <h4>{matiere?.nom || 'Matière inconnue'}</h4>
                        
                        {enseignantsMatiere.length > 0 ? (
                          <div className="enseignants-selection">
                            {enseignantsMatiere.map(enseignant => (
                              <div key={`enseignant-${enseignant.id}-${matiereId}`} className="enseignant-item">
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
                                  {enseignant.matieres?.length > 1 && (
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
                <div key={`classe-view-${classe.id}`} className="class-item">
                  <h3>{classe.nom_classe}</h3>
                  {classe.series?.map(serie => (
                    <div key={`serie-view-${serie.id}-${classe.id}`} className="serie-item">
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
                                <tr key={`matiere-row-${matiere.id}-${serie.id}`}>
                                  <td>{matiere.nom}</td>
                                  <td>
                                    {matiere.enseignants?.length > 0 ? (
                                      <ul className="enseignants-list">
                                        {matiere.enseignants.map(enseignant => (
                                          <li key={`enseignant-li-${enseignant.id}-${matiere.id}`}>
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


  // Gestionnaire générique pour les cases à cocher (périodes, types)
const handleCheckboxChange = (setter, currentSelection, id) => {
  setter(prev =>
    prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
  );
};

// Gestionnaire spécifique pour les cases à cocher des classes
const handleClassCheckboxChange = (id) => {
  setSelectedClasses(prev => {
    const newSelection = prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id];
    // Si une classe est désélectionnée, supprimez ses sélections de séries
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

// Gestionnaire spécifique pour les cases à cocher des séries
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
          api.get(`/classesS?with_series=true&with_matieres=true`),
          api.get(`/periodes`),
          api.get(`/types`),
          api.get(`/typeevaluationETclasseS`),
          api.get(`/classes-with-series`),
        ]);
        setClasses(classesRes.data);
        setPeriodes(periodesRes.data);
        setTypes(typesRes.data);
        const raw = liaisonsRes.data.data || [];
  const flatLiaisons = raw.flatMap(classe =>
    classe.type_evaluations.map(te => ({
      id: te.id,
      classe_id: classe.id,
      periode_id: te.periode_id,
      typeevaluation_id: te.typeevaluation_id,
      serie_id: te.serie_id
    }))
  );
  setLiaisons(flatLiaisons);
        setLiaisons(liaisonsRes.data);
        console.log("liaison 1", liaisonsRes.data);
        setClassesWithSeries(classesSeriesRes.data);
      } catch (error) {
        setMessage({ text: 'Erreur lors du chargement des données', type: 'error' });
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
      const liaisonsRes = await api.get(`/typeevaluationETclasseS`);
      setLiaisons(liaisonsRes.data.data);
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
    
    // Si la liaison a une série, la sélectionner
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

  // Soumettre le formulaire (création ou modification)
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
        // Mise à jour de la liaison existante
        await api.put(`/typeevaluation-classe/${editingLiaison.id}`, liaisonsToCreate[0]);
        setMessage({ text: 'Liaison mise à jour avec succès', type: 'success' });
      } else {
        // Création de nouvelles liaisons
        await api.post(`/typeevaluation-classe/attach-multiple`, {
          liaisons: liaisonsToCreate,
        });
        setMessage({ text: 'Liaisons ajoutées avec succès', type: 'success' });
      }

      // Recharger les liaisons
      const liaisonsRes = await api.get(`/typeevaluationETclasseS`);
      setLiaisons(liaisonsRes.data.data);

      //console.log("Liaison 1" , liaisonsRes.data.data)
      
      // Réinitialiser le formulaire
      cancelEdit();
    } catch (error) {
      setMessage({ text: error.response?.data?.message || 'Erreur lors de la liaison', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Organiser les liaisons par classe puis par période
  const getOrganizedLiaisons = () => {
    const organized = {};

    // Initialiser avec les classes
    classes.forEach(classe => {
      organized[classe.id] = {
        nom: classe.nom_classe,
        periodes: {}
      };
    });

    
    console.log("liasons", liaisons);

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

    if (!Array.isArray(liaisons)) {
      return organized;
    }

    // Ajouter les liaisons existantes
    liaisons.forEach(liaison => {
      if (organized[liaison.classe_id] && organized[liaison.classe_id].periodes[liaison.periode_id]) {
        const typeExists = organized[liaison.classe_id].periodes[liaison.periode_id].types.some(
          t => t.id === liaison.typeevaluation_id
        );
        
        if (!typeExists) {
          const type = types.find(t => t.id === liaison.typeevaluation_id);
          if (type) {
            organized[liaison.classe_id].periodes[liaison.periode_id].types.push({
              id: type.id,
              nom: type.nom,
              liaisonId: liaison.id,
              serieId: liaison.serie_id,
              serieNom: liaison.serie_id 
                ? classesWithSeries
                    .find(c => c.id === liaison.classe_id)
                    ?.series?.find(s => s.id === liaison.serie_id)?.nom
                : null
            });
          }
        }
      }
    });

    return organized;
  };

  const organizedLiaisons = getOrganizedLiaisons();

  return (
    <div className="link-type-classe-periode-container">
      <div className="form-card">
        <h2 className="form-title">
          {editingLiaison ? 'Modifier une liaison' : 'Créer une liaison'}
        </h2>
        
        {message.text && (
          <div className={`message ${message.type}`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Périodes Checkboxes */}
          <div className="form-group">
            <label>Période(s)</label>
            <div className="checkbox-group">
              {periodes.map(periode => (
                <label key={periode.id}>
                  <input
                    type="checkbox"
                    value={periode.id}
                    checked={selectedPeriodes.includes(periode.id)}
                    onChange={() => handleCheckboxChange(setSelectedPeriodes, selectedPeriodes, periode.id)}
                    disabled={loading}
                  />
                  {periode.nom} ({periode.date_debut} - {periode.date_fin})
                </label>
              ))}
            </div>
          </div>

          {/* Types d'évaluation Checkboxes */}
          <div className="form-group">
            <label>Type(s) d'évaluation</label>
            <div className="checkbox-group">
              {types.map(type => (
                <label key={type.id}>
                  <input
                    type="checkbox"
                    value={type.id}
                    checked={selectedTypes.includes(type.id)}
                    onChange={() => handleCheckboxChange(setSelectedTypes, selectedTypes, type.id)}
                    disabled={loading}
                  />
                  {type.nom}
                </label>
              ))}
            </div>
          </div>

          {/* Classes Checkboxes */}
          <div className="form-group">
            <label>Classe(s)</label>
            <div className="checkbox-group">
              {classes.map(classe => (
                <label key={classe.id}>
                  <input
                    type="checkbox"
                    value={classe.id}
                    checked={selectedClasses.includes(classe.id)}
                    onChange={() => handleClassCheckboxChange(classe.id)}
                    disabled={loading}
                  />
                  {classe.nom_classe}
                </label>
              ))}
            </div>
          </div>

          {/* Séries Checkboxes */}
          {selectedClasses.length > 0 && (
            <div className="form-group">
              <label>Série(s) par Classe sélectionnée</label>
              {selectedClasses.map(classId => {
                const classe = classesWithSeries.find(c => c.id == classId);
                if (!classe || !classe.series || classe.series.length === 0) {
                  return null;
                }
                return (
                  <div key={`series-for-${classId}`} className="checkbox-group series-group">
                    <h4>{classe.nom_classe}:</h4>
                    {classe.series.map(serie => (
                      <label key={serie.id}>
                        <input
                          type="checkbox"
                          value={serie.id}
                          checked={(selectedSeries[classId] || []).includes(serie.id)}
                          onChange={() => handleSeriesCheckboxChange(classId, serie.id)}
                          disabled={loading}
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
            <button
              type="submit"
              disabled={loading || selectedClasses.length === 0 || selectedPeriodes.length === 0 || selectedTypes.length === 0}
              className="submit-button"
            >
              {loading ? 'Enregistrement...' : editingLiaison ? 'Mettre à jour' : 'Enregistrer'}
            </button>
            
            {editingLiaison && (
              <button
                type="button"
                onClick={cancelEdit}
                className="cancel-button"
              >
                Annuler
              </button>
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
                <h3 className="class-title">{classeData.nom}</h3>
                
                {Object.entries(classeData.periodes).map(([periodeId, periodeData]) => (
                  <div key={`periode-${periodeId}`} className="periode-group">
                    <h4 className="periode-title">
                      {periodeData.nom} ({periodeData.date_debut} - {periodeData.date_fin})
                    </h4>
                    
                    {periodeData.types.length > 0 ? (
                      <table className="liaisons-table">
                        <thead>
                          <tr>
                            <th>Type d'évaluation</th>
                            <th>Série</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {periodeData.types.map(type => (
                            <tr key={`type-${type.id}`}>
                              <td>{type.nom}</td>
                              <td>{type.serieNom || 'Général'}</td>
                              <td className="actions-cell">
                                <button 
                                  className="edit-btn"
                                  onClick={() => handleEditLiaison({
                                    id: type.liaisonId,
                                    classe_id: parseInt(classId),
                                    periode_id: parseInt(periodeId),
                                    typeevaluation_id: type.id,
                                    serie_id: type.serieId
                                  })}
                                >
                                  Modifier
                                </button>
                                <button 
                                  className="delete-btn"
                                  onClick={() => handleDeleteLiaison(type.liaisonId)}
                                >
                                  Supprimer
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <p>Aucun type d'évaluation configuré pour cette période</p>
                    )}
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

const filegeneratePDF = async (data) => {
  const response = await api.get(`://127.0.0.1:8000/api/v1/pdf`, {
    responseType: 'arraybuffer',
    params: {
      data: JSON.stringify(data),
    },
  });
  const blob = new Blob([response.data], { type: 'application/pdf' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', 'document.pdf');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};  

const FilterGenerate = () => {

  const [filters, setFilters] = useState({
    classe_id:'',
    categorie_id:'',
    serie_id:'',
    matiere_id:'',
    periode:'',
    });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [series, setSeries] = useState([]);
  const [matieres, setMatieres] = useState([]);
  const [periodes, setPeriodes] = useState([]);
  const [types, setTypes] = useState([]);
  const [classesMat,setClassesMat] = useState([]);
  const [classesWithData, setClassesWithData] = useState([]);
  const [matieres1, setMatieres1] = useState([]); 
  const [message, setMessage] = useState({ text: '', type: '' }); 
  const [classes, setClasses] = useState([]);
  const [dataEducmaster, setDataEducmaster] = useState([]);
  const [showDownloadButton, setShowDownloadButton] = useState(false);


  const getMatieresBySerie = (serieId) => {
    if (!serieId) return [];
    
    const serie = matieres.find(s => s.id == serieId);
    return serie && serie.matieres ? serie.matieres : [];
  };
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [classesRes,classesMatieresRes, matieresRes, matieres1Res, seriesRes] = await Promise.all([
          api.get(`/classesS?with_series=true&with_matieres=true`),
          api.get(`/with-series-matieresSecondaire`),
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
  // Gérer les changements de filtres
const handleFilterChange = (e) => {
  const { name, value } = e.target;
  setFilters(prev => ({
    ...prev,
    [name]: value
  }));
};

useEffect(() => {
    if (filters.classe_id) {
        const selectedClasse = classes.find(c => c.id == filters.classe_id);
        if (selectedClasse) {
            setFilters(prev => ({
                ...prev,
                categorie_id: selectedClasse.categorie_classe || ''
            }));
        }
    }
}, [filters.classe_id, classes]);

    // Fonction pour appliquer les filtres
  const applyFilters = async () => {
    setShowDownloadButton(false);
    try {
      setLoading(true);
      
      // Construction de l'URL avec les paramètres de filtrage
      let url = `/EducMasterFile`;
      const params = new URLSearchParams();
      
      // Ajouter uniquement les filtres non vides
      for (const [key, value] of Object.entries(filters)) {
        if (value) {
          params.append(key, value);
        }
      }
      
      const response = await api.get(`${url}?${params.toString()}`);
      
      if (response.data.success) {
        setDataEducmaster(response.data.data);
        if (response.data.data.length > 0) {
          setShowDownloadButton(true);
        }
        console.log('Données du Fichier Educmaster :', response.data.data);
      } else {
        throw new Error(response.data.message || 'Erreur lors du filtrage');
      }
    } catch (error) {
      console.error('Erreur lors de la recuperation des données:', error);
      setError(error.message || 'Erreur lors de la recuperation des données pour le fichier educmaster');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    const doc = new jsPDF();
    doc.text("Fichier EducMaster de la classe de", 14, 15);

    const tableColumn = ["Matricule", "Nom", "Prénoms","Moy. Interro", "Devoir 1", "Devoir 2"];
    const tableRows = [];
    console.log(dataEducmaster);

    dataEducmaster.forEach(item => {
        // Vérification que Devoirs existe et est un tableau
        const devoirs = Array.isArray(item.Devoirs) ? item.Devoirs : [];
        
        const devoir1 = devoirs.find(d => d.type_evaluation === 'Devoir1')?.note || 'N/A';
        const devoir2 = devoirs.find(d => d.type_evaluation === 'Devoir2')?.note || 'N/A';
        
        const rowData = [
            item.numero_matricule || 'N/A',
            item.nom || 'N/A',
            item.prenom || 'N/A',
            item.moyenne_interrogations || 'N/A',
            devoir1,
            devoir2,
        ];
        tableRows.push(rowData);
    });

    doc.autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: 20,
    });

    doc.save('educmaster_data.pdf');
};


  return(<div className="filters-section">
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
        <label>Categorie</label>
                      

                      <input 
                        type="text" 
                        name="categorie_id"
                        value={
                          filters.classe_id 
                          ? classes.find(c => c.id == filters.classe_id)?.categorie_classe || 'Classe non trouvée'
                          : ''}
                        onChange={handleFilterChange}
                        className="filter-select"
                        readOnly
                      />
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
                          const classe = classesMat.find(c => c.id == filters.classe_id);
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
        {showDownloadButton && (
          <button 
            onClick={handleDownload}
            className="btn-filter"
            style={{marginLeft: '10px'}}
          >
            Télécharger
          </button>
        )}
      </div>
    </div>
  </div>);
};


const Contributions = () => {
  const [classes, setClasses] = useState([]);
  const [contributions, setContributions] = useState([]);
  const [classesMat, setClassesMat] = useState([]);
   const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [montant, setMontant] = useState('');
  const [selectedClassID, setSelectedClassID] = useState('');
  const [selectedSerieID, setSelectedSerieID] = useState('');
  const [date_fin_premiere_tranche, setDate_fin_premiere_tranche] = useState('');
  const [montant_premiere_tranche,setMontantPT] = useState('');
  const [montant_deuxieme_tranche,setMontantDT] = useState('');
  const [montant_troisieme_tranche,setMontantTT] = useState('');
  const [date_fin_deuxieme_tranche, setDate_fin_deuxieme_tranche] = useState('');
  const [date_fin_troisieme_tranche, setDate_fin_troisieme_tranche] = useState('');
  const [editingId, setEditingId] = useState(null);

  // Charger les données
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [classesRes, contributionsRes, classesetSeriesRes] = await Promise.all([
          api.get(`/classesS?with_series=true&with_matieres=true`),
          api.get(`/contributions`),
          api.get(`/with-series-matieresSecondaire`),
        ]);
        setClasses(classesRes.data);
        setContributions(contributionsRes.data);
        setClassesMat(classesetSeriesRes.data);
      } catch (err) {
        setError("Erreur lors du chargement des données");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = {
        montant: parseInt(montant),
        id_classe: selectedClassID,
        id_serie: selectedSerieID,
        montant_premiere_tranche: parseInt(montant_premiere_tranche),
        date_fin_premiere_tranche,
        montant_deuxieme_tranche: parseInt(montant_deuxieme_tranche),
        date_fin_deuxieme_tranche,
        montant_troisieme_tranche: parseInt(montant_troisieme_tranche),
        date_fin_troisieme_tranche,
      };

      let response;
      if (editingId) {
        response = await api.put(`/contributions/${editingId}`, data);
        setContributions(contributions.map(c => c.id === editingId ? response.data : c));
        setEditingId(null);
      } else {
        response = await api.post(`/contributions/store`, data);
        setContributions([...contributions, response.data]);
      }

      // Réinitialiser le formulaire
      resetForm();
    } catch (error) {
      console.error(error);
      setError("Erreur lors de l'enregistrement");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (contribution) => {
    setEditingId(contribution.id);
    setMontant(contribution.montant);
    setSelectedClassID(contribution.id_classe);
    setMontantPT(contribution.montant_premiere_tranche);
    setDate_fin_premiere_tranche(contribution.date_fin_premiere_tranche);
    setMontantDT(contribution.montant_deuxieme_tranche);
    setDate_fin_deuxieme_tranche(contribution.date_fin_deuxieme_tranche);
    setMontantTT(contribution.montant_troisieme_tranche);
    setDate_fin_troisieme_tranche(contribution.date_fin_troisieme_tranche);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cette contribution?")) {
      try {
        await api.delete(`/contributions/${id}`);
        setContributions(contributions.filter(c => c.id !== id));
      } catch (error) {
        console.error(error);
        setError("Erreur lors de la suppression");
      }
    }
  };

  const resetForm = () => {
    setMontant('');
    setSelectedClassID('');
    setDate_fin_premiere_tranche('');
    setDate_fin_deuxieme_tranche('');
    setDate_fin_troisieme_tranche('');
  };

  const filteredContributions = selectedClassID 
    ? contributions.filter(c => c.id_classe === parseInt(selectedClassID))
    : contributions;

  

  return (
    <div className="contributions-container">
      <h2>Gestion des Contributions</h2>
      {error && <div className="error-message">{error}</div>}
      
      <form onSubmit={handleSubmit} className="contribution-form">

        <div className="form-group">
          <label>Classe</label>
          <select
            value={selectedClassID}
            onChange={(e) => setSelectedClassID(e.target.value)}
            required
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
          <label>Serie</label>
          <select
            value={selectedSerieID}
            onChange={(e) => setSelectedSerieID(e.target.value)}
            required
          >
            <option value="">Sélectionnez une série</option>
            {selectedClassID && (() => {
                const classe = classesMat.find(c => c.id == selectedClassID);
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
          <label>Montant (FCFA)</label>
          <input 
            type="number" 
            value={montant} 
            placeholder='Montant de la contribution'
            onChange={(e) => setMontant(e.target.value)} 
            required 
          />
        </div>

        

        <div className="form-group">
          <label>Montant de la premiere tranche (FCFA)</label>
          <input 
            type="number" 
            value={montant_premiere_tranche} 
            onChange={(e) => setMontantPT(e.target.value)} 
            required 
          />
        </div>

        <div className="form-group">
          <label>Date fin 1ère tranche</label>
          <input
            type="date"
            value={date_fin_premiere_tranche}
            onChange={(e) => setDate_fin_premiere_tranche(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label>Montant de la deuxieme tranche (FCFA)</label>
          <input 
            type="number" 
            value={montant_deuxieme_tranche} 
            onChange={(e) => setMontantDT(e.target.value)} 
            required 
          />
        </div>

        <div className="form-group">
          <label>Date fin 2ème tranche</label>
          <input
            type="date"
            value={date_fin_deuxieme_tranche}
            onChange={(e) => setDate_fin_deuxieme_tranche(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label>Montant de la troisieme tranche (FCFA)</label>
          <input 
            type="number" 
            value={montant_troisieme_tranche} 
            onChange={(e) => setMontantTT(e.target.value)} 
            required 
          />
        </div>
        <div className="form-group">
          <label>Date fin 3ème tranche</label>
          <input
            type="date"
            value={date_fin_troisieme_tranche}
            onChange={(e) => setDate_fin_troisieme_tranche(e.target.value)}
            required
          />
        </div>

        <button type="submit" disabled={loading}>
          {loading ? 'Enregistrement...' : editingId ? 'Modifier' : 'Ajouter'}
        </button>
        {editingId && (
          <button type="button" onClick={() => {
            setEditingId(null);
            resetForm();
          }}>
            Annuler
          </button>
        )}
      </form>

      <div className="contributions-list">
        <h3>Liste des Contributions</h3>
        <div className="filter-section">
          <label>Filtrer par classe: </label>
          <select
            value={selectedClassID}
            onChange={(e) => setSelectedClassID(e.target.value)}
          >
            <option value="">Toutes les classes</option>
            {classes.map(classe => (
              <option key={classe.id} value={classe.id}>
                {classe.nom_classe}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <p>Chargement...</p>
        ) : filteredContributions.length === 0 ? (
          <p>Aucune contribution trouvée</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Classe</th>
                <th>Montant</th>
                <th>Montant et date de fin de la 1ère tranche</th>
                <th>Montant et date de fin de la 2ème tranche</th>
                <th>Montant et date de fin de la 3ème tranche</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredContributions.map(contribution => {
                const classe = classesMat.find(c => c.id === contribution.id_classe);
                return (
                  <tr key={contribution.id}>
                    <td>{classe ? classe.nom_classe : 'Inconnue'}</td>
                    <td>{contribution.montant} FCFA</td>
                    <td>{contribution.montant_premiere_tranche} FCFA {new Date(contribution.date_fin_premiere_tranche).toLocaleDateString()}</td>
                    <td>{contribution.montant_deuxieme_tranche} FCFA {new Date(contribution.date_fin_deuxieme_tranche).toLocaleDateString()}</td>
                    <td>{contribution.montant_troisieme_tranche} FCFA {new Date(contribution.date_fin_troisieme_tranche).toLocaleDateString()}</td>
                    <td>
                      <div className="action-buttons">
                        <button 
                          className="edit-btn"
                          onClick={() => handleEdit(contribution)}
                        >
                          <Edit2 size={14} /> Modifier
                        </button>
                        <button 
                          className="delete-btn"
                          onClick={() => handleDelete(contribution.id)}
                        >
                          <Trash2 size={14} /> Supprimer
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};