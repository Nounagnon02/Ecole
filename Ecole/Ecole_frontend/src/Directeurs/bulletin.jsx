import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/GlobalStyles.css';

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
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--primary)' }}>Bulletins Scolaires</h2>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <select
            value={selectedSession}
            onChange={(e) => setSelectedSession(e.target.value)}
            className="form-select"
            style={{ minWidth: '200px' }}
          >
            <option value="">Sélectionner une session</option>
            <option value="1">1er Trimestre</option>
            <option value="2">2ème Trimestre</option>
            <option value="3">3ème Trimestre</option>
          </select>

          <select
            value={selectedClasse}
            onChange={(e) => setSelectedClasse(e.target.value)}
            className="form-select"
            style={{ minWidth: '200px' }}
          >
            <option value="">Sélectionner une classe</option>
            {/* Options des classes */}
          </select>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Chargement...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {bulletins.map((bulletin) => (
            <div key={bulletin.id} className="card">
              <div className="card-body">
                <div style={{ marginBottom: '1rem' }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>{bulletin.eleve.nom}</h3>
                  <p style={{ color: 'var(--text-muted)' }}>Moyenne générale: <span style={{ fontWeight: 'bold', color: 'var(--primary)' }}>{bulletin.moyenne_generale}</span></p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button className="btn btn-primary" style={{ flex: 1 }}>
                    Voir le bulletin
                  </button>
                  <button className="btn btn-secondary" style={{ flex: 1 }}>
                    Imprimer
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Bulletin;