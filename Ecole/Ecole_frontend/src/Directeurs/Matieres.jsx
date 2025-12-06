import '../styles/GlobalStyles.css';
import axios from 'axios';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import React from 'react';
import { Edit2, Trash2, Save, X, Plus, Menu, Home, Users, Book, Calendar, User, Settings, LogOut, Bell } from 'lucide-react';


export default function Matieres() {
  const [matieres, setMatieres] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [newMatiere, setNewMatiere] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('matieres');
  const [message, setMessage] = useState('');


  const [selectedMatiere, setSelectedMatiere] = useState(null);
  const [newMatiereName, setNewMatiereName] = useState('');

  useEffect(() => {
    fetchMatieres();
  }, []);
  const fetchMatieres = async () => {
    try {
      setLoading(true);
      const res = await axios.get('http://localhost:8000/api/matieres');
      setMatieres(res.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
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
      })

      setMatieres([...matieres, res.data]);
      setNewMatiere('');
      setError('');
      setLoading(false);
    } catch (err) {

      const errorMessage = err.response?.data?.message || "Erreur lors de l'ajout";
      const errorDetails = err.response?.data?.errors || err.response?.data?.error || err.message;

      setMessage(`${errorMessage}: ${JSON.stringify(errorDetails)}`);

      console.error('Erreur détaillée:', err.response?.data || err.message);

      setLoading(false);
    }
  };


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
      await fetchMatieres(); // Recharger les matières après la modification

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


    } catch (err) {
      setError('Erreur lors de la suppression');
      setLoading(false);
    }
  };





  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const renderContent = () => {
    if (activeTab !== 'matieres') {
      return (
        <div className="section-placeholder">
          <div className="placeholder-content">
            <h3 className="placeholder-title">Section {activeTab} en cours de développement</h3>
            <p className="placeholder-text">Cette fonctionnalité sera disponible prochainement</p>
          </div>
        </div>
      );
    }

    return (
      <>
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {/* Formulaire d'ajout */}
        <div className="form-container" style={{ marginBottom: '2rem' }}>
          <h2 style={{ marginBottom: '1.5rem', fontSize: '1.25rem', fontWeight: 'bold' }}>Ajouter une nouvelle matière</h2>
          <div className="form-group" style={{ flexDirection: 'row', gap: '1rem' }}>
            <input
              type="text"
              value={newMatiere}
              onChange={(e) => setNewMatiere(e.target.value)}
              placeholder="Nom de la matière"
              className="form-input"
              style={{ flex: 1 }}
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

        {/* Liste des matières */}
        <div>
          <h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem', fontWeight: 'bold' }}>Liste des Matières</h2>

          {loading && matieres.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
              Chargement des matières...
            </div>
          ) : matieres.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
              Aucune matière trouvée. Ajoutez-en une ci-dessus.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
              {matieres.map((matiere) => (
                <div key={matiere.id} className="card">
                  <div className="card-body">
                    <div className="matiere-details">
                      {editingId === matiere.id ? (
                        <div className="form-grid">
                          <input
                            type="text"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="form-input"
                            onKeyPress={(e) => e.key === 'Enter' && Modification(matiere.id)}
                            autoFocus
                          />
                          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                            <button
                              onClick={() => Modification(matiere.id)}
                              disabled={loading}
                              className="btn btn-primary"
                              title="Sauvegarder"
                            >
                              <Save size={16} />
                            </button>
                            <button
                              onClick={handleCancel}
                              className="btn btn-danger"
                              title="Annuler"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="matiere-display">
                          <div className="matiere-info">
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>{matiere.nom}</h3>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>ID: {matiere.id}</p>
                          </div>
                          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                            <button
                              onClick={() => handleEdit(matiere)}
                              disabled={loading || editingId !== null}
                              className="btn btn-icon"
                              title="Modifier"
                              style={{ color: 'var(--primary)' }}
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(matiere.id)}
                              disabled={loading || editingId !== null}
                              className="btn btn-icon"
                              title="Supprimer"
                              style={{ color: 'var(--error)' }}
                            >
                              <Trash2 size={16} />
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

        {/* Instructions pour l'intégration Laravel 
        <div className="instructions">
          <h3 className="instructions-title">Instructions pour Laravel</h3>
          <div className="instructions-content">
            <p><strong>Routes API à créer dans Laravel :</strong></p>
            <ul className="instructions-list">
              <li>GET /api/matieres - Récupérer toutes les matières</li>
              <li>POST /api/matieres - Créer une nouvelle matière</li>
              <li>PUT /api/matieres/{`{id}`} - Modifier une matière</li>
              <li>DELETE /api/matieres/{`{id}`} - Supprimer une matière</li>
            </ul>
            <p className="instructions-note"><strong>N'oubliez pas :</strong> Configurez CORS dans Laravel et décommentez les appels API dans le code React.</p>
          </div>
        </div>*/}
      </>
    );
  };

  return (
    <div className="app-dashboard">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="sidebar-header">
          <h1 className="sidebar-title">EcoleGestion</h1>
        </div>
        <nav className="sidebar-nav">
          <button
            className={`sidebar-link ${activeTab === 'accueil' ? 'active' : ''}`}
            onClick={() => setActiveTab('accueil')}
          >
            <Home size={20} />
            <span>Accueil</span>
          </button>
          <button
            className={`sidebar-link ${activeTab === 'eleves' ? 'active' : ''}`}
            onClick={() => setActiveTab('eleves')}
          >
            <Users size={20} />
            <span>Élèves</span>
          </button>
          <button
            className={`sidebar-link ${activeTab === 'matieres' ? 'active' : ''}`}
            onClick={() => setActiveTab('matieres')}
          >
            <Book size={20} />
            <span>Matières</span>
          </button>
          <button
            className={`sidebar-link ${activeTab === 'calendrier' ? 'active' : ''}`}
            onClick={() => setActiveTab('calendrier')}
          >
            <Calendar size={20} />
            <span>Calendrier</span>
          </button>
          <button
            className={`sidebar-link ${activeTab === 'personnel' ? 'active' : ''}`}
            onClick={() => setActiveTab('personnel')}
          >
            <User size={20} />
            <span>Personnel</span>
          </button>
          <button
            className={`sidebar-link ${activeTab === 'parametres' ? 'active' : ''}`}
            onClick={() => setActiveTab('parametres')}
          >
            <Settings size={20} />
            <span>Paramètres</span>
          </button>
          <div className="sidebar-footer">
            <button className="sidebar-link">
              <LogOut size={20} />
              <span>Déconnexion</span>
            </button>
          </div>
        </nav>
      </div>

      {/* Main content */}
      <div className="main-content">
        {/* Header */}
        <header className="page-header">
          <div className="header-content">
            <h2 className="header-title">
              {activeTab === 'matieres' ? 'Gestion des Matières' :
                activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
            </h2>
            <div className="header-actions">
              <button className="btn btn-icon">
                <Bell size={20} />
                <span className="notification-badge">4</span>
              </button>
              <div className="user-profile">
                <div className="avatar-circle">A</div>
                <span className="user-name">Administrateur</span>
              </div>
            </div>
          </div>
        </header>

        {/* Content area */}
        <main className="content-container">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

//export default MatieresManager;
