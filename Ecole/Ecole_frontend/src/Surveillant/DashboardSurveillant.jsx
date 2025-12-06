import React, { useState, useEffect } from 'react';
import {
  Clock, Users, AlertTriangle, CheckCircle,
  Calendar, FileText, Eye, Plus, Edit2,
  Shield, UserCheck, UserX, Bell, MessageSquare, LogOut
} from 'lucide-react';
import api from '../api';
import Messagerie from '../components/Messagerie';
import NotificationBell from '../components/NotificationBell';
import '../styles/GlobalStyles.css';

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
    <div className="stats-grid">
      <div className="stat-card">
        <div className="stat-icon" style={{ background: 'linear-gradient(135deg, var(--warning) 0%, #e8590c 100%)' }}>
          <Clock size={24} />
        </div>
        <div className="stat-content">
          <h3>{retards.filter(r => r.date_retard === new Date().toISOString().split('T')[0]).length}</h3>
          <p>Retards aujourd'hui</p>
        </div>
      </div>
      <div className="stat-card">
        <div className="stat-icon" style={{ background: 'linear-gradient(135deg, var(--error) 0%, #c0392b 100%)' }}>
          <UserX size={24} />
        </div>
        <div className="stat-content">
          <h3>{absences.filter(a => a.date_absence === new Date().toISOString().split('T')[0]).length}</h3>
          <p>Absences aujourd'hui</p>
        </div>
      </div>
      <div className="stat-card">
        <div className="stat-icon" style={{ background: 'linear-gradient(135deg, var(--secondary-1) 0%, #553098 100%)' }}>
          <AlertTriangle size={24} />
        </div>
        <div className="stat-content">
          <h3>{incidents.length}</h3>
          <p>Incidents cette semaine</p>
        </div>
      </div>
      <div className="stat-card">
        <div className="stat-icon" style={{ background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)' }}>
          <Shield size={24} />
        </div>
        <div className="stat-content">
          <h3>{sanctions.filter(s => s.statut === 'en_cours').length}</h3>
          <p>Sanctions en cours</p>
        </div>
      </div>
    </div>
  );

  const renderRetardsAbsences = () => (
    <div className="form-container">
      <h2>Pointage des élèves</h2>
      <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <input type="text" className="form-input" placeholder="Rechercher un élève..." style={{ flex: 1 }} />
        <button className="btn btn-warning" onClick={() => marquerRetard()} style={{ background: 'var(--warning)', color: 'white' }}>
          <Clock size={16} /> Marquer retard
        </button>
        <button className="btn btn-danger" onClick={() => marquerAbsence()}>
          <UserX size={16} /> Marquer absence
        </button>
      </div>

      <div className="stats-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <div className="card">
          <h4 style={{ marginBottom: '1rem', color: 'var(--warning)' }}>Retards du jour</h4>
          <table className="data-table">
            <thead>
              <tr>
                <th>Élève</th>
                <th>Classe</th>
                <th>Heure</th>
                <th>Durée</th>
              </tr>
            </thead>
            <tbody>
              {retards.map(retard => (
                <tr key={retard.id}>
                  <td>{retard.eleve_nom}</td>
                  <td>{retard.classe}</td>
                  <td>{retard.heure_arrivee}</td>
                  <td>{retard.duree_retard} min</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card">
          <h4 style={{ marginBottom: '1rem', color: 'var(--error)' }}>Absences du jour</h4>
          <table className="data-table">
            <thead>
              <tr>
                <th>Élève</th>
                <th>Classe</th>
                <th>Justifiée</th>
              </tr>
            </thead>
            <tbody>
              {absences.map(absence => (
                <tr key={absence.id}>
                  <td>{absence.eleve_nom}</td>
                  <td>{absence.classe}</td>
                  <td>
                    {absence.justifiee ? (
                      <CheckCircle className="text-success" size={16} />
                    ) : (
                      <AlertTriangle className="text-error" size={16} />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderIncidents = () => (
    <div>
      <div className="form-container" style={{ marginBottom: '2rem' }}>
        <h2>Signaler un incident</h2>
        <div className="form-grid">
          <div className="form-group">
            <label>Élève</label>
            <select className="form-select" value={newIncident.eleve_id} onChange={(e) => setNewIncident({ ...newIncident, eleve_id: e.target.value })}>
              <option value="">Sélectionner un élève</option>
            </select>
          </div>
          <div className="form-group">
            <label>Type</label>
            <select className="form-select" value={newIncident.type} onChange={(e) => setNewIncident({ ...newIncident, type: e.target.value })}>
              <option value="">Type d'incident</option>
              <option value="bagarre">Bagarre</option>
              <option value="insolence">Insolence</option>
              <option value="degradation">Dégradation</option>
              <option value="autre">Autre</option>
            </select>
          </div>
          <div className="form-group">
            <label>Gravité</label>
            <select className="form-select" value={newIncident.gravite} onChange={(e) => setNewIncident({ ...newIncident, gravite: e.target.value })}>
              <option value="faible">Faible</option>
              <option value="moyenne">Moyenne</option>
              <option value="grave">Grave</option>
            </select>
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea className="form-input" placeholder="Description de l'incident" value={newIncident.description} onChange={(e) => setNewIncident({ ...newIncident, description: e.target.value })} />
          </div>
        </div>
        <button onClick={ajouterIncident} className="btn btn-primary">
          <Plus size={16} /> Signaler
        </button>
      </div>

      <div className="form-container">
        <h2>Incidents récents</h2>
        <div className="stats-grid">
          {incidents.map(incident => (
            <div key={incident.id} className="card" style={{ borderLeft: `4px solid var(--${incident.gravite === 'grave' ? 'error' : incident.gravite === 'moyenne' ? 'warning' : 'info'})` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <h4 style={{ margin: 0 }}>{incident.type}</h4>
                <span className={`status ${incident.gravite}`}>{incident.gravite}</span>
              </div>
              <p><strong>Élève:</strong> {incident.eleve_nom}</p>
              <p><strong>Date:</strong> {incident.date_incident}</p>
              <p><strong>Description:</strong> {incident.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderSanctions = () => (
    <div>
      <div className="form-container" style={{ marginBottom: '2rem' }}>
        <h2>Appliquer une sanction</h2>
        <div className="form-grid">
          <div className="form-group">
            <label>Incident</label>
            <select className="form-select" value={newSanction.incident_id} onChange={(e) => setNewSanction({ ...newSanction, incident_id: e.target.value })}>
              <option value="">Sélectionner un incident</option>
              {incidents.map(incident => (
                <option key={incident.id} value={incident.id}>
                  {incident.type} - {incident.eleve_nom}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Type de sanction</label>
            <select className="form-select" value={newSanction.type_sanction} onChange={(e) => setNewSanction({ ...newSanction, type_sanction: e.target.value })}>
              <option value="">Type de sanction</option>
              <option value="avertissement">Avertissement</option>
              <option value="retenue">Retenue</option>
              <option value="exclusion_temporaire">Exclusion temporaire</option>
              <option value="travail_interet_general">Travail d'intérêt général</option>
            </select>
          </div>
          <div className="form-group">
            <label>Durée</label>
            <input type="text" className="form-input" placeholder="Ex: 2 heures, 3 jours" value={newSanction.duree} onChange={(e) => setNewSanction({ ...newSanction, duree: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea className="form-input" placeholder="Description de la sanction" value={newSanction.description} onChange={(e) => setNewSanction({ ...newSanction, description: e.target.value })} />
          </div>
        </div>
        <button onClick={ajouterSanction} className="btn btn-primary">
          <Plus size={16} /> Appliquer
        </button>
      </div>

      <div className="form-container">
        <h2>Sanctions en cours</h2>
        <table className="data-table">
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
                <td><span className={`status ${sanction.statut}`}>{sanction.statut}</span></td>
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

  const renderPlanning = () => (
    <div className="form-container">
      <h2>Planning de surveillance</h2>
      <table className="data-table">
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
  );

  return (
    <div className="app-dashboard">
      <div className="sidebar">
        <div className="sidebar-header">
          <h2>Espace Surveillant</h2>
        </div>
        <nav className="sidebar-nav">
          {[
            { id: 'overview', icon: Shield, label: 'Aperçu' },
            { id: 'pointage', icon: UserCheck, label: 'Pointage' },
            { id: 'incidents', icon: AlertTriangle, label: 'Incidents' },
            { id: 'sanctions', icon: FileText, label: 'Sanctions' },
            { id: 'planning', icon: Calendar, label: 'Planning' },
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
            <p style={{ color: 'var(--text-muted)' }}>Bienvenue dans votre espace de surveillance</p>
          </div>
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