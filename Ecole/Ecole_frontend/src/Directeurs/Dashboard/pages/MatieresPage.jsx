import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, Save } from 'lucide-react';
import api from '../../../api';

// Reusable Modal Component
const Modal = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;
    return (
        <div className="modal-overlay" style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
            <div className="modal-content" style={{
                backgroundColor: 'white', padding: '2rem', borderRadius: '8px', minWidth: '400px', maxWidth: '90%'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <h3>{title}</h3>
                    <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer' }}><X size={20} /></button>
                </div>
                {children}
            </div>
        </div>
    );
};

export default function MatieresPage({ matieres, onRefresh }) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingMatiere, setEditingMatiere] = useState(null);
    const [formData, setFormData] = useState({ nom: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    // Reset form
    useEffect(() => {
        if (!isModalOpen) {
            setFormData({ nom: '' });
            setEditingMatiere(null);
            setError('');
            setMessage('');
        }
    }, [isModalOpen]);

    const handleEdit = (matiere) => {
        setEditingMatiere(matiere);
        setFormData({ nom: matiere.nom });
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette matière ?')) return;

        setLoading(true);
        try {
            await api.delete(`/matieres/delete/${id}`);
            onRefresh();
            alert('Matière supprimée avec succès');
        } catch (err) {
            console.error(err);
            alert('Erreur lors de la suppression');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            if (editingMatiere) {
                await api.post(`/matieres/update/${editingMatiere.id}`, formData);
                setMessage('Matière modifiée avec succès');
            } else {
                await api.post('/matieres/store', formData);
                setMessage('Matière ajoutée avec succès');
            }

            onRefresh();
            setTimeout(() => setIsModalOpen(false), 1500);

        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || 'Une erreur est survenue');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="matieres-page">
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', alignItems: 'center' }}>
                <h2>Gestion des Matières</h2>
                <button className="btn btn-primary" onClick={() => setIsModalOpen(true)} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <Plus size={18} /> Nouvelle Matière
                </button>
            </div>

            <div className="card">
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ background: '#f8f9fa', textAlign: 'left' }}>
                            <th style={{ padding: '1rem' }}>Nom de la matière</th>
                            <th style={{ padding: '1rem', textAlign: 'right' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {matieres.length === 0 ? (
                            <tr><td colSpan="2" style={{ padding: '1rem', textAlign: 'center' }}>Aucune matière trouvée</td></tr>
                        ) : (
                            matieres.map(matiere => (
                                <tr key={matiere.id} style={{ borderBottom: '1px solid #eee' }}>
                                    <td style={{ padding: '1rem' }}>{matiere.nom}</td>
                                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                                        <button onClick={() => handleEdit(matiere)} className="btn-icon" style={{ marginRight: '0.5rem', color: '#3b82f6' }}>
                                            <Edit2 size={18} />
                                        </button>
                                        <button onClick={() => handleDelete(matiere.id)} className="btn-icon" style={{ color: '#ef4444' }}>
                                            <Trash2 size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingMatiere ? "Modifier la matière" : "Ajouter une matière"}
            >
                {message && <div style={{ padding: '0.5rem', background: '#dcfce7', color: '#166534', borderRadius: '4px', marginBottom: '1rem' }}>{message}</div>}
                {error && <div style={{ padding: '0.5rem', background: '#fee2e2', color: '#991b1b', borderRadius: '4px', marginBottom: '1rem' }}>{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem' }}>Nom de la matière</label>
                        <input
                            type="text"
                            className="form-input"
                            value={formData.nom}
                            onChange={e => setFormData({ ...formData, nom: e.target.value })}
                            placeholder="Ex: Mathématiques"
                            required
                            style={{ width: '100%', padding: '0.5rem' }}
                        />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                        <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary">Annuler</button>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? 'Enregistrement...' : 'Enregistrer'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
