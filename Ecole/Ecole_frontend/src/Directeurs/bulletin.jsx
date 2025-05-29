import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Mes_CSS/bulletin.css';

const Bulletin = () => {
  const [bulletins, setBulletins] = useState([]);
  const [selectedSession, setSelectedSession] = useState('');
  const [selectedClasse, setSelectedClasse] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchBulletins = async () => {
    if (!selectedSession || !selectedClasse) return;

    setLoading(true);
    try {
      const response = await axios.get(`/api/bulletins?session=${selectedSession}&classe=${selectedClasse}`);
      setBulletins(response.data);
    } catch (error) {
      console.error('Erreur lors du chargement des bulletins:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchBulletins();
  }, [selectedSession, selectedClasse]);

  return (
    <div className="bulletin-container">
      <div className="bulletin-header">
        <h2>Bulletins Scolaires</h2>
        <div className="bulletin-filters">
          <select 
            value={selectedSession} 
            onChange={(e) => setSelectedSession(e.target.value)}
            className="bulletin-select"
          >
            <option value="">Sélectionner une session</option>
            <option value="1">1er Trimestre</option>
            <option value="2">2ème Trimestre</option>
            <option value="3">3ème Trimestre</option>
          </select>

          <select 
            value={selectedClasse} 
            onChange={(e) => setSelectedClasse(e.target.value)}
            className="bulletin-select"
          >
            <option value="">Sélectionner une classe</option>
            {/* Options des classes */}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="bulletin-loading">Chargement...</div>
      ) : (
        <div className="bulletin-list">
          {bulletins.map((bulletin) => (
            <div key={bulletin.id} className="bulletin-card">
              <div className="bulletin-info">
                <h3>{bulletin.eleve.nom}</h3>
                <p>Moyenne générale: {bulletin.moyenne_generale}</p>
              </div>
              <div className="bulletin-actions">
                <button className="bulletin-btn bulletin-btn-view">
                  Voir le bulletin
                </button>
                <button className="bulletin-btn bulletin-btn-print">
                  Imprimer
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Bulletin;