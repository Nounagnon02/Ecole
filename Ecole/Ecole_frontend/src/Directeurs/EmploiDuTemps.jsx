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
    <div className="container">
      <h2 style={{ marginBottom: '2rem', fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--primary)' }}>Gestion des Emplois du Temps</h2>

      <div className="card">
        <h3 style={{ marginBottom: '1.5rem', fontSize: '1.25rem', fontWeight: 'bold' }}>Ajouter un cours</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label>Classe</label>
              <select
                value={form.classe_id}
                onChange={(e) => { setForm({ ...form, classe_id: e.target.value }); setSelectedClasse(e.target.value); loadEmplois(e.target.value); }}
                required
                className="form-select"
              >
                <option value="">Sélectionner une classe</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.nom_classe}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label>Matière</label>
              <select
                value={form.matiere_id}
                onChange={(e) => setForm({ ...form, matiere_id: e.target.value })}
                required
                className="form-select"
              >
                <option value="">Sélectionner une matière</option>
                {matieres.map(m => <option key={m.id} value={m.id}>{m.nom}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label>Enseignant</label>
              <select
                value={form.enseignant_id}
                onChange={(e) => setForm({ ...form, enseignant_id: e.target.value })}
                required
                className="form-select"
              >
                <option value="">Sélectionner un enseignant</option>
                {enseignants.map(e => <option key={e.id} value={e.id}>{e.nom} {e.prenom}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label>Jour</label>
              <select
                value={form.jour}
                onChange={(e) => setForm({ ...form, jour: e.target.value })}
                required
                className="form-select"
              >
                <option value="Lundi">Lundi</option>
                <option value="Mardi">Mardi</option>
                <option value="Mercredi">Mercredi</option>
                <option value="Jeudi">Jeudi</option>
                <option value="Vendredi">Vendredi</option>
                <option value="Samedi">Samedi</option>
              </select>
            </div>

            <div className="form-group">
              <label>Heure de début</label>
              <input
                type="time"
                value={form.heure_debut}
                onChange={(e) => setForm({ ...form, heure_debut: e.target.value })}
                required
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label>Heure de fin</label>
              <input
                type="time"
                value={form.heure_fin}
                onChange={(e) => setForm({ ...form, heure_fin: e.target.value })}
                required
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label>Salle</label>
              <input
                type="text"
                placeholder="Salle"
                value={form.salle}
                onChange={(e) => setForm({ ...form, salle: e.target.value })}
                className="form-input"
              />
            </div>
          </div>
          <button type="submit" className="btn btn-primary" style={{ marginTop: '1.5rem' }}>Ajouter</button>
        </form>
      </div>

      {selectedClasse && (
        <div className="card" style={{ marginTop: '2rem' }}>
          <h3 style={{ marginBottom: '1.5rem', fontSize: '1.25rem', fontWeight: 'bold' }}>Emploi du temps de la classe</h3>
          {emplois.length > 0 ? (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Jour</th>
                  <th>Heure</th>
                  <th>Matière</th>
                  <th>Professeur</th>
                  <th>Salle</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {emplois.map(e => (
                  <tr key={e.id}>
                    <td>{e.jour}</td>
                    <td>{e.heure_debut} - {e.heure_fin}</td>
                    <td>{e.matiere}</td>
                    <td>{e.professeur}</td>
                    <td>{e.salle}</td>
                    <td>
                      <button
                        onClick={() => handleDelete(e.id)}
                        className="btn btn-danger"
                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.85rem' }}
                      >
                        Supprimer
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p style={{ color: 'var(--text-muted)', fontStyle: 'italic', textAlign: 'center', padding: '1rem' }}>Aucun cours programmé pour cette classe.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default EmploiDuTemps;
