/**
 * ElevesPage - Page de gestion des élèves
 * 
 * Affiche la liste paginée des élèves avec filtrage par classe et niveau.
 */
import React, { useState, useMemo, useCallback } from 'react';
import { Search, Plus, Edit2, Trash2, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../../../api';

const ITEMS_PER_PAGE = 20;

export default function ElevesPage({ eleves = [], classes = [], onRefresh }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedClasse, setSelectedClasse] = useState('');
    const [selectedNiveau, setSelectedNiveau] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [showAddModal, setShowAddModal] = useState(false);
    const [loading, setLoading] = useState(false);

    // Filtrer les élèves
    const filteredEleves = useMemo(() => {
        let result = [...eleves];

        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            result = result.filter(eleve =>
                eleve.nom?.toLowerCase().includes(term) ||
                eleve.prenom?.toLowerCase().includes(term) ||
                eleve.matricule?.toLowerCase().includes(term)
            );
        }

        if (selectedClasse) {
            result = result.filter(eleve => eleve.classe_id == selectedClasse);
        }

        if (selectedNiveau) {
            const classesDuNiveau = classes
                .filter(c => c.categorie_classe?.toLowerCase() === selectedNiveau.toLowerCase())
                .map(c => c.id);
            result = result.filter(eleve => classesDuNiveau.includes(eleve.classe_id));
        }

        return result;
    }, [eleves, searchTerm, selectedClasse, selectedNiveau, classes]);

    // Pagination
    const totalPages = Math.ceil(filteredEleves.length / ITEMS_PER_PAGE);
    const paginatedEleves = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredEleves.slice(start, start + ITEMS_PER_PAGE);
    }, [filteredEleves, currentPage]);

    // Trouver le nom de la classe
    const getClassName = useCallback((classeId) => {
        const classe = classes.find(c => c.id === classeId);
        return classe?.nom_classe || 'N/A';
    }, [classes]);

    // Supprimer un élève
    const handleDelete = async (id) => {
        if (!window.confirm('Êtes-vous sûr de vouloir supprimer cet élève ?')) return;

        try {
            setLoading(true);
            await api.delete(`/eleves/delete/${id}`);
            onRefresh?.('eleves');
        } catch (err) {
            console.error('Erreur lors de la suppression:', err);
            alert('Erreur lors de la suppression');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="eleves-page">
            {/* En-tête et filtres */}
            <div className="page-header" style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1.5rem',
                flexWrap: 'wrap',
                gap: '1rem'
            }}>
                <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold' }}>
                    Gestion des Élèves ({filteredEleves.length} élèves)
                </h2>
                <button
                    className="btn btn-primary"
                    onClick={() => setShowAddModal(true)}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                    <Plus size={18} /> Ajouter un élève
                </button>
            </div>

            {/* Filtres */}
            <div className="filters-bar card" style={{
                display: 'flex',
                gap: '1rem',
                padding: '1rem',
                marginBottom: '1.5rem',
                flexWrap: 'wrap'
            }}>
                <div style={{ flex: 1, minWidth: '200px', position: 'relative' }}>
                    <Search size={18} style={{
                        position: 'absolute',
                        left: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: 'var(--text-muted)'
                    }} />
                    <input
                        type="text"
                        placeholder="Rechercher par nom, prénom ou matricule..."
                        value={searchTerm}
                        onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                        className="form-input"
                        style={{ paddingLeft: '40px', width: '100%' }}
                    />
                </div>

                <select
                    value={selectedNiveau}
                    onChange={(e) => { setSelectedNiveau(e.target.value); setCurrentPage(1); }}
                    className="form-input"
                    style={{ minWidth: '150px' }}
                >
                    <option value="">Tous les niveaux</option>
                    <option value="maternelle">Maternelle</option>
                    <option value="primaire">Primaire</option>
                    <option value="secondaire">Secondaire</option>
                </select>

                <select
                    value={selectedClasse}
                    onChange={(e) => { setSelectedClasse(e.target.value); setCurrentPage(1); }}
                    className="form-input"
                    style={{ minWidth: '150px' }}
                >
                    <option value="">Toutes les classes</option>
                    {classes
                        .filter(c => !selectedNiveau || c.categorie_classe?.toLowerCase() === selectedNiveau.toLowerCase())
                        .map(classe => (
                            <option key={classe.id} value={classe.id}>{classe.nom_classe}</option>
                        ))}
                </select>
            </div>

            {/* Tableau des élèves */}
            <div className="card" style={{ overflow: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ borderBottom: '2px solid var(--border)' }}>
                            <th style={{ padding: '1rem', textAlign: 'left' }}>Matricule</th>
                            <th style={{ padding: '1rem', textAlign: 'left' }}>Nom</th>
                            <th style={{ padding: '1rem', textAlign: 'left' }}>Prénom</th>
                            <th style={{ padding: '1rem', textAlign: 'left' }}>Classe</th>
                            <th style={{ padding: '1rem', textAlign: 'left' }}>Date de naissance</th>
                            <th style={{ padding: '1rem', textAlign: 'center' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedEleves.length === 0 ? (
                            <tr>
                                <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                                    Aucun élève trouvé
                                </td>
                            </tr>
                        ) : (
                            paginatedEleves.map((eleve) => (
                                <tr key={eleve.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                    <td style={{ padding: '1rem' }}>{eleve.matricule || 'N/A'}</td>
                                    <td style={{ padding: '1rem', fontWeight: '500' }}>{eleve.nom}</td>
                                    <td style={{ padding: '1rem' }}>{eleve.prenom}</td>
                                    <td style={{ padding: '1rem' }}>{getClassName(eleve.classe_id)}</td>
                                    <td style={{ padding: '1rem' }}>{eleve.date_naissance || 'N/A'}</td>
                                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                                            <button
                                                className="btn btn-icon"
                                                style={{ color: 'var(--primary)' }}
                                                onClick={() => console.log('Edit', eleve.id)}
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                className="btn btn-icon"
                                                style={{ color: 'var(--error)' }}
                                                onClick={() => handleDelete(eleve.id)}
                                                disabled={loading}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: '1rem',
                    marginTop: '1.5rem'
                }}>
                    <button
                        className="btn btn-secondary"
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                    >
                        <ChevronLeft size={18} />
                    </button>
                    <span>
                        Page {currentPage} sur {totalPages}
                    </span>
                    <button
                        className="btn btn-secondary"
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                    >
                        <ChevronRight size={18} />
                    </button>
                </div>
            )}
        </div>
    );
}
