// src/components/student/StudentDashboard.js
import React, { useState } from 'react';
import axios from 'axios';
import Bulletin from './Bulletin';

const StudentDashboard = () => {
    const [matricule, setMatricule] = useState('');
    const [showBulletin, setShowBulletin] = useState(false);
    const [candidatId, setCandidatId] = useState(null);
    const [error, setError] = useState('');

    const handleSearch = async () => {
        try {
            // Remplacez l'URL par celle de votre API pour récupérer le candidat par matricule
            const response = await axios.get(`http://localhost:8000/api/candidats/matricule/${matricule}`);
            const candidat = response.data;

            if (candidat) {
                setCandidatId(candidat.id);
                setShowBulletin(true);
                setError('');
            } else {
                setError('Candidat non trouvé.');
            }
        } catch (error) {
            console.error("Erreur lors de la recherche du candidat :", error);
            setError('Une erreur est survenue lors de la recherche.');
        }
    };

    return (
        <div className="student-dashboard">
            <h2>Tableau de Bord Étudiant</h2>
            <p>Bienvenue sur votre tableau de bord, étudiant !</p>

            <div>
                <input
                    type="text"
                    placeholder="Entrez votre numéro matricule"
                    value={matricule}
                    onChange={(e) => setMatricule(e.target.value)}
                />
                <button onClick={handleSearch}>Rechercher</button>
            </div>

            {error && <p className="error">{error}</p>}

            {showBulletin && (
                <Bulletin candidatId={candidatId} onClose={() => setShowBulletin(false)} />
            )}
        </div>
    );
};

export default StudentDashboard;
