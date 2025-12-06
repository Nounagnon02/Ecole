import React, { useState, useEffect } from 'react';
import { BookOpen, Award, Calendar, TrendingUp } from 'lucide-react';
import api from '../api';
import './DashboardUniversite.css';

const DashboardEtudiant = () => {
  const [notes, setNotes] = useState([]);
  const [moyenne, setMoyenne] = useState(0);
  const [credits, setCredits] = useState(0);

  useEffect(() => {
    const etudiantId = localStorage.getItem('userId');
    api.get(`/universite/notes?etudiant_id=${etudiantId}`)
      .then(res => {
        setNotes(res.data);
        const moy = res.data.reduce((acc, n) => acc + parseFloat(n.note), 0) / res.data.length;
        setMoyenne(moy.toFixed(2));
        setCredits(res.data.filter(n => n.note >= 10).reduce((acc, n) => acc + (n.matiere?.credits || 0), 0));
      })
      .catch(console.error);
  }, []);

  return (
    <div className="univ-dashboard">
      <div className="univ-header">
        <h1>Mon Espace Étudiant</h1>
        <p>Suivi de votre parcours académique</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">
            <TrendingUp size={28} />
          </div>
          <div className="stat-content">
            <h3>{moyenne}</h3>
            <p>Moyenne Générale</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <Award size={28} />
          </div>
          <div className="stat-content">
            <h3>{credits}</h3>
            <p>Crédits Validés</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <BookOpen size={28} />
          </div>
          <div className="stat-content">
            <h3>{notes.length}</h3>
            <p>Matières</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <Calendar size={28} />
          </div>
          <div className="stat-content">
            <h3>S1</h3>
            <p>Semestre Actuel</p>
          </div>
        </div>
      </div>

      <div className="form-container">
        <h2>Mes Notes</h2>
        <table className="data-table">
          <thead><tr><th>Matière</th><th>Note</th><th>Crédits</th><th>Type</th><th>Session</th></tr></thead>
          <tbody>
            {notes.map(n => (
              <tr key={n.id}>
                <td>{n.matiere?.nom}</td>
                <td className={n.note >= 10 ? 'univ-text-success' : 'univ-text-error'} style={{ fontWeight: 'bold' }}>
                  {n.note}/20
                </td>
                <td>{n.matiere?.credits}</td>
                <td>{n.type}</td>
                <td>{n.session}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DashboardEtudiant;
