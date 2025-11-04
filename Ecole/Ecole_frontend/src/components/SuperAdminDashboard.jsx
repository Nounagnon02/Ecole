import React, { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { School, Users, GraduationCap, BookOpen, DollarSign, TrendingUp, Download, Search, Filter, Eye, Power, Settings, FileText, Bell, Calendar, Edit } from 'lucide-react';
import api from '../api';

const SuperAdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [ecoles, setEcoles] = useState([]);
  const [stats, setStats] = useState({});
  const [chartData, setChartData] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    nom: '',
    email: '',
    telephone: '',
    adresse: '',
    slug: '',
    status: 'active'
  });

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      const [ecolesRes, elevesRes, enseignantsRes, classesRes] = await Promise.all([
        api.get('/ecoles'),
        api.get('/elevesT'),
        api.get('/enseignants'),
        api.get('/classes')
      ]);
      
      setEcoles(ecolesRes.data.data || ecolesRes.data);
      setStats({
        totalEcoles: (ecolesRes.data.data || ecolesRes.data).length,
        totalEleves: (elevesRes.data.data || elevesRes.data).length,
        totalEnseignants: (enseignantsRes.data.data || enseignantsRes.data).length,
        totalClasses: (classesRes.data.data || classesRes.data).length,
        activeEcoles: (ecolesRes.data.data || ecolesRes.data).filter(e => e.status === 'active').length
      });
      
      // Mock chart data
      setChartData([
        { month: 'Jan', eleves: 400, enseignants: 50 },
        { month: 'Fev', eleves: 450, enseignants: 55 },
        { month: 'Mar', eleves: 500, enseignants: 60 },
        { month: 'Avr', eleves: 550, enseignants: 65 },
        { month: 'Mai', eleves: 600, enseignants: 70 }
      ]);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleEcoleStatus = async (id, currentStatus) => {
    try {
      await api.put(`/ecoles/${id}`, { status: currentStatus === 'active' ? 'inactive' : 'active' });
      fetchAllData();
    } catch (error) {
      console.error('Erreur:', error);
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
      fetchAllData();
      resetForm();
      alert('École enregistrée avec succès!');
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de l\'enregistrement');
    }
  };

  const handleEdit = (ecole) => {
    setFormData(ecole);
    setEditingId(ecole.id);
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({ nom: '', email: '', telephone: '', adresse: '', slug: '', status: 'active' });
    setEditingId(null);
    setShowForm(false);
  };

  const exportData = (format) => {
    alert(`Export ${format} en cours...`);
  };

  const filteredEcoles = ecoles.filter(e => 
    (filterStatus === 'all' || e.status === filterStatus) &&
    (e.nom?.toLowerCase().includes(searchTerm.toLowerCase()) || 
     e.email?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) return <div className="loading">Chargement...</div>;

  return (
    <div className="super-admin">
      <header className="dashboard-header">
        <h1><School size={32} /> Dashboard Super Admin</h1>
        <div className="header-actions">
          <button className="btn-icon"><Bell size={20} /></button>
          <button className="btn-icon"><Settings size={20} /></button>
        </div>
      </header>

      <nav className="tabs">
        {['overview', 'ecoles', 'users', 'reports', 'settings'].map(tab => (
          <button 
            key={tab}
            className={activeTab === tab ? 'active' : ''}
            onClick={() => setActiveTab(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </nav>

      {activeTab === 'overview' && (
        <div className="overview">
          <div className="stats-grid">
            <div className="stat-card blue">
              <School size={40} />
              <div>
                <h2>{stats.totalEcoles}</h2>
                <p>Écoles</p>
                <small>{stats.activeEcoles} actives</small>
              </div>
            </div>
            <div className="stat-card green">
              <Users size={40} />
              <div>
                <h2>{stats.totalEleves}</h2>
                <p>Élèves</p>
                <small>+12% ce mois</small>
              </div>
            </div>
            <div className="stat-card orange">
              <GraduationCap size={40} />
              <div>
                <h2>{stats.totalEnseignants}</h2>
                <p>Enseignants</p>
                <small>+5% ce mois</small>
              </div>
            </div>
            <div className="stat-card purple">
              <BookOpen size={40} />
              <div>
                <h2>{stats.totalClasses}</h2>
                <p>Classes</p>
                <small>Tous niveaux</small>
              </div>
            </div>
          </div>

          <div className="charts-section">
            <div className="chart-card">
              <h3><TrendingUp size={20} /> Évolution des Inscriptions</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="eleves" stroke="#007bff" strokeWidth={2} />
                  <Line type="monotone" dataKey="enseignants" stroke="#28a745" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="chart-card">
              <h3><BarChart size={20} /> Répartition par École</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="eleves" fill="#007bff" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'ecoles' && (
        <div className="ecoles-section">
          <div className="toolbar">
            <div className="search-box">
              <Search size={20} />
              <input 
                type="text"
                placeholder="Rechercher une école..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="all">Tous</option>
              <option value="active">Actives</option>
              <option value="inactive">Inactives</option>
            </select>
            <button className="btn-add" onClick={() => setShowForm(!showForm)}>
              {showForm ? '✕ Fermer' : '+ Nouvelle École'}
            </button>
            <button className="btn-export" onClick={() => exportData('excel')}>
              <Download size={18} /> Export Excel
            </button>
            <button className="btn-export" onClick={() => exportData('pdf')}>
              <FileText size={18} /> Export PDF
            </button>
          </div>

          {showForm && (
            <form onSubmit={handleSubmit} className="ecole-form">
              <h3>{editingId ? 'Modifier l\'école' : 'Nouvelle école'}</h3>
              <div className="form-grid">
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
              <select
                value={formData.status}
                onChange={(e) => setFormData({...formData, status: e.target.value})}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              <div className="form-actions">
                <button type="submit" className="btn-primary">
                  {editingId ? 'Modifier' : 'Créer'}
                </button>
                <button type="button" className="btn-cancel" onClick={resetForm}>
                  Annuler
                </button>
              </div>
            </form>
          )}

          <table className="data-table">
            <thead>
              <tr>
                <th>École</th>
                <th>Email</th>
                <th>Téléphone</th>
                <th>Élèves</th>
                <th>Enseignants</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredEcoles.map(ecole => (
                <tr key={ecole.id}>
                  <td><strong>{ecole.nom}</strong></td>
                  <td>{ecole.email}</td>
                  <td>{ecole.telephone}</td>
                  <td>{Math.floor(Math.random() * 500)}</td>
                  <td>{Math.floor(Math.random() * 50)}</td>
                  <td>
                    <span className={`badge ${ecole.status}`}>
                      {ecole.status}
                    </span>
                  </td>
                  <td>
                    <button className="btn-icon" title="Voir détails">
                      <Eye size={16} />
                    </button>
                    <button 
                      className="btn-icon"
                      onClick={() => handleEdit(ecole)}
                      title="Modifier"
                    >
                      <Edit size={16} />
                    </button>
                    <button 
                      className="btn-icon"
                      onClick={() => toggleEcoleStatus(ecole.id, ecole.status)}
                      title="Activer/Désactiver"
                    >
                      <Power size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="users-section">
          <h2>Gestion des Utilisateurs</h2>
          <div className="user-stats">
            <div className="user-card">
              <h3>Directeurs</h3>
              <p>{stats.totalEcoles}</p>
            </div>
            <div className="user-card">
              <h3>Enseignants</h3>
              <p>{stats.totalEnseignants}</p>
            </div>
            <div className="user-card">
              <h3>Parents</h3>
              <p>{stats.totalEleves}</p>
            </div>
            <div className="user-card">
              <h3>Élèves</h3>
              <p>{stats.totalEleves}</p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'reports' && (
        <div className="reports-section">
          <h2>Rapports & Exports</h2>
          <div className="report-cards">
            <div className="report-card">
              <FileText size={32} />
              <h3>Rapport Mensuel</h3>
              <button className="btn-primary">Générer</button>
            </div>
            <div className="report-card">
              <Calendar size={32} />
              <h3>Rapport Annuel</h3>
              <button className="btn-primary">Générer</button>
            </div>
            <div className="report-card">
              <DollarSign size={32} />
              <h3>Rapport Financier</h3>
              <button className="btn-primary">Générer</button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="settings-section">
          <h2>Paramètres Système</h2>
          <div className="settings-grid">
            <div className="setting-card">
              <h3>Année Scolaire</h3>
              <input type="text" defaultValue="2024-2025" />
            </div>
            <div className="setting-card">
              <h3>Périodes</h3>
              <select>
                <option>Trimestre</option>
                <option>Semestre</option>
              </select>
            </div>
            <div className="setting-card">
              <h3>Backup Automatique</h3>
              <label>
                <input type="checkbox" defaultChecked />
                Activer
              </label>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .super-admin {
          padding: 20px;
          background: #f5f7fa;
          min-height: 100vh;
        }
        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          background: white;
          padding: 20px;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .header-actions {
          display: flex;
          gap: 10px;
        }
        .tabs {
          display: flex;
          gap: 10px;
          margin-bottom: 20px;
          background: white;
          padding: 10px;
          border-radius: 12px;
        }
        .tabs button {
          padding: 10px 20px;
          border: none;
          background: transparent;
          cursor: pointer;
          border-radius: 8px;
          font-weight: 500;
        }
        .tabs button.active {
          background: #007bff;
          color: white;
        }
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }
        .stat-card {
          background: white;
          padding: 25px;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          display: flex;
          align-items: center;
          gap: 20px;
        }
        .stat-card.blue svg { color: #007bff; }
        .stat-card.green svg { color: #28a745; }
        .stat-card.orange svg { color: #fd7e14; }
        .stat-card.purple svg { color: #6f42c1; }
        .stat-card h2 {
          margin: 0;
          font-size: 2.5em;
        }
        .stat-card p {
          margin: 5px 0;
          color: #666;
        }
        .stat-card small {
          color: #28a745;
          font-size: 0.85em;
        }
        .charts-section {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
          gap: 20px;
        }
        .chart-card {
          background: white;
          padding: 20px;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .chart-card h3 {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 20px;
        }
        .toolbar {
          display: flex;
          gap: 10px;
          margin-bottom: 20px;
          flex-wrap: wrap;
        }
        .search-box {
          display: flex;
          align-items: center;
          gap: 10px;
          background: white;
          padding: 10px 15px;
          border-radius: 8px;
          flex: 1;
          min-width: 250px;
        }
        .search-box input {
          border: none;
          outline: none;
          flex: 1;
        }
        .toolbar select {
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 8px;
        }
        .btn-add {
          padding: 10px 20px;
          background: #007bff;
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
        }
        .btn-export {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 15px;
          background: #28a745;
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
        }
        .ecole-form {
          background: white;
          padding: 25px;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          margin-bottom: 20px;
        }
        .ecole-form h3 {
          margin-top: 0;
          margin-bottom: 20px;
        }
        .form-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 15px;
          margin-bottom: 15px;
        }
        .ecole-form input,
        .ecole-form textarea,
        .ecole-form select {
          padding: 12px;
          border: 1px solid #ddd;
          border-radius: 8px;
          font-size: 14px;
        }
        .ecole-form textarea {
          grid-column: 1 / -1;
          resize: vertical;
        }
        .form-actions {
          display: flex;
          gap: 10px;
          margin-top: 20px;
        }
        .btn-cancel {
          padding: 10px 20px;
          background: #6c757d;
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
        }
        .data-table {
          width: 100%;
          background: white;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .data-table th {
          background: #f8f9fa;
          padding: 15px;
          text-align: left;
          font-weight: 600;
        }
        .data-table td {
          padding: 15px;
          border-top: 1px solid #eee;
        }
        .badge {
          padding: 5px 10px;
          border-radius: 20px;
          font-size: 0.85em;
          font-weight: 600;
        }
        .badge.active {
          background: #d4edda;
          color: #155724;
        }
        .badge.inactive {
          background: #f8d7da;
          color: #721c24;
        }
        .btn-icon {
          background: none;
          border: none;
          cursor: pointer;
          padding: 5px;
          margin: 0 5px;
        }
        .btn-icon:hover {
          background: #f0f0f0;
          border-radius: 4px;
        }
        .user-stats, .report-cards, .settings-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin-top: 20px;
        }
        .user-card, .report-card, .setting-card {
          background: white;
          padding: 20px;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          text-align: center;
        }
        .btn-primary {
          background: #007bff;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 8px;
          cursor: pointer;
          margin-top: 10px;
        }
        .loading {
          text-align: center;
          padding: 50px;
          font-size: 1.2em;
        }
      `}</style>
    </div>
  );
};

export default SuperAdminDashboard;
