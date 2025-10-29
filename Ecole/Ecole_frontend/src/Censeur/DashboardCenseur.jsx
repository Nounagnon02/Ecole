import React, { useState, useEffect } from 'react';
import { 
  BookOpen, Users, Calendar, TrendingUp, 
  FileText, Award, Clock, Settings, 
  Plus, Edit2, Eye, CheckCircle, MessageSquare
} from 'lucide-react';
import api from '../api';
import Messagerie from '../components/Messagerie';
import NotificationBell from '../components/NotificationBell';
import '../styles/dashboard.css';

const DashboardCenseur = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [resultats, setResultats] = useState([]);
  const [conseils, setConseils] = useState([]);
  const [examens, setExamens] = useState([]);
  const [emploisTemps, setEmploisTemps] = useState([]);
  const [rapportsPedagogiques, setRapportsPedagogiques] = useState([]);
  const [enseignants, setEnseignants] = useState([]);

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
      setNewConseil({
        classe_id: '',
        date_conseil: '',
        trimestre: '',
        observations: ''
      });
      fetchCenseurData();
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const planifierExamen = async () => {
    try {
      await api.post('/examens', newExamen);
      setNewExamen({
        matiere_id: '',
        classe_id: '',
        date_examen: '',
        heure_debut: '',
        duree: '',
        surveillant_id: ''
      });
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
    <div className="overview-grid">
      <div className="stat-card">
        <Users className="stat-icon" />
        <div>
          <h3>Classes suivies</h3>
          <p>{resultats.length}</p>
        </div>
      </div>
      <div className="stat-card">
        <Calendar className="stat-icon" />
        <div>
          <h3>Conseils planifiés</h3>
          <p>{conseils.length}</p>
        </div>
      </div>
      <div className="stat-card">
        <FileText className="stat-icon" />
        <div>
          <h3>Examens à venir</h3>
          <p>{examens.filter(e => new Date(e.date_examen) > new Date()).length}</p>
        </div>
      </div>
      <div className="stat-card">
        <TrendingUp className="stat-icon" />
        <div>
          <h3>Taux de réussite</h3>
          <p>{resultats.taux_reussite || 0}%</p>
        </div>
      </div>
    </div>
  );

  const renderResultats = () => (
    <div className="resultats-section">
      <h3>Suivi des résultats scolaires</h3>
      <div className="resultats-grid">
        {resultats.map(resultat => (
          <div key={resultat.id} className="resultat-card">
            <h4>{resultat.classe_nom}</h4>
            <div className="resultat-stats">
              <div className="stat">
                <span>Moyenne générale</span>
                <strong>{resultat.moyenne_generale}</strong>
              </div>
              <div className="stat">
                <span>Taux de réussite</span>
                <strong>{resultat.taux_reussite}%</strong>
              </div>
              <div className="stat">
                <span>Élèves en difficulté</span>
                <strong>{resultat.eleves_difficulte}</strong>
              </div>
            </div>
            <button className="btn-details">
              <Eye size={16} /> Voir détails
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  const renderConseils = () => (
    <div className="conseils-section">
      <div className="form-section">
        <h3>Planifier un conseil de classe</h3>
        <div className="form-grid">
          <select
            value={newConseil.classe_id}
            onChange={(e) => setNewConseil({...newConseil, classe_id: e.target.value})}
          >
            <option value="">Sélectionner une classe</option>
          </select>

          <input
            type="date"
            value={newConseil.date_conseil}
            onChange={(e) => setNewConseil({...newConseil, date_conseil: e.target.value})}
          />

          <select
            value={newConseil.trimestre}
            onChange={(e) => setNewConseil({...newConseil, trimestre: e.target.value})}
          >
            <option value="">Sélectionner la période</option>
            <option value="1er_trimestre">1er Trimestre</option>
            <option value="2eme_trimestre">2ème Trimestre</option>
            <option value="3eme_trimestre">3ème Trimestre</option>
          </select>

          <textarea
            placeholder="Observations"
            value={newConseil.observations}
            onChange={(e) => setNewConseil({...newConseil, observations: e.target.value})}
          />

          <button onClick={planifierConseil} className="btn-primary">
            <Plus size={16} /> Planifier
          </button>
        </div>
      </div>

      <div className="conseils-list">
        <h3>Conseils programmés</h3>
        <table>
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
                <td>
                  <span className={`status ${conseil.statut}`}>
                    {conseil.statut}
                  </span>
                </td>
                <td>
                  <button className="btn-action">
                    <Edit2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderExamens = () => (
    <div className="examens-section">
      <div className="form-section">
        <h3>Organiser un examen</h3>
        <div className="form-grid">
          <select
            value={newExamen.classe_id}
            onChange={(e) => setNewExamen({...newExamen, classe_id: e.target.value})}
          >
            <option value="">Sélectionner une classe</option>
          </select>

          <select
            value={newExamen.matiere_id}
            onChange={(e) => setNewExamen({...newExamen, matiere_id: e.target.value})}
          >
            <option value="">Sélectionner une matière</option>
          </select>

          <input
            type="date"
            value={newExamen.date_examen}
            onChange={(e) => setNewExamen({...newExamen, date_examen: e.target.value})}
          />

          <input
            type="time"
            value={newExamen.heure_debut}
            onChange={(e) => setNewExamen({...newExamen, heure_debut: e.target.value})}
          />

          <input
            type="number"
            placeholder="Durée (minutes)"
            value={newExamen.duree}
            onChange={(e) => setNewExamen({...newExamen, duree: e.target.value})}
          />

          <select
            value={newExamen.surveillant_id}
            onChange={(e) => setNewExamen({...newExamen, surveillant_id: e.target.value})}
          >
            <option value="">Sélectionner un surveillant</option>
          </select>

          <button onClick={planifierExamen} className="btn-primary">
            <Plus size={16} /> Programmer
          </button>
        </div>
      </div>

      <div className="examens-list">
        <h3>Examens programmés</h3>
        <div className="examens-grid">
          {examens.map(examen => (
            <div key={examen.id} className="examen-card">
              <h4>{examen.matiere_nom}</h4>
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
    <div className="emplois-temps-section">
      <h3>Validation des emplois du temps</h3>
      <div className="emplois-list">
        {emploisTemps.map(emploi => (
          <div key={emploi.id} className="emploi-card">
            <div className="emploi-header">
              <h4>{emploi.classe_nom}</h4>
              <span className={`status ${emploi.statut}`}>
                {emploi.statut}
              </span>
            </div>
            <p><strong>Enseignant:</strong> {emploi.enseignant_nom}</p>
            <p><strong>Dernière modification:</strong> {emploi.date_modification}</p>
            <div className="emploi-actions">
              <button className="btn-view">
                <Eye size={16} /> Voir
              </button>
              {emploi.statut === 'en_attente' && (
                <button 
                  onClick={() => validerEmploiTemps(emploi.id)}
                  className="btn-validate"
                >
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
    <div className="rapports-section">
      <h3>Rapports pédagogiques</h3>
      <div className="rapports-grid">
        {rapportsPedagogiques.map(rapport => (
          <div key={rapport.id} className="rapport-card">
            <h4>{rapport.titre}</h4>
            <p>{rapport.description}</p>
            <div className="rapport-meta">
              <span>Période: {rapport.periode}</span>
              <span>Créé le: {rapport.date_creation}</span>
            </div>
            <button className="btn-download">
              <FileText size={16} /> Télécharger
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="dashboard-censeur">
      <div className="sidebar">
        <div className="sidebar-header">
          <h2>Espace Censeur</h2>
        </div>
        <nav className="sidebar-nav">
          <button 
            className={activeTab === 'overview' ? 'active' : ''}
            onClick={() => setActiveTab('overview')}
          >
            <TrendingUp size={20} /> Aperçu
          </button>
          <button 
            className={activeTab === 'resultats' ? 'active' : ''}
            onClick={() => setActiveTab('resultats')}
          >
            <Award size={20} /> Résultats
          </button>
          <button 
            className={activeTab === 'conseils' ? 'active' : ''}
            onClick={() => setActiveTab('conseils')}
          >
            <Users size={20} /> Conseils de classe
          </button>
          <button 
            className={activeTab === 'examens' ? 'active' : ''}
            onClick={() => setActiveTab('examens')}
          >
            <FileText size={20} /> Examens
          </button>
          <button 
            className={activeTab === 'emplois' ? 'active' : ''}
            onClick={() => setActiveTab('emplois')}
          >
            <Calendar size={20} /> Emplois du temps
          </button>
          <button 
            className={activeTab === 'rapports' ? 'active' : ''}
            onClick={() => setActiveTab('rapports')}
          >
            <BookOpen size={20} /> Rapports
          </button>
          <button 
            className={activeTab === 'messages' ? 'active' : ''}
            onClick={() => setActiveTab('messages')}
          >
            <MessageSquare size={20} /> Messages
          </button>
        </nav>
      </div>

      <div className="main-content">
        <header className="main-header">
          <h1>Dashboard Censeur</h1>
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