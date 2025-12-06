import React, { useState, useEffect } from 'react';
import {
  DollarSign, CreditCard, FileText, TrendingUp,
  Users, Calendar, AlertCircle, CheckCircle,
  Plus, Edit2, Trash2, Download, Send, MessageSquare, LogOut
} from 'lucide-react';
import api from '../api';
import Messagerie from '../components/Messagerie';
import NotificationBell from '../components/NotificationBell';
import '../styles/GlobalStyles.css';

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
    <div className="stats-grid">
      <div className="stat-card">
        <div className="stat-icon" style={{ background: 'linear-gradient(135deg, var(--success) 0%, #1aa179 100%)' }}>
          <DollarSign size={24} />
        </div>
        <div className="stat-content">
          <h3>{rapports.revenus_mois || 0} FCFA</h3>
          <p>Revenus du mois</p>
        </div>
      </div>
      <div className="stat-card">
        <div className="stat-icon" style={{ background: 'linear-gradient(135deg, var(--warning) 0%, #e8590c 100%)' }}>
          <CreditCard size={24} />
        </div>
        <div className="stat-content">
          <h3>{paiements.filter(p => p.statut === 'en_attente').length}</h3>
          <p>Paiements en attente</p>
        </div>
      </div>
      <div className="stat-card">
        <div className="stat-icon" style={{ background: 'linear-gradient(135deg, var(--error) 0%, #c0392b 100%)' }}>
          <AlertCircle size={24} />
        </div>
        <div className="stat-content">
          <h3>{retards.length}</h3>
          <p>Retards de paiement</p>
        </div>
      </div>
      <div className="stat-card">
        <div className="stat-icon" style={{ background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)' }}>
          <Users size={24} />
        </div>
        <div className="stat-content">
          <h3>{bourses.length}</h3>
          <p>Élèves boursiers</p>
        </div>
      </div>
    </div>
  );

  const renderPaiements = () => (
    <div className="form-container">
      <h2>Gestion des paiements</h2>
      <table className="data-table">
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
                <button className="btn btn-icon" onClick={() => genererFacture(paiement.eleve_id)}>
                  <FileText size={16} />
                </button>
                {paiement.statut === 'en_retard' && (
                  <button className="btn btn-icon" style={{ color: 'var(--error)' }} onClick={() => envoyerRelance(paiement.id)}>
                    <Send size={16} />
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderContributions = () => (
    <div>
      <div className="form-container" style={{ marginBottom: '2rem' }}>
        <h2>Ajouter une contribution</h2>
        <div className="form-grid">
          <div className="form-group">
            <label>Classe</label>
            <select className="form-select" value={newContribution.classe_id} onChange={(e) => setNewContribution({ ...newContribution, classe_id: e.target.value })}>
              <option value="">Sélectionner une classe</option>
            </select>
          </div>
          <div className="form-group">
            <label>Montant</label>
            <input type="number" className="form-input" placeholder="Montant" value={newContribution.montant} onChange={(e) => setNewContribution({ ...newContribution, montant: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Description</label>
            <input type="text" className="form-input" placeholder="Description" value={newContribution.description} onChange={(e) => setNewContribution({ ...newContribution, description: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Date limite</label>
            <input type="date" className="form-input" value={newContribution.date_limite} onChange={(e) => setNewContribution({ ...newContribution, date_limite: e.target.value })} />
          </div>
        </div>
        <button onClick={ajouterContribution} className="btn btn-primary">
          <Plus size={16} /> Ajouter
        </button>
      </div>

      <div className="form-container">
        <h2>Contributions existantes</h2>
        <div className="stats-grid">
          {contributions.map(contribution => (
            <div key={contribution.id} className="card">
              <h4 style={{ marginBottom: '0.5rem' }}>{contribution.description}</h4>
              <p><strong>Classe:</strong> {contribution.classe_nom}</p>
              <p><strong>Montant:</strong> {contribution.montant} FCFA</p>
              <p><strong>Date limite:</strong> {contribution.date_limite}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderBourses = () => (
    <div>
      <div className="form-container" style={{ marginBottom: '2rem' }}>
        <h2>Ajouter une bourse</h2>
        <div className="form-grid">
          <div className="form-group">
            <label>Élève</label>
            <select className="form-select" value={newBourse.eleve_id} onChange={(e) => setNewBourse({ ...newBourse, eleve_id: e.target.value })}>
              <option value="">Sélectionner un élève</option>
            </select>
          </div>
          <div className="form-group">
            <label>Type</label>
            <select className="form-select" value={newBourse.type} onChange={(e) => setNewBourse({ ...newBourse, type: e.target.value })}>
              <option value="">Type de bourse</option>
              <option value="excellence">Excellence</option>
              <option value="sociale">Sociale</option>
              <option value="partielle">Partielle</option>
            </select>
          </div>
          <div className="form-group">
            <label>Réduction (%)</label>
            <input type="number" className="form-input" placeholder="Pourcentage de réduction" value={newBourse.pourcentage} onChange={(e) => setNewBourse({ ...newBourse, pourcentage: e.target.value })} />
          </div>
        </div>
        <button onClick={ajouterBourse} className="btn btn-primary">
          <Plus size={16} /> Ajouter
        </button>
      </div>

      <div className="form-container">
        <h2>Élèves boursiers</h2>
        <table className="data-table">
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
                  <button className="btn btn-icon"><Edit2 size={16} /></button>
                  <button className="btn btn-icon" style={{ color: 'var(--error)' }}><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderRapports = () => (
    <div className="form-container">
      <h2>Rapports financiers</h2>
      <div className="stats-grid">
        <div className="card">
          <h4 style={{ marginBottom: '0.5rem' }}>Revenus mensuels</h4>
          <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--success)', marginBottom: '1rem' }}>{rapports.revenus_mois || 0} FCFA</p>
          <button className="btn btn-primary" style={{ width: '100%' }}>
            <Download size={16} /> Télécharger
          </button>
        </div>

        <div className="card">
          <h4 style={{ marginBottom: '0.5rem' }}>Créances</h4>
          <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--error)', marginBottom: '1rem' }}>{rapports.creances || 0} FCFA</p>
          <button className="btn btn-primary" style={{ width: '100%' }}>
            <Download size={16} /> Télécharger
          </button>
        </div>

        <div className="card">
          <h4 style={{ marginBottom: '0.5rem' }}>Taux de recouvrement</h4>
          <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--primary)', marginBottom: '1rem' }}>{rapports.taux_recouvrement || 0}%</p>
          <button className="btn btn-primary" style={{ width: '100%' }}>
            <Download size={16} /> Télécharger
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="app-dashboard">
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
        <header className="page-header">
          <div>
            <h1>Dashboard Comptable</h1>
            <p style={{ color: 'var(--text-muted)' }}>Gestion financière et comptabilité</p>
          </div>
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