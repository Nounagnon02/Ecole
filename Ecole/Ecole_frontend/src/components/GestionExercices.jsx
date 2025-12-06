import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Download, Upload } from 'lucide-react';
import api from '../api';
import './GestionExercices.css';

const GestionExercices = () => {
  const [exercices, setExercices] = useState([]);
  const [classes, setClasses] = useState([]);
  const [matieres, setMatieres] = useState([]);
  const [form, setForm] = useState({ titre: '', description: '', classe_id: '', matiere_id: '', date_limite: '', fichier: null });
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    Promise.all([api.get('/exercices'), api.get('/classes'), api.get('/matieres')])
      .then(([ex, cl, mat]) => { setExercices(ex.data); setClasses(cl.data); setMatieres(mat.data); })
      .catch(console.error);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      Object.keys(form).forEach(key => formData.append(key, form[key]));
      await api.post('/exercices', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setMessage({ text: 'Exercice ajouté', type: 'success' });
      setForm({ titre: '', description: '', classe_id: '', matiere_id: '', date_limite: '', fichier: null });
      const res = await api.get('/exercices');
      setExercices(res.data);
    } catch (error) {
      setMessage({ text: 'Erreur', type: 'error' });
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Supprimer cet exercice ?')) {
      try {
        await api.delete(`/exercices/${id}`);
        setExercices(exercices.filter(ex => ex.id !== id));
      } catch (error) {
        setMessage({ text: 'Erreur', type: 'error' });
      }
    }
  };

  return (
    <div className="exercices-container">
      <h1>Gestion des Exercices</h1>
      {message.text && <div className={`message ${message.type}`}>{message.text}</div>}
      
      <div className="form-container">
        <h2>Ajouter un Exercice</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label>Titre</label>
              <input className="form-input" value={form.titre} onChange={(e) => setForm({...form, titre: e.target.value})} required />
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
            <div className="form-group">
              <label>Date limite</label>
              <input type="date" className="form-input" value={form.date_limite} onChange={(e) => setForm({...form, date_limite: e.target.value})} required />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea className="form-input" value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} rows="3" />
            </div>
            <div className="form-group">
              <label>Fichier (PDF, Word, etc.)</label>
              <input type="file" className="form-input" onChange={(e) => setForm({...form, fichier: e.target.files[0]})} />
            </div>
          </div>
          <button type="submit" className="btn btn-primary"><Plus size={18} /> Ajouter</button>
        </form>
      </div>

      <div className="form-container" style={{ marginTop: '2rem' }}>
        <h2>Liste des Exercices ({exercices.length})</h2>
        <table className="data-table">
          <thead><tr><th>Titre</th><th>Classe</th><th>Matière</th><th>Date limite</th><th>Actions</th></tr></thead>
          <tbody>
            {exercices.map(ex => (
              <tr key={ex.id}>
                <td>{ex.titre}</td>
                <td>{ex.classe?.nom_classe}</td>
                <td>{ex.matiere?.nom}</td>
                <td>{new Date(ex.date_limite).toLocaleDateString()}</td>
                <td>
                  {ex.fichier && <button className="btn btn-sm"><Download size={16} /></button>}
                  <button className="btn btn-sm" onClick={() => handleDelete(ex.id)}><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default GestionExercices;
