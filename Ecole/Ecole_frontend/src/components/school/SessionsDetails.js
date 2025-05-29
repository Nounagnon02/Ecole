import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../admin/style.css';
import { useParams } from 'react-router-dom';

const SessionDetails = () => {
    const { id } = useParams(); // Récupérer l'ID de la session à partir de l'URL
    const [session, setSession] = useState(null);

    // Récupérer les détails de la session
    useEffect(() => {
        axios.get(`http://localhost:8000/api/sessions/${id}`)
            .then(res => setSession(res.data))
            .catch(err => console.error(err));
    }, [id]);

    if (!session) {
        return <p>Chargement...</p>;
    }

    return (
        <div>
            <h2>Détails de la Session</h2>
            <p><strong>Nom:</strong> {session.nom}</p>
            <p><strong>Statut:</strong> {session.statut}</p>
            <p><strong>Date de Début:</strong> {session.date_debut}</p>
            <p><strong>Date de Fin:</strong> {session.date_fin}</p>
            <p><strong>Matières:</strong></p>
            <ul>
                {session.matieres.map(matiere => (
                    <li key={matiere.id}>{matiere.nom}</li>
                ))}
            </ul>
        </div>
    );
};

export default SessionDetails;
