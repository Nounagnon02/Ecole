import React, { useState, useEffect } from 'react';
import { PieChart, Pie, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { Edit2, Trash2, Save, X, Plus, Menu, Home, Users, Book, User, Settings, LogOut, Bell, Calendar, ChevronDown, ChevronUp, ClipboardList } from 'lucide-react';
import axios from 'axios';
import './Mes_CSS_directeur/dashboard_directeur.css';
import { NavLink } from 'react-router-dom';

// Données fictives
const studentData = [
  { name: 'Janvier', students: 320 },
  { name: 'Février', students: 335 },
  { name: 'Mars', students: 338 },
  { name: 'Avril', students: 342 },
  { name: 'Mai', students: 345 },
  { name: 'Juin', students: 350 },
];

const attendanceData = [
  { name: 'Lundi', présent: 92, absent: 8 },
  { name: 'Mardi', présent: 95, absent: 5 },
  { name: 'Mercredi', présent: 90, absent: 10 },
  { name: 'Jeudi', présent: 88, absent: 12 },
  { name: 'Vendredi', présent: 85, absent: 15 },
];

const gradeData = [
  { name: '0-5', value: 5 },
  { name: '6-10', value: 15 },
  { name: '11-15', value: 40 },
  { name: '16-20', value: 25 },
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
  const [series, setSeries] = useState([]);
  const [notes, setNotes] = useState([]);
  const [classes, setClasses] = useState([]);
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
  const [importData, setImportData] = useState({
  classe_id: '',
  matiere_id: '',
  enseignant_id: '',
  fichier: null,
  type_evaluation: '',
  date_evaluation: new Date().toISOString().split('T')[0],
  periode: ''
});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('aperçu');
  const [showNotifications, setShowNotifications] = useState(false);
  const [expandedSection, setExpandedSection] = useState('statistiques');

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

// Gardez uniquement cette version
useEffect(() => {
  const loadInitialData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchMatieres(),
        fetchNotes(),
        fetchClasses(),
        fetchEleves(),
        fetchSeries()
      ]);
    } catch (error) {
      console.error('Erreur chargement données:', error);
      setError('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };
  
  loadInitialData();
}, []);


  const fetchMatieres = async () => {
    try {
      setLoading(true);
      const res = await axios.get('http://localhost:8000/api/matieres');
      setMatieres(res.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError('Erreur lors du chargement des matières');
      setLoading(false);
    }
  };
  const fetchSeries = async () => {
    try {
      setLoading(true);
      const res = await axios.get('http://localhost:8000/api/series');
      setSeries(res.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError('Erreur lors du chargement des séries');
      setLoading(false);
    }
  };


  // Fonction pour récupérer les notes depuis l'API
const fetchNotes = async () => {
  try {
    setLoading(true);
    setError(''); // Réinitialiser les erreurs
    const res = await axios.get('http://localhost:8000/api/notes');
    
    if (!res.data) {
      throw new Error('Données invalides reçues du serveur');
    }
    
    setNotes(Array.isArray(res.data) ? res.data : []);
    setMessage('Notes chargées avec succès');
  } catch (err) {
    const errorMsg = err.response?.data?.message || err.message || 'Erreur inconnue';
    console.error('Erreur fetchNotes:', errorMsg);
    setError(`Erreur lors du chargement des notes: ${errorMsg}`);
    setNotes([]);
  } finally {
    setLoading(false);
  }
};

  const fetchClasses = async () => {
    try {
      const res = await axios.get('http://localhost:8000/api/classes');
      setClasses(res.data);
    } catch (err) {
      console.error(err);
      setError('Erreur lors du chargement des classes');
    }
  };

  const fetchEleves = async () => {
    try {
      const res = await axios.get('http://localhost:8000/api/eleves');
      setEleves(res.data);
    } catch (err) {
      console.error(err);
      setError('Erreur lors du chargement des élèves');
    }
  };

  const AjouterMatiere = async () => {
    if (!newMatiere.trim()) {
      setError('Le nom de la matière ne peut pas être vide');
      return;
    }

    try {
      setLoading(true);
      const res = await axios.post('http://localhost:8000/api/matieres/store', { nom: newMatiere }, {
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

  const AjouterSerie = async () => {
    if (!newSerie.trim()) {
        setError('Le nom de la série ne peut pas être vide');
        return;
    }

    try {
        setLoading(true);
        const res = await axios.post('http://localhost:8000/api/series/store', { 
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

  const handleEdit = (matiere) => {
    setEditingId(matiere.id);
    setEditValue(matiere.nom);
  };

  const Modification = async (id) => {
    if (!editValue.trim()) {
      setError('Le nom de la matière ne peut pas être vide');
      return;
    }

    try {
      setLoading(true);
      await axios.put(`http://localhost:8000/api/matieres/update/${id}`, { nom: editValue }, {
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

  const ModificationSerie = async (id) => {
    if (!editValue.trim()) {
      setError('Le nom de la série ne peut pas être vide');
      return;
    }

    try {
      setLoading(true);
      await axios.put(`http://localhost:8000/api/series/update/${id}`, { nom: editValue }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      await fetchMatieres();
      setMessage('Série modifiée avec succès');      
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
      await axios.delete(`http://localhost:8000/api/matieres/delete/${id}`);
      fetchMatieres();
      setMessage('Matière supprimée avec succès');
      setLoading(false);
    } catch (err) {
      setError('Erreur lors de la suppression');
      setLoading(false);
    }
  };

  const handleNoteChange = (e) => {
    const { name, value } = e.target;
    setNewNote(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddNote = async () => {
  try {
    setLoading(true);
    const res = await axios.post('http://localhost:8000/api/notes', newNote);
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

  const handleImportChange = (e) => {
  const { name, value, files } = e.target;
  setImportData(prev => ({
    ...prev,
    [name]: files ? files[0] : value
  }));
};

const handleImportSubmit = async (e) => {
  e.preventDefault();
  
  const formData = new FormData();
  for (const key in importData) {
    if (importData[key] !== null && importData[key] !== '') {
      formData.append(key, importData[key]);
    }
  }

  try {
    setLoading(true);
    const res = await axios.post('http://localhost:8000/api/notes/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    
    setMessage(res.data.message);
    if (res.data.imported_count > 0) {
      fetchNotes(); // Rafraîchir la liste des notes
    }
    
    // Réinitialiser le formulaire
    setImportData({
      classe_id: '',
      matiere_id: '',
      enseignant_id: '',
      fichier: null,
      type_evaluation: '',
      date_evaluation: new Date().toISOString().split('T')[0],
      periode: ''
    });
    
    setLoading(false);
  } catch (err) {
    setError(err.response?.data?.message || "Erreur lors de l'import");
    setLoading(false);
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
    await axios.delete(`http://localhost:8000/api/notes/${noteId}`);
    await fetchNotes(); // Recharger les notes
    setMessage('Note supprimée avec succès');
  } catch (err) {
    setError('Erreur lors de la suppression de la note');
    console.error(err);
  } finally {
    setLoading(false);
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
            className={`sidebar-item ${activeTab === 'calendrier' ? 'active' : ''}`} 
            onClick={() => setActiveTab('calendrier')}
          >
            <Calendar size={20} />
            {sidebarOpen && <span className="sidebar-item-text">Calendrier</span>}
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
                
                {loading && matieres.length === 0 ? (
                  <div className="empty-state">
                    Chargement des matières...
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
                    Chargement des Serie...
                  </div>
                ) : series.length === 0 ? (
                  <div className="empty-state">
                    Aucune série  trouvée. Ajoutez-en une ci-dessus.
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
                            {classe.nom}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="form-group">
                      <label>Matière</label>
                      <select
                        name="matiere_id"
                        value={importData.matiere_id}
                        onChange={handleImportChange}
                        className="form-input"
                        required
                      >
                        <option value="">Sélectionner une matière</option>
                        {matieres.map(matiere => (
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
                    </div>
                    
                    <div className="form-group">
                      <label>Type d'évaluation</label>
                      <input
                        type="text"
                        name="type_evaluation"
                        value={importData.type_evaluation}
                        onChange={handleImportChange}
                        className="form-input"
                      />
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
                      <input
                        type="text"
                        name="periode"
                        value={importData.periode}
                        onChange={handleImportChange}
                        className="form-input"
                      />
                    </div>
                  </div>
                  
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn btn-primary"
                  >
                    Importer les notes
                  </button>
                </form>
              </div>
              
              {/* Le reste de votre code existant... */}
              
              <div className="add-note-form">
                
                          <h3 className="form-title">Ajouter une nouvelle note</h3>
                          <div className="form-grid">
                            <div className="form-group">
                              <label>Élève</label>
                              <select
                                name="eleve_id"
                                value={newNote.eleve_id}
                                onChange={handleNoteChange}
                                className="form-input"
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
                              <select
                                name="classe_id"
                                value={newNote.classe_id}
                                onChange={handleNoteChange}
                                className="form-input"
                              >
                                <option value="">Sélectionner une classe</option>
                                {classes.map(classe => (
                                  <option key={classe.id} value={classe.id}>
                                    {classe.nom}
                                  </option>
                                ))}
                              </select>
                            </div>
                            
                            <div className="form-group">
                              <label>Matière</label>
                              <select
                                name="matiere_id"
                                value={newNote.matiere_id}
                                onChange={handleNoteChange}
                                className="form-input"
                              >
                                <option value="">Sélectionner une matière</option>
                                {matieres.map(matiere => (
                                  <option key={matiere.id} value={matiere.id}>
                                    {matiere.nom}
                                  </option>
                                ))}
                              </select>
                            </div>
                            
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
                              <input
                                type="text"
                                name="type_evaluation"
                                value={newNote.type_evaluation}
                                onChange={handleNoteChange}
                                className="form-input"
                              />
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
                              <input
                                type="text"
                                name="periode"
                                value={newNote.periode}
                                onChange={handleNoteChange}
                                className="form-input"
                              />
                            </div>
                            
                            <div className="form-group">
                              <label>Commentaire</label>
                              <textarea
                                name="commentaire"
                                value={newNote.commentaire}
                                onChange={handleNoteChange}
                                className="form-input"
                              />
                            </div>
                          </div>
                          
                          <button
                            onClick={handleAddNote}
                            disabled={loading}
                            className="btn btn-primary"
                          >
                            Ajouter la note
                          </button>
                        
                {/* Votre formulaire existant d'ajout manuel de notes */}
              </div>
              
              <div className="notes-list">
                <h3 className="list-title">Liste des Notes</h3>
                {loading ? (
                  <div className="empty-state">Chargement des notes...</div>
                ) : notes.length === 0 ? (
                  <div className="empty-state">Aucune note enregistrée</div>
                ) : (
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Élève</th>
                        <th>Classe</th>
                        <th>Matière</th>
                        <th>Note</th>
                        <th>Date</th>
                        <th>Type</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {notes.map(note => (
                        <tr key={note.id}>
                          <td>{note.eleve ? `${note.eleve.nom} ${note.eleve.prenom}` : 'N/A'}</td>
                          <td>{note.classe ? note.classe.nom : 'N/A'}</td>
                          <td>{note.matiere ? note.matiere.nom : 'N/A'}</td>
                          <td>{note.note}/{note.note_sur}</td>
                          <td>{new Date(note.date_evaluation).toLocaleDateString()}</td>
                          <td>{note.type_evaluation || 'N/A'}</td>
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
  )}
              </div>
            
            </div>
  
          )}
          

          {activeTab === 'classes' && (
            <div className="classes-container">
              <h2 className="section-title">Liste des classes</h2>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Classe</th>
                    <th>Effectif</th>
                    <th>Enseignant</th>
                    <th>Salle</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {classesList.map((classe) => (
                    <tr key={classe.id}>
                      <td>{classe.nom}</td>
                      <td>{classe.effectif} élèves</td>
                      <td>{classe.enseignant}</td>
                      <td>{classe.salle}</td>
                      <td>
                        <button className="btn btn-details">Détails</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {(activeTab !== 'aperçu' && activeTab !== 'classes' && activeTab !== 'matieres' && activeTab !== 'notes') && (
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



