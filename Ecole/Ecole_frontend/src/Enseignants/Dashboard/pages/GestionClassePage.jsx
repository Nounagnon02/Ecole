import React, { useState } from 'react';
import { Eye, Users } from 'lucide-react';
import api from '../../../api';

const GestionClassePage = ({ classes = [] }) => {
    const [selectedClassId, setSelectedClassId] = useState('');
    const [eleves, setEleves] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchEleves = async (classeId) => {
        if (!classeId) return;
        setLoading(true);
        try {
            const res = await api.get(`/classes/${classeId}/eleves`);
            // Adapt according to API response structure (usually data.data or just data)
            setEleves(res.data.success ? res.data.data : []);
        } catch (error) {
            console.error(error);
            setEleves([]);
        } finally {
            setLoading(false);
        }
    };

    const handleClassChange = (e) => {
        const id = e.target.value;
        setSelectedClassId(id);
        fetchEleves(id);
    };

    return (
        <div className="gestion-classe-container">
            <div className="headeraction mb-4 d-flex align-items-center gap-3">
                <Users size={24} className="text-primary" />
                <select
                    className="form-select form-input"
                    value={selectedClassId}
                    onChange={handleClassChange}
                    style={{ maxWidth: '300px' }}
                >
                    <option value="">Sélectionner une de vos classes</option>
                    {classes.map(classe => (
                        <option key={classe.id} value={classe.id}>
                            {classe.nom || classe.nom_classe}
                        </option>
                    ))}
                </select>
            </div>

            {selectedClassId && (
                <div className="eleves-list card p-0 overflow-hidden">
                    <div className="card-header p-3 bg-light border-bottom">
                        <h3 className="m-0" style={{ fontSize: '1.2rem' }}>Liste des élèves</h3>
                        <span className="badge badge-info">{eleves.length} élèves</span>
                    </div>

                    {loading ? (
                        <div className="p-5 text-center">Chargement...</div>
                    ) : eleves.length === 0 ? (
                        <div className="p-5 text-center text-muted">Aucun élève trouvé.</div>
                    ) : (
                        <div className="table-responsive">
                            <table className="table table-hover mb-0">
                                <thead>
                                    <tr>
                                        <th className="p-3">Matricule</th>
                                        <th className="p-3">Nom</th>
                                        <th className="p-3">Prénom</th>
                                        <th className="p-3 text-end">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {eleves.map(eleve => (
                                        <tr key={eleve.id}>
                                            <td className="p-3">{eleve.matricule}</td>
                                            <td className="p-3 fw-bold">{eleve.nom}</td>
                                            <td className="p-3">{eleve.prenom}</td>
                                            <td className="p-3 text-end">
                                                <button className="btn btn-sm btn-outline-primary">
                                                    <Eye size={16} /> Détails
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default GestionClassePage;
