import './Mes_CSS_directeur/Matiere.css';
import axios from 'axios';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import React from 'react';
import { Edit2, Trash2, Save, X, Plus, Menu, Home, Users, Book, Calendar, User, Settings, LogOut, Bell } from 'lucide-react';


export default function Matieres()  {
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
      const res =await axios.post('http://localhost:8000/api/matieres/store', { nom: newMatiere },{
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
          'Content-Type': 'application/json'}
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

        {/* Liste des matières */}
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
    <div className="app-container">
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
            className={`nav-item ${activeTab === 'accueil' ? 'nav-item-active' : ''}`} 
            onClick={() => setActiveTab('accueil')}
          >
            <Home size={20} />
            {sidebarOpen && <span className="nav-text">Accueil</span>}
          </div>
          <div 
            className={`nav-item ${activeTab === 'eleves' ? 'nav-item-active' : ''}`} 
            onClick={() => setActiveTab('eleves')}
          >
            <Users size={20} />
            {sidebarOpen && <span className="nav-text">Élèves</span>}
          </div>
          <div 
            className={`nav-item ${activeTab === 'matieres' ? 'nav-item-active' : ''}`} 
            onClick={() => setActiveTab('matieres')}
          >
            <Book size={20} />
            {sidebarOpen && <span className="nav-text">Matières</span>}
          </div>
          <div 
            className={`nav-item ${activeTab === 'calendrier' ? 'nav-item-active' : ''}`} 
            onClick={() => setActiveTab('calendrier')}
          >
            <Calendar size={20} />
            {sidebarOpen && <span className="nav-text">Calendrier</span>}
          </div>
          <div 
            className={`nav-item ${activeTab === 'personnel' ? 'nav-item-active' : ''}`} 
            onClick={() => setActiveTab('personnel')}
          >
            <User size={20} />
            {sidebarOpen && <span className="nav-text">Personnel</span>}
          </div>
          <div 
            className={`nav-item ${activeTab === 'parametres' ? 'nav-item-active' : ''}`} 
            onClick={() => setActiveTab('parametres')}
          >
            <Settings size={20} />
            {sidebarOpen && <span className="nav-text">Paramètres</span>}
          </div>
          <div className="nav-item nav-logout">
            <LogOut size={20} />
            {sidebarOpen && <span className="nav-text">Déconnexion</span>}
          </div>
        </nav>
      </div>

      {/* Main content */}
      <div className="main-content">
        {/* Header */}
        <header className="main-header">
          <div className="header-content">
            <h2 className="page-title">
              {activeTab === 'matieres' ? 'Gestion des Matières' : 
               activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
            </h2>
            <div className="header-actions">
              <div className="notification-wrapper">
                <button className="notification-btn">
                  <Bell size={20} />
                  <span className="notification-badge">4</span>
                </button>
              </div>
              <div className="user-info">
                <img src="/api/placeholder/40/40" alt="Profile" className="user-avatar" />
                {sidebarOpen && <span className="user-name">Administrateur</span>}
              </div>
            </div>
          </div>
        </header>

        {/* Content area */}
        <main className="content-area">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

//export default MatieresManager;
