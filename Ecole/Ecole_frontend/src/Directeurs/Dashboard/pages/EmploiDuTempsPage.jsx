import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, User, Book, Trash2, Plus, Save, Filter } from 'lucide-react';
import api from '../../../api';

export default function EmploiDuTempsPage({ classes = [], matieres = [] }) {
    const [enseignants, setEnseignants] = useState([]);
    const [selectedClasse, setSelectedClasse] = useState('');
    const [emplois, setEmplois] = useState([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [form, setForm] = useState({
        classe_id: '',
        matiere_id: '',
        enseignant_id: '',
        jour: 'Lundi',
        heure_debut: '',
        heure_fin: '',
        salle: ''
    });

    const jours = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

    useEffect(() => {
        loadEnseignants();
    }, []);

    const loadEnseignants = async () => {
        try {
            const res = await api.get('/enseignants');
            setEnseignants(res.data);
        } catch (err) {
            console.error("Erreur chargement enseignants", err);
        }
    };

    const loadEmplois = async (classId) => {
        if (!classId) return;
        setLoading(true);
        try {
            const res = await api.get(`/emplois-du-temps/classe/${classId}`);
            setEmplois(res.data.data || []);
        } catch (err) {
            console.error("Erreur chargement emploi du temps", err);
            setEmplois([]);
        } finally {
            setLoading(false);
        }
    };

    const handleClasseChange = (e) => {
        const classId = e.target.value;
        setSelectedClasse(classId);
        setForm({ ...form, classe_id: classId });
        loadEmplois(classId);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await api.post('/emplois-du-temps', form);
            await loadEmplois(form.classe_id);
            // Reset parts of form but keep class/context
            setForm({
                ...form,
                matiere_id: '',
                enseignant_id: '',
                heure_debut: '',
                heure_fin: '',
                salle: ''
            });
        } catch (err) {
            alert("Erreur lors de l'ajout du cours. Vérifiez les conflits.");
            console.error(err);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Supprimer ce cours ?')) return;
        try {
            await api.delete(`/emplois-du-temps/${id}`);
            loadEmplois(selectedClasse);
        } catch (err) {
            alert("Erreur lors de la suppression");
        }
    };

    // Group emplois by day for better visualization
    const emploisByDay = jours.reduce((acc, jour) => {
        acc[jour] = emplois.filter(e => e.jour === jour).sort((a, b) => a.heure_debut.localeCompare(b.heure_debut));
        return acc;
    }, {});

    return (
        <div className="emploi-page">
            <div className="page-header" style={{ marginBottom: '1.5rem' }}>
                <h2>Gestion des Emplois du Temps</h2>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
                {/* Formulaire d'ajout */}
                <div className="card" style={{ height: 'fit-content' }}>
                    <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Plus size={20} /> Nouveau Cours
                    </h3>

                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label>Classe</label>
                            <select value={form.classe_id} onChange={handleClasseChange} required className="form-input">
                                <option value="">-- Sélectionner --</option>
                                {classes.map(c => <option key={c.id} value={c.id}>{c.nom_classe}</option>)}
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Matière</label>
                            <select
                                value={form.matiere_id}
                                onChange={e => setForm({ ...form, matiere_id: e.target.value })}
                                required
                                className="form-input"
                                disabled={!form.classe_id}
                            >
                                <option value="">-- Sélectionner --</option>
                                {matieres.map(m => <option key={m.id} value={m.id}>{m.nom}</option>)}
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Enseignant</label>
                            <select
                                value={form.enseignant_id}
                                onChange={e => setForm({ ...form, enseignant_id: e.target.value })}
                                required
                                className="form-input"
                            >
                                <option value="">-- Sélectionner --</option>
                                {enseignants.map(e => <option key={e.id} value={e.id}>{e.nom} {e.prenom}</option>)}
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Jour</label>
                            <select value={form.jour} onChange={e => setForm({ ...form, jour: e.target.value })} required className="form-input">
                                {jours.map(j => <option key={j} value={j}>{j}</option>)}
                            </select>
                        </div>

                        <div className="form-row" style={{ display: 'flex', gap: '1rem' }}>
                            <div className="form-group" style={{ flex: 1 }}>
                                <label>Début</label>
                                <input type="time" value={form.heure_debut} onChange={e => setForm({ ...form, heure_debut: e.target.value })} required className="form-input" />
                            </div>
                            <div className="form-group" style={{ flex: 1 }}>
                                <label>Fin</label>
                                <input type="time" value={form.heure_fin} onChange={e => setForm({ ...form, heure_fin: e.target.value })} required className="form-input" />
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Salle</label>
                            <input type="text" placeholder="Ex: Salle A1" value={form.salle} onChange={e => setForm({ ...form, salle: e.target.value })} className="form-input" />
                        </div>

                        <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={submitting || !form.classe_id}>
                            <Save size={18} /> {submitting ? 'Ajout...' : 'Ajouter au planning'}
                        </button>
                    </form>
                </div>

                {/* Visualisation Planning */}
                <div className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                        <h3>Planning {selectedClasse ? `- ${classes.find(c => c.id == selectedClasse)?.nom_classe || ''}` : ''}</h3>
                        {!selectedClasse && <span style={{ color: 'var(--text-muted)' }}>Sélectionnez une classe pour voir le planning</span>}
                    </div>

                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '2rem' }}>Chargement...</div>
                    ) : (
                        selectedClasse && (
                            <div className="schedule-grid">
                                {jours.map(jour => (
                                    <div key={jour} className="schedule-day ps-2 pe-2 pb-2" style={{ borderBottom: '1px solid #eee', marginBottom: '1rem' }}>
                                        <h4 style={{ color: 'var(--primary)', marginBottom: '0.5rem', borderBottom: '2px solid var(--primary-light)', display: 'inline-block' }}>{jour}</h4>
                                        {emploisByDay[jour] && emploisByDay[jour].length > 0 ? (
                                            <div className="courses-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                                {emploisByDay[jour].map(e => (
                                                    <div key={e.id} className="course-item" style={{
                                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                                        background: '#f8fafc', padding: '0.75rem', borderRadius: '6px', borderLeft: '4px solid var(--secondary)'
                                                    }}>
                                                        <div>
                                                            <div style={{ fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                                <Clock size={14} /> {e.heure_debut?.substring(0, 5)} - {e.heure_fin?.substring(0, 5)}
                                                                <span style={{ marginLeft: '1rem', color: 'var(--primary)' }}><Book size={14} /> {e.matiere}</span>
                                                            </div>
                                                            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem', display: 'flex', gap: '1rem' }}>
                                                                <span><User size={14} /> {e.professeur}</span>
                                                                <span><MapPin size={14} /> {e.salle || 'N/A'}</span>
                                                            </div>
                                                        </div>
                                                        <button onClick={() => handleDelete(e.id)} className="btn-icon" style={{ color: '#ef4444' }}>
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div style={{ fontSize: '0.85rem', color: '#9ca3af', fontStyle: 'italic' }}>Aucun cours</div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )
                    )}
                </div>
            </div>
        </div>
    );
}
