import React, { useState } from 'react';
import { Plus, Save } from 'lucide-react';
import api from '../../../api';

const NotesPage = ({ classes = [], onRefresh }) => {
    const [newNote, setNewNote] = useState({
        eleve_id: '',
        matiere_id: '', // Should be selected based on teacher's subjects
        note: '',
        type_evaluation: 'Interrogation',
        date_evaluation: new Date().toISOString().split('T')[0]
    });

    // Simplification: Fetching students when class is selected
    const [students, setStudents] = useState([]);
    const [selectedClassId, setSelectedClassId] = useState('');

    const handleClassChange = async (e) => {
        const classId = e.target.value;
        setSelectedClassId(classId);
        if (classId) {
            try {
                const res = await api.get(`/classes/${classId}/eleves`);
                setStudents(res.data.success ? res.data.data : []);
            } catch (err) {
                console.error(err);
            }
        } else {
            setStudents([]);
        }
    };

    const ajouterNote = async () => {
        if (!newNote.eleve_id || !newNote.note) {
            alert("Veuillez sélectionner un élève et entrer une note");
            return;
        }
        try {
            await api.post('/notes', newNote);
            alert('Note ajoutée avec succès');
            setNewNote(prev => ({ ...prev, eleve_id: '', note: '' }));
            if (onRefresh) onRefresh();
        } catch (error) {
            console.error(error);
            alert('Erreur lors de l\'ajout');
        }
    };

    return (
        <div className="notes-enceignant-container">
            <div className="card p-4">
                <h3 className="mb-4">Saisie de Notes</h3>

                <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>

                    <div className="form-group">
                        <label>Classe</label>
                        <select className="form-select" value={selectedClassId} onChange={handleClassChange}>
                            <option value="">Sélectionner une classe</option>
                            {classes.map(c => <option key={c.id} value={c.id}>{c.nom || c.nom_classe}</option>)}
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Élève</label>
                        <select
                            className="form-select"
                            value={newNote.eleve_id}
                            onChange={(e) => setNewNote({ ...newNote, eleve_id: e.target.value })}
                            disabled={!selectedClassId}
                        >
                            <option value="">Sélectionner un élève</option>
                            {students.map(s => <option key={s.id} value={s.id}>{s.nom} {s.prenom}</option>)}
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Note (/20)</label>
                        <input
                            type="number"
                            className="form-input"
                            value={newNote.note}
                            onChange={(e) => setNewNote({ ...newNote, note: e.target.value })}
                            min="0" max="20"
                        />
                    </div>

                    <div className="form-group">
                        <label>Type</label>
                        <select
                            className="form-select"
                            value={newNote.type_evaluation}
                            onChange={(e) => setNewNote({ ...newNote, type_evaluation: e.target.value })}
                        >
                            <option value="Interrogation">Interrogation</option>
                            <option value="Devoir1">Devoir 1</option>
                            <option value="Devoir2">Devoir 2</option>
                            <option value="Compo">Composition</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Date</label>
                        <input
                            type="date"
                            className="form-input"
                            value={newNote.date_evaluation}
                            onChange={(e) => setNewNote({ ...newNote, date_evaluation: e.target.value })}
                        />
                    </div>

                    <button className="btn btn-primary" onClick={ajouterNote} style={{ gridColumn: 'span 2', marginTop: '1rem' }}>
                        <Save size={18} /> Enregistrer la note
                    </button>
                </div>
            </div>
        </div>
    );
};

export default NotesPage;
