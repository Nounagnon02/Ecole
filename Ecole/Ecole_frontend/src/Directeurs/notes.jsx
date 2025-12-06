import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/GlobalStyles.css';

const Notes = () => {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    classe_id: '',
    matiere_id: '',
    periode: '',
    eleve_id: ''
  });

  useEffect(() => {
    fetchNotes();
  }, [filters]);

  const fetchNotes = async () => {
    try {
      const queryParams = new URLSearchParams(filters).toString();
      const response = await axios.get(`/api/notes?${queryParams}`);
      setNotes(response.data);
      setLoading(false);
    } catch (error) {
      setError("Erreur lors du chargement des notes");
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (loading) return <div className="notes-loading">Chargement...</div>;
  if (error) return <div className="notes-error">{error}</div>;

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--primary)' }}>Gestion des Notes</h2>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <select
            name="classe_id"
            value={filters.classe_id}
            onChange={handleFilterChange}
            className="form-select"
            style={{ minWidth: '200px' }}
          >
            <option value="">Toutes les classes</option>
            {/* Options des classes */}
          </select>

          <select
            name="matiere_id"
            value={filters.matiere_id}
            onChange={handleFilterChange}
            className="form-select"
            style={{ minWidth: '200px' }}
          >
            <option value="">Toutes les matières</option>
            {/* Options des matières */}
          </select>

          <select
            name="periode"
            value={filters.periode}
            onChange={handleFilterChange}
            className="form-select"
            style={{ minWidth: '200px' }}
          >
            <option value="">Toutes les périodes</option>
            <option value="1">1er Trimestre</option>
            <option value="2">2ème Trimestre</option>
            <option value="3">3ème Trimestre</option>
          </select>
        </div>
      </div>

      <div className="card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Élève</th>
              <th>Matière</th>
              <th>Note</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {notes.map((note) => (
              <tr key={note.id}>
                <td>{note.eleve?.nom}</td>
                <td>{note.matiere?.nom}</td>
                <td>{note.note}/{note.note_sur}</td>
                <td>{new Date(note.date_evaluation).toLocaleDateString()}</td>
                <td style={{ display: 'flex', gap: '0.5rem' }}>
                  <button className="btn btn-primary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.85rem' }}>Modifier</button>
                  <button className="btn btn-danger" style={{ padding: '0.25rem 0.5rem', fontSize: '0.85rem' }}>Supprimer</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Notes;