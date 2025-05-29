import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';

const AddCandidatToSession = () => {
  const { sessionId } = useParams();
  const [candidatId, setCandidatId] = useState('');
  const [candidats, setCandidats] = useState([]);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    fetchCandidats();
  }, []);

  const fetchCandidats = () => {
    axios.get('http://localhost:8000/api/candidats')
      .then(res => setCandidats(res.data))
      .catch(err => {
        console.error(err);
        setErrorMessage("Erreur lors du chargement des candidats.");
      });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!sessionId) {
      setErrorMessage("L'ID de la session n'est pas défini !");
      return;
    }

    axios.post(`http://localhost:8000/api/sessions/${sessionId}/candidats`, { candidat_id: candidatId })
      .then(res => {
        setSuccessMessage("Candidat ajouté avec succès !");
        setErrorMessage('');
      })
      .catch(err => {
        console.error(err);
        setErrorMessage("Erreur lors de l'ajout du candidat.");
        setSuccessMessage('');
      });
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <label htmlFor="candidatSelect">Sélectionnez un candidat :</label>
        <select
          id="candidatSelect"
          value={candidatId}
          onChange={(e) => setCandidatId(e.target.value)}
          required
        >
          <option value="">Choisissez un candidat</option>
          {candidats.map(candidat => (
            <option key={candidat.id} value={candidat.id}>
              {candidat.nom} {candidat.prenom}
            </option>
          ))}
        </select>
        <button type="submit">Ajouter le candidat à la session</button>
      </form>

      {/* Affichage du message de succès ou d'erreur */}
      {successMessage && <p style={{ color: 'green' }}>{successMessage}</p>}
      {errorMessage && <p style={{ color: 'red' }}>{errorMessage}</p>}
    </div>
  );
};

export default AddCandidatToSession;
