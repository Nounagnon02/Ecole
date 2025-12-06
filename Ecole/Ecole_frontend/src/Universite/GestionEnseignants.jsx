import React, { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import api from '../api';
import './DashboardUniversite.css';

const GestionEnseignants = () => {
  const [enseignants, setEnseignants] = useState([]);
  const [departements, setDepartements] = useState([]);
  const [form, setForm] = useState({ nom: '', prenom: '', grade: '', specialite: '', email: '', telephone: '', departement_id: '' });
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    Promise.all([api.get('/universite/enseignants'), api.get('/universite/departements')])
      .then(([e, d]) => { setEnseignants(e.data); setDepartements(d.data); })
      .catch(console.error);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/universite/enseignants', form);
      setMessage({ text: 'Enseignant ajouté', type: 'success' });
      setForm({ nom: '', prenom: '', grade: '', specialite: '', email: '', telephone: '', departement_id: '' });
      const res = await api.get('/universite/enseignants');
      setEnseignants(res.data);
    } catch (error) {
      setMessage({ text: 'Erreur', type: 'error' });
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Confirmer ?')) {
      try {
        await api.delete(`/universite/enseignants/${id}`);
        setEnseignants(enseignants.filter(e => e.id !== id));
      } catch (error) {
        setMessage({ text: 'Erreur', type: 'error' });
      }
    }
  };

  return (
    <div className="univ-dashboard">
      <div className="univ-header"><h1>Gestion des Enseignants</h1></div>
      {message.text && <div className={`message ${message.type}`}>{message.text}</div>}
      
      <div className="form-container">
        <h2>Ajouter un Enseignant</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label>Nom</label>
              <input className="form-input" value={form.nom} onChange={(e) => setForm({...form, nom: e.target.value})} required />
            </div>
            <div className="form-group">
              <label>Prénom</label>
              <input className="form-input" value={form.prenom} onChange={(e) => setForm({...form, prenom: e.target.value})} required />
            </div>
            <div className="form-group">
              <label>Grade</label>
              <select className="form-select" value={form.grade} onChange={(e) => setForm({...form, grade: e.target.value})}>
                <option value="">Sélectionner</option>
                <option value="Professeur">Professeur</option>
                <option value="Maître de Conférences">Maître de Conférences</option>
                <option value="Assistant">Assistant</option>
              </select>
            </div>
            <div className="form-group">
              <label>Spécialité</label>
              <input className="form-input" value={form.specialite} onChange={(e) => setForm({...form, specialite: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input type="email" className="form-input" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Téléphone</label>
              <input className="form-input" value={form.telephone} onChange={(e) => setForm({...form, telephone: e.target.value})} />
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
        <h2>Liste des Enseignants ({enseignants.length})</h2>
        <table className="data-table">
          <thead><tr><th>Nom</th><th>Prénom</th><th>Grade</th><th>Spécialité</th><th>Département</th><th>Actions</th></tr></thead>
          <tbody>
            {enseignants.map(e => (
              <tr key={e.id}>
                <td>{e.nom}</td>
                <td>{e.prenom}</td>
                <td>{e.grade}</td>
                <td>{e.specialite}</td>
                <td>{e.departement?.nom}</td>
                <td><button className="btn" onClick={() => handleDelete(e.id)}><Trash2 size={16} /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default GestionEnseignants;
