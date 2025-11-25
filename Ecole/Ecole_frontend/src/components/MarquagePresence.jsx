import React, { useState, useEffect } from 'react';
import api from '../api';

const MarquagePresence = () => {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [eleves, setEleves] = useState([]);
  const [presences, setPresences] = useState({});
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      fetchEleves();
    }
  }, [selectedClass, date]);

  const fetchClasses = async () => {
    try {
      const res = await api.get('/classes');
      setClasses(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchEleves = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/classes/${selectedClass}/eleves`);
      setEleves(res.data);
      
      const presencesRes = await api.get(`/presences?classe_id=${selectedClass}&date=${date}`);
      const presencesData = {};
      presencesRes.data.forEach(p => {
        presencesData[p.eleve_id] = p.statut;
      });
      setPresences(presencesData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePresenceChange = (eleveId, statut) => {
    setPresences(prev => ({
      ...prev,
      [eleveId]: statut
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const data = Object.entries(presences).map(([eleve_id, statut]) => ({
        eleve_id: parseInt(eleve_id),
        statut,
        date
      }));

      await api.post('/presences/bulk', { presences: data, classe_id: selectedClass });
      setMessage({ text: 'Présences enregistrées avec succès', type: 'success' });
    } catch (err) {
      setMessage({ text: 'Erreur lors de l\'enregistrement', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="marquage-presence-container">
      <h2>Marquage des Présences</h2>
      
      {message.text && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="form-group">
        <label>Date</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="form-input"
        />
      </div>

      <div className="form-group">
        <label>Classe</label>
        <select
          value={selectedClass}
          onChange={(e) => setSelectedClass(e.target.value)}
          className="form-input"
        >
          <option value="">Sélectionner une classe</option>
          {classes.map(classe => (
            <option key={classe.id} value={classe.id}>
              {classe.nom_classe}
            </option>
          ))}
        </select>
      </div>

      {selectedClass && (
        <form onSubmit={handleSubmit}>
          <table className="presence-table">
            <thead>
              <tr>
                <th>Élève</th>
                <th>Présent</th>
                <th>Absent</th>
                <th>Retard</th>
              </tr>
            </thead>
            <tbody>
              {eleves.map(eleve => (
                <tr key={eleve.id}>
                  <td>{eleve.nom} {eleve.prenom}</td>
                  <td>
                    <input
                      type="radio"
                      name={`presence-${eleve.id}`}
                      checked={presences[eleve.id] === 'present'}
                      onChange={() => handlePresenceChange(eleve.id, 'present')}
                    />
                  </td>
                  <td>
                    <input
                      type="radio"
                      name={`presence-${eleve.id}`}
                      checked={presences[eleve.id] === 'absent'}
                      onChange={() => handlePresenceChange(eleve.id, 'absent')}
                    />
                  </td>
                  <td>
                    <input
                      type="radio"
                      name={`presence-${eleve.id}`}
                      checked={presences[eleve.id] === 'retard'}
                      onChange={() => handlePresenceChange(eleve.id, 'retard')}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
          >
            {loading ? 'Enregistrement...' : 'Enregistrer les présences'}
          </button>
        </form>
      )}
    </div>
  );
};

export default MarquagePresence;
