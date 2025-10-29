import React, { useState, useEffect } from 'react';
import { 
  BookOpen, Calendar, MessageSquare, ClipboardList, 
  User, Bell, FileText, Clock, Award, Download
} from 'lucide-react';
import api from '../api';
import Messagerie from '../components/Messagerie';
import NotificationBell from '../components/NotificationBell';
import '../styles/dashboard.css';

const DashboardEleve = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [bulletins, setBulletins] = useState([]);
  const [devoirs, setDevoirs] = useState([]);
  const [emploiTemps, setEmploiTemps] = useState([]);
  const [messages, setMessages] = useState([]);
  const [notes, setNotes] = useState([]);
  const [ressources, setRessources] = useState([]);
  const [profil, setProfil] = useState({});

  useEffect(() => {
    fetchEleveData();
  }, []);

  const fetchEleveData = async () => {
    try {
      setLoading(true);
      const eleveId = localStorage.getItem('userId');
      const [bulletinsRes, devoirsRes, emploiRes, messagesRes] = await Promise.all([
        api.get(`/eleves/${eleveId}/bulletins`),
        api.get(`/eleves/${eleveId}/devoirs`),
        api.get(`/eleves/${eleveId}/emploi-temps`),
        api.get(`/eleves/${eleveId}/messages`)
      ]);
      
      setBulletins(bulletinsRes.data);
      setDevoirs(devoirsRes.data);
      setEmploiTemps(emploiRes.data);
      setMessages(messagesRes.data);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderOverview = () => (
    <div className="overview-grid">
      <div className="stat-card">
        <Award className="stat-icon" />
        <div>
          <h3>Moyenne générale</h3>
          <p>{notes.moyenne_generale || 'N/A'}</p>
        </div>
      </div>
      <div className="stat-card">
        <ClipboardList className="stat-icon" />
        <div>
          <h3>Devoirs à rendre</h3>
          <p>{devoirs.filter(d => !d.rendu).length}</p>
        </div>
      </div>
      <div className="stat-card">
        <MessageSquare className="stat-icon" />
        <div>
          <h3>Messages non lus</h3>
          <p>{messages.filter(m => !m.lu).length}</p>
        </div>
      </div>
      <div className="stat-card">
        <Calendar className="stat-icon" />
        <div>
          <h3>Prochains examens</h3>
          <p>3</p>
        </div>
      </div>
    </div>
  );

  const renderBulletins = () => (
    <div className="bulletins-section">
      <h3>Mes bulletins</h3>
      <div className="bulletins-grid">
        {bulletins.map(bulletin => (
          <div key={bulletin.id} className="bulletin-card">
            <h4>{bulletin.periode}</h4>
            <p>Moyenne: {bulletin.moyenne_generale}</p>
            <p>Rang: {bulletin.rang}</p>
            <button className="btn-download">
              <Download size={16} /> Télécharger
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  const renderDevoirs = () => (
    <div className="devoirs-section">
      <h3>Mes devoirs</h3>
      <div className="devoirs-list">
        {devoirs.map(devoir => (
          <div key={devoir.id} className={`devoir-item ${devoir.rendu ? 'rendu' : 'a-rendre'}`}>
            <div className="devoir-header">
              <h4>{devoir.titre}</h4>
              <span className="devoir-matiere">{devoir.matiere}</span>
            </div>
            <p>{devoir.description}</p>
            <div className="devoir-footer">
              <span className="devoir-date">À rendre le: {devoir.date_limite}</span>
              <span className={`devoir-status ${devoir.rendu ? 'rendu' : 'en-attente'}`}>
                {devoir.rendu ? 'Rendu' : 'À rendre'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderEmploiTemps = () => (
    <div className="emploi-temps">
      <h3>Mon emploi du temps</h3>
      <div className="emploi-grid">
        <table className="emploi-table">
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
            {emploiTemps.map(creneau => (
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

  const renderMessages = () => {
    const eleveId = localStorage.getItem('userId');
    const userName = localStorage.getItem('userName') || 'Élève';
    return <Messagerie userId={eleveId} userName={userName} />;
  };

  const renderRessources = () => (
    <div className="ressources-section">
      <h3>Ressources de cours</h3>
      <div className="ressources-grid">
        {ressources.map(ressource => (
          <div key={ressource.id} className="ressource-item">
            <FileText className="ressource-icon" />
            <div className="ressource-info">
              <h4>{ressource.titre}</h4>
              <p>{ressource.matiere}</p>
              <span>{ressource.type}</span>
            </div>
            <button className="btn-download">
              <Download size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  const renderProfil = () => (
    <div className="profil-section">
      <h3>Mon profil</h3>
      <div className="profil-card">
        <div className="profil-photo">
          <User size={60} />
        </div>
        <div className="profil-info">
          <h4>{profil.nom} {profil.prenom}</h4>
          <p>Classe: {profil.classe}</p>
          <p>Matricule: {profil.matricule}</p>
          <p>Date de naissance: {profil.date_naissance}</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="dashboard-eleve">
      <div className="sidebar">
        <div className="sidebar-header">
          <h2>Espace Élève</h2>
        </div>
        <nav className="sidebar-nav">
          <button 
            className={activeTab === 'overview' ? 'active' : ''}
            onClick={() => setActiveTab('overview')}
          >
            <User size={20} /> Aperçu
          </button>
          <button 
            className={activeTab === 'bulletins' ? 'active' : ''}
            onClick={() => setActiveTab('bulletins')}
          >
            <Award size={20} /> Bulletins
          </button>
          <button 
            className={activeTab === 'devoirs' ? 'active' : ''}
            onClick={() => setActiveTab('devoirs')}
          >
            <ClipboardList size={20} /> Devoirs
          </button>
          <button 
            className={activeTab === 'emploi' ? 'active' : ''}
            onClick={() => setActiveTab('emploi')}
          >
            <Calendar size={20} /> Emploi du temps
          </button>
          <button 
            className={activeTab === 'messages' ? 'active' : ''}
            onClick={() => setActiveTab('messages')}
          >
            <MessageSquare size={20} /> Messages
          </button>
          <button 
            className={activeTab === 'ressources' ? 'active' : ''}
            onClick={() => setActiveTab('ressources')}
          >
            <FileText size={20} /> Ressources
          </button>
          <button 
            className={activeTab === 'profil' ? 'active' : ''}
            onClick={() => setActiveTab('profil')}
          >
            <User size={20} /> Mon profil
          </button>
        </nav>
      </div>

      <div className="main-content">
        <header className="main-header">
          <h1>Dashboard Élève</h1>
          <div className="header-actions">
            <NotificationBell userId={localStorage.getItem('userId')} />
            <User size={20} />
          </div>
        </header>

        <main className="content-area">
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'bulletins' && renderBulletins()}
          {activeTab === 'devoirs' && renderDevoirs()}
          {activeTab === 'emploi' && renderEmploiTemps()}
          {activeTab === 'messages' && renderMessages()}
          {activeTab === 'ressources' && renderRessources()}
          {activeTab === 'profil' && renderProfil()}
        </main>
      </div>
    </div>
  );
};

export default DashboardEleve;