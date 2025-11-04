import React, { useState, useEffect } from 'react';
import api from '../api';
import { School } from 'lucide-react';

const EcoleSelector = ({ onSelect, selectedEcoleId }) => {
  const [ecoles, setEcoles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEcoles();
  }, []);

  const fetchEcoles = async () => {
    try {
      const response = await api.get('/ecoles');
      setEcoles(response.data.data || response.data);
    } catch (error) {
      console.error('Erreur chargement écoles:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Chargement des écoles...</div>;

  return (
    <div className="form-group">
      <label>
        <School size={16} style={{ marginRight: '8px' }} />
        École
      </label>
      <select
        value={selectedEcoleId || ''}
        onChange={(e) => onSelect(e.target.value)}
        required
      >
        <option value="">Sélectionnez votre école</option>
        {ecoles.map(ecole => (
          <option key={ecole.id} value={ecole.id}>
            {ecole.nom}
          </option>
        ))}
      </select>
    </div>
  );
};

export default EcoleSelector;
