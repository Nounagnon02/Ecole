import React, { useEffect, useState } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';

const Bulletin = ({ candidatId, onClose }) => {
    const [bulletinData, setBulletinData] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchBulletin = async () => {
            try {
                const response = await axios.get(`http://localhost:8000/api/candidats/${candidatId}/bulletin`);
                setBulletinData(response.data);
            } catch (error) {
                console.error("Erreur lors de la récupération du bulletin :", error);
                setError('Erreur lors de la récupération des données.');
            }
        };

        fetchBulletin();
    }, [candidatId]);

    if (error) {
        return <p className="error">{error}</p>;
    }

    if (!bulletinData) {
        return <p>Chargement du bulletin...</p>;
    }

    const { candidats, notes, moyenne } = bulletinData;

    // Fonction pour générer le PDF
    const handleDownloadPDF = () => {
        const doc = new jsPDF();

        doc.text(`Bulletin de ${candidats.nom} ${candidats.prenom}`, 10, 10);
        doc.text("Matières et notes :", 10, 20);

        // Ajouter les matières et les notes dans le PDF
        notes.forEach((note, index) => {
            doc.text(`${note.matieres.nom} : ${note.note !== null ? note.note : 'Pas de note'}`, 10, 30 + index * 10);
        });

        doc.text(`Moyenne: ${moyenne !== null ? moyenne : 'Non disponible'}`, 10, 30 + notes.length * 10 + 10);

        // Sauvegarder et télécharger le fichier PDF
        doc.save(`Bulletin_${candidats.nom}_${candidats.prenom}.pdf`);
    };

    return (
        <div className="bulletin">
            <h3>Bulletin de {candidats.nom} {candidats.prenom}</h3>
            <table>
                <thead>
                    <tr>
                        <th>Matière</th>
                        <th>Note</th>
                    </tr>
                </thead>
                <tbody>
                    {notes.map(note => (
                        <tr key={note.id}>
                            <td>{note.matieres.nom}</td>
                            <td>{note.note !== null ? note.note : 'Pas de note'}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <h4>Moyenne: {moyenne !== null ? moyenne : 'Non disponible'}</h4>
            
            {/* Bouton pour télécharger le PDF */}
            <button onClick={handleDownloadPDF}>Télécharger le bulletin en PDF</button>
            <button onClick={onClose}>Fermer</button>
        </div>
    );
};

export default Bulletin;
