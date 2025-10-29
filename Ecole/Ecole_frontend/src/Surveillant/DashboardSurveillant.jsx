import React, { useState, useEffect } from 'react';
import { 
  Clock, Users, AlertTriangle, CheckCircle, 
  Calendar, FileText, Eye, Plus, Edit2, 
  Shield, UserCheck, UserX, Bell, MessageSquare
} from 'lucide-react';
import api from '../api';
import Messagerie from '../components/Messagerie';
import NotificationBell from '../components/NotificationBell';
import '../styles/dashboard.css';

const DashboardSurveillant = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [retards, setRetards] = useState([]);
  const [absences, setAbsences] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [sanctions, setSanctions] = useState([]);
  const [planning, setPlanning] = useState([]);
  const [entreesSorties, setEntreesSorties] = useState([]);

  const [newIncident, setNewIncident] = useState({
    eleve_id: '',
    type: '',
    description: '',
    gravite: 'faible',
    date_incident: new Date().toISOString().split('T')[0]
  });

  const [newSanction, setNewSanction] = useState({
    eleve_id: '',
    incident_id: '',
    type_sanction: '',
    duree: '',
    description: ''
  });

  useEffect(() => {
    fetchSurveillantData();
  }, []);

  const fetchSurveillantData = async () => {
    try {
      setLoading(true);
      const [retardsRes, absencesRes, incidentsRes] = await Promise.all([
        api.get('/surveillant/retards'),
        api.get('/surveillant/absences'),
        api.get('/surveillant/incidents')
      ]);
      
      setRetards(retardsRes.data);
      setAbsences(absencesRes.data);
      setIncidents(incidentsRes.data);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const marquerRetard = async (eleveId) => {
    try {
      await api.post('/retards', {
        eleve_id: eleveId,
        date_retard: new Date().toISOString(),
        heure_arrivee: new Date().toTimeString().split(' ')[0]
      });
      fetchSurveillantData();
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const marquerAbsence = async (eleveId) => {
    try {
      await api.post('/absences', {
        eleve_id: eleveId,
        date_absence: new Date().toISOString().split('T')[0],
        type: 'non_justifiee'
      });
      fetchSurveillantData();
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const ajouterIncident = async () => {
    try {
      await api.post('/incidents', newIncident);
      setNewIncident({
        eleve_id: '',
        type: '',
        description: '',
        gravite: 'faible',
        date_incident: new Date().toISOString().split('T')[0]
      });
      fetchSurveillantData();
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const ajouterSanction = async () => {
    try {
      await api.post('/sanctions', newSanction);
      setNewSanction({
        eleve_id: '',
        incident_id: '',
        type_sanction: '',
        duree: '',
        description: ''
      });
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const renderOverview = () => (
    <div className="overview-grid">
      <div className="stat-card">
        <Clock className="stat-icon" />
        <div>
          <h3>Retards aujourd'hui</h3>
          <p>{retards.filter(r => r.date_retard === new Date().toISOString().split('T')[0]).length}</p>
        </div>
      </div>
      <div className="stat-card">
        <UserX className="stat-icon" />
        <div>
          <h3>Absences aujourd'hui</h3>
          <p>{absences.filter(a => a.date_absence === new Date().toISOString().split('T')[0]).length}</p>
        </div>
      </div>
      <div className="stat-card">
        <AlertTriangle className="stat-icon" />
        <div>
          <h3>Incidents cette semaine</h3>
          <p>{incidents.length}</p>
        </div>
      </div>
      <div className="stat-card">
        <Shield className="stat-icon" />
        <div>
          <h3>Sanctions en cours</h3>
          <p>{sanctions.filter(s => s.statut === 'en_cours').length}</p>
        </div>
      </div>
    </div>
  );

  const renderRetardsAbsences = () => (
    <div className="retards-absences-section">
      <div className="pointage-section">
        <h3>Pointage des élèves</h3>
        <div className="pointage-controls">
          <input type="text" placeholder="Rechercher un élève..." />
          <button className="btn-retard" onClick={() => marquerRetard()}>
            <Clock size={16} /> Marquer retard
          </button>
          <button className="btn-absence" onClick={() => marquerAbsence()}>
            <UserX size={16} /> Marquer absence
          </button>
        </div>
      </div>

      <div className="retards-list">
        <h4>Retards du jour</h4>
        <table>
          <thead>
            <tr>
              <th>Élève</th>
              <th>Classe</th>
              <th>Heure d'arrivée</th>
              <th>Retard</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {retards.map(retard => (
              <tr key={retard.id}>
                <td>{retard.eleve_nom}</td>
                <td>{retard.classe}</td>
                <td>{retard.heure_arrivee}</td>
                <td>{retard.duree_retard} min</td>
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

      <div className="absences-list">
        <h4>Absences du jour</h4>
        <table>
          <thead>
            <tr>
              <th>Élève</th>
              <th>Classe</th>
              <th>Type</th>
              <th>Justifiée</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {absences.map(absence => (
              <tr key={absence.id}>
                <td>{absence.eleve_nom}</td>
                <td>{absence.classe}</td>
                <td>{absence.type}</td>
                <td>
                  {absence.justifiee ? (
                    <CheckCircle className="text-green" size={16} />
                  ) : (
                    <AlertTriangle className="text-red" size={16} />
                  )}
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

  const renderIncidents = () => (
    <div className="incidents-section">
      <div className="form-section">
        <h3>Signaler un incident</h3>
        <div className="form-grid">
          <select
            value={newIncident.eleve_id}
            onChange={(e) => setNewIncident({...newIncident, eleve_id: e.target.value})}
          >
            <option value="">Sélectionner un élève</option>
          </select>

          <select
            value={newIncident.type}
            onChange={(e) => setNewIncident({...newIncident, type: e.target.value})}
          >
            <option value="">Type d'incident</option>
            <option value="bagarre">Bagarre</option>
            <option value="insolence">Insolence</option>
            <option value="degradation">Dégradation</option>
            <option value="autre">Autre</option>
          </select>

          <select
            value={newIncident.gravite}
            onChange={(e) => setNewIncident({...newIncident, gravite: e.target.value})}
          >
            <option value="faible">Faible</option>
            <option value="moyenne">Moyenne</option>
            <option value="grave">Grave</option>
          </select>

          <textarea
            placeholder="Description de l'incident"
            value={newIncident.description}
            onChange={(e) => setNewIncident({...newIncident, description: e.target.value})}
          />

          <button onClick={ajouterIncident} className="btn-primary">
            <Plus size={16} /> Signaler
          </button>
        </div>
      </div>

      <div className="incidents-list">
        <h3>Incidents récents</h3>
        {incidents.map(incident => (
          <div key={incident.id} className={`incident-item gravite-${incident.gravite}`}>
            <div className="incident-header">
              <h4>{incident.type}</h4>
              <span className={`gravite-badge ${incident.gravite}`}>
                {incident.gravite}
              </span>
            </div>
            <p><strong>Élève:</strong> {incident.eleve_nom}</p>
            <p><strong>Date:</strong> {incident.date_incident}</p>
            <p><strong>Description:</strong> {incident.description}</p>
          </div>
        ))}
      </div>
    </div>
  );

  const renderSanctions = () => (
    <div className="sanctions-section">
      <div className="form-section">
        <h3>Appliquer une sanction</h3>
        <div className="form-grid">
          <select
            value={newSanction.incident_id}
            onChange={(e) => setNewSanction({...newSanction, incident_id: e.target.value})}
          >
            <option value="">Sélectionner un incident</option>
            {incidents.map(incident => (
              <option key={incident.id} value={incident.id}>
                {incident.type} - {incident.eleve_nom}
              </option>
            ))}
          </select>

          <select
            value={newSanction.type_sanction}
            onChange={(e) => setNewSanction({...newSanction, type_sanction: e.target.value})}
          >
            <option value="">Type de sanction</option>
            <option value="avertissement">Avertissement</option>
            <option value="retenue">Retenue</option>
            <option value="exclusion_temporaire">Exclusion temporaire</option>
            <option value="travail_interet_general">Travail d'intérêt général</option>
          </select>

          <input
            type="text"
            placeholder="Durée (ex: 2 heures, 3 jours)"
            value={newSanction.duree}
            onChange={(e) => setNewSanction({...newSanction, duree: e.target.value})}
          />

          <textarea
            placeholder="Description de la sanction"
            value={newSanction.description}
            onChange={(e) => setNewSanction({...newSanction, description: e.target.value})}
          />

          <button onClick={ajouterSanction} className="btn-primary">
            <Plus size={16} /> Appliquer
          </button>
        </div>
      </div>

      <div className="sanctions-list">
        <h3>Sanctions en cours</h3>
        <table>
          <thead>
            <tr>
              <th>Élève</th>
              <th>Type</th>
              <th>Durée</th>
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sanctions.map(sanction => (
              <tr key={sanction.id}>
                <td>{sanction.eleve_nom}</td>
                <td>{sanction.type_sanction}</td>
                <td>{sanction.duree}</td>
                <td>
                  <span className={`status ${sanction.statut}`}>
                    {sanction.statut}
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

  const renderPlanning = () => (
    <div className="planning-section">
      <h3>Planning de surveillance</h3>
      <div className="planning-grid">
        <table className="planning-table">
          <thead>
            <tr>
              <th>Heure</th>
              <th>Lundi</th>
              <th>Mardi</th>
              <th>Mercredi</th>
              <th>Jeudi</th>
              <th>Vendredi</th>
            </tr>
          </thead>
          <tbody>
            {planning.map(creneau => (
              <tr key={creneau.id}>
                <td>{creneau.heure}</td>
                <td>{creneau.lundi}</td>
                <td>{creneau.mardi}</td>
                <td>{creneau.mercredi}</td>
                <td>{creneau.jeudi}</td>
                <td>{creneau.vendredi}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="dashboard-surveillant">
      <div className="sidebar">
        <div className="sidebar-header">
          <h2>Espace Surveillant</h2>
        </div>
        <nav className="sidebar-nav">
          <button 
            className={activeTab === 'overview' ? 'active' : ''}
            onClick={() => setActiveTab('overview')}
          >
            <Shield size={20} /> Aperçu
          </button>
          <button 
            className={activeTab === 'pointage' ? 'active' : ''}
            onClick={() => setActiveTab('pointage')}
          >
            <UserCheck size={20} /> Pointage
          </button>
          <button 
            className={activeTab === 'incidents' ? 'active' : ''}
            onClick={() => setActiveTab('incidents')}
          >
            <AlertTriangle size={20} /> Incidents
          </button>
          <button 
            className={activeTab === 'sanctions' ? 'active' : ''}
            onClick={() => setActiveTab('sanctions')}
          >
            <FileText size={20} /> Sanctions
          </button>
          <button 
            className={activeTab === 'planning' ? 'active' : ''}
            onClick={() => setActiveTab('planning')}
          >
            <Calendar size={20} /> Planning
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
          <h1>Dashboard Surveillant</h1>
          <div className="header-actions">
            <NotificationBell userId={localStorage.getItem('userId')} />
          </div>
        </header>

        <main className="content-area">
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'pointage' && renderRetardsAbsences()}
          {activeTab === 'incidents' && renderIncidents()}
          {activeTab === 'sanctions' && renderSanctions()}
          {activeTab === 'planning' && renderPlanning()}
          {activeTab === 'messages' && <Messagerie userId={localStorage.getItem('userId')} userName={localStorage.getItem('userName') || 'Surveillant'} />}
        </main>
      </div>
    </div>
  );
};

export default DashboardSurveillant;