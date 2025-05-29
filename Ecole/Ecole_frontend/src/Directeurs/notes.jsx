import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Mes_CSS/notes.css';

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
    <div className="notes-container">
      <div className="notes-header">
        <h2>Gestion des Notes</h2>
        <div className="notes-filters">
          <select
            name="classe_id"
            value={filters.classe_id}
            onChange={handleFilterChange}
            className="notes-select"
          >
            <option value="">Toutes les classes</option>
            {/* Options des classes */}
          </select>

          <select
            name="matiere_id"
            value={filters.matiere_id}
            onChange={handleFilterChange}
            className="notes-select"
          >
            <option value="">Toutes les matières</option>
            {/* Options des matières */}
          </select>

          <select
            name="periode"
            value={filters.periode}
            onChange={handleFilterChange}
            className="notes-select"
          >
            <option value="">Toutes les périodes</option>
            <option value="1">1er Trimestre</option>
            <option value="2">2ème Trimestre</option>
            <option value="3">3ème Trimestre</option>
          </select>
        </div>
      </div>

      <div className="notes-table-container">
        <table className="notes-table">
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
                <td className="notes-actions">
                  <button className="notes-btn notes-btn-edit">Modifier</button>
                  <button className="notes-btn notes-btn-delete">Supprimer</button>
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