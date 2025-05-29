import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './style.css'


const SessionDetails = ({ session, onClose }) => {
    const navigate = useNavigate();
    const [moyennes, setMoyennes] = useState({}); // État pour les moyennes
    const [notes, setNotes] = useState({}); // État pour les notes des candidats

    useEffect(() => {
        // Fonction pour récupérer les moyennes des candidats
        const fetchMoyennes = async () => {
            try {
                const response = await axios.get(`http://localhost:8000/api/sessions/${session.id}/moyennes`);
                const moyennesObj = response.data.reduce((acc, item) => {
                    acc[item.candidats_id] = item.moyenne;
                    return acc;
                }, {});
                setMoyennes(moyennesObj);
            } catch (error) {
                console.error("Erreur lors de la récupération des moyennes :", error);
            }
        };

        // Fonction pour récupérer les notes des candidats
        const fetchNotes = async () => {
            try {
                const response = await axios.get(`http://localhost:8000/api/sessions/${session.id}/note`); // Appel à la route Laravel pour les notes
                const notesObj = response.data.reduce((acc, item) => {
                    const { candidats_id, matieres_id, note } = item;
                    if (!acc[candidats_id]) {
                        acc[candidats_id] = {};
                    }
                    acc[candidats_id][matieres_id] = note;
                    return acc;
                }, {});
                setNotes(notesObj);
            } catch (error) {
                console.error("Erreur lors de la récupération des notes :", error);
            }
        };

        fetchMoyennes();
        fetchNotes();
    }, [session.id]);

    if (!session) {
        return <p>Session non disponible.</p>;
    }

    return (
        <div className="modal">
            <h3>Détails de la session : {session.nom}</h3>
            <table>
                <tbody>
                    <tr><td><strong>Statut :</strong></td><td>{session.statut}</td></tr>
                    <tr><td><strong>Date de Début :</strong></td><td>{session.date_debut}</td></tr>
                    <tr><td><strong>Date de Fin :</strong></td><td>{session.date_fin}</td></tr>
                </tbody>
            </table>

            <h4>Matières :</h4>
            {session.matieres && session.matieres.length > 0 ? (
                <table>
                    <thead>
                        <tr><th>ID</th><th>Nom de la Matière</th></tr>
                    </thead>
                    <tbody>
                        {session.matieres.map(matiere => (
                            <tr key={matiere.id}><td>{matiere.id}</td><td>{matiere.nom}</td></tr>
                        ))}
                    </tbody>
                </table>
            ) : <p>Aucune matière disponible</p>}

            <h4>Candidats Inscrits :</h4>
            {session.candidats && session.candidats.length > 0 ? (
                <table>
                    <thead>
                        <tr>
                            <th>ID</th><th>Nom</th><th>Prénom</th>
                            {session.matieres.map(matiere => (
                                <th key={matiere.id}>{matiere.nom}</th>
                            ))}
                            <th>Moyenne</th>
                        </tr>
                    </thead>
                    <tbody>
                        {session.candidats.map(candidat => (
                            <tr key={candidat.id}>
                                <td>{candidat.id}</td>
                                <td>{candidat.nom}</td>
                                <td>{candidat.prenom}</td>
                                {session.matieres.map(matiere => (
                                    <td key={matiere.id}>
                                        {notes[candidat.id] && notes[candidat.id][matiere.id] !== undefined
                                            ? notes[candidat.id][matiere.id]
                                            : 'Pas de note'}
                                    </td>
                                ))}
                                <td>{moyennes[candidat.id] !== undefined ? moyennes[candidat.id] : 'Pas de moyenne'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            ) : <p>Aucun candidat inscrit</p>}

            <button onClick={onClose}>Fermer</button>
            <button onClick={() => navigate(`/session/addcandidats/${session.id}`)} disabled={session.statut !== 'ouverte'}>
                Ajouter Un Candidat
            </button>
            <button onClick={() => navigate(`/ajouter/note/candidat/${session.id}`)} disabled={session.statut !== 'ouverte'}>
                Ajouter Une Note
            </button>
        </div>
    );
};

export default SessionDetails;
