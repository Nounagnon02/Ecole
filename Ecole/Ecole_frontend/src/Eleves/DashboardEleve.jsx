import React, { useState, useEffect } from 'react';
import {
  BookOpen, Calendar, MessageSquare, ClipboardList,
  User, Bell, FileText, Clock, Award, Download
} from 'lucide-react';
import api from '../api';
import Messagerie from '../components/Messagerie';
import DashboardLayout from '../components/DashboardLayout';
import '../styles/dashboard.css';

const NAV_ITEMS = [
  { id: 'overview', icon: User, label: 'Aperçu' },
  { id: 'bulletins', icon: Award, label: 'Bulletins' },
  { id: 'devoirs', icon: ClipboardList, label: 'Devoirs' },
  { id: 'emploi', icon: Calendar, label: 'Emploi du temps' },
  { id: 'messages', icon: MessageSquare, label: 'Messages' },
  { id: 'ressources', icon: FileText, label: 'Ressources' },
  { id: 'profil', icon: User, label: 'Mon profil' },
];

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
  const [notification, setNotification] = useState({ show: false, message: '', type: 'error' });

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
      setNotification({ show: true, message: 'Erreur lors du chargement des donnees', type: 'error' });
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
    <DashboardLayout
      navItems={NAV_ITEMS}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      userRole="Élève"
      notification={notification}
      onCloseNotification={() => setNotification({ show: false, message: '', type: 'error' })}
      headerTitle="Dashboard Élève"
      wrapperClass="dashboard-eleve"
      headerVariant="main"
      headerExtra={<User size={20} />}
    >
      {activeTab === 'overview' && renderOverview()}
      {activeTab === 'bulletins' && renderBulletins()}
      {activeTab === 'devoirs' && renderDevoirs()}
      {activeTab === 'emploi' && renderEmploiTemps()}
      {activeTab === 'messages' && renderMessages()}
      {activeTab === 'ressources' && renderRessources()}
      {activeTab === 'profil' && renderProfil()}
    </DashboardLayout>
  );
};

export default DashboardEleve;