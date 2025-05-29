// Exemple de composant React
import axios from 'axios';
import React from 'react';

function EnvoyerEmails() {
    const envoyerEmails = async () => {
        try {
            const response = axios.post('http://localhost:8000/envoyer_email_candidats', {
                
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                alert('Emails envoyés avec succès !');
            } else {
                alert('Erreur lors de l\'envoi des emails.');
            }
        } catch (error) {
            console.error("Erreur:", error);
            alert('Erreur de connexion.');
        }
    };

    return (
        <button onClick={envoyerEmails}>
            Envoyer numéro de matricule par email
        </button>
    );
}

export default EnvoyerEmails;
