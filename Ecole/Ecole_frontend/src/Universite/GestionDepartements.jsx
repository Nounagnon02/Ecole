import React, { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import api from '../api';
import './DashboardUniversite.css';

const GestionDepartements = () => {
  const [departements, setDepartements] = useState([]);
  const [facultes, setFacultes] = useState([]);
  const [form, setForm] = useState({ nom: '', code: '', faculte_id: '' });
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    Promise.all([api.get('/universite/departements'), api.get('/universite/facultes')])
      .then(([d, f]) => { setDepartements(d.data); setFacultes(f.data); })
      .catch(console.error);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/universite/departements', form);
      setMessage({ text: 'Département ajouté', type: 'success' });
      setForm({ nom: '', code: '', faculte_id: '' });
      const res = await api.get('/universite/departements');
      setDepartements(res.data);
    } catch (error) {
      setMessage({ text: 'Erreur', type: 'error' });
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Confirmer ?')) {
      try {
        await api.delete(`/universite/departements/${id}`);
        setDepartements(departements.filter(d => d.id !== id));
      } catch (error) {
        setMessage({ text: 'Erreur', type: 'error' });
      }
    }
  };

  return (
    <div className="univ-dashboard">
      <div className="univ-header"><h1>Gestion des Départements</h1></div>
      {message.text && <div className={`message ${message.type}`}>{message.text}</div>}
      
      <div className="form-container">
        <h2>Ajouter un Département</h2>
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
              <label>Faculté</label>
              <select className="form-select" value={form.faculte_id} onChange={(e) => setForm({...form, faculte_id: e.target.value})} required>
                <option value="">Sélectionner</option>
                {facultes.map(f => <option key={f.id} value={f.id}>{f.nom}</option>)}
              </select>
            </div>
          </div>
          <button type="submit" className="btn btn-primary"><Plus size={18} /> Ajouter</button>
        </form>
      </div>

      <div className="form-container" style={{ marginTop: '2rem' }}>
        <h2>Liste des Départements ({departements.length})</h2>
        <table className="data-table">
          <thead><tr><th>Code</th><th>Nom</th><th>Faculté</th><th>Actions</th></tr></thead>
          <tbody>
            {departements.map(d => (
              <tr key={d.id}>
                <td>{d.code}</td>
                <td>{d.nom}</td>
                <td>{d.faculte?.nom}</td>
                <td><button className="btn" onClick={() => handleDelete(d.id)}><Trash2 size={16} /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default GestionDepartements;
