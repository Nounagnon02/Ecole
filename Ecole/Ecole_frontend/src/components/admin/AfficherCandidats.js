import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import axios from 'axios';
import './style.css';
import { useNavigate } from 'react-router-dom';

// Create axios instance with default config
const api = axios.create({
    baseURL: 'http://localhost:8000/api',
    timeout: 10000,
});

// Loading component
const LoadingSpinner = memo(() => (
    <div className="loading-spinner">
        <div className="spinner"></div>
        <p>Chargement...</p>
    </div>
));

LoadingSpinner.displayName = 'LoadingSpinner';

// Error component
const ErrorMessage = memo(({ error, onRetry }) => (
    <div className="error-message">
        <p>Erreur: {error}</p>
        <button onClick={onRetry} className="retry-button">
            Réessayer
        </button>
    </div>
));

ErrorMessage.displayName = 'ErrorMessage';

// Candidat row component
const CandidatRow = memo(({ candidat, onEdit, onDelete }) => (
    <tr>
        <td>{candidat.nom}</td>
        <td>{candidat.prenom}</td>
        <td>{candidat.email}</td>
        <td>
            <button 
                onClick={() => onEdit(candidat)}
                className="edit-button"
                disabled={!candidat.id}
            >
                Modifier
            </button>
            <button 
                onClick={() => onDelete(candidat.id)}
                className="delete-button"
                disabled={!candidat.id}
            >
                Supprimer
            </button>
        </td>
    </tr>
));

CandidatRow.displayName = 'CandidatRow';

// Edit form component
const EditForm = memo(({ 
    candidat, 
    formData, 
    onFormChange, 
    onSubmit, 
    onCancel,
    isSubmitting 
}) => (
    <form onSubmit={onSubmit} className="edit-form">
        <h3>Modifier le Candidat</h3>
        <div className="form-group">
            <input 
                type="text" 
                value={formData.nom} 
                onChange={(e) => onFormChange('nom', e.target.value)} 
                placeholder="Nom du Candidat" 
                required
                disabled={isSubmitting}
            />
        </div>
        <div className="form-group">
            <input 
                type="text" 
                value={formData.prenom} 
                onChange={(e) => onFormChange('prenom', e.target.value)} 
                placeholder="Prénom du Candidat" 
                required
                disabled={isSubmitting}
            />
        </div>
        <div className="form-group">
            <input 
                type="email" 
                value={formData.email} 
                onChange={(e) => onFormChange('email', e.target.value)} 
                placeholder="Email du Candidat" 
                required
                disabled={isSubmitting}
            />
        </div>
        <div className="form-actions">
            <button 
                type="submit" 
                disabled={isSubmitting}
                className="submit-button"
            >
                {isSubmitting ? 'Mise à jour...' : 'Mettre à jour'}
            </button>
            <button 
                type="button" 
                onClick={onCancel}
                disabled={isSubmitting}
                className="cancel-button"
            >
                Annuler
            </button>
        </div>
    </form>
));

EditForm.displayName = 'EditForm';

const ShowCandidats = memo(() => {
    const [candidats, setCandidats] = useState([]);
    const [selectedCandidat, setSelectedCandidat] = useState(null);
    const [formData, setFormData] = useState({
        nom: '',
        prenom: '',
        email: ''
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const navigate = useNavigate();

    // Fetch candidats function with error handling
    const fetchCandidats = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await api.get('/candidats');
            setCandidats(response.data);
        } catch (err) {
            const errorMessage = err.response?.data?.message || 
                                err.message || 
                                'Erreur lors du chargement des candidats';
            setError(errorMessage);
            console.error('Error fetching candidats:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    // Initialize data on component mount
    useEffect(() => {
        fetchCandidats();
    }, [fetchCandidats]);

    // Handle navigation to add candidate
    const handleAddCandidate = useCallback(() => {
        navigate('/candidats/add');
    }, [navigate]);

    // Handle editing a candidate
    const handleEdit = useCallback((candidat) => {
        setSelectedCandidat(candidat);
        setFormData({
            nom: candidat.nom || '',
            prenom: candidat.prenom || '',
            email: candidat.email || ''
        });
    }, []);

    // Handle form field changes
    const handleFormChange = useCallback((field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    }, []);

    // Handle candidate deletion
    const handleDelete = useCallback(async (id) => {
        if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce candidat ?')) {
            return;
        }

        try {
            await api.delete(`/candidats/delete/${id}`);
            // Remove from local state for immediate UI feedback
            setCandidats(prev => prev.filter(candidat => candidat.id !== id));
        } catch (err) {
            const errorMessage = err.response?.data?.message || 
                                err.message || 
                                'Erreur lors de la suppression';
            setError(errorMessage);
            console.error('Error deleting candidat:', err);
        }
    }, []);

    // Handle form submission
    const handleSubmit = useCallback(async (e) => {
        e.preventDefault();
        
        if (!selectedCandidat?.id) {
            setError('Aucun candidat sélectionné');
            return;
        }

        // Validate form data
        if (!formData.nom.trim() || !formData.prenom.trim() || !formData.email.trim()) {
            setError('Tous les champs sont obligatoires');
            return;
        }

        try {
            setIsSubmitting(true);
            setError(null);
            
            const response = await api.put(`/candidats/update/${selectedCandidat.id}`, {
                nom: formData.nom.trim(),
                prenom: formData.prenom.trim(),
                email: formData.email.trim()
            });

            // Update local state with the updated candidate
            setCandidats(prev => 
                prev.map(candidat => 
                    candidat.id === selectedCandidat.id 
                        ? { ...candidat, ...response.data }
                        : candidat
                )
            );

            // Reset form
            setSelectedCandidat(null);
            setFormData({ nom: '', prenom: '', email: '' });
            
        } catch (err) {
            const errorMessage = err.response?.data?.message || 
                                err.message || 
                                'Erreur lors de la mise à jour';
            setError(errorMessage);
            console.error('Error updating candidat:', err);
        } finally {
            setIsSubmitting(false);
        }
    }, [selectedCandidat, formData]);

    // Handle form cancellation
    const handleCancel = useCallback(() => {
        setSelectedCandidat(null);
        setFormData({ nom: '', prenom: '', email: '' });
        setError(null);
    }, []);

    // Memoize candidates count for performance
    const candidatesCount = useMemo(() => candidats.length, [candidats.length]);

    // Memoize whether we have candidates
    const hasCandidates = useMemo(() => candidats.length > 0, [candidats.length]);

    if (loading) {
        return <LoadingSpinner />;
    }

    if (error && !hasCandidates) {
        return <ErrorMessage error={error} onRetry={fetchCandidats} />;
    }

    return (
        <div className="candidats-container">
            <div className="header-section">
                <h2>Liste des Candidats ({candidatesCount})</h2>
                <button 
                    onClick={handleAddCandidate}
                    className="add-button"
                >
                    Ajouter un candidat
                </button>
            </div>

            {error && (
                <div className="error-banner">
                    {error}
                </div>
            )}

            {hasCandidates ? (
                <div className="table-container">
                    <table className="candidats-table">
                        <thead>
                            <tr>
                                <th>Nom</th>
                                <th>Prénom</th>
                                <th>Email</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {candidats.map((candidat) => (
                                <CandidatRow
                                    key={candidat.id}
                                    candidat={candidat}
                                    onEdit={handleEdit}
                                    onDelete={handleDelete}
                                />
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="empty-state">
                    <p>Aucun candidat trouvé.</p>
                    <button 
                        onClick={handleAddCandidate}
                        className="add-button"
                    >
                        Ajouter le premier candidat
                    </button>
                </div>
            )}

            {selectedCandidat && (
                <EditForm
                    candidat={selectedCandidat}
                    formData={formData}
                    onFormChange={handleFormChange}
                    onSubmit={handleSubmit}
                    onCancel={handleCancel}
                    isSubmitting={isSubmitting}
                />
            )}
        </div>
    );
});

ShowCandidats.displayName = 'ShowCandidats';

export default ShowCandidats;
