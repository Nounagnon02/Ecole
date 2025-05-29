import React from 'react';
import './style.css'


const SessionTable = ({ sessions, onDelete, onView }) => {
    return (
        <table border="1">
            <thead>
                <tr>
                    <th>Nom</th>
                    <th>Statut</th>
                    <th>Date de Début</th>
                    <th>Date de Fin</th>
                    <th>Matières</th>
                    <th>Actions</th> {/* Colonne pour les boutons d'action */}
                </tr>
            </thead>
            <tbody>
                {sessions.map((session) => (
                    <tr key={session.id}>
                        <td>{session.nom}</td>
                        <td>{session.statut}</td>
                        <td>{session.date_debut}</td>
                        <td>{session.date_fin}</td>
                        <td>
                            {session.matieres.length > 0 ? (
                                session.matieres.map(matiere => (
                                    <span key={matiere.id}>{matiere.nom}, </span>
                                ))
                            ) : (
                                <span>Aucune matière</span>
                            )}
                        </td>
                        <td>
                            {/* Bouton Voir pour chaque session */}
                            <button onClick={() => onView(session)}>Voir</button>
                            {/* Bouton Supprimer */}
                            <button onClick={() => onDelete(session.id)}>Supprimer</button>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
};

export default SessionTable;
