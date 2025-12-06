import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import api from '../api';
import './DashboardUniversite.css';

const GestionEtudiants = () => {
  const [etudiants, setEtudiants] = useState([]);
  const [filieres, setFilieres] = useState([]);
  const [form, setForm] = useState({ nom: '', prenom: '', email: '', telephone: '', matricule: '', filiere_id: '' });
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [etud, fil] = await Promise.all([
        api.get('/universite/etudiants'),
        api.get('/universite/filieres')
      ]);
      setEtudiants(etud.data);
      setFilieres(fil.data);
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/universite/etudiants', form);
      setMessage({ text: 'Étudiant ajouté avec succès', type: 'success' });
      setForm({ nom: '', prenom: '', email: '', telephone: '', matricule: '', filiere_id: '' });
      fetchData();
    } catch (error) {
      setMessage({ text: 'Erreur lors de l\'ajout', type: 'error' });
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Confirmer la suppression ?')) {
      try {
        await api.delete(`/universite/etudiants/${id}`);
        setMessage({ text: 'Étudiant supprimé', type: 'success' });
        fetchData();
      } catch (error) {
        setMessage({ text: 'Erreur lors de la suppression', type: 'error' });
      }
    }
  };

  return (
    <div className="univ-dashboard">
      <div className="univ-header">
        <h1>Gestion des Étudiants</h1>
      </div>

      {message.text && <div className={`message ${message.type}`}>{message.text}</div>}

      <div className="form-container">
        <h2>Ajouter un Étudiant</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label>Nom</label>
              <input className="form-input" value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Prénom</label>
              <input className="form-input" value={form.prenom} onChange={(e) => setForm({ ...form, prenom: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input type="email" className="form-input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Téléphone</label>
              <input className="form-input" value={form.telephone} onChange={(e) => setForm({ ...form, telephone: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Matricule</label>
              <input className="form-input" value={form.matricule} onChange={(e) => setForm({ ...form, matricule: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Filière</label>
              <select className="form-select" value={form.filiere_id} onChange={(e) => setForm({ ...form, filiere_id: e.target.value })} required>
                <option value="">Sélectionner</option>
                {filieres.map(f => <option key={f.id} value={f.id}>{f.nom}</option>)}
              </select>
            </div>
          </div>
          <button type="submit" className="btn btn-primary"><Plus size={18} /> Ajouter</button>
        </form>
      </div>

      <div className="form-container" style={{ marginTop: '2rem' }}>
        <h2>Liste des Étudiants ({etudiants.length})</h2>
        <table className="data-table">
          <thead>
            <tr>
              <th>Matricule</th>
              <th>Nom</th>
              <th>Prénom</th>
              <th>Email</th>
              <th>Filière</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {etudiants.map(e => (
              <tr key={e.id}>
                <td>{e.matricule}</td>
                <td>{e.nom}</td>
                <td>{e.prenom}</td>
                <td>{e.email}</td>
                <td>{e.filiere?.nom}</td>
                <td>
                  <button className="btn btn-danger btn-icon" onClick={() => handleDelete(e.id)}><Trash2 size={18} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default GestionEtudiants;
