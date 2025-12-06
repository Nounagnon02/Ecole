import React, { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import api from '../api';
import './DashboardUniversite.css';

const GestionFacultes = () => {
  const [facultes, setFacultes] = useState([]);
  const [universites, setUniversites] = useState([]);
  const [form, setForm] = useState({ nom: '', code: '', universite_id: '' });
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [fac, univ] = await Promise.all([
        api.get('/universite/facultes'),
        api.get('/universite/universites')
      ]);
      setFacultes(fac.data);
      setUniversites(univ.data);
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/universite/facultes', form);
      setMessage({ text: 'Faculté ajoutée avec succès', type: 'success' });
      setForm({ nom: '', code: '', universite_id: '' });
      fetchData();
    } catch (error) {
      setMessage({ text: 'Erreur lors de l\'ajout', type: 'error' });
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Confirmer la suppression ?')) {
      try {
        await api.delete(`/universite/facultes/${id}`);
        setMessage({ text: 'Faculté supprimée', type: 'success' });
        fetchData();
      } catch (error) {
        setMessage({ text: 'Erreur lors de la suppression', type: 'error' });
      }
    }
  };

  return (
    <div className="univ-dashboard">
      <div className="univ-header">
        <h1>Gestion des Facultés</h1>
      </div>

      {message.text && <div className={`message ${message.type}`}>{message.text}</div>}

      <div className="form-container">
        <h2>Ajouter une Faculté</h2>
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
              <label>Université</label>
              <select className="form-select" value={form.universite_id} onChange={(e) => setForm({...form, universite_id: e.target.value})} required>
                <option value="">Sélectionner</option>
                {universites.map(u => <option key={u.id} value={u.id}>{u.nom}</option>)}
              </select>
            </div>
          </div>
          <button type="submit" className="btn btn-primary"><Plus size={18} /> Ajouter</button>
        </form>
      </div>

      <div className="form-container" style={{ marginTop: '2rem' }}>
        <h2>Liste des Facultés ({facultes.length})</h2>
        <table className="data-table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Nom</th>
              <th>Université</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {facultes.map(f => (
              <tr key={f.id}>
                <td>{f.code}</td>
                <td>{f.nom}</td>
                <td>{f.universite?.nom}</td>
                <td>
                  <button className="btn" onClick={() => handleDelete(f.id)}><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default GestionFacultes;
