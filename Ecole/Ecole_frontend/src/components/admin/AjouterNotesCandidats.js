import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './style.css'

import { useParams } from 'react-router-dom';

const AjouterNotesCandidats = () => {
    const { sessionId } = useParams(); // Récupérer l'ID de la session depuis l'URL
    const [candidats, setCandidates] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [selectedCandidate, setSelectedCandidate] = useState('');
    const [notes, setNotes] = useState({});
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [ignoredNotes, setIgnoredNotes] = useState([]); // Nouvel état pour les notes ignorées

    useEffect(() => {
        // Récupérer la liste des candidats pour la session
        const fetchCandidates = async () => {
            try {
                const response = await axios.get(`http://localhost:8000/api/sessions/${sessionId}/candidats`);
                setCandidates(response.data);
            } catch (error) {
                console.error('Erreur lors de la récupération des candidats:', error);
            }
        };

        // Récupérer les matières spécifiques à la session
        const fetchSubjects = async () => {
            try {
                const response = await axios.get(`http://localhost:8000/api/sessions/${sessionId}/matieres`);
                setSubjects(response.data);
            } catch (error) {
                console.error('Erreur lors de la récupération des matières:', error);
            }
        };

        fetchCandidates();
        fetchSubjects();
    }, [sessionId]);

    // Met à jour les notes pour chaque matière
    const handleNoteChange = (subjectId, noteValue) => {
        setNotes(prevNotes => ({
            ...prevNotes,
            [subjectId]: noteValue
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSuccessMessage('');
        setErrorMessage('');
        setIgnoredNotes([]); // Réinitialise les notes ignorées avant chaque soumission

        try {
            // Construction du tableau de notes à envoyer
            const notesData = subjects.map(subject => ({
                candidat_id: selectedCandidate,  // Candidat sélectionné
                matiere_id: subject.id,          // ID de la matière
                note: notes[subject.id]          // Note correspondante à la matière
            }));

            const response = await axios.post(`http://localhost:8000/api/sessions/${sessionId}/notes`, {
                notes: notesData, // Envoi du tableau de notes au backend
            });

            if (response.status === 201) {
                const { ignored_notes } = response.data;
                
                if (ignored_notes && ignored_notes.length > 0) {
                    // Si des notes ont été ignorées, on les stocke pour affichage
                    setIgnoredNotes(ignored_notes);
                    
                } else {
                    setSuccessMessage('Notes ajoutées avec succès !');
                }

                setNotes({}); // Réinitialise les notes après le succès
            }
        } catch (error) {
            // Gestion des erreurs du backend
            if (error.response && error.response.data) {
                setErrorMessage(`Erreur: ${error.response.data.message}`);
            } else {
                setErrorMessage('Erreur lors de l\'ajout des notes.');
            }
            console.error('Erreur lors de l\'ajout des notes:', error.response ? error.response.data : error);
        }
    };

    return (
        <div>
            <h2>Ajouter les Notes</h2>
            {successMessage && <div className="success">{successMessage}</div>}
            {errorMessage && <div className="error">{errorMessage}</div>}

            {/* Affichage des messages d'avertissement pour les notes ignorées */}
            {ignoredNotes.length > 0 && (
                <div className="warning">
                    <p>Les notes pour les matières suivantes existent déjà et n'ont pas été enregistrées :</p>
                    <ul>
                        {ignoredNotes.map((ignoredNote, index) => {
                            const subject = subjects.find(sub => sub.id === ignoredNote.matiere_id);
                            return subject ? <li key={index}>{subject.nom}</li> : null;
                        })}
                    </ul>
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <div>
                    <label>
                        Candidat:
                        <select value={selectedCandidate} onChange={(e) => setSelectedCandidate(e.target.value)} required>
                            <option value="">Sélectionner un candidat</option>
                            {candidats.map(candidate => (
                                <option key={candidate.id} value={candidate.id}>{candidate.nom} {candidate.prenom}</option>
                            ))}
                        </select>
                    </label>
                </div>

                {/* Affichage des champs de note pour chaque matière */}
                <div>
                    {subjects.map(subject => (
                        <div key={subject.id}>
                            <label>
                                {subject.nom}:
                                <input
                                    type="number"
                                    value={notes[subject.id] || ''}
                                    onChange={(e) => handleNoteChange(subject.id, e.target.value)}
                                    required
                                    min="0"
                                    max="20" // Ajuster en fonction du système de notation
                                />
                            </label>
                        </div>
                    ))}
                </div>

                <button type="submit">Ajouter les Notes</button>
            </form>
        </div>
    );
};

export default AjouterNotesCandidats;
