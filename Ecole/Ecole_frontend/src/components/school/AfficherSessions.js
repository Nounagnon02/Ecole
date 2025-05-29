import React, { useState, useEffect } from 'react';
import '../admin/style.css'

import axios from 'axios';
import SessionTable from './SessionTable'; // Importation du composant SessionTable

import SessionDetails from './SessionDetails'; // Importation du composant SessionDetails

const SchoolSessions = () => {
    const [sessions, setSessions] = useState([]); // Stocke les sessions récupérées
    const [selectedSession, setSelectedSession] = useState(null); // Stocke la session sélectionnée
    const [showDetails, setShowDetails] = useState(false); // Contrôle l'affichage des détails
    
    // Récupérer les sessions au chargement du composant
    useEffect(() => {
        fetchSessions();
    }, []);
    
    const fetchSessions = () => {
        axios.get('http://localhost:8000/api/sessions')
            .then(res => setSessions(res.data))
            .catch(err => console.error(err));
    };

    // Fonction pour supprimer une session
    const handleDelete = (id) => {
        if (window.confirm('Voulez-vous vraiment supprimer cette session ?')) {
            axios.delete(`http://localhost:8000/api/sessions/${id}`)
                .then(() => {
                    // Met à jour la liste des sessions après suppression
                    setSessions(sessions.filter(session => session.id !== id));
                })
                .catch(err => console.error(err));
        }
    };

    // Fonction pour afficher les détails d'une session
    const handleView = (session) => {
        setSelectedSession(session); // Met à jour la session sélectionnée
        setShowDetails(true); // Affiche les détails de la session
    };

    // Fonction pour fermer la modal des détails
    const closeDetails = () => {
        setShowDetails(false);
        setSelectedSession(null); // Réinitialise la session sélectionnée
    };

    return (
        <div>
            <h2>Liste des Sessions</h2>
            <SessionTable 
                sessions={sessions} 
                onDelete={handleDelete} 
                onView={handleView} 
            />
            {showDetails && selectedSession && (
                <SessionDetails 
                    session={selectedSession} 
                    onClose={closeDetails} 
                />
            )}
        </div>
    );
};

export default SchoolSessions;
