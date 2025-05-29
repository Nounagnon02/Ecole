import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './style.css'

import { useNavigate } from 'react-router-dom';

const ShowMatieres = () => {
    const [matieres, setMatieres] = useState([]); // Stocke les matières récupérées
    const [selectedMatiere, setSelectedMatiere] = useState(null); // Matière à modifier
    const [newMatiereName, setNewMatiereName] = useState(''); // Nom de la nouvelle matière

    // Récupérer les matières au chargement du composant
    useEffect(() => {
        fetchMatieres();
    }, []);
    const navigate=useNavigate();

    const fetchMatieres = async () => {
        try {
            const res = await axios.get('http://localhost:8000/api/matieres');
            setMatieres(res.data);
        } catch (err) {
            console.error(err);
        }
    };
    const handleButtonClick = () => {
        navigate('/matieres/add'); // Rediriger vers la route cible
    };
    const handleEdit = (matiere) => {
        setSelectedMatiere(matiere);
        setNewMatiereName(matiere.nom);
    };

    const handleDelete = async (id) => {
        try {
            await axios.delete(`http://localhost:8000/api/matieres/delete/${id}`);
            fetchMatieres(); // Rafraîchir la liste après la suppression
        } catch (err) {
            console.error(err);
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        if (selectedMatiere) {
            try {
                await axios.put(`http://localhost:8000/api/matieres/update/${selectedMatiere.id}`, {
                    nom: newMatiereName,
                });
                setSelectedMatiere(null); // Réinitialiser la matière sélectionnée
                setNewMatiereName(''); // Réinitialiser le nom
                fetchMatieres(); // Rafraîchir la liste après la mise à jour
            } catch (err) {
                console.error(err);
            }
        }
    };

    return (
        <div>
            {/* Affichage des matières sous forme de tableau */}
            <h2>Liste des Matières</h2>
            <button onClick={(handleButtonClick)}>Ajouter</button>
            <table border="1">
                <thead>
                    <tr>
                        <th>Nom</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {matieres.map((matiere) => (
                        <tr key={matiere.id}>
                            <td>{matiere.nom}</td>
                            <td>
                                <button onClick={() => handleEdit(matiere)}>Modifier</button>
                                <button onClick={() => handleDelete(matiere.id)}>Supprimer</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Formulaire pour modifier une matière */}
            {selectedMatiere && (
                <form onSubmit={handleUpdate}>
                    <h3>Modifier la Matière</h3>
                    <input 
                        type="text" 
                        value={newMatiereName} 
                        onChange={(e) => setNewMatiereName(e.target.value)} 
                        placeholder="Nom de la matière" 
                    />
                    <button type="submit">Mettre à jour</button>
                    <button type="button" onClick={() => setSelectedMatiere(null)}>Annuler</button>
                </form>
            )}
        </div>
    );
};

export default ShowMatieres;
