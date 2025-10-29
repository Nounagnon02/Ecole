import React, { useState, useEffect } from 'react';
import { 
  Users, BookOpen, Calendar, MessageSquare, ClipboardList, 
  Clock, FileText, Bell, User, Settings, LogOut, Plus, Edit2, 
  Trash2, Save, X, RefreshCw, Send, Eye
} from 'lucide-react';
import api from '../api';
import Messagerie from '../components/Messagerie';
import NotificationBell from '../components/NotificationBell';
import '../styles/dashboard.css';

const DashboardEnseignant = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [eleves, setEleves] = useState([]);
  const [notes, setNotes] = useState([]);
  const [devoirs, setDevoirs] = useState([]);
  const [messages, setMessages] = useState([]);
  const [emploiTemps, setEmploiTemps] = useState([]);

  const [newNote, setNewNote] = useState({
    eleve_id: '',
    matiere_id: '',
    note: '',
    type_evaluation: '',
    date_evaluation: new Date().toISOString().split('T')[0]
  });

  const [newDevoir, setNewDevoir] = useState({
    classe_id: '',
    matiere_id: '',
    titre: '',
    description: '',
    date_limite: '',
    type: 'devoir'
  });

  const [newMessage, setNewMessage] = useState({
    destinataire_id: '',
    type_destinataire: 'parent',
    sujet: '',
    contenu: ''
  });

  useEffect(() => {
    fetchEnseignantData();
  }, []);

  const fetchEnseignantData = async () => {
    try {
      setLoading(true);
      const enseignantId = localStorage.getItem('userId');
      const [classesRes, emploiRes, devoirsRes] = await Promise.all([
        api.get(`/enseignants/${enseignantId}/classes`, { params: { enseignant_id: enseignantId } }),
        api.get(`/enseignants/${enseignantId}/emploi-temps`, { params: { enseignant_id: enseignantId } }),
        api.get('/devoirs')
      ]);
      
      if (classesRes.data.success) setClasses(classesRes.data.data);
      if (emploiRes.data.success) setEmploiTemps(emploiRes.data.data);
      if (devoirsRes.data) setDevoirs(Array.isArray(devoirsRes.data) ? devoirsRes.data : []);
    } catch (error) {
      console.error('Erreur:', error);
      setClasses([]);
      setEmploiTemps([]);
      setDevoirs([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchClasseEleves = async (classeId) => {
    try {
      const res = await api.get(`/classes/${classeId}/eleves`);
      if (res.data.success) setEleves(res.data.data);
    } catch (error) {
      console.error('Erreur:', error);
      setEleves([]);
    }
  };

  const ajouterNote = async () => {
    try {
      await api.post('/notes', newNote);
      alert('Note ajoutée avec succès');
      setNewNote({
        eleve_id: '',
        matiere_id: '',
        note: '',
        type_evaluation: '',
        date_evaluation: new Date().toISOString().split('T')[0]
      });
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de l\'ajout de la note');
    }
  };

  const ajouterDevoir = async () => {
    try {
      await api.post('/devoirs', { ...newDevoir, enseignant_id: localStorage.getItem('userId') });
      alert('Devoir ajouté avec succès');
      fetchEnseignantData();
      setNewDevoir({
        classe_id: '',
        matiere_id: '',
        titre: '',
        description: '',
        date_limite: '',
        type: 'devoir'
      });
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de l\'ajout du devoir');
    }
  };

  const envoyerMessage = async () => {
    try {
      await api.post('/messages', newMessage);
      setNewMessage({
        destinataire_id: '',
        type_destinataire: 'parent',
        sujet: '',
        contenu: ''
      });
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const renderOverview = () => (
    <div className="overview-grid">
      <div className="stat-card">
        <Users className="stat-icon" />
        <div>
          <h3>Classes</h3>
          <p>{classes.length}</p>
        </div>
      </div>
      <div className="stat-card">
        <BookOpen className="stat-icon" />
        <div>
          <h3>Élèves</h3>
          <p>{eleves.length}</p>
        </div>
      </div>
      <div className="stat-card">
        <ClipboardList className="stat-icon" />
        <div>
          <h3>Notes saisies</h3>
          <p>{notes.length}</p>
        </div>
      </div>
      <div className="stat-card">
        <Calendar className="stat-icon" />
        <div>
          <h3>Devoirs donnés</h3>
          <p>{devoirs.length}</p>
        </div>
      </div>
    </div>
  );

  const renderGestionClasse = () => (
    <div className="gestion-classe">
      <div className="classe-selector">
        <select 
          value={selectedClass} 
          onChange={(e) => {
            setSelectedClass(e.target.value);
            fetchClasseEleves(e.target.value);
          }}
        >
          <option value="">Sélectionner une classe</option>
          {classes.map(classe => (
            <option key={classe.id} value={classe.id}>{classe.nom}</option>
          ))}
        </select>
      </div>

      {selectedClass && (
        <div className="eleves-list">
          <h3>Liste des élèves</h3>
          <table>
            <thead>
              <tr>
                <th>Nom</th>
                <th>Prénom</th>
                <th>Matricule</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {eleves.map(eleve => (
                <tr key={eleve.id}>
                  <td>{eleve.nom}</td>
                  <td>{eleve.prenom}</td>
                  <td>{eleve.matricule}</td>
                  <td>
                    <button className="btn-action">
                      <Eye size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  const renderSaisieNotes = () => (
    <div className="saisie-notes">
      <div className="form-section">
        <h3>Ajouter une note</h3>
        <div className="form-grid">
          <select
            value={newNote.eleve_id}
            onChange={(e) => setNewNote({...newNote, eleve_id: e.target.value})}
          >
            <option value="">Sélectionner un élève</option>
            {eleves.map(eleve => (
              <option key={eleve.id} value={eleve.id}>
                {eleve.nom} {eleve.prenom}
              </option>
            ))}
          </select>

          <input
            type="number"
            placeholder="Note"
            value={newNote.note}
            onChange={(e) => setNewNote({...newNote, note: e.target.value})}
          />

          <select
            value={newNote.type_evaluation}
            onChange={(e) => setNewNote({...newNote, type_evaluation: e.target.value})}
          >
            <option value="">Type d'évaluation</option>
            <option value="Devoir1">Devoir 1</option>
            <option value="Devoir2">Devoir 2</option>
            <option value="Interrogation">Interrogation</option>
          </select>

          <input
            type="date"
            value={newNote.date_evaluation}
            onChange={(e) => setNewNote({...newNote, date_evaluation: e.target.value})}
          />

          <button onClick={ajouterNote} className="btn-primary">
            <Plus size={16} /> Ajouter
          </button>
        </div>
      </div>
    </div>
  );

  const renderCahierTexte = () => (
    <div className="cahier-texte">
      <div className="form-section">
        <h3>Ajouter un devoir</h3>
        <div className="form-grid">
          <input
            type="text"
            placeholder="Titre du devoir"
            value={newDevoir.titre}
            onChange={(e) => setNewDevoir({...newDevoir, titre: e.target.value})}
          />

          <textarea
            placeholder="Description"
            value={newDevoir.description}
            onChange={(e) => setNewDevoir({...newDevoir, description: e.target.value})}
          />

          <input
            type="date"
            value={newDevoir.date_limite}
            onChange={(e) => setNewDevoir({...newDevoir, date_limite: e.target.value})}
          />

          <button onClick={ajouterDevoir} className="btn-primary">
            <Plus size={16} /> Ajouter
          </button>
        </div>
      </div>

      <div className="devoirs-list">
        <h3>Devoirs donnés</h3>
        {devoirs.map(devoir => (
          <div key={devoir.id} className="devoir-item">
            <h4>{devoir.titre}</h4>
            <p>{devoir.description}</p>
            <span>À rendre le: {devoir.date_limite}</span>
          </div>
        ))}
      </div>
    </div>
  );

  const renderMessagerie = () => {
    const enseignantId = localStorage.getItem('userId');
    const userName = localStorage.getItem('userName') || 'Enseignant';
    return <Messagerie userId={enseignantId} userName={userName} />;
  };

  const renderEmploiTemps = () => (
    <div className="emploi-temps">
      <h3>Mon emploi du temps</h3>
      {emploiTemps.length === 0 ? (
        <p>Aucun emploi du temps disponible</p>
      ) : (
        <div className="emploi-grid">
          {emploiTemps.map(cours => (
            <div key={cours.id} className="cours-item">
              <h4>{cours.matiere || 'Matière'}</h4>
              <p>{cours.classe || 'Classe'}</p>
              <span>{cours.jour} - {cours.heure_debut} à {cours.heure_fin}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="dashboard-enseignant">
      <div className="sidebar">
        <div className="sidebar-header">
          <h2>Espace Enseignant</h2>
        </div>
        <nav className="sidebar-nav">
          <button 
            className={activeTab === 'overview' ? 'active' : ''}
            onClick={() => setActiveTab('overview')}
          >
            <User size={20} /> Aperçu
          </button>
          <button 
            className={activeTab === 'classe' ? 'active' : ''}
            onClick={() => setActiveTab('classe')}
          >
            <Users size={20} /> Ma classe
          </button>
          <button 
            className={activeTab === 'notes' ? 'active' : ''}
            onClick={() => setActiveTab('notes')}
          >
            <ClipboardList size={20} /> Notes
          </button>
          <button 
            className={activeTab === 'cahier' ? 'active' : ''}
            onClick={() => setActiveTab('cahier')}
          >
            <BookOpen size={20} /> Cahier de texte
          </button>
          <button 
            className={activeTab === 'messages' ? 'active' : ''}
            onClick={() => setActiveTab('messages')}
          >
            <MessageSquare size={20} /> Messages
          </button>
          <button 
            className={activeTab === 'emploi' ? 'active' : ''}
            onClick={() => setActiveTab('emploi')}
          >
            <Calendar size={20} /> Emploi du temps
          </button>
        </nav>
      </div>

      <div className="main-content">
        <header className="main-header">
          <h1>Dashboard Enseignant</h1>
          <div className="header-actions">
            <NotificationBell userId={localStorage.getItem('userId')} />
            <User size={20} />
          </div>
        </header>

        <main className="content-area">
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'classe' && renderGestionClasse()}
          {activeTab === 'notes' && renderSaisieNotes()}
          {activeTab === 'cahier' && renderCahierTexte()}
          {activeTab === 'messages' && renderMessagerie()}
          {activeTab === 'emploi' && renderEmploiTemps()}
        </main>
      </div>
    </div>
  );
};

export default DashboardEnseignant;