import { useState } from 'react';
import '../styles/GlobalStyles.css';
import axios from 'axios';

export function MatiereUpdate() {

    const [matiere, SetMatiere] = useState({
        nom: "",
    });

    const [error, SetError] = useState(false);
    const [message, SetMessage] = useState('');

    const HandleChange = (e) => {
        SetMatiere({ ...matiere, [e.target.name]: e.target.value });
    };


    const HandleSubmit = (e) => {
        e.preventDefault();

        if (!matiere.nom) {
            SetError(true);
            SetMessage('Le nom de la matiere est  requis');
            return;
        }



        axios.post('http://localhost:8000/api/matieres', matiere, {
            headers: {
                'Content-Type': 'application/json'
            }
        })
            .then(res => {
                SetMessage('Matiere ajoutée avec succès');
                SetError(false);
                SetMatiere({
                    nom: "",
                });

            })
            .catch(err => {
                const errorMessage = err.response?.data?.message || "Erreur lors de l'ajout";
                const errorDetails = err.response?.data?.errors || err.response?.data?.error || err.message;

                SetMessage(`${errorMessage}: ${JSON.stringify(errorDetails)}`);
                SetError(true);
                console.error('Erreur détaillée:', err.response?.data || err.message);
            });
    };

    return (
        <div className="form-container">
            <form onSubmit={HandleSubmit}>

                <h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem', fontWeight: 'bold' }}>Enregistrement d'une Matière</h2>

                {message && (
                    <div className={`message ${error ? 'error' : 'success'}`}>
                        {message}
                    </div>
                )}

                <div className="form-group">
                    <input
                        type="text"
                        className="form-input"
                        name="nom"
                        value={matiere.nom}
                        onChange={HandleChange}
                        placeholder="Le Nom de la Matière"
                    />
                </div>

                <button className="btn btn-primary" type="submit">Enregistrer</button>
            </form>
        </div>
    );
}
