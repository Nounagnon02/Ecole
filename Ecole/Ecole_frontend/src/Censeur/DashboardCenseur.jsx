import React, { useState, useEffect } from 'react';
import {
  BookOpen, Users, Calendar, TrendingUp,
  FileText, Award, Clock, Settings,
  Plus, Edit2, Eye, CheckCircle, MessageSquare, LogOut
} from 'lucide-react';
import api from '../api';
import Messagerie from '../components/Messagerie';
import NotificationBell from '../components/NotificationBell';
import '../styles/GlobalStyles.css';

const DashboardCenseur = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [resultats, setResultats] = useState([]);
  const [conseils, setConseils] = useState([]);
  const [examens, setExamens] = useState([]);
  const [emploisTemps, setEmploisTemps] = useState([]);
  const [rapportsPedagogiques, setRapportsPedagogiques] = useState([]);

  const [newConseil, setNewConseil] = useState({
    classe_id: '',
    date_conseil: '',
    trimestre: '',
    observations: ''
  });

  const [newExamen, setNewExamen] = useState({
    matiere_id: '',
    classe_id: '',
    date_examen: '',
    heure_debut: '',
    duree: '',
    surveillant_id: ''
  });

  useEffect(() => {
    fetchCenseurData();
  }, []);

  const fetchCenseurData = async () => {
    try {
      setLoading(true);
      const [resultatsRes, conseilsRes, examensRes] = await Promise.all([
        api.get('/censeur/resultats'),
        api.get('/censeur/conseils'),
        api.get('/censeur/examens')
      ]);

      setResultats(resultatsRes.data);
      setConseils(conseilsRes.data);
      setExamens(examensRes.data);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const planifierConseil = async () => {
    try {
      await api.post('/conseils-classe', newConseil);
      setNewConseil({ classe_id: '', date_conseil: '', trimestre: '', observations: '' });
      fetchCenseurData();
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const planifierExamen = async () => {
    try {
      await api.post('/examens', newExamen);
      setNewExamen({ matiere_id: '', classe_id: '', date_examen: '', heure_debut: '', duree: '', surveillant_id: '' });
      fetchCenseurData();
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const validerEmploiTemps = async (emploiId) => {
    try {
      await api.put(`/emplois-temps/${emploiId}/valider`);
      alert('Emploi du temps validé');
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const renderOverview = () => (
    <div className="stats-grid">
      <div className="stat-card">
        <div className="stat-icon" style={{ background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)' }}>
          <Users size={24} />
        </div>
        <div className="stat-content">
          <h3>{resultats.length}</h3>
          <p>Classes suivies</p>
        </div>
      </div>
      <div className="stat-card">
        <div className="stat-icon" style={{ background: 'linear-gradient(135deg, var(--secondary-2) 0%, #1aa179 100%)' }}>
          <Calendar size={24} />
        </div>
        <div className="stat-content">
          <h3>{conseils.length}</h3>
          <p>Conseils planifiés</p>
        </div>
      </div>
      <div className="stat-card">
        <div className="stat-icon" style={{ background: 'linear-gradient(135deg, var(--secondary-3) 0%, #e8590c 100%)' }}>
          <FileText size={24} />
        </div>
        <div className="stat-content">
          <h3>{examens.filter(e => new Date(e.date_examen) > new Date()).length}</h3>
          <p>Examens à venir</p>
        </div>
      </div>
      <div className="stat-card">
        <div className="stat-icon" style={{ background: 'linear-gradient(135deg, var(--secondary-1) 0%, #553098 100%)' }}>
          <TrendingUp size={24} />
        </div>
        <div className="stat-content">
          <h3>{resultats.taux_reussite || 0}%</h3>
          <p>Taux de réussite</p>
        </div>
      </div>
    </div>
  );

  const renderResultats = () => (
    <div className="form-container">
      <h2>Suivi des résultats scolaires</h2>
      <div className="stats-grid">
        {resultats.map(resultat => (
          <div key={resultat.id} className="card">
            <h4 style={{ color: 'var(--primary)', marginBottom: '1rem' }}>{resultat.classe_nom}</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Moyenne générale:</span>
                <strong>{resultat.moyenne_generale}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Taux de réussite:</span>
                <strong className="text-success">{resultat.taux_reussite}%</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Élèves en difficulté:</span>
                <strong className="text-error">{resultat.eleves_difficulte}</strong>
              </div>
            </div>
            <button className="btn btn-primary" style={{ marginTop: '1rem', width: '100%' }}>
              <Eye size={16} /> Voir détails
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  const renderConseils = () => (
    <div>
      <div className="form-container" style={{ marginBottom: '2rem' }}>
        <h2>Planifier un conseil de classe</h2>
        <div className="form-grid">
          <div className="form-group">
            <label>Classe</label>
            <select className="form-select" value={newConseil.classe_id} onChange={(e) => setNewConseil({ ...newConseil, classe_id: e.target.value })}>
              <option value="">Sélectionner une classe</option>
            </select>
          </div>
          <div className="form-group">
            <label>Date</label>
            <input type="date" className="form-input" value={newConseil.date_conseil} onChange={(e) => setNewConseil({ ...newConseil, date_conseil: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Période</label>
            <select className="form-select" value={newConseil.trimestre} onChange={(e) => setNewConseil({ ...newConseil, trimestre: e.target.value })}>
              <option value="">Sélectionner la période</option>
              <option value="1er_trimestre">1er Trimestre</option>
              <option value="2eme_trimestre">2ème Trimestre</option>
              <option value="3eme_trimestre">3ème Trimestre</option>
            </select>
          </div>
          <div className="form-group">
            <label>Observations</label>
            <textarea className="form-input" placeholder="Observations" value={newConseil.observations} onChange={(e) => setNewConseil({ ...newConseil, observations: e.target.value })} />
          </div>
        </div>
        <button onClick={planifierConseil} className="btn btn-primary">
          <Plus size={16} /> Planifier
        </button>
      </div>

      <div className="form-container">
        <h2>Conseils programmés</h2>
        <table className="data-table">
          <thead>
            <tr>
              <th>Classe</th>
              <th>Date</th>
              <th>Période</th>
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {conseils.map(conseil => (
              <tr key={conseil.id}>
                <td>{conseil.classe_nom}</td>
                <td>{conseil.date_conseil}</td>
                <td>{conseil.trimestre}</td>
                <td><span className={`status ${conseil.statut}`}>{conseil.statut}</span></td>
                <td>
                  <button className="btn btn-icon"><Edit2 size={16} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderExamens = () => (
    <div>
      <div className="form-container" style={{ marginBottom: '2rem' }}>
        <h2>Organiser un examen</h2>
        <div className="form-grid">
          <div className="form-group">
            <label>Classe</label>
            <select className="form-select" value={newExamen.classe_id} onChange={(e) => setNewExamen({ ...newExamen, classe_id: e.target.value })}>
              <option value="">Sélectionner une classe</option>
            </select>
          </div>
          <div className="form-group">
            <label>Matière</label>
            <select className="form-select" value={newExamen.matiere_id} onChange={(e) => setNewExamen({ ...newExamen, matiere_id: e.target.value })}>
              <option value="">Sélectionner une matière</option>
            </select>
          </div>
          <div className="form-group">
            <label>Date</label>
            <input type="date" className="form-input" value={newExamen.date_examen} onChange={(e) => setNewExamen({ ...newExamen, date_examen: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Heure Début</label>
            <input type="time" className="form-input" value={newExamen.heure_debut} onChange={(e) => setNewExamen({ ...newExamen, heure_debut: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Durée (min)</label>
            <input type="number" className="form-input" value={newExamen.duree} onChange={(e) => setNewExamen({ ...newExamen, duree: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Surveillant</label>
            <select className="form-select" value={newExamen.surveillant_id} onChange={(e) => setNewExamen({ ...newExamen, surveillant_id: e.target.value })}>
              <option value="">Sélectionner un surveillant</option>
            </select>
          </div>
        </div>
        <button onClick={planifierExamen} className="btn btn-primary">
          <Plus size={16} /> Programmer
        </button>
      </div>

      <div className="form-container">
        <h2>Examens programmés</h2>
        <div className="stats-grid">
          {examens.map(examen => (
            <div key={examen.id} className="card">
              <h4 style={{ color: 'var(--primary)', marginBottom: '0.5rem' }}>{examen.matiere_nom}</h4>
              <p><strong>Classe:</strong> {examen.classe_nom}</p>
              <p><strong>Date:</strong> {examen.date_examen}</p>
              <p><strong>Heure:</strong> {examen.heure_debut}</p>
              <p><strong>Durée:</strong> {examen.duree} min</p>
              <p><strong>Surveillant:</strong> {examen.surveillant_nom}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderEmploisTemps = () => (
    <div className="form-container">
      <h2>Validation des emplois du temps</h2>
      <div className="stats-grid">
        {emploisTemps.map(emploi => (
          <div key={emploi.id} className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h4>{emploi.classe_nom}</h4>
              <span className={`status ${emploi.statut}`}>{emploi.statut}</span>
            </div>
            <p><strong>Enseignant:</strong> {emploi.enseignant_nom}</p>
            <p><strong>Dernière modification:</strong> {emploi.date_modification}</p>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
              <button className="btn btn-primary"><Eye size={16} /> Voir</button>
              {emploi.statut === 'en_attente' && (
                <button onClick={() => validerEmploiTemps(emploi.id)} className="btn btn-success" style={{ background: 'var(--success)', color: 'white' }}>
                  <CheckCircle size={16} /> Valider
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderRapports = () => (
    <div className="form-container">
      <h2>Rapports pédagogiques</h2>
      <div className="stats-grid">
        {rapportsPedagogiques.map(rapport => (
          <div key={rapport.id} className="card">
            <h4>{rapport.titre}</h4>
            <p>{rapport.description}</p>
            <div style={{ marginTop: '1rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              <span>Période: {rapport.periode}</span>
              <br />
              <span>Créé le: {rapport.date_creation}</span>
            </div>
            <button className="btn btn-primary" style={{ marginTop: '1rem' }}>
              <FileText size={16} /> Télécharger
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="app-dashboard">
      <div className="sidebar">
        <div className="sidebar-header">
          <h2>Espace Censeur</h2>
        </div>
        <nav className="sidebar-nav">
          {[
            { id: 'overview', icon: TrendingUp, label: 'Aperçu' },
            { id: 'resultats', icon: Award, label: 'Résultats' },
            { id: 'conseils', icon: Users, label: 'Conseils de classe' },
            { id: 'examens', icon: FileText, label: 'Examens' },
            { id: 'emplois', icon: Calendar, label: 'Emplois du temps' },
            { id: 'rapports', icon: BookOpen, label: 'Rapports' },
            { id: 'messages', icon: MessageSquare, label: 'Messages' }
          ].map(item => (
            <button 
              key={item.id}
              className={activeTab === item.id ? 'active' : ''}
              onClick={() => setActiveTab(item.id)}
            >
              <item.icon size={20} /> {item.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="main-content">
        <header className="page-header">
          <div>
            <h1>Tableau de Bord</h1>
            <p style={{ color: 'var(--text-muted)' }}>Bienvenue dans votre espace de gestion</p>
          </div>
          <div className="header-actions">
            <NotificationBell userId={localStorage.getItem('userId')} />
          </div>
        </header>

        <main className="content-area">
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'resultats' && renderResultats()}
          {activeTab === 'conseils' && renderConseils()}
          {activeTab === 'examens' && renderExamens()}
          {activeTab === 'emplois' && renderEmploisTemps()}
          {activeTab === 'rapports' && renderRapports()}
          {activeTab === 'messages' && <Messagerie userId={localStorage.getItem('userId')} userName={localStorage.getItem('userName') || 'Censeur'} />}
        </main>
      </div>
    </div>
  );
};

export default DashboardCenseur;