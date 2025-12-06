import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Calendar } from 'lucide-react';
import api from '../api';
import './GestionExercices.css';

const CahierTexte = () => {
  const [seances, setSeances] = useState([]);
  const [classes, setClasses] = useState([]);
  const [matieres, setMatieres] = useState([]);
  const [form, setForm] = useState({ date: new Date().toISOString().split('T')[0], classe_id: '', matiere_id: '', contenu: '', devoirs: '' });
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    Promise.all([api.get('/cahier-texte'), api.get('/classes'), api.get('/matieres')])
      .then(([s, cl, mat]) => { setSeances(s.data || []); setClasses(cl.data); setMatieres(mat.data); })
      .catch(console.error);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/cahier-texte', form);
      setMessage({ text: 'Séance ajoutée', type: 'success' });
      setForm({ date: new Date().toISOString().split('T')[0], classe_id: '', matiere_id: '', contenu: '', devoirs: '' });
      const res = await api.get('/cahier-texte');
      setSeances(res.data || []);
    } catch (error) {
      setMessage({ text: 'Erreur', type: 'error' });
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Supprimer cette séance ?')) {
      try {
        await api.delete(`/cahier-texte/${id}`);
        setSeances(seances.filter(s => s.id !== id));
      } catch (error) {
        setMessage({ text: 'Erreur', type: 'error' });
      }
    }
  };

  return (
    <div className="exercices-container">
      <h1>Cahier de Texte</h1>
      {message.text && <div className={`message ${message.type}`}>{message.text}</div>}
      
      <div className="form-container">
        <h2>Ajouter une Séance</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label>Date</label>
              <input type="date" className="form-input" value={form.date} onChange={(e) => setForm({...form, date: e.target.value})} required />
            </div>
            <div className="form-group">
              <label>Classe</label>
              <select className="form-select" value={form.classe_id} onChange={(e) => setForm({...form, classe_id: e.target.value})} required>
                <option value="">Sélectionner</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.nom_classe}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Matière</label>
              <select className="form-select" value={form.matiere_id} onChange={(e) => setForm({...form, matiere_id: e.target.value})} required>
                <option value="">Sélectionner</option>
                {matieres.map(m => <option key={m.id} value={m.id}>{m.nom}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label>Contenu de la séance</label>
              <textarea className="form-input" value={form.contenu} onChange={(e) => setForm({...form, contenu: e.target.value})} rows="4" required />
            </div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label>Devoirs à faire</label>
              <textarea className="form-input" value={form.devoirs} onChange={(e) => setForm({...form, devoirs: e.target.value})} rows="3" />
            </div>
          </div>
          <button type="submit" className="btn btn-primary"><Plus size={18} /> Ajouter</button>
        </form>
      </div>

      <div className="form-container" style={{ marginTop: '2rem' }}>
        <h2>Historique des Séances ({seances.length})</h2>
        <table className="data-table">
          <thead><tr><th>Date</th><th>Classe</th><th>Matière</th><th>Contenu</th><th>Devoirs</th><th>Actions</th></tr></thead>
          <tbody>
            {seances.map(s => (
              <tr key={s.id}>
                <td><Calendar size={16} style={{ display: 'inline', marginRight: '0.5rem' }} />{new Date(s.date).toLocaleDateString()}</td>
                <td>{s.classe?.nom_classe}</td>
                <td>{s.matiere?.nom}</td>
                <td style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.contenu}</td>
                <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.devoirs || '-'}</td>
                <td>
                  <button className="btn btn-sm" onClick={() => handleDelete(s.id)}><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CahierTexte;
