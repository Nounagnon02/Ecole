import React, { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import api from '../api';
import './DashboardUniversite.css';

const GestionMatieres = () => {
  const [matieres, setMatieres] = useState([]);
  const [semestres, setSemestres] = useState([]);
  const [form, setForm] = useState({ nom: '', code: '', credits: '', coefficient: '', semestre_id: '' });
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    Promise.all([api.get('/universite/matieres'), api.get('/universite/semestres')])
      .then(([m, s]) => { setMatieres(m.data); setSemestres(s.data); })
      .catch(console.error);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/universite/matieres', form);
      setMessage({ text: 'Matière ajoutée', type: 'success' });
      setForm({ nom: '', code: '', credits: '', coefficient: '', semestre_id: '' });
      const res = await api.get('/universite/matieres');
      setMatieres(res.data);
    } catch (error) {
      setMessage({ text: 'Erreur', type: 'error' });
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Confirmer ?')) {
      try {
        await api.delete(`/universite/matieres/${id}`);
        setMatieres(matieres.filter(m => m.id !== id));
      } catch (error) {
        setMessage({ text: 'Erreur', type: 'error' });
      }
    }
  };

  return (
    <div className="univ-dashboard">
      <div className="univ-header"><h1>Gestion des Matières/UE</h1></div>
      {message.text && <div className={`message ${message.type}`}>{message.text}</div>}
      
      <div className="form-container">
        <h2>Ajouter une Matière</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label>Nom</label>
              <input className="form-input" value={form.nom} onChange={(e) => setForm({...form, nom: e.target.value})} required />
            </div>
            <div className="form-group">
              <label>Code</label>
              <input className="form-input" value={form.code} onChange={(e) => setForm({...form, code: e.target.value})} required />
            </div>
            <div className="form-group">
              <label>Crédits ECTS</label>
              <input type="number" className="form-input" value={form.credits} onChange={(e) => setForm({...form, credits: e.target.value})} required />
            </div>
            <div className="form-group">
              <label>Coefficient</label>
              <input type="number" className="form-input" value={form.coefficient} onChange={(e) => setForm({...form, coefficient: e.target.value})} required />
            </div>
            <div className="form-group">
              <label>Semestre</label>
              <select className="form-select" value={form.semestre_id} onChange={(e) => setForm({...form, semestre_id: e.target.value})} required>
                <option value="">Sélectionner</option>
                {semestres.map(s => <option key={s.id} value={s.id}>{s.nom}</option>)}
              </select>
            </div>
          </div>
          <button type="submit" className="btn btn-primary"><Plus size={18} /> Ajouter</button>
        </form>
      </div>

      <div className="form-container" style={{ marginTop: '2rem' }}>
        <h2>Liste des Matières ({matieres.length})</h2>
        <table className="data-table">
          <thead><tr><th>Code</th><th>Nom</th><th>Crédits</th><th>Coefficient</th><th>Semestre</th><th>Actions</th></tr></thead>
          <tbody>
            {matieres.map(m => (
              <tr key={m.id}>
                <td>{m.code}</td>
                <td>{m.nom}</td>
                <td>{m.credits}</td>
                <td>{m.coefficient}</td>
                <td>{m.semestre?.nom}</td>
                <td><button className="btn" onClick={() => handleDelete(m.id)}><Trash2 size={16} /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default GestionMatieres;
