import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, Save } from 'lucide-react';
import api from '../../../api';

// Simple Modal Component
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

export default function ClassesPage({ classes, onRefresh }) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingClasse, setEditingClasse] = useState(null);
    const [formData, setFormData] = useState({ nom_classe: '', categorie_classe: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    // Reset form when modal opens/closes
    useEffect(() => {
        if (!isModalOpen) {
            setFormData({ nom_classe: '', categorie_classe: '' });
            setEditingClasse(null);
            setError('');
            setMessage('');
        }
    }, [isModalOpen]);

    const handleEdit = (classe) => {
        setEditingClasse(classe);
        setFormData({
            nom_classe: classe.nom_classe || classe.nom, // Handle potential API inconsistencies
            categorie_classe: classe.categorie_classe
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette classe ? Cette action est irréversible.')) return;

        setLoading(true);
        try {
            await api.delete(`/classes/delete/${id}`);
            onRefresh(); // Refresh list via parent
            alert('Classe supprimée avec succès');
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
            if (editingClasse) {
                // Update
                await api.put(`/classes/update/${editingClasse.id}`, {
                    nom: formData.nom_classe, // API often expects 'nom' for update but 'nom_classe' for store, verify!
                    nom_classe: formData.nom_classe,
                    categorie_classe: formData.categorie_classe
                });
                setMessage('Classe modifiée avec succès');
            } else {
                // Create
                await api.post('/classes/store', formData);
                setMessage('Classe ajoutée avec succès');
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
        <div className="classes-page">
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', alignItems: 'center' }}>
                <h2>Gestion des Classes</h2>
                <button className="btn btn-primary" onClick={() => setIsModalOpen(true)} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <Plus size={18} /> Nouvelle Classe
                </button>
            </div>

            <div className="card">
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ background: '#f8f9fa', textAlign: 'left' }}>
                            <th style={{ padding: '1rem' }}>Nom de la classe</th>
                            <th style={{ padding: '1rem' }}>Catégorie / Niveau</th>
                            <th style={{ padding: '1rem', textAlign: 'right' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {classes.length === 0 ? (
                            <tr><td colSpan="3" style={{ padding: '1rem', textAlign: 'center' }}>Aucune classe trouvée</td></tr>
                        ) : (
                            classes.map(classe => (
                                <tr key={classe.id} style={{ borderBottom: '1px solid #eee' }}>
                                    <td style={{ padding: '1rem' }}>{classe.nom_classe || classe.nom}</td>
                                    <td style={{ padding: '1rem' }}>
                                        <span className={`badge badge-${classe.categorie_classe?.toLowerCase() || 'default'}`}>
                                            {classe.categorie_classe}
                                        </span>
                                    </td>
                                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                                        <button onClick={() => handleEdit(classe)} className="btn-icon" style={{ marginRight: '0.5rem', color: '#3b82f6' }}>
                                            <Edit2 size={18} />
                                        </button>
                                        <button onClick={() => handleDelete(classe.id)} className="btn-icon" style={{ color: '#ef4444' }}>
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
                title={editingClasse ? "Modifier la classe" : "Ajouter une classe"}
            >
                {message && <div style={{ padding: '0.5rem', background: '#dcfce7', color: '#166534', borderRadius: '4px', marginBottom: '1rem' }}>{message}</div>}
                {error && <div style={{ padding: '0.5rem', background: '#fee2e2', color: '#991b1b', borderRadius: '4px', marginBottom: '1rem' }}>{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-group" style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem' }}>Nom de la classe</label>
                        <input
                            type="text"
                            className="form-input"
                            value={formData.nom_classe}
                            onChange={e => setFormData({ ...formData, nom_classe: e.target.value })}
                            placeholder="Ex: 6ème A"
                            required
                            style={{ width: '100%', padding: '0.5rem' }}
                        />
                    </div>

                    <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem' }}>Niveau / Catégorie</label>
                        <select
                            className="form-input"
                            value={formData.categorie_classe}
                            onChange={e => setFormData({ ...formData, categorie_classe: e.target.value })}
                            required
                            style={{ width: '100%', padding: '0.5rem' }}
                        >
                            <option value="">Sélectionner...</option>
                            <option value="Maternelle">Maternelle</option>
                            <option value="Primaire">Primaire</option>
                            <option value="Secondaire">Secondaire</option>
                        </select>
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
