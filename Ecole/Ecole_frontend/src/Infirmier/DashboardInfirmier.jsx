import React, { useState, useEffect } from 'react';
import { 
  Heart, Users, AlertTriangle, Calendar, 
  FileText, Plus, Edit2, Eye, Pill, 
  Activity, Shield, Phone, Clock, MessageSquare
} from 'lucide-react';
import api from '../api';
import Messagerie from '../components/Messagerie';
import NotificationBell from '../components/NotificationBell';
import '../styles/dashboard.css';

const DashboardInfirmier = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [dossiersMedicaux, setDossiersMedicaux] = useState([]);
  const [consultations, setConsultations] = useState([]);
  const [traitements, setTraitements] = useState([]);
  const [vaccinations, setVaccinations] = useState([]);
  const [urgences, setUrgences] = useState([]);
  const [statistiques, setStatistiques] = useState({});

  const [newConsultation, setNewConsultation] = useState({
    eleve_id: '',
    symptomes: '',
    diagnostic: '',
    traitement: '',
    observations: '',
    date_consultation: new Date().toISOString().split('T')[0]
  });

  const [newTraitement, setNewTraitement] = useState({
    eleve_id: '',
    medicament: '',
    posologie: '',
    duree: '',
    date_debut: '',
    date_fin: ''
  });

  const [newVaccination, setNewVaccination] = useState({
    eleve_id: '',
    vaccin: '',
    date_vaccination: '',
    rappel_prevu: '',
    lot_vaccin: ''
  });

  useEffect(() => {
    fetchInfirmierData();
  }, []);

  const fetchInfirmierData = async () => {
    try {
      setLoading(true);
      const [dossiersRes, consultationsRes, statistiquesRes] = await Promise.all([
        api.get('/infirmier/dossiers-medicaux'),
        api.get('/infirmier/consultations'),
        api.get('/infirmier/statistiques')
      ]);
      
      setDossiersMedicaux(dossiersRes.data);
      setConsultations(consultationsRes.data);
      setStatistiques(statistiquesRes.data);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const ajouterConsultation = async () => {
    try {
      await api.post('/consultations', newConsultation);
      setNewConsultation({
        eleve_id: '',
        symptomes: '',
        diagnostic: '',
        traitement: '',
        observations: '',
        date_consultation: new Date().toISOString().split('T')[0]
      });
      fetchInfirmierData();
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const ajouterTraitement = async () => {
    try {
      await api.post('/traitements', newTraitement);
      setNewTraitement({
        eleve_id: '',
        medicament: '',
        posologie: '',
        duree: '',
        date_debut: '',
        date_fin: ''
      });
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const ajouterVaccination = async () => {
    try {
      await api.post('/vaccinations', newVaccination);
      setNewVaccination({
        eleve_id: '',
        vaccin: '',
        date_vaccination: '',
        rappel_prevu: '',
        lot_vaccin: ''
      });
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const declencherUrgence = async (eleveId, typeUrgence) => {
    try {
      await api.post('/urgences', {
        eleve_id: eleveId,
        type_urgence: typeUrgence,
        date_urgence: new Date().toISOString()
      });
      alert('Urgence déclarée - Parents contactés');
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const renderOverview = () => (
    <div className="overview-grid">
      <div className="stat-card">
        <Heart className="stat-icon" />
        <div>
          <h3>Consultations aujourd'hui</h3>
          <p>{consultations.filter(c => c.date_consultation === new Date().toISOString().split('T')[0]).length}</p>
        </div>
      </div>
      <div className="stat-card">
        <Pill className="stat-icon" />
        <div>
          <h3>Traitements en cours</h3>
          <p>{traitements.filter(t => t.statut === 'en_cours').length}</p>
        </div>
      </div>
      <div className="stat-card">
        <Shield className="stat-icon" />
        <div>
          <h3>Vaccinations à jour</h3>
          <p>{statistiques.vaccinations_a_jour || 0}%</p>
        </div>
      </div>
      <div className="stat-card">
        <AlertTriangle className="stat-icon" />
        <div>
          <h3>Urgences ce mois</h3>
          <p>{urgences.length}</p>
        </div>
      </div>
    </div>
  );

  const renderDossiersMedicaux = () => (
    <div className="dossiers-section">
      <h3>Dossiers médicaux des élèves</h3>
      <div className="dossiers-grid">
        {dossiersMedicaux.map(dossier => (
          <div key={dossier.id} className="dossier-card">
            <div className="dossier-header">
              <h4>{dossier.eleve_nom}</h4>
              <span className="classe">{dossier.classe}</span>
            </div>
            <div className="dossier-info">
              <div className="info-item">
                <strong>Allergies:</strong>
                <span>{dossier.allergies || 'Aucune'}</span>
              </div>
              <div className="info-item">
                <strong>Traitements:</strong>
                <span>{dossier.traitements_permanents || 'Aucun'}</span>
              </div>
              <div className="info-item">
                <strong>Groupe sanguin:</strong>
                <span>{dossier.groupe_sanguin || 'Non renseigné'}</span>
              </div>
              <div className="info-item">
                <strong>Contact urgence:</strong>
                <span>{dossier.contact_urgence}</span>
              </div>
            </div>
            <div className="dossier-actions">
              <button className="btn-view">
                <Eye size={16} /> Voir
              </button>
              <button className="btn-edit">
                <Edit2 size={16} /> Modifier
              </button>
              <button 
                onClick={() => declencherUrgence(dossier.eleve_id, 'medicale')}
                className="btn-urgence"
              >
                <Phone size={16} /> Urgence
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderConsultations = () => (
    <div className="consultations-section">
      <div className="form-section">
        <h3>Nouvelle consultation</h3>
        <div className="form-grid">
          <select
            value={newConsultation.eleve_id}
            onChange={(e) => setNewConsultation({...newConsultation, eleve_id: e.target.value})}
          >
            <option value="">Sélectionner un élève</option>
          </select>

          <textarea
            placeholder="Symptômes observés"
            value={newConsultation.symptomes}
            onChange={(e) => setNewConsultation({...newConsultation, symptomes: e.target.value})}
          />

          <textarea
            placeholder="Diagnostic"
            value={newConsultation.diagnostic}
            onChange={(e) => setNewConsultation({...newConsultation, diagnostic: e.target.value})}
          />

          <textarea
            placeholder="Traitement prescrit"
            value={newConsultation.traitement}
            onChange={(e) => setNewConsultation({...newConsultation, traitement: e.target.value})}
          />

          <textarea
            placeholder="Observations"
            value={newConsultation.observations}
            onChange={(e) => setNewConsultation({...newConsultation, observations: e.target.value})}
          />

          <button onClick={ajouterConsultation} className="btn-primary">
            <Plus size={16} /> Enregistrer
          </button>
        </div>
      </div>

      <div className="consultations-list">
        <h3>Consultations récentes</h3>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Élève</th>
              <th>Symptômes</th>
              <th>Diagnostic</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {consultations.map(consultation => (
              <tr key={consultation.id}>
                <td>{consultation.date_consultation}</td>
                <td>{consultation.eleve_nom}</td>
                <td>{consultation.symptomes}</td>
                <td>{consultation.diagnostic}</td>
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
    </div>
  );

  const renderTraitements = () => (
    <div className="traitements-section">
      <div className="form-section">
        <h3>Nouveau traitement</h3>
        <div className="form-grid">
          <select
            value={newTraitement.eleve_id}
            onChange={(e) => setNewTraitement({...newTraitement, eleve_id: e.target.value})}
          >
            <option value="">Sélectionner un élève</option>
          </select>

          <input
            type="text"
            placeholder="Médicament"
            value={newTraitement.medicament}
            onChange={(e) => setNewTraitement({...newTraitement, medicament: e.target.value})}
          />

          <input
            type="text"
            placeholder="Posologie"
            value={newTraitement.posologie}
            onChange={(e) => setNewTraitement({...newTraitement, posologie: e.target.value})}
          />

          <input
            type="text"
            placeholder="Durée du traitement"
            value={newTraitement.duree}
            onChange={(e) => setNewTraitement({...newTraitement, duree: e.target.value})}
          />

          <input
            type="date"
            value={newTraitement.date_debut}
            onChange={(e) => setNewTraitement({...newTraitement, date_debut: e.target.value})}
          />

          <input
            type="date"
            value={newTraitement.date_fin}
            onChange={(e) => setNewTraitement({...newTraitement, date_fin: e.target.value})}
          />

          <button onClick={ajouterTraitement} className="btn-primary">
            <Plus size={16} /> Ajouter
          </button>
        </div>
      </div>

      <div className="traitements-list">
        <h3>Traitements en cours</h3>
        {traitements.map(traitement => (
          <div key={traitement.id} className="traitement-card">
            <div className="traitement-header">
              <h4>{traitement.eleve_nom}</h4>
              <span className={`status ${traitement.statut}`}>
                {traitement.statut}
              </span>
            </div>
            <div className="traitement-details">
              <p><strong>Médicament:</strong> {traitement.medicament}</p>
              <p><strong>Posologie:</strong> {traitement.posologie}</p>
              <p><strong>Période:</strong> {traitement.date_debut} - {traitement.date_fin}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderVaccinations = () => (
    <div className="vaccinations-section">
      <div className="form-section">
        <h3>Enregistrer une vaccination</h3>
        <div className="form-grid">
          <select
            value={newVaccination.eleve_id}
            onChange={(e) => setNewVaccination({...newVaccination, eleve_id: e.target.value})}
          >
            <option value="">Sélectionner un élève</option>
          </select>

          <select
            value={newVaccination.vaccin}
            onChange={(e) => setNewVaccination({...newVaccination, vaccin: e.target.value})}
          >
            <option value="">Type de vaccin</option>
            <option value="DTC">DTC</option>
            <option value="ROR">ROR</option>
            <option value="Hepatite_B">Hépatite B</option>
            <option value="Meningite">Méningite</option>
          </select>

          <input
            type="date"
            value={newVaccination.date_vaccination}
            onChange={(e) => setNewVaccination({...newVaccination, date_vaccination: e.target.value})}
          />

          <input
            type="date"
            placeholder="Date rappel prévu"
            value={newVaccination.rappel_prevu}
            onChange={(e) => setNewVaccination({...newVaccination, rappel_prevu: e.target.value})}
          />

          <input
            type="text"
            placeholder="Lot du vaccin"
            value={newVaccination.lot_vaccin}
            onChange={(e) => setNewVaccination({...newVaccination, lot_vaccin: e.target.value})}
          />

          <button onClick={ajouterVaccination} className="btn-primary">
            <Plus size={16} /> Enregistrer
          </button>
        </div>
      </div>

      <div className="vaccinations-list">
        <h3>Suivi des vaccinations</h3>
        <table>
          <thead>
            <tr>
              <th>Élève</th>
              <th>Vaccin</th>
              <th>Date</th>
              <th>Rappel prévu</th>
              <th>Statut</th>
            </tr>
          </thead>
          <tbody>
            {vaccinations.map(vaccination => (
              <tr key={vaccination.id}>
                <td>{vaccination.eleve_nom}</td>
                <td>{vaccination.vaccin}</td>
                <td>{vaccination.date_vaccination}</td>
                <td>{vaccination.rappel_prevu}</td>
                <td>
                  <span className={`status ${vaccination.statut}`}>
                    {vaccination.statut}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderStatistiques = () => (
    <div className="statistiques-section">
      <h3>Statistiques de santé</h3>
      <div className="stats-grid">
        <div className="stat-card">
          <h4>Consultations ce mois</h4>
          <p className="stat-number">{statistiques.consultations_mois || 0}</p>
        </div>
        <div className="stat-card">
          <h4>Accidents signalés</h4>
          <p className="stat-number">{statistiques.accidents || 0}</p>
        </div>
        <div className="stat-card">
          <h4>Élèves sous traitement</h4>
          <p className="stat-number">{statistiques.eleves_traitement || 0}</p>
        </div>
        <div className="stat-card">
          <h4>Vaccinations en retard</h4>
          <p className="stat-number">{statistiques.vaccinations_retard || 0}</p>
        </div>
      </div>

      <div className="maladies-frequentes">
        <h4>Pathologies les plus fréquentes</h4>
        <div className="pathologies-list">
          {statistiques.pathologies_frequentes?.map((pathologie, index) => (
            <div key={index} className="pathologie-item">
              <span>{pathologie.nom}</span>
              <span className="count">{pathologie.count} cas</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="dashboard-infirmier">
      <div className="sidebar">
        <div className="sidebar-header">
          <h2>Espace Infirmier</h2>
        </div>
        <nav className="sidebar-nav">
          <button 
            className={activeTab === 'overview' ? 'active' : ''}
            onClick={() => setActiveTab('overview')}
          >
            <Heart size={20} /> Aperçu
          </button>
          <button 
            className={activeTab === 'dossiers' ? 'active' : ''}
            onClick={() => setActiveTab('dossiers')}
          >
            <FileText size={20} /> Dossiers médicaux
          </button>
          <button 
            className={activeTab === 'consultations' ? 'active' : ''}
            onClick={() => setActiveTab('consultations')}
          >
            <Activity size={20} /> Consultations
          </button>
          <button 
            className={activeTab === 'traitements' ? 'active' : ''}
            onClick={() => setActiveTab('traitements')}
          >
            <Pill size={20} /> Traitements
          </button>
          <button 
            className={activeTab === 'vaccinations' ? 'active' : ''}
            onClick={() => setActiveTab('vaccinations')}
          >
            <Shield size={20} /> Vaccinations
          </button>
          <button 
            className={activeTab === 'statistiques' ? 'active' : ''}
            onClick={() => setActiveTab('statistiques')}
          >
            <Calendar size={20} /> Statistiques
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
          <h1>Dashboard Infirmier</h1>
          <div className="header-actions">
            <NotificationBell userId={localStorage.getItem('userId')} />
          </div>
        </header>

        <main className="content-area">
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'dossiers' && renderDossiersMedicaux()}
          {activeTab === 'consultations' && renderConsultations()}
          {activeTab === 'traitements' && renderTraitements()}
          {activeTab === 'vaccinations' && renderVaccinations()}
          {activeTab === 'statistiques' && renderStatistiques()}
          {activeTab === 'messages' && <Messagerie userId={localStorage.getItem('userId')} userName={localStorage.getItem('userName') || 'Infirmier'} />}
        </main>
      </div>
    </div>
  );
};

export default DashboardInfirmier;