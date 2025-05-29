import React, { useState } from 'react';
import axios from 'axios';
import './style.css'


const AddMatiere = () => {
    const [matiere, setMatiere] = useState({ nom: '' });
    const [message, setMessage] = useState(''); // Message de succès ou d'erreur
    const [error, setError] = useState(false);

    const handleChange = (e) => {
        setMatiere({ ...matiere, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!matiere.nom) {
            setError(true);
            setMessage('Le nom de la matière est requis');
            return;
        }

        axios.post('http://localhost:8000/api/matieres/store', matiere,{
            headers: {
                'Content-Type': 'application/json'
            }
        })
            .then(res => {
                setMessage('Matière ajoutée avec succès');
                setError(false);
                setMatiere({ nom: '' }); // Réinitialiser le champ
            })
            .catch(err => {
                setMessage('Erreur lors de l’ajout de la matière');
                setError(true);
                console.error(err.response.data);
            });
    };

    return (
        <form onSubmit={handleSubmit}>
            <input
                type="text"
                name="nom"
                value={matiere.nom}
                onChange={handleChange}
                placeholder="Nom de la Matière"
            />
            <button type="submit">Ajouter la matière</button>
            {message && <p style={{ color: error ? 'red' : 'green' }}>{message}</p>}
        </form>
    );
};

export default AddMatiere;
