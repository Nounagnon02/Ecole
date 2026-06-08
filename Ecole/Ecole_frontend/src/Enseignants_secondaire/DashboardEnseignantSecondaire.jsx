import React, { useState, useEffect } from 'react';
import { Users, BookOpen, Calendar, MessageSquare } from 'lucide-react';
import api from '../api';
import Messagerie from '../components/Messagerie';
import DashboardLayout from '../components/DashboardLayout';
import '../styles/dashboard.css';

const NAV_ITEMS = [
  { id: 'overview', icon: Users, label: 'Aperçu' },
  { id: 'classe', icon: Users, label: 'Mes classes' },
  { id: 'exercices', icon: BookOpen, label: 'Exercices' },
  { id: 'emploi', icon: Calendar, label: 'Emploi du temps' },
  { id: 'messages', icon: MessageSquare, label: 'Messages' },
];

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

      const [classesRes, exercicesRes, emploiRes] = await Promise.all([
        api.get(`/enseignants/${enseignantId}/classes`, { params: { enseignant_id: enseignantId } }),
        api.get('/exercices', { params: { enseignant_id: enseignantId } }).catch(() => null),
        api.get(`/enseignants/${enseignantId}/emploi-temps`, { params: { enseignant_id: enseignantId } })
      ]);

      if (classesRes.data.success) setClasses(classesRes.data.data);
      if (exercicesRes?.data?.success) setDevoirs(exercicesRes.data.data);
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

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
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
        );
      case 'classe':
        return (
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
        );
      case 'exercices':
        return (
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
        );
      case 'emploi':
        return (
          <div className="emploi-temps">
            <h3>Mon emploi du temps</h3>
            {emploiTemps.map(cours => (
              <div key={cours.id} className="cours-item">
                <h4>{cours.matiere}</h4>
                <p>{cours.jour} - {cours.heure_debut} à {cours.heure_fin}</p>
              </div>
            ))}
          </div>
        );
      case 'messages':
        return <Messagerie />;
      default:
        return null;
    }
  };

  return (
    <DashboardLayout
      navItems={NAV_ITEMS}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      userRole="Enseignant Secondaire"
      headerTitle="Dashboard Enseignant"
    >
      {renderContent()}
    </DashboardLayout>
  );
};

export default DashboardEnseignantSecondaire;
