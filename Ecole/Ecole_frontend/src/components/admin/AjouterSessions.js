import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../AddCandidat.css'

const AddSession = () => {
  const [nom, setNom] = useState('');
  const [date_debut, setDateDebut] = useState('');
  const [date_fin, setDateFin] = useState('');
  const [statut, setStatut] = useState('');
  const [matieres, setMatieres] = useState([]);
  const [selectedMatieres, setSelectedMatieres] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('http://localhost:8000/api/matieres')
      .then((response) => {
        setMatieres(response.data);
        setLoading(false);
      })
      .catch(() => {
        setError('Erreur lors du chargement des matières');
        setLoading(false);
      });
  }, []);

  const handleMatiereChange = (e) => {
    const { value, checked } = e.target;
    if (checked) {
      setSelectedMatieres([...selectedMatieres, value]);
    } else {
      setSelectedMatieres(selectedMatieres.filter((id) => id !== value));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validation supplémentaire : date_debut avant date_fin
    if (new Date(date_debut) >= new Date(date_fin)) {
      setError('La date de début doit être antérieure à la date de fin');
      return;
    }

    axios.post('http://localhost:8000/api/sessions/store', {
      nom,
      date_debut,
      date_fin,
      statut,
      matieres: selectedMatieres,
    })
      .then(() => {
        alert('Session enregistrée avec succès');
      })
      .catch(() => {
        setError('Erreur lors de l\'enregistrement de la session');
      });
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Ajouter une Session</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      
      <div>
        <label>Nom:</label>
        <input
          type="text"
          value={nom}
          onChange={(e) => setNom(e.target.value)}
          required
        />
      </div>
      
      <div>
        <label>Date de Début:</label>
        <input
          type="date"
          value={date_debut}
          onChange={(e) => setDateDebut(e.target.value)}
          required
        />
      </div>
      
      <div>
        <label>Date de Fin:</label>
        <input
          type="date"
          value={date_fin}
          onChange={(e) => setDateFin(e.target.value)}
          required
        />
      </div>
      
      <div>
        <label>Statut:</label>
        <select
          value={statut}
          onChange={(e) => setStatut(e.target.value)}
          required
        >
          <option value="">Sélectionner un statut</option>
          <option value="ouverte">Ouverte</option>
          <option value="fermée">Fermée</option>
        </select>
      </div>
      
      <div>
        <label>Matières:</label>
        {loading ? (
          <p>Chargement des matières...</p>
        ) : (
          matieres.length > 0 ? (
            <div className="checkbox-group">
              {matieres.map((matiere) => (
                <div key={matiere.id}>
                  <input
                    type="checkbox"
                    id={`matiere-${matiere.id}`}
                    value={matiere.id}
                    onChange={handleMatiereChange}
                  />
                  <label htmlFor={`matiere-${matiere.id}`}>{matiere.nom}</label>
                </div>
              ))}
            </div>
          ) : (
            <p>Aucune matière disponible</p>
          )
        )}
      </div>
      
      <button type="submit">Enregistrer la session</button>
    </form>
  );
};

export default AddSession;
