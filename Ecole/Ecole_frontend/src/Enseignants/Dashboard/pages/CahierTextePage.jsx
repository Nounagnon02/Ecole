import React, { useState } from 'react';
import { Plus, BookOpen, Trash2 } from 'lucide-react';
import api from '../../../api';

const CahierTextePage = ({ devoirs = [], onRefresh }) => {
    const [newDevoir, setNewDevoir] = useState({
        classe_id: '',
        matiere_id: '',
        titre: '',
        description: '',
        date_limite: '',
        type: 'devoir'
    });
    const [loading, setLoading] = useState(false);

    const ajouterDevoir = async () => {
        if (!newDevoir.titre || !newDevoir.date_limite) {
            alert('Veuillez remplir les champs obligatoires');
            return;
        }

        try {
            setLoading(true);
            const enseignantId = localStorage.getItem('userId');
            await api.post('/devoirs', { ...newDevoir, enseignant_id: enseignantId });
            alert('Devoir ajouté avec succès');
            setNewDevoir({
                classe_id: '',
                matiere_id: '',
                titre: '',
                description: '',
                date_limite: '',
                type: 'devoir'
            });
            if (onRefresh) onRefresh();
        } catch (error) {
            console.error('Erreur:', error);
            alert('Erreur lors de l\'ajout du devoir');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="cahier-texte-container">
            <div className="card p-4 mb-4">
                <h3 className="mb-3"><Plus size={18} /> Ajouter un devoir</h3>
                <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <input
                        className="form-input"
                        type="text"
                        placeholder="Titre du devoir"
                        value={newDevoir.titre}
                        onChange={(e) => setNewDevoir({ ...newDevoir, titre: e.target.value })}
                    />
                    <input
                        className="form-input"
                        type="date"
                        value={newDevoir.date_limite}
                        onChange={(e) => setNewDevoir({ ...newDevoir, date_limite: e.target.value })}
                    />
                    <textarea
                        className="form-input"
                        style={{ gridColumn: 'span 2' }}
                        placeholder="Description détaillée"
                        value={newDevoir.description}
                        onChange={(e) => setNewDevoir({ ...newDevoir, description: e.target.value })}
                    />
                    <button
                        onClick={ajouterDevoir}
                        className="btn btn-primary"
                        disabled={loading}
                    >
                        {loading ? 'Ajout...' : 'Publier le devoir'}
                    </button>
                </div>
            </div>

            <div className="devoirs-list">
                <h3 className="mb-3"><BookOpen size={18} /> Devoirs en cours</h3>
                {devoirs.length === 0 ? (
                    <p className="text-muted">Aucun devoir programmé.</p>
                ) : (
                    <div className="grid-devoirs" style={{ display: 'grid', gap: '1rem' }}>
                        {devoirs.map(devoir => (
                            <div key={devoir.id} className="card p-3 d-flex justify-content-between">
                                <div>
                                    <h4 className="m-0">{devoir.titre}</h4>
                                    <p className="text-muted small m-0">{devoir.description}</p>
                                    <span className="badge badge-info mt-2">Pour le {new Date(devoir.date_limite).toLocaleDateString()}</span>
                                </div>
                                <button className="btn btn-icon text-danger">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CahierTextePage;
