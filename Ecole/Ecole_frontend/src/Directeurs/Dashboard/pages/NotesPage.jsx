/**
 * NotesPage - Page de gestion des notes
 * 
 * Permet la saisie, visualisation et filtrage des notes.
 */
import React, { useState, useCallback, useEffect } from 'react';
import { Plus, Filter, Download, Upload, Save } from 'lucide-react';
import api from '../../../api';

export default function NotesPage({
    classes = [],
    matieres = [],
    series = [],
    eleves = [],
    onRefresh
}) {
    const [activeMode, setActiveMode] = useState('saisie'); // 'saisie' | 'consultation'
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    // Filtres
    const [filters, setFilters] = useState({
        classe_id: '',
        serie_id: '',
        matiere_id: '',
        type_evaluation: '',
        periode: ''
    });

    // Notes filtrées
    const [filteredNotes, setFilteredNotes] = useState([]);

    // Formulaire de nouvelle note
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

    // Élèves de la classe sélectionnée
    const elevesClasse = eleves.filter(e => e.classe_id == filters.classe_id || e.classe_id == newNote.classe_id);

    // Obtenir la série d'une classe
    const getSerieByClasse = useCallback((classeId) => {
        const classe = classes.find(c => c.id == classeId);
        return classe?.serie_id || '';
    }, [classes]);

    // Obtenir la catégorie d'une classe
    const getClasseCategorie = useCallback((classeId) => {
        const classe = classes.find(c => c.id == parseInt(classeId));
        return classe?.categorie_classe || '';
    }, [classes]);

    // Obtenir les matières d'une série
    const getMatieresBySerie = useCallback((serieId) => {
        if (!serieId) return matieres;
        const serie = series.find(s => s.id == serieId);
        return serie?.matieres || matieres;
    }, [series, matieres]);

    // Charger les notes filtrées
    const loadFilteredNotes = async () => {
        if (!filters.classe_id) return;

        setLoading(true);
        try {
            const params = new URLSearchParams();
            Object.entries(filters).forEach(([key, value]) => {
                if (value) params.append(key, value);
            });

            const response = await api.get(`/notes/filter?${params.toString()}`);
            setFilteredNotes(response.data.data || response.data || []);
        } catch (err) {
            console.error('Erreur lors du chargement des notes:', err);
            setError('Erreur lors du chargement des notes');
        } finally {
            setLoading(false);
        }
    };

    // Ajouter une note
    const handleAddNote = async () => {
        if (!newNote.eleve_id || !newNote.matiere_id || !newNote.note) {
            setError('Veuillez remplir tous les champs obligatoires');
            return;
        }

        setLoading(true);
        setError('');
        try {
            await api.post('/notes', newNote);
            setMessage('Note ajoutée avec succès');
            setNewNote({
                ...newNote,
                eleve_id: '',
                note: '',
                commentaire: ''
            });
            if (activeMode === 'consultation') loadFilteredNotes();
        } catch (err) {
            setError(err.response?.data?.message || 'Erreur lors de l\'ajout de la note');
        } finally {
            setLoading(false);
        }
    };

    // Composant de sélection du type d'évaluation
    const TypeEvaluationSelect = ({ value, onChange, categorie }) => {
        const getOptions = () => {
            switch (categorie?.toLowerCase()) {
                case 'maternelle':
                case 'primaire':
                    return [
                        <option key="1" value="1ère evaluation">1ère évaluation</option>,
                        <option key="2" value="2ème evaluation">2ème évaluation</option>,
                        <option key="3" value="3ème evaluation">3ème évaluation</option>,
                        <option key="4" value="4ème evaluation">4ème évaluation</option>,
                        <option key="5" value="5ème evaluation">5ème évaluation</option>
                    ];
                case 'secondaire':
                    return [
                        <option key="1" value="Devoir1">Devoir 1</option>,
                        <option key="2" value="Devoir2">Devoir 2</option>,
                        <option key="3" value="Interrogation">Interrogation écrite</option>
                    ];
                default:
                    return [];
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
                <option value="">Sélectionner un type</option>
                {getOptions()}
            </select>
        );
    };

    return (
        <div className="notes-page">
            {/* Messages */}
            {error && <div className="message error" style={{ marginBottom: '1rem' }}>{error}</div>}
            {message && <div className="message success" style={{ marginBottom: '1rem' }}>{message}</div>}

            {/* Onglets mode */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
                <button
                    className={`btn ${activeMode === 'saisie' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setActiveMode('saisie')}
                >
                    <Plus size={18} /> Saisie de notes
                </button>
                <button
                    className={`btn ${activeMode === 'consultation' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setActiveMode('consultation')}
                >
                    <Filter size={18} /> Consultation
                </button>
            </div>

            {/* Mode Saisie */}
            {activeMode === 'saisie' && (
                <div className="card" style={{ padding: '1.5rem' }}>
                    <h3 style={{ marginBottom: '1.5rem' }}>Nouvelle note</h3>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                        {/* Classe */}
                        <div className="form-group">
                            <label>Classe *</label>
                            <select
                                value={newNote.classe_id}
                                onChange={(e) => setNewNote({
                                    ...newNote,
                                    classe_id: e.target.value,
                                    eleve_id: '',
                                    matiere_id: ''
                                })}
                                className="form-input"
                            >
                                <option value="">Sélectionner une classe</option>
                                {classes.map(c => (
                                    <option key={c.id} value={c.id}>{c.nom_classe}</option>
                                ))}
                            </select>
                        </div>

                        {/* Élève */}
                        <div className="form-group">
                            <label>Élève *</label>
                            <select
                                value={newNote.eleve_id}
                                onChange={(e) => setNewNote({ ...newNote, eleve_id: e.target.value })}
                                className="form-input"
                                disabled={!newNote.classe_id}
                            >
                                <option value="">Sélectionner un élève</option>
                                {eleves
                                    .filter(e => e.classe_id == newNote.classe_id)
                                    .map(e => (
                                        <option key={e.id} value={e.id}>
                                            {e.nom} {e.prenom}
                                        </option>
                                    ))}
                            </select>
                        </div>

                        {/* Matière */}
                        <div className="form-group">
                            <label>Matière *</label>
                            <select
                                value={newNote.matiere_id}
                                onChange={(e) => setNewNote({ ...newNote, matiere_id: e.target.value })}
                                className="form-input"
                            >
                                <option value="">Sélectionner une matière</option>
                                {getMatieresBySerie(getSerieByClasse(newNote.classe_id)).map(m => (
                                    <option key={m.id} value={m.id}>{m.nom}</option>
                                ))}
                            </select>
                        </div>

                        {/* Type d'évaluation */}
                        <div className="form-group">
                            <label>Type d'évaluation *</label>
                            <TypeEvaluationSelect
                                value={newNote.type_evaluation}
                                onChange={(e) => setNewNote({ ...newNote, type_evaluation: e.target.value })}
                                categorie={getClasseCategorie(newNote.classe_id)}
                            />
                        </div>

                        {/* Note */}
                        <div className="form-group">
                            <label>Note *</label>
                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                <input
                                    type="number"
                                    value={newNote.note}
                                    onChange={(e) => setNewNote({ ...newNote, note: e.target.value })}
                                    className="form-input"
                                    min="0"
                                    max={newNote.note_sur}
                                    step="0.5"
                                    style={{ width: '80px' }}
                                />
                                <span>/</span>
                                <input
                                    type="number"
                                    value={newNote.note_sur}
                                    onChange={(e) => setNewNote({ ...newNote, note_sur: e.target.value })}
                                    className="form-input"
                                    min="1"
                                    style={{ width: '80px' }}
                                />
                            </div>
                        </div>

                        {/* Période */}
                        <div className="form-group">
                            <label>Période</label>
                            <select
                                value={newNote.periode}
                                onChange={(e) => setNewNote({ ...newNote, periode: e.target.value })}
                                className="form-input"
                            >
                                <option value="">Sélectionner</option>
                                <option value="Trimestre 1">Trimestre 1</option>
                                <option value="Trimestre 2">Trimestre 2</option>
                                <option value="Trimestre 3">Trimestre 3</option>
                            </select>
                        </div>

                        {/* Date */}
                        <div className="form-group">
                            <label>Date</label>
                            <input
                                type="date"
                                value={newNote.date_evaluation}
                                onChange={(e) => setNewNote({ ...newNote, date_evaluation: e.target.value })}
                                className="form-input"
                            />
                        </div>
                    </div>

                    {/* Commentaire */}
                    <div className="form-group" style={{ marginTop: '1rem' }}>
                        <label>Commentaire</label>
                        <textarea
                            value={newNote.commentaire}
                            onChange={(e) => setNewNote({ ...newNote, commentaire: e.target.value })}
                            className="form-input"
                            rows="2"
                            placeholder="Observation facultative..."
                            style={{ width: '100%', resize: 'vertical' }}
                        />
                    </div>

                    <button
                        onClick={handleAddNote}
                        disabled={loading}
                        className="btn btn-primary"
                        style={{ marginTop: '1rem' }}
                    >
                        <Save size={18} /> {loading ? 'Enregistrement...' : 'Enregistrer la note'}
                    </button>
                </div>
            )}

            {/* Mode Consultation */}
            {activeMode === 'consultation' && (
                <div className="card" style={{ padding: '1.5rem' }}>
                    <h3 style={{ marginBottom: '1.5rem' }}>Filtrer les notes</h3>

                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                        <select
                            value={filters.classe_id}
                            onChange={(e) => setFilters({ ...filters, classe_id: e.target.value })}
                            className="form-input"
                        >
                            <option value="">Toutes les classes</option>
                            {classes.map(c => (
                                <option key={c.id} value={c.id}>{c.nom_classe}</option>
                            ))}
                        </select>

                        <select
                            value={filters.periode}
                            onChange={(e) => setFilters({ ...filters, periode: e.target.value })}
                            className="form-input"
                        >
                            <option value="">Toutes les périodes</option>
                            <option value="Trimestre 1">Trimestre 1</option>
                            <option value="Trimestre 2">Trimestre 2</option>
                            <option value="Trimestre 3">Trimestre 3</option>
                        </select>

                        <button onClick={loadFilteredNotes} className="btn btn-primary" disabled={loading}>
                            <Filter size={18} /> Filtrer
                        </button>
                    </div>

                    {/* Tableau des notes */}
                    {filteredNotes.length > 0 && (
                        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid var(--border)' }}>
                                    <th style={{ padding: '0.75rem', textAlign: 'left' }}>Élève</th>
                                    <th style={{ padding: '0.75rem', textAlign: 'left' }}>Matière</th>
                                    <th style={{ padding: '0.75rem', textAlign: 'center' }}>Note</th>
                                    <th style={{ padding: '0.75rem', textAlign: 'left' }}>Type</th>
                                    <th style={{ padding: '0.75rem', textAlign: 'left' }}>Période</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredNotes.map((note, idx) => (
                                    <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                                        <td style={{ padding: '0.75rem' }}>
                                            {note.eleve?.nom} {note.eleve?.prenom}
                                        </td>
                                        <td style={{ padding: '0.75rem' }}>{note.matiere?.nom}</td>
                                        <td style={{ padding: '0.75rem', textAlign: 'center', fontWeight: 'bold' }}>
                                            {note.note}/{note.note_sur || 20}
                                        </td>
                                        <td style={{ padding: '0.75rem' }}>{note.type_evaluation}</td>
                                        <td style={{ padding: '0.75rem' }}>{note.periode}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}

                    {filteredNotes.length === 0 && !loading && (
                        <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                            Aucune note trouvée. Sélectionnez des filtres et cliquez sur "Filtrer".
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}
