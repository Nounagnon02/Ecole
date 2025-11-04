import React, { useState, useEffect } from 'react';
import { Edit2, Save, X } from 'lucide-react';
import api from '../api';

const ProfilUtilisateur = () => {
  const [user, setUser] = useState({
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    role: ''
  });
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      setLoading(true);
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      const res = await api.get('/user/profile', {
        headers: {
          'X-User-Id': userData.id,
          'X-User-Role': userData.role
        }
      });
      setUser(res.data);
    } catch (error) {
      console.error('Erreur chargement profil:', error);
      setMessage({ text: 'Erreur lors du chargement du profil', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setUser({ ...user, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      await api.put('/user/profile', user, {
        headers: {
          'X-User-Id': userData.id,
          'X-User-Role': userData.role
        }
      });
      setMessage({ text: 'Profil mis à jour avec succès', type: 'success' });
      setEditing(false);
    } catch (error) {
      setMessage({ text: 'Erreur lors de la mise à jour', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="profil-container">
      <h2>Mon Profil</h2>
      
      {message.text && (
        <div className={`message ${message.type === 'error' ? 'error-message' : 'success-message'}`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="profil-form">
        <div className="form-group">
          <label>Nom</label>
          <input
            type="text"
            name="nom"
            value={user.nom}
            onChange={handleChange}
            disabled={!editing}
            className="form-input"
          />
        </div>

        <div className="form-group">
          <label>Prénom</label>
          <input
            type="text"
            name="prenom"
            value={user.prenom}
            onChange={handleChange}
            disabled={!editing}
            className="form-input"
          />
        </div>

        <div className="form-group">
          <label>Email</label>
          <input
            type="email"
            name="email"
            value={user.email}
            onChange={handleChange}
            disabled={!editing}
            className="form-input"
          />
        </div>

        <div className="form-group">
          <label>Téléphone</label>
          <input
            type="tel"
            name="telephone"
            value={user.telephone}
            onChange={handleChange}
            disabled={!editing}
            className="form-input"
          />
        </div>

        <div className="form-group">
          <label>Rôle</label>
          <input
            type="text"
            value={user.role}
            disabled
            className="form-input"
          />
        </div>

        <div className="form-actions">
          {!editing ? (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="btn btn-primary"
            >
              <Edit2 size={16} />
              Modifier
            </button>
          ) : (
            <>
              <button
                type="submit"
                disabled={loading}
                className="btn btn-success"
              >
                <Save size={16} />
                Enregistrer
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditing(false);
                  loadUserProfile();
                }}
                className="btn btn-secondary"
              >
                <X size={16} />
                Annuler
              </button>
            </>
          )}
        </div>
      </form>
    </div>
  );
};

export default ProfilUtilisateur;
