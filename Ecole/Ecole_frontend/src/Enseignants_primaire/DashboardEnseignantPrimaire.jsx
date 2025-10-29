import React, { useState, useEffect } from 'react';
import { Users, BookOpen, Calendar, MessageSquare, ClipboardList, Plus } from 'lucide-react';
import api from '../api';
import Messagerie from '../components/Messagerie';
import NotificationBell from '../components/NotificationBell';
import '../styles/dashboard.css';

const DashboardEnseignantPrimaire = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [classes, setClasses] = useState([]);
  const [devoirs, setDevoirs] = useState([]);
  const [emploiTemps, setEmploiTemps] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [eleves, setEleves] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const enseignantId = localStorage.getItem('userId');
      const [classesRes, devoirsRes, emploiRes] = await Promise.all([
        api.get(`/enseignants/${enseignantId}/classes`, { params: { enseignant_id: enseignantId } }),
        api.get('/devoirs'),
        api.get(`/enseignants/${enseignantId}/emploi-temps`, { params: { enseignant_id: enseignantId } })
      ]);
      
      if (classesRes.data.success) setClasses(classesRes.data.data);
      if (devoirsRes.data) setDevoirs(Array.isArray(devoirsRes.data) ? devoirsRes.data : []);
      if (emploiRes.data.success) setEmploiTemps(emploiRes.data.data);
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const fetchClasseEleves = async (classeId) => {
    try {
      const res = await api.get(`/classes/${classeId}/eleves`);
      if (res.data.success) setEleves(res.data.data);
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  return (
    <div className="dashboard-enseignant">
      <div className="sidebar">
        <div className="sidebar-header">
          <h2>Enseignant Primaire</h2>
        </div>
        <nav className="sidebar-nav">
          <button className={activeTab === 'overview' ? 'active' : ''} onClick={() => setActiveTab('overview')}>
            <Users size={20} /> Aperçu
          </button>
          <button className={activeTab === 'classe' ? 'active' : ''} onClick={() => setActiveTab('classe')}>
            <Users size={20} /> Ma classe
          </button>
          <button className={activeTab === 'devoirs' ? 'active' : ''} onClick={() => setActiveTab('devoirs')}>
            <BookOpen size={20} /> Devoirs
          </button>
          <button className={activeTab === 'emploi' ? 'active' : ''} onClick={() => setActiveTab('emploi')}>
            <Calendar size={20} /> Emploi du temps
          </button>
          <button className={activeTab === 'messages' ? 'active' : ''} onClick={() => setActiveTab('messages')}>
            <MessageSquare size={20} /> Messages
          </button>
        </nav>
      </div>

      <div className="main-content">
        <header className="main-header">
          <h1>Dashboard Enseignant</h1>
          <div className="header-actions">
            <NotificationBell userId={localStorage.getItem('userId')} />
          </div>
        </header>

        <main className="content-area">
          {activeTab === 'overview' && (
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
                  <h3>Devoirs donnés</h3>
                  <p>{devoirs.length}</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'classe' && (
            <div className="gestion-classe">
              <select value={selectedClass} onChange={(e) => { setSelectedClass(e.target.value); fetchClasseEleves(e.target.value); }}>
                <option value="">Sélectionner une classe</option>
                {classes.map(classe => (
                  <option key={classe.id} value={classe.id}>{classe.nom}</option>
                ))}
              </select>
              {selectedClass && (
                <table>
                  <thead>
                    <tr><th>Nom</th><th>Prénom</th><th>Matricule</th></tr>
                  </thead>
                  <tbody>
                    {eleves.map(eleve => (
                      <tr key={eleve.id}>
                        <td>{eleve.nom}</td>
                        <td>{eleve.prenom}</td>
                        <td>{eleve.matricule}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {activeTab === 'devoirs' && (
            <div className="devoirs-section">
              <h3>Mes devoirs</h3>
              {devoirs.map(devoir => (
                <div key={devoir.id} className="devoir-card">
                  <h4>{devoir.titre}</h4>
                  <p>{devoir.description}</p>
                  <span>Date limite: {devoir.date_limite}</span>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'emploi' && (
            <div className="emploi-temps">
              <h3>Mon emploi du temps</h3>
              {emploiTemps.map(cours => (
                <div key={cours.id} className="cours-item">
                  <h4>{cours.matiere}</h4>
                  <p>{cours.jour} - {cours.heure_debut} à {cours.heure_fin}</p>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'messages' && (
            <Messagerie userId={localStorage.getItem('userId')} userName={localStorage.getItem('userName')} />
          )}
        </main>
      </div>
    </div>
  );
};

export default DashboardEnseignantPrimaire;
