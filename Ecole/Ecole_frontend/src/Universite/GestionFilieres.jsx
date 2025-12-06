import React, { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import api from '../api';
import './DashboardUniversite.css';

const GestionFilieres = () => {
  const [filieres, setFilieres] = useState([]);
  const [departements, setDepartements] = useState([]);
  const [form, setForm] = useState({ nom: '', code: '', niveau: '', departement_id: '' });
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    Promise.all([api.get('/universite/filieres'), api.get('/universite/departements')])
      .then(([f, d]) => { setFilieres(f.data); setDepartements(d.data); })
      .catch(console.error);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/universite/filieres', form);
      setMessage({ text: 'Filière ajoutée', type: 'success' });
      setForm({ nom: '', code: '', niveau: '', departement_id: '' });
      const res = await api.get('/universite/filieres');
      setFilieres(res.data);
    } catch (error) {
      setMessage({ text: 'Erreur', type: 'error' });
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Confirmer ?')) {
      try {
        await api.delete(`/universite/filieres/${id}`);
        setFilieres(filieres.filter(f => f.id !== id));
      } catch (error) {
        setMessage({ text: 'Erreur', type: 'error' });
      }
    }
  };

  return (
    <div className="univ-dashboard">
      <div className="univ-header"><h1>Gestion des Filières</h1></div>
      {message.text && <div className={`message ${message.type}`}>{message.text}</div>}
      
      <div className="form-container">
        <h2>Ajouter une Filière</h2>
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
              <label>Niveau</label>
              <select className="form-select" value={form.niveau} onChange={(e) => setForm({...form, niveau: e.target.value})} required>
                <option value="">Sélectionner</option>
                <option value="Licence">Licence</option>
                <option value="Master">Master</option>
                <option value="Doctorat">Doctorat</option>
              </select>
            </div>
            <div className="form-group">
              <label>Département</label>
              <select className="form-select" value={form.departement_id} onChange={(e) => setForm({...form, departement_id: e.target.value})} required>
                <option value="">Sélectionner</option>
                {departements.map(d => <option key={d.id} value={d.id}>{d.nom}</option>)}
              </select>
            </div>
          </div>
          <button type="submit" className="btn btn-primary"><Plus size={18} /> Ajouter</button>
        </form>
      </div>

      <div className="form-container" style={{ marginTop: '2rem' }}>
        <h2>Liste des Filières ({filieres.length})</h2>
        <table className="data-table">
          <thead><tr><th>Code</th><th>Nom</th><th>Niveau</th><th>Département</th><th>Actions</th></tr></thead>
          <tbody>
            {filieres.map(f => (
              <tr key={f.id}>
                <td>{f.code}</td>
                <td>{f.nom}</td>
                <td>{f.niveau}</td>
                <td>{f.departement?.nom}</td>
                <td><button className="btn" onClick={() => handleDelete(f.id)}><Trash2 size={16} /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default GestionFilieres;
