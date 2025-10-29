import React, { useState, useEffect } from 'react';
import api from '../api';

const EmploiDuTemps = () => {
  const [classes, setClasses] = useState([]);
  const [matieres, setMatieres] = useState([]);
  const [enseignants, setEnseignants] = useState([]);
  const [selectedClasse, setSelectedClasse] = useState('');
  const [emplois, setEmplois] = useState([]);
  const [form, setForm] = useState({
    classe_id: '',
    matiere_id: '',
    enseignant_id: '',
    jour: 'Lundi',
    heure_debut: '',
    heure_fin: '',
    salle: ''
  });

  useEffect(() => {
    loadClasses();
    loadMatieres();
    loadEnseignants();
  }, []);

  const loadClasses = async () => {
    const res = await api.get('/classes');
    setClasses(res.data);
  };

  const loadMatieres = async () => {
    const res = await api.get('/matieres');
    setMatieres(res.data);
  };

  const loadEnseignants = async () => {
    const res = await api.get('/enseignants');
    setEnseignants(res.data);
  };

  const loadEmplois = async (classId) => {
    const res = await api.get(`/emplois-du-temps/classe/${classId}`);
    setEmplois(res.data.data || []);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await api.post('/emplois-du-temps', form);
    loadEmplois(form.classe_id);
    setForm({ ...form, matiere_id: '', enseignant_id: '', heure_debut: '', heure_fin: '', salle: '' });
  };

  const handleDelete = async (id) => {
    if (window.confirm('Supprimer ce cours ?')) {
      await api.delete(`/emplois-du-temps/${id}`);
      loadEmplois(selectedClasse);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Gestion des Emplois du Temps</h2>
      
      <form onSubmit={handleSubmit} style={{ marginBottom: '20px', padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
          <select value={form.classe_id} onChange={(e) => { setForm({...form, classe_id: e.target.value}); setSelectedClasse(e.target.value); loadEmplois(e.target.value); }} required>
            <option value="">Sélectionner une classe</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.nom_classe}</option>)}
          </select>
          
          <select value={form.matiere_id} onChange={(e) => setForm({...form, matiere_id: e.target.value})} required>
            <option value="">Sélectionner une matière</option>
            {matieres.map(m => <option key={m.id} value={m.id}>{m.nom}</option>)}
          </select>
          
          <select value={form.enseignant_id} onChange={(e) => setForm({...form, enseignant_id: e.target.value})} required>
            <option value="">Sélectionner un enseignant</option>
            {enseignants.map(e => <option key={e.id} value={e.id}>{e.nom} {e.prenom}</option>)}
          </select>
          
          <select value={form.jour} onChange={(e) => setForm({...form, jour: e.target.value})} required>
            <option value="Lundi">Lundi</option>
            <option value="Mardi">Mardi</option>
            <option value="Mercredi">Mercredi</option>
            <option value="Jeudi">Jeudi</option>
            <option value="Vendredi">Vendredi</option>
            <option value="Samedi">Samedi</option>
          </select>
          
          <input type="time" value={form.heure_debut} onChange={(e) => setForm({...form, heure_debut: e.target.value})} required />
          <input type="time" value={form.heure_fin} onChange={(e) => setForm({...form, heure_fin: e.target.value})} required />
          <input type="text" placeholder="Salle" value={form.salle} onChange={(e) => setForm({...form, salle: e.target.value})} />
        </div>
        <button type="submit" style={{ marginTop: '10px', padding: '10px 20px', background: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Ajouter</button>
      </form>

      {selectedClasse && (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f0f0f0' }}>
              <th style={{ padding: '10px', border: '1px solid #ddd' }}>Jour</th>
              <th style={{ padding: '10px', border: '1px solid #ddd' }}>Heure</th>
              <th style={{ padding: '10px', border: '1px solid #ddd' }}>Matière</th>
              <th style={{ padding: '10px', border: '1px solid #ddd' }}>Professeur</th>
              <th style={{ padding: '10px', border: '1px solid #ddd' }}>Salle</th>
              <th style={{ padding: '10px', border: '1px solid #ddd' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {emplois.map(e => (
              <tr key={e.id}>
                <td style={{ padding: '10px', border: '1px solid #ddd' }}>{e.jour}</td>
                <td style={{ padding: '10px', border: '1px solid #ddd' }}>{e.heure_debut} - {e.heure_fin}</td>
                <td style={{ padding: '10px', border: '1px solid #ddd' }}>{e.matiere}</td>
                <td style={{ padding: '10px', border: '1px solid #ddd' }}>{e.professeur}</td>
                <td style={{ padding: '10px', border: '1px solid #ddd' }}>{e.salle}</td>
                <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                  <button onClick={() => handleDelete(e.id)} style={{ background: '#f44336', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}>Supprimer</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default EmploiDuTemps;
