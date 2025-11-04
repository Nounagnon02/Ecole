import React, { useState, useEffect } from 'react';
import api from '../api';
import { School, Plus, Edit, Trash2, Save, X, Users, BookOpen, GraduationCap, TrendingUp, BarChart3, Settings } from 'lucide-react';

const EcoleManagement = () => {
  const [ecoles, setEcoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [stats, setStats] = useState({
    totalEcoles: 0,
    totalEleves: 0,
    totalEnseignants: 0,
    totalClasses: 0
  });
  const [formData, setFormData] = useState({
    nom: '',
    email: '',
    telephone: '',
    adresse: '',
    slug: ''
  });

  useEffect(() => {
    fetchEcoles();
    fetchStats();
  }, []);

  const fetchEcoles = async () => {
    try {
      const response = await api.get('/ecoles');
      setEcoles(response.data.data || response.data);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const [ecolesRes, elevesRes, enseignantsRes, classesRes] = await Promise.all([
        api.get('/ecoles'),
        api.get('/elevesT'),
        api.get('/enseignants'),
        api.get('/classes')
      ]);
      setStats({
        totalEcoles: (ecolesRes.data.data || ecolesRes.data).length,
        totalEleves: (elevesRes.data.data || elevesRes.data).length,
        totalEnseignants: (enseignantsRes.data.data || enseignantsRes.data).length,
        totalClasses: (classesRes.data.data || classesRes.data).length
      });
    } catch (error) {
      console.error('Erreur stats:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/ecoles/${editingId}`, formData);
      } else {
        await api.post('/ecoles', formData);
      }
      fetchEcoles();
      resetForm();
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de l\'enregistrement');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Supprimer cette école ?')) {
      try {
        await api.delete(`/ecoles/${id}`);
        fetchEcoles();
      } catch (error) {
        console.error('Erreur:', error);
        alert('Erreur lors de la suppression');
      }
    }
  };

  const handleEdit = (ecole) => {
    setFormData(ecole);
    setEditingId(ecole.id);
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({ nom: '', email: '', telephone: '', adresse: '', slug: '' });
    setEditingId(null);
    setShowForm(false);
  };

  if (loading) return <div>Chargement...</div>;

  return (
    <div className="ecole-management">
      <div className="header">
        <h2><School size={24} /> Dashboard Super Admin</h2>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">
          {showForm ? <X size={20} /> : <Plus size={20} />}
          {showForm ? 'Annuler' : 'Nouvelle École'}
        </button>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <School size={32} />
          <div>
            <h3>{stats.totalEcoles}</h3>
            <p>Écoles</p>
          </div>
        </div>
        <div className="stat-card">
          <Users size={32} />
          <div>
            <h3>{stats.totalEleves}</h3>
            <p>Élèves</p>
          </div>
        </div>
        <div className="stat-card">
          <GraduationCap size={32} />
          <div>
            <h3>{stats.totalEnseignants}</h3>
            <p>Enseignants</p>
          </div>
        </div>
        <div className="stat-card">
          <BookOpen size={32} />
          <div>
            <h3>{stats.totalClasses}</h3>
            <p>Classes</p>
          </div>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="ecole-form">
          <div className="form-row">
            <input
              type="text"
              placeholder="Nom de l'école"
              value={formData.nom}
              onChange={(e) => setFormData({...formData, nom: e.target.value})}
              required
            />
            <input
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              required
            />
          </div>
          <div className="form-row">
            <input
              type="tel"
              placeholder="Téléphone"
              value={formData.telephone}
              onChange={(e) => setFormData({...formData, telephone: e.target.value})}
            />
            <input
              type="text"
              placeholder="Slug (URL)"
              value={formData.slug}
              onChange={(e) => setFormData({...formData, slug: e.target.value})}
              required
            />
          </div>
          <textarea
            placeholder="Adresse"
            value={formData.adresse}
            onChange={(e) => setFormData({...formData, adresse: e.target.value})}
            rows="3"
          />
          <button type="submit" className="btn-success">
            <Save size={20} /> {editingId ? 'Modifier' : 'Créer'}
          </button>
        </form>
      )}

      <h3 style={{marginTop: '30px', marginBottom: '15px'}}>Liste des Écoles</h3>
      <div className="ecoles-list">
        {ecoles.map(ecole => (
          <div key={ecole.id} className="ecole-card">
            <div className="ecole-info">
              <h3>{ecole.nom}</h3>
              <p><strong>Email:</strong> {ecole.email}</p>
              <p><strong>Tél:</strong> {ecole.telephone}</p>
              <p className="address"><strong>Adresse:</strong> {ecole.adresse}</p>
              <p><strong>Slug:</strong> {ecole.slug}</p>
              <p><strong>Status:</strong> <span className={`status ${ecole.status}`}>{ecole.status}</span></p>
            </div>
            <div className="ecole-actions">
              <button onClick={() => handleEdit(ecole)} className="btn-edit">
                <Edit size={18} />
              </button>
              <button onClick={() => handleDelete(ecole.id)} className="btn-delete">
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <style jsx>{`
        .ecole-management {
          padding: 20px;
          background: #f8f9fa;
          min-height: 100vh;
        }
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }
        .stat-card {
          background: white;
          padding: 20px;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          display: flex;
          align-items: center;
          gap: 15px;
        }
        .stat-card svg {
          color: #007bff;
        }
        .stat-card h3 {
          margin: 0;
          font-size: 2em;
          color: #333;
        }
        .stat-card p {
          margin: 0;
          color: #666;
          font-size: 0.9em;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }
        .ecole-form {
          background: #f5f5f5;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 20px;
        }
        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin-bottom: 10px;
        }
        .form-row input {
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 4px;
        }
        textarea {
          width: 100%;
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 4px;
          margin-bottom: 10px;
        }
        .ecoles-list {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 20px;
        }
        .ecole-card {
          background: white;
          border: 1px solid #ddd;
          border-radius: 12px;
          padding: 20px;
          display: flex;
          justify-content: space-between;
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
          transition: transform 0.2s;
        }
        .ecole-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
        .ecole-info h3 {
          margin: 0 0 10px 0;
          color: #333;
        }
        .ecole-info p {
          margin: 5px 0;
          color: #666;
          font-size: 0.95em;
        }
        .status {
          padding: 3px 8px;
          border-radius: 4px;
          font-size: 0.85em;
          font-weight: 600;
        }
        .status.active {
          background: #d4edda;
          color: #155724;
        }
        .status.inactive {
          background: #f8d7da;
          color: #721c24;
        }
        .address {
          font-size: 0.9em;
        }
        .ecole-actions {
          display: flex;
          gap: 10px;
          align-items: flex-start;
        }
        .btn-primary, .btn-success, .btn-edit, .btn-delete {
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 8px 15px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }
        .btn-primary {
          background: #007bff;
          color: white;
          transition: background 0.2s;
        }
        .btn-primary:hover {
          background: #0056b3;
        }
        .btn-success {
          background: #28a745;
          color: white;
        }
        .btn-edit {
          background: #ffc107;
          color: white;
        }
        .btn-delete {
          background: #dc3545;
          color: white;
        }
      `}</style>
    </div>
  );
};

export default EcoleManagement;
