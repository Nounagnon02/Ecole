import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './style.css'

import { useNavigate } from 'react-router-dom';

const ShowCandidats = () => {
    const [candidats, setCandidats] = useState([]); // Stocke les matières récupérées
    const [selectedCandidats, setSelectedCantidats] = useState(null); // Matière à modifier
    const [newCandidatName, setNewCandidatName] = useState(''); // Nom de la nouvelle matière
    const [newCandidatFirstName, setNewCandidatFirstName] = useState(''); // Nom de la nouvelle matière
    const [newCandidatEmail, setNewCandidatEmail] = useState(''); // Nom de la nouvelle matière

    // Récupérer les matières au chargement du composant
    useEffect(() => {
        fetchCandidats();
    }, []);
    const navigate=useNavigate();

    const fetchCandidats = async () => {
        try {
            const res = await axios.get('http://localhost:8000/api/candidats');
            setCandidats(res.data);
        } catch (err) {
            console.error(err);
        }
    };
    const handleButtonClick = () => {
        navigate('/candidats/add'); // Rediriger vers la route cible
    };
    const handleEdit = (candidat) => {
        setSelectedCantidats(candidat);
        setNewCandidatName(candidat.nom);
        setNewCandidatFirstName(candidat.prenom);
        setNewCandidatEmail(candidat.email);
    };

    const handleDelete = async (id) => {
        try {
            await axios.delete(`http://localhost:8000/api/candidats/delete/${id}`);
            fetchCandidats(); // Rafraîchir la liste après la suppression
        } catch (err) {
            console.error(err);
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        if (selectedCandidats) {
            try {
                await axios.put(`http://localhost:8000/api/candidats/update/${selectedCandidats.id}`, {
                    nom: newCandidatName,
                    prenom:newCandidatFirstName,
                    email:newCandidatEmail
                });
                setSelectedCantidats(null); // Réinitialiser la matière sélectionnée
                setNewCandidatName(''); // Réinitialiser le nom
                setNewCandidatFirstName('');
                setNewCandidatEmail('');
                fetchCandidats(); // Rafraîchir la liste après la mise à jour
            } catch (err) {
                console.error(err);
            }
        }
    };

    return (
        <div>
            {/* Affichage des matières sous forme de tableau */}
            <h2>Liste des Candidats</h2>
            <button onClick={(handleButtonClick)}>Ajouter</button>
            <table border="1">
                <thead>
                    <tr>
                        <th>Nom</th>
                        <th>Prenom</th>
                        <th>Email</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {candidats.map((candidat) => (
                        <tr key={candidat.id}>
                            <td>{candidat.nom}</td>
                            <td>{candidat.prenom}</td>
                            <td>{candidat.email}</td>
                            <td>
                                <button onClick={() => handleEdit(candidat)}>Modifier</button>
                                <button onClick={() => handleDelete(candidat.id)}>Supprimer</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Formulaire pour modifier une matière */}
            {selectedCandidats && (
                <form onSubmit={handleUpdate}>
                    <h3>Modifier le Candidat</h3>
                    <input 
                        type="text" 
                        value={newCandidatName} 
                        onChange={(e) => setNewCandidatName(e.target.value)} 
                        placeholder="Nom du Candidat" 
                    />
                      <input 
                        type="text" 
                        value={newCandidatFirstName} 
                        onChange={(e) => setNewCandidatFirstName(e.target.value)} 
                        placeholder="Prénom du Candidat" 
                    />
                      <input 
                        type="email" 
                        value={newCandidatEmail} 
                        onChange={(e) => setNewCandidatEmail(e.target.value)} 
                        placeholder="Email du Candidat" 
                    />
                    <button type="submit">Mettre à jour</button>
                    <button type="button" onClick={() => setSelectedCantidats(null)}>Annuler</button>
                </form>
            )}
        </div>
    );
};

export default ShowCandidats;
