import React, { useState, useEffect } from 'react';
import { Users, BookOpen, Calendar, MessageSquare, ClipboardList } from 'lucide-react';
import api from '../api';
import Messagerie from '../components/Messagerie';
import NotificationBell from '../components/NotificationBell';
import '../styles/dashboard.css';

const DashboardEnseignantSecondaire = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [classes, setClasses] = useState([]);
  const [devoirs, setDevoirs] = useState([]);
  const [emploiTemps, setEmploiTemps] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [eleves, setEleves] = useState([]);
  const [showExerciceForm, setShowExerciceForm] = useState(false);
  const [newExercice, setNewExercice] = useState({ classe_id: '', titre: '', description: '', date_limite: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const enseignantId = user.id;
      console.log('Enseignant ID:', enseignantId);
      
      // Charger les classes
      const classesRes = await api.get(`/enseignants/${enseignantId}/classes`, { params: { enseignant_id: enseignantId } });
      if (classesRes.data.success) setClasses(classesRes.data.data);
      console.log('Classes:', classesRes.data.data);
      
      // Charger les exercices
      try {
        const exercicesRes = await api.get('/exercices', { params: { enseignant_id: enseignantId } });
        if (exercicesRes.data.success) setDevoirs(exercicesRes.data.data);
      } catch (error) {
        console.error('Erreur chargement exercices:', error);
        setDevoirs([]);
      }
      
      // Charger l'emploi du temps
      const emploiRes = await api.get(`/enseignants/${enseignantId}/emploi-temps`, { params: { enseignant_id: enseignantId } });
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
          <h2>Enseignant Secondaire</h2>
        </div>
        <nav className="sidebar-nav">
          <button className={activeTab === 'overview' ? 'active' : ''} onClick={() => setActiveTab('overview')}>
            <Users size={20} /> Aperçu
          </button>
          <button className={activeTab === 'classe' ? 'active' : ''} onClick={() => setActiveTab('classe')}>
            <Users size={20} /> Mes classes
          </button>
          <button className={activeTab === 'exercices' ? 'active' : ''} onClick={() => setActiveTab('exercices')}>
            <BookOpen size={20} /> Exercices
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
            <NotificationBell userId={JSON.parse(localStorage.getItem('user') || '{}').id} />
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
                  <option key={classe.id} value={classe.id}>{classe.nom_classe}</option>
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

          {activeTab === 'exercices' && (
            <div className="exercices-section">
              <div className="section-header">
                <h3>Mes exercices</h3>
                <button onClick={() => setShowExerciceForm(!showExerciceForm)} className="btn-primary">+ Nouvel exercice</button>
              </div>
              
              {showExerciceForm && (
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  try {
                    const user = JSON.parse(localStorage.getItem('user') || '{}');
                    await api.post('/exercices', { ...newExercice, enseignant_id: user.id });
                    setNewExercice({ classe_id: '', titre: '', description: '', date_limite: '' });
                    setShowExerciceForm(false);
                    fetchData();
                  } catch (error) {
                    console.error('Erreur:', error);
                    alert('Erreur lors de la création');
                  }
                }} className="exercice-form">
                  <select value={newExercice.classe_id} onChange={(e) => setNewExercice({...newExercice, classe_id: e.target.value})} required>
                    <option value="">Sélectionner une classe</option>
                    {classes.map(classe => <option key={classe.id} value={classe.id}>{classe.nom_classe}</option>)}
                  </select>
                  <input type="text" placeholder="Titre" value={newExercice.titre} onChange={(e) => setNewExercice({...newExercice, titre: e.target.value})} required />
                  <textarea placeholder="Description" value={newExercice.description} onChange={(e) => setNewExercice({...newExercice, description: e.target.value})} required />
                  <input type="date" value={newExercice.date_limite} onChange={(e) => setNewExercice({...newExercice, date_limite: e.target.value})} required />
                  <div className="form-actions">
                    <button type="submit">Créer</button>
                    <button type="button" onClick={() => setShowExerciceForm(false)}>Annuler</button>
                  </div>
                </form>
              )}
              
              <div className="exercices-list">
                {devoirs.length === 0 ? (
                  <p>Aucun exercice pour le moment</p>
                ) : (
                  devoirs.map(devoir => (
                    <div key={devoir.id} className="exercice-card">
                      <h4>{devoir.titre}</h4>
                      <p>{devoir.description}</p>
                      <span>Date limite: {new Date(devoir.date_limite).toLocaleDateString()}</span>
                    </div>
                  ))
                )}
              </div>
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
            <Messagerie />
          )}
        </main>
      </div>
    </div>
  );
};

export default DashboardEnseignantSecondaire;
