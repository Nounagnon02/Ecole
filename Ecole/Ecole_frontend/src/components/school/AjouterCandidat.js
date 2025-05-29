import React, { useState } from 'react';
import axios from 'axios';
import '../AddCandidat.css';

// Fonction pour générer un numéro matricule unique
const generateMatricule = () => {
    // Par exemple, générer un ID unique basé sur la date et une chaîne aléatoire
    const timestamp = Date.now().toString();
    const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `MAT-${timestamp}-${randomStr}`;
};

const AddCandidat = () => {
    const [candidat, setCandidat] = useState({ nom: '', prenom: '', email: '', serie: '', numero_matricule: generateMatricule() });
    const [message, setMessage] = useState(''); // Message de succès ou d'erreur
    const [error, setError] = useState(false);

    const handleChange = (e) => {
        setCandidat({ ...candidat, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        // Validation des champs requis
        if (!candidat.nom || !candidat.prenom || !candidat.email || !candidat.serie) {
            setError(true);
            setMessage('Tous les champs sont requis.');
            return;
        }

        // Envoi des données à l'API avec le matricule généré
        axios.post('http://localhost:8000/api/candidats/store', candidat, {
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(res => {
            setMessage('Candidat ajouté avec succès');
            setError(false);
            setCandidat({ nom: '', prenom: '', email: '', serie: '', numero_matricule: generateMatricule() }); // Réinitialiser les champs avec un nouveau matricule
        })
        .catch(err => {
            setMessage('Erreur lors de l’ajout du candidat');
            setError(true);
            console.error(err.response.data);
        });
    };

    return (
        <form onSubmit={handleSubmit}>
            <input
                type="text"
                name="nom"
                value={candidat.nom}
                onChange={handleChange}
                placeholder="Nom du candidat"
            />
            <input
                type="text"
                name="prenom"
                value={candidat.prenom}
                onChange={handleChange}
                placeholder="Prénom du candidat"
            />
            <input
                type="email"
                name="email"
                value={candidat.email}
                onChange={handleChange}
                placeholder="Email du candidat"
            />
            <select
                name="serie"
                value={candidat.serie}
                onChange={handleChange}
            >
                <option value="">Sélectionnez la série</option>
                <option value="Série A">Série A</option>
                <option value="Série B">Série B</option>
                <option value="Série C">Série C</option>
                <option value="Série D">Série D</option>
                <option value="Série E">Série E</option>
                <option value="Série MC">Série MC</option>
                <option value="Série ML">Série ML</option>
            </select>
            <button type="submit">Ajouter le Candidat</button>
            
            {/* Afficher le message de succès/erreur */}
            {message && <p style={{ color: error ? 'red' : 'green' }}>{message}</p>}
            
            {/* Afficher le numéro matricule généré */}
            <p>Numéro Matricule: {candidat.numero_matricule}</p>
        </form>
    );
};

export default AddCandidat;
