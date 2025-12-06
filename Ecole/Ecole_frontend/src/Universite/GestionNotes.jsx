import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import api from '../api';
import './DashboardUniversite.css';

const GestionNotes = () => {
  const [notes, setNotes] = useState([]);
  const [etudiants, setEtudiants] = useState([]);
  const [matieres, setMatieres] = useState([]);
  const [form, setForm] = useState({ etudiant_id: '', matiere_id: '', note: '', type: 'CC', session: 'Normale' });
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    Promise.all([api.get('/universite/notes'), api.get('/universite/etudiants'), api.get('/universite/matieres')])
      .then(([n, e, m]) => { setNotes(n.data); setEtudiants(e.data); setMatieres(m.data); })
      .catch(console.error);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/universite/notes', form);
      setMessage({ text: 'Note ajoutée', type: 'success' });
      setForm({ etudiant_id: '', matiere_id: '', note: '', type: 'CC', session: 'Normale' });
      const res = await api.get('/universite/notes');
      setNotes(res.data);
    } catch (error) {
      setMessage({ text: 'Erreur', type: 'error' });
    }
  };

  return (
    <div className="univ-dashboard">
      <div className="univ-header"><h1>Gestion des Notes</h1></div>
      {message.text && <div className={`message ${message.type}`}>{message.text}</div>}
      
      <div className="form-container">
        <h2>Ajouter une Note</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label>Étudiant</label>
              <select className="form-select" value={form.etudiant_id} onChange={(e) => setForm({...form, etudiant_id: e.target.value})} required>
                <option value="">Sélectionner</option>
                {etudiants.map(e => <option key={e.id} value={e.id}>{e.nom} {e.prenom}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Matière</label>
              <select className="form-select" value={form.matiere_id} onChange={(e) => setForm({...form, matiere_id: e.target.value})} required>
                <option value="">Sélectionner</option>
                {matieres.map(m => <option key={m.id} value={m.id}>{m.nom}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Note /20</label>
              <input type="number" step="0.01" min="0" max="20" className="form-input" value={form.note} onChange={(e) => setForm({...form, note: e.target.value})} required />
            </div>
            <div className="form-group">
              <label>Type</label>
              <select className="form-select" value={form.type} onChange={(e) => setForm({...form, type: e.target.value})} required>
                <option value="CC">Contrôle Continu</option>
                <option value="Examen">Examen Final</option>
                <option value="TP">Travaux Pratiques</option>
              </select>
            </div>
            <div className="form-group">
              <label>Session</label>
              <select className="form-select" value={form.session} onChange={(e) => setForm({...form, session: e.target.value})} required>
                <option value="Normale">Normale</option>
                <option value="Rattrapage">Rattrapage</option>
              </select>
            </div>
          </div>
          <button type="submit" className="btn btn-primary"><Plus size={18} /> Ajouter</button>
        </form>
      </div>

      <div className="form-container" style={{ marginTop: '2rem' }}>
        <h2>Liste des Notes ({notes.length})</h2>
        <table className="data-table">
          <thead><tr><th>Étudiant</th><th>Matière</th><th>Note</th><th>Type</th><th>Session</th></tr></thead>
          <tbody>
            {notes.map(n => (
              <tr key={n.id}>
                <td>{n.etudiant?.nom} {n.etudiant?.prenom}</td>
                <td>{n.matiere?.nom}</td>
                <td>{n.note}/20</td>
                <td>{n.type}</td>
                <td>{n.session}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default GestionNotes;
