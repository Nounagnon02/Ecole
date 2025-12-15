/**
 * Dashboard Directeur - Version optimisée et modulaire
 * 
 * Ce composant utilise les nouveaux composants modulaires et le hook useDashboardData
 * pour une meilleure performance et maintenabilité.
 */
import React, { useState, useCallback, Suspense, lazy } from 'react';
import { Edit2, Trash2, Save, X, Plus } from 'lucide-react';
import '../../styles/GlobalStyles.css';
import * as XLSX from 'xlsx';
import api from '../../api';

// Composants modulaires
import { Sidebar, Header, LoadingSpinner, OverviewTab } from './components';
import { useDashboardData } from './hooks';

// Composants lazy-loaded pour les onglets lourds
const Messagerie = lazy(() => import('../../components/Messagerie'));
const EmploiDuTemps = lazy(() => import('../EmploiDuTemps'));
const MarquagePresence = lazy(() => import('../../components/MarquagePresence'));

// Pages lazy-loaded pour les onglets avec beaucoup de données
const ElevesPage = lazy(() => import('./pages/ElevesPage'));
const NotesPage = lazy(() => import('./pages/NotesPage'));

export default function Dashboard() {
    // Hook pour charger toutes les données en parallèle avec cache
    const {
        classes,
        classes1,
        eleves,
        matieres,
        matieresSeries,
        series,
        studentData,
        gradeData,
        notifications,
        evenements,
        loading,
        error: dataError,
        refresh,
        refreshSection,
        getClasseCategorie,
        getMatieresBySerie,
        getSerieByClasse
    } = useDashboardData();

    // États locaux pour les formulaires
    const [activeTab, setActiveTab] = useState('aperçu');
    const [expandedSection, setExpandedSection] = useState('statistiques');
    const [editingId, setEditingId] = useState(null);
    const [editValue, setEditValue] = useState('');
    const [newMatiere, setNewMatiere] = useState('');
    const [newSerie, setNewSerie] = useState('');
    const [newClassName, setNewClassName] = useState('');
    const [newClassCategory, setNewClassCategory] = useState('');
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [localLoading, setLocalLoading] = useState(false);

    // Filtres pour les notes
    const [filters, setFilters] = useState({
        classe_id: '',
        serie_id: '',
        matiere_id: '',
        type_evaluation: '',
        periode: ''
    });
    const [filteredNotes, setFilteredNotes] = useState([]);

    // États pour le formulaire d'import
    const [importData, setImportData] = useState({
        classe_id: '',
        serie_id: '',
        matiere_id: '',
        fichier: null,
        type_evaluation: '',
        date_evaluation: '',
        periode: ''
    });

    // État pour nouvelle note
    const [newNote, setNewNote] = useState({
        eleve_id: '',
        classe_id: '',
        matiere_id: '',
        note: '',
        note_sur: 20,
        type_evaluation: '',
        commentaire: '',
        date_evaluation: new Date().toISOString().split('T')[0],
        periode: ''
    });

    // ============ HANDLERS ============

    const handleTabChange = useCallback((tab) => {
        setActiveTab(tab);
    }, []);

    const toggleSection = useCallback((section) => {
        setExpandedSection(prev => prev === section ? null : section);
    }, []);

    const handleFilterChange = useCallback((e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    }, []);

    const handleEdit = useCallback((item) => {
        setEditingId(item.id);
        setEditValue(item.nom);
    }, []);

    const handleCancel = useCallback(() => {
        setEditingId(null);
        setEditValue('');
        setError('');
    }, []);

    // ============ ACTIONS CRUD MATIÈRES ============

    const AjouterMatiere = async () => {
        if (!newMatiere.trim()) {
            setError('Le nom de la matière ne peut pas être vide');
            return;
        }

        try {
            setLocalLoading(true);
            await api.post('/matieres/store', { nom: newMatiere });
            setNewMatiere('');
            setMessage('Matière ajoutée avec succès');
            refreshSection('matieres');
        } catch (err) {
            setError(err.response?.data?.message || "Erreur lors de l'ajout");
        } finally {
            setLocalLoading(false);
        }
    };

    const ModificationMatiere = async (id) => {
        if (!editValue.trim()) {
            setError('Le nom de la matière ne peut pas être vide');
            return;
        }

        try {
            setLocalLoading(true);
            await api.put(`/matieres/update/${id}`, { nom: editValue });
            setMessage('Matière modifiée avec succès');
            setEditingId(null);
            setEditValue('');
            refreshSection('matieres');
        } catch (err) {
            setError('Erreur lors de la modification');
        } finally {
            setLocalLoading(false);
        }
    };

    const handleDeleteMatiere = async (id) => {
        if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette matière ?')) return;

        try {
            setLocalLoading(true);
            await api.delete(`/matieres/delete/${id}`);
            setMessage('Matière supprimée avec succès');
            refreshSection('matieres');
        } catch (err) {
            setError('Erreur lors de la suppression');
        } finally {
            setLocalLoading(false);
        }
    };

    // ============ ACTIONS CRUD SÉRIES ============

    const AjouterSerie = async () => {
        if (!newSerie.trim()) {
            setError('Le nom de la série ne peut pas être vide');
            return;
        }

        try {
            setLocalLoading(true);
            await api.post('/series', { nom: newSerie });
            setNewSerie('');
            setMessage('Série ajoutée avec succès');
            refreshSection('series');
        } catch (err) {
            setError(err.response?.data?.message || "Erreur lors de l'ajout");
        } finally {
            setLocalLoading(false);
        }
    };

    // ============ ACTIONS CRUD CLASSES ============

    const AjouterClasse = async () => {
        if (!newClassName.trim() || !newClassCategory.trim()) {
            setError('Veuillez remplir tous les champs');
            return;
        }

        try {
            setLocalLoading(true);
            await api.post('/classes/store', {
                nom_classe: newClassName,
                categorie_classe: newClassCategory
            });
            setNewClassName('');
            setNewClassCategory('');
            setMessage('Classe ajoutée avec succès');
            refreshSection('classes1');
        } catch (err) {
            setError(err.response?.data?.message || "Erreur lors de l'ajout");
        } finally {
            setLocalLoading(false);
        }
    };

    // ============ COMPOSANT DE SÉLECTION TYPE ÉVALUATION ============

    const TypeEvaluationSelect = ({ value, onChange, categorie }) => {
        const getOptions = () => {
            switch (categorie?.toLowerCase()) {
                case 'maternelle':
                case 'primaire':
                    return [
                        <option key="empty" value="">Sélectionner un type</option>,
                        <option key="1" value="1ère evaluation">1ère évaluation</option>,
                        <option key="2" value="2ème evaluation">2ème évaluation</option>,
                        <option key="3" value="3ème evaluation">3ème évaluation</option>,
                        <option key="4" value="4ème evaluation">4ème évaluation</option>,
                        <option key="5" value="5ème evaluation">5ème évaluation</option>
                    ];
                case 'secondaire':
                    return [
                        <option key="empty" value="">Sélectionner un type</option>,
                        <option key="1" value="Devoir1">Devoir 1</option>,
                        <option key="2" value="Devoir2">Devoir 2</option>,
                        <option key="3" value="Interrogation">Interrogation écrite</option>
                    ];
                default:
                    return [<option key="empty" value="">Sélectionner un type</option>];
            }
        };

        return (
            <select
                name="type_evaluation"
                value={value}
                onChange={onChange}
                className="form-input"
                required
            >
                {getOptions()}
            </select>
        );
    };

    // ============ RENDU ============

    if (loading) {
        return (
            <div className="app-dashboard">
                <LoadingSpinner message="Chargement du tableau de bord..." />
            </div>
        );
    }

    return (
        <div className="app-dashboard">
            {/* Sidebar */}
            <Sidebar activeTab={activeTab} onTabChange={handleTabChange} />

            {/* Main content */}
            <div className="main-content">
                <Header activeTab={activeTab} />

                {/* Messages d'erreur/succès */}
                {error && <div className="message error">{error}</div>}
                {message && <div className="message success">{message}</div>}

                {/* Content area */}
                <main className="content-area">
                    <Suspense fallback={<LoadingSpinner />}>
                        {/* Onglet Aperçu */}
                        {activeTab === 'aperçu' && (
                            <OverviewTab
                                studentData={studentData}
                                gradeData={gradeData}
                                evenements={evenements}
                                notifications={notifications}
                                expandedSection={expandedSection}
                                onToggleSection={toggleSection}
                            />
                        )}

                        {/* Onglet Matières */}
                        {activeTab === 'matieres' && (
                            <div>
                                <div className="form-container" style={{ marginBottom: '2rem' }}>
                                    <h2 style={{ marginBottom: '1.5rem', fontSize: '1.25rem', fontWeight: 'bold' }}>
                                        Ajouter une nouvelle matière
                                    </h2>
                                    <div className="form-group" style={{ flexDirection: 'row', gap: '1rem' }}>
                                        <input
                                            type="text"
                                            value={newMatiere}
                                            onChange={(e) => setNewMatiere(e.target.value)}
                                            placeholder="Nom de la matière"
                                            className="form-input"
                                            onKeyPress={(e) => e.key === 'Enter' && AjouterMatiere()}
                                            style={{ flex: 1 }}
                                        />
                                        <button
                                            onClick={AjouterMatiere}
                                            disabled={localLoading}
                                            className="btn btn-primary"
                                        >
                                            <Plus size={18} /> Ajouter
                                        </button>
                                    </div>
                                </div>

                                <h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem', fontWeight: 'bold' }}>
                                    Liste des Matières
                                </h2>

                                {matieres.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                                        Aucune matière trouvée. Ajoutez-en une ci-dessus.
                                    </div>
                                ) : (
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                                        {matieres.map((matiere) => (
                                            <div key={matiere.id} className="card">
                                                {editingId === matiere.id ? (
                                                    <div style={{ display: 'flex', gap: '0.5rem', flexDirection: 'column' }}>
                                                        <input
                                                            type="text"
                                                            value={editValue}
                                                            onChange={(e) => setEditValue(e.target.value)}
                                                            className="form-input"
                                                            autoFocus
                                                        />
                                                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                                            <button
                                                                onClick={() => ModificationMatiere(matiere.id)}
                                                                disabled={localLoading}
                                                                className="btn btn-primary"
                                                            >
                                                                <Save size={16} />
                                                            </button>
                                                            <button onClick={handleCancel} className="btn btn-danger">
                                                                <X size={16} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <div>
                                                            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '600' }}>{matiere.nom}</h3>
                                                            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>ID: {matiere.id}</p>
                                                        </div>
                                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                            <button
                                                                onClick={() => handleEdit(matiere)}
                                                                disabled={localLoading || editingId !== null}
                                                                className="btn btn-icon"
                                                                style={{ color: 'var(--primary)' }}
                                                            >
                                                                <Edit2 size={18} />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteMatiere(matiere.id)}
                                                                disabled={localLoading || editingId !== null}
                                                                className="btn btn-icon"
                                                                style={{ color: 'var(--error)' }}
                                                            >
                                                                <Trash2 size={18} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Onglet Séries */}
                        {activeTab === 'series' && (
                            <div className="series-container">
                                <div className="add-form">
                                    <h2 className="form-title">Ajouter une nouvelle série</h2>
                                    <div className="form-controls" style={{ display: 'flex', gap: '1rem' }}>
                                        <input
                                            type="text"
                                            value={newSerie}
                                            onChange={(e) => setNewSerie(e.target.value)}
                                            placeholder="Nom de la série"
                                            className="input-field form-input"
                                            style={{ flex: 1 }}
                                            onKeyPress={(e) => e.key === 'Enter' && AjouterSerie()}
                                        />
                                        <button onClick={AjouterSerie} disabled={localLoading} className="btn btn-primary">
                                            <Plus size={18} /> Ajouter
                                        </button>
                                    </div>
                                </div>

                                <h2 style={{ margin: '2rem 0 1rem' }}>Liste des Séries</h2>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
                                    {series.map((serie) => (
                                        <div key={serie.id} className="card">
                                            <h3>{serie.nom}</h3>
                                            <p style={{ color: 'var(--text-muted)' }}>ID: {serie.id}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Onglet Classes */}
                        {activeTab === 'classes' && (
                            <div>
                                <div className="form-container" style={{ marginBottom: '2rem' }}>
                                    <h2 style={{ marginBottom: '1rem' }}>Ajouter une nouvelle classe</h2>
                                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                                        <input
                                            type="text"
                                            value={newClassName}
                                            onChange={(e) => setNewClassName(e.target.value)}
                                            placeholder="Nom de la classe"
                                            className="form-input"
                                            style={{ flex: 1, minWidth: '200px' }}
                                        />
                                        <select
                                            value={newClassCategory}
                                            onChange={(e) => setNewClassCategory(e.target.value)}
                                            className="form-input"
                                            style={{ flex: 1, minWidth: '200px' }}
                                        >
                                            <option value="">Sélectionner une catégorie</option>
                                            <option value="maternelle">Maternelle</option>
                                            <option value="primaire">Primaire</option>
                                            <option value="secondaire">Secondaire</option>
                                        </select>
                                        <button onClick={AjouterClasse} disabled={localLoading} className="btn btn-primary">
                                            <Plus size={18} /> Ajouter
                                        </button>
                                    </div>
                                </div>

                                <h2 style={{ marginBottom: '1rem' }}>Liste des Classes</h2>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
                                    {classes1.map((classe) => (
                                        <div key={classe.id} className="card">
                                            <h3>{classe.nom_classe}</h3>
                                            <p style={{ color: 'var(--text-muted)' }}>
                                                Catégorie: {classe.categorie_classe} | Effectif: {classe.effectif || 0}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Onglet Messages */}
                        {activeTab === 'messages' && <Messagerie />}

                        {/* Onglet Emploi du temps */}
                        {activeTab === 'emploi' && <EmploiDuTemps />}

                        {/* Onglet Marquage Présence */}
                        {activeTab === 'presence' && <MarquagePresence />}

                        {/* Onglet Élèves */}
                        {activeTab === 'élèves' && (
                            <ElevesPage
                                eleves={eleves}
                                classes={classes1}
                                onRefresh={refreshSection}
                            />
                        )}

                        {/* Onglet Notes */}
                        {activeTab === 'notes' && (
                            <NotesPage
                                classes={classes}
                                matieres={matieres}
                                series={series}
                                eleves={eleves}
                                onRefresh={refreshSection}
                            />
                        )}

                        {/* Autres onglets - placeholder */}
                        {['LiaisonSeriesClass', 'LiaisonMatieresAvecCoefficientEtSerieClasses',
                            'LierElevesAuxParents', 'enseignantsauxclasses', 'personnel', 'paramètres'].includes(activeTab) && (
                                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                                    <h2>Section {activeTab}</h2>
                                    <p>Cette section utilise les anciens composants du dashboard original.</p>
                                    <p>La migration complète sera effectuée progressivement.</p>
                                </div>
                            )}
                    </Suspense>
                </main>
            </div>
        </div>
    );
}
