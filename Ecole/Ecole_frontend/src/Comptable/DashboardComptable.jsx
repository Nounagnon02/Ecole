import React, { useState, useEffect } from 'react';
import { 
  DollarSign, CreditCard, FileText, TrendingUp, 
  Users, Calendar, AlertCircle, CheckCircle, 
  Plus, Edit2, Trash2, Download, Send, MessageSquare
} from 'lucide-react';
import api from '../api';
import Messagerie from '../components/Messagerie';
import NotificationBell from '../components/NotificationBell';
import '../styles/dashboard.css';

const DashboardComptable = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [paiements, setPaiements] = useState([]);
  const [factures, setFactures] = useState([]);
  const [contributions, setContributions] = useState([]);
  const [rapports, setRapports] = useState({});
  const [retards, setRetards] = useState([]);
  const [bourses, setBourses] = useState([]);

  const [newContribution, setNewContribution] = useState({
    classe_id: '',
    montant: '',
    description: '',
    date_limite: ''
  });

  const [newBourse, setNewBourse] = useState({
    eleve_id: '',
    montant: '',
    type: '',
    pourcentage: ''
  });

  useEffect(() => {
    fetchComptableData();
  }, []);

  const fetchComptableData = async () => {
    try {
      setLoading(true);
      const [paiementsRes, facturesRes, rapportsRes] = await Promise.all([
        api.get('/comptable/paiements'),
        api.get('/comptable/factures'),
        api.get('/comptable/rapports')
      ]);
      
      setPaiements(paiementsRes.data);
      setFactures(facturesRes.data);
      setRapports(rapportsRes.data);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const ajouterContribution = async () => {
    try {
      await api.post('/contributions', newContribution);
      setNewContribution({
        classe_id: '',
        montant: '',
        description: '',
        date_limite: ''
      });
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const ajouterBourse = async () => {
    try {
      await api.post('/bourses', newBourse);
      setNewBourse({
        eleve_id: '',
        montant: '',
        type: '',
        pourcentage: ''
      });
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const genererFacture = async (eleveId) => {
    try {
      const response = await api.post(`/factures/generer/${eleveId}`);
      alert('Facture générée avec succès');
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const envoyerRelance = async (paiementId) => {
    try {
      await api.post(`/paiements/${paiementId}/relance`);
      alert('Relance envoyée');
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const renderOverview = () => (
    <div className="overview-grid">
      <div className="stat-card">
        <DollarSign className="stat-icon" />
        <div>
          <h3>Revenus du mois</h3>
          <p>{rapports.revenus_mois || 0} FCFA</p>
        </div>
      </div>
      <div className="stat-card">
        <CreditCard className="stat-icon" />
        <div>
          <h3>Paiements en attente</h3>
          <p>{paiements.filter(p => p.statut === 'en_attente').length}</p>
        </div>
      </div>
      <div className="stat-card">
        <AlertCircle className="stat-icon" />
        <div>
          <h3>Retards de paiement</h3>
          <p>{retards.length}</p>
        </div>
      </div>
      <div className="stat-card">
        <Users className="stat-icon" />
        <div>
          <h3>Élèves boursiers</h3>
          <p>{bourses.length}</p>
        </div>
      </div>
    </div>
  );

  const renderPaiements = () => (
    <div className="paiements-section">
      <h3>Gestion des paiements</h3>
      <div className="paiements-table">
        <table>
          <thead>
            <tr>
              <th>Élève</th>
              <th>Montant</th>
              <th>Type</th>
              <th>Statut</th>
              <th>Date limite</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paiements.map(paiement => (
              <tr key={paiement.id}>
                <td>{paiement.eleve_nom}</td>
                <td>{paiement.montant} FCFA</td>
                <td>{paiement.type}</td>
                <td>
                  <span className={`status ${paiement.statut}`}>
                    {paiement.statut === 'paye' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                    {paiement.statut}
                  </span>
                </td>
                <td>{paiement.date_limite}</td>
                <td>
                  <button onClick={() => genererFacture(paiement.eleve_id)}>
                    <FileText size={16} />
                  </button>
                  {paiement.statut === 'en_retard' && (
                    <button onClick={() => envoyerRelance(paiement.id)}>
                      <Send size={16} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderContributions = () => (
    <div className="contributions-section">
      <div className="form-section">
        <h3>Ajouter une contribution</h3>
        <div className="form-grid">
          <select
            value={newContribution.classe_id}
            onChange={(e) => setNewContribution({...newContribution, classe_id: e.target.value})}
          >
            <option value="">Sélectionner une classe</option>
          </select>

          <input
            type="number"
            placeholder="Montant"
            value={newContribution.montant}
            onChange={(e) => setNewContribution({...newContribution, montant: e.target.value})}
          />

          <input
            type="text"
            placeholder="Description"
            value={newContribution.description}
            onChange={(e) => setNewContribution({...newContribution, description: e.target.value})}
          />

          <input
            type="date"
            value={newContribution.date_limite}
            onChange={(e) => setNewContribution({...newContribution, date_limite: e.target.value})}
          />

          <button onClick={ajouterContribution} className="btn-primary">
            <Plus size={16} /> Ajouter
          </button>
        </div>
      </div>

      <div className="contributions-list">
        <h3>Contributions existantes</h3>
        {contributions.map(contribution => (
          <div key={contribution.id} className="contribution-item">
            <h4>{contribution.description}</h4>
            <p>Classe: {contribution.classe_nom}</p>
            <p>Montant: {contribution.montant} FCFA</p>
            <p>Date limite: {contribution.date_limite}</p>
          </div>
        ))}
      </div>
    </div>
  );

  const renderBourses = () => (
    <div className="bourses-section">
      <div className="form-section">
        <h3>Ajouter une bourse</h3>
        <div className="form-grid">
          <select
            value={newBourse.eleve_id}
            onChange={(e) => setNewBourse({...newBourse, eleve_id: e.target.value})}
          >
            <option value="">Sélectionner un élève</option>
          </select>

          <select
            value={newBourse.type}
            onChange={(e) => setNewBourse({...newBourse, type: e.target.value})}
          >
            <option value="">Type de bourse</option>
            <option value="excellence">Excellence</option>
            <option value="sociale">Sociale</option>
            <option value="partielle">Partielle</option>
          </select>

          <input
            type="number"
            placeholder="Pourcentage de réduction"
            value={newBourse.pourcentage}
            onChange={(e) => setNewBourse({...newBourse, pourcentage: e.target.value})}
          />

          <button onClick={ajouterBourse} className="btn-primary">
            <Plus size={16} /> Ajouter
          </button>
        </div>
      </div>

      <div className="bourses-list">
        <h3>Élèves boursiers</h3>
        <table>
          <thead>
            <tr>
              <th>Élève</th>
              <th>Type</th>
              <th>Réduction</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {bourses.map(bourse => (
              <tr key={bourse.id}>
                <td>{bourse.eleve_nom}</td>
                <td>{bourse.type}</td>
                <td>{bourse.pourcentage}%</td>
                <td>
                  <button className="btn-edit">
                    <Edit2 size={16} />
                  </button>
                  <button className="btn-delete">
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderRapports = () => (
    <div className="rapports-section">
      <h3>Rapports financiers</h3>
      <div className="rapports-grid">
        <div className="rapport-card">
          <h4>Revenus mensuels</h4>
          <p className="rapport-montant">{rapports.revenus_mois || 0} FCFA</p>
          <button className="btn-download">
            <Download size={16} /> Télécharger
          </button>
        </div>

        <div className="rapport-card">
          <h4>Créances</h4>
          <p className="rapport-montant">{rapports.creances || 0} FCFA</p>
          <button className="btn-download">
            <Download size={16} /> Télécharger
          </button>
        </div>

        <div className="rapport-card">
          <h4>Taux de recouvrement</h4>
          <p className="rapport-pourcentage">{rapports.taux_recouvrement || 0}%</p>
          <button className="btn-download">
            <Download size={16} /> Télécharger
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="dashboard-comptable">
      <div className="sidebar">
        <div className="sidebar-header">
          <h2>Espace Comptable</h2>
        </div>
        <nav className="sidebar-nav">
          <button 
            className={activeTab === 'overview' ? 'active' : ''}
            onClick={() => setActiveTab('overview')}
          >
            <TrendingUp size={20} /> Aperçu
          </button>
          <button 
            className={activeTab === 'paiements' ? 'active' : ''}
            onClick={() => setActiveTab('paiements')}
          >
            <CreditCard size={20} /> Paiements
          </button>
          <button 
            className={activeTab === 'contributions' ? 'active' : ''}
            onClick={() => setActiveTab('contributions')}
          >
            <DollarSign size={20} /> Contributions
          </button>
          <button 
            className={activeTab === 'bourses' ? 'active' : ''}
            onClick={() => setActiveTab('bourses')}
          >
            <Users size={20} /> Bourses
          </button>
          <button 
            className={activeTab === 'rapports' ? 'active' : ''}
            onClick={() => setActiveTab('rapports')}
          >
            <FileText size={20} /> Rapports
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
          <h1>Dashboard Comptable</h1>
          <div className="header-actions">
            <NotificationBell userId={localStorage.getItem('userId')} />
          </div>
        </header>

        <main className="content-area">
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'paiements' && renderPaiements()}
          {activeTab === 'contributions' && renderContributions()}
          {activeTab === 'bourses' && renderBourses()}
          {activeTab === 'rapports' && renderRapports()}
          {activeTab === 'messages' && <Messagerie userId={localStorage.getItem('userId')} userName={localStorage.getItem('userName') || 'Comptable'} />}
        </main>
      </div>
    </div>
  );
};

export default DashboardComptable;