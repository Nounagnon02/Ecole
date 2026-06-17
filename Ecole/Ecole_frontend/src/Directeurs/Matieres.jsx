import '../styles/GlobalStyles.css';
import { useState, useEffect } from 'react';
import React from 'react';
import { Edit2, Trash2, Save, X, Plus, Home, Users, Book, Calendar, User, Settings } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import api from '../api';

// ── Navigation ─────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { id: 'accueil',     label: 'Accueil',     icon: Home },
  { id: 'eleves',      label: 'Élèves',      icon: Users },
  { id: 'matieres',    label: 'Matières',    icon: Book },
  { id: 'calendrier',  label: 'Calendrier',  icon: Calendar },
  { id: 'personnel',   label: 'Personnel',   icon: User },
  { id: 'parametres',  label: 'Paramètres',  icon: Settings },
];

// ── Composant principal ────────────────────────────────────────────────────
export default function Matieres() {
  const [matieres, setMatieres] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [newMatiere, setNewMatiere] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('matieres');

  useEffect(() => { fetchMatieres(); }, []);

  // ── CRUD ───────────────────────────────────────────────────────────────
  const fetchMatieres = async () => {
    try {
      setLoading(true);
      const res = await api.get('/matieres');
      setMatieres(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const AjouterMatiere = async () => {
    if (!newMatiere.trim()) { setError('Le nom de la matière ne peut pas être vide'); return; }
    try {
      setLoading(true);
      const res = await api.post('/matieres/store', { nom: newMatiere });
      setMatieres([...matieres, res.data]);
      setNewMatiere('');
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || "Erreur lors de l'ajout");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (matiere) => { setEditingId(matiere.id); setEditValue(matiere.nom); };

  const Modification = async (id) => {
    if (!editValue.trim()) { setError('Le nom de la matière ne peut pas être vide'); return; }
    try {
      setLoading(true);
      await api.put(`/matieres/update/${id}`, { nom: editValue });
      await fetchMatieres();
      setEditingId(null);
      setEditValue('');
      setError('');
    } catch (err) {
      setError('Erreur lors de la modification');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => { setEditingId(null); setEditValue(''); setError(''); };

  const handleDelete = async (id) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette matière ?')) return;
    try {
      setLoading(true);
      await api.delete(`/matieres/delete/${id}`);
      fetchMatieres();
    } catch (err) {
      setError('Erreur lors de la suppression');
      setLoading(false);
    }
  };

  // ── Rendu ──────────────────────────────────────────────────────────────
  return (
    <DashboardLayout
      navItems={NAV_ITEMS}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      userRole="Directeur"
      headerTitle={activeTab === 'matieres'
        ? 'Gestion des Matières'
        : activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
    >
      {activeTab !== 'matieres' ? (
        <div className="section-placeholder">
          <div className="placeholder-content">
            <h3 className="placeholder-title">Section {activeTab} en cours de développement</h3>
            <p className="placeholder-text">Cette fonctionnalité sera disponible prochainement</p>
          </div>
        </div>
      ) : (
        <>
          {error && <div className="error-message">{error}</div>}

          {/* Formulaire d'ajout */}
          <div className="form-container" style={{ marginBottom: '2rem' }}>
            <h2 style={{ marginBottom: '1.5rem', fontSize: '1.25rem', fontWeight: 'bold' }}>
              Ajouter une nouvelle matière
            </h2>
            <div className="form-group" style={{ flexDirection: 'row', gap: '1rem' }}>
              <input
                type="text"
                value={newMatiere}
                onChange={(e) => setNewMatiere(e.target.value)}
                placeholder="Nom de la matière"
                className="form-input"
                style={{ flex: 1 }}
                onKeyPress={(e) => e.key === 'Enter' && AjouterMatiere()}
              />
              <button onClick={AjouterMatiere} disabled={loading} className="btn btn-primary">
                <Plus size={18} /> Ajouter
              </button>
            </div>
          </div>

          {/* Liste des matières */}
          <div>
            <h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem', fontWeight: 'bold' }}>
              Liste des Matières
            </h2>

            {loading && matieres.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                Chargement des matières...
              </div>
            ) : matieres.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                Aucune matière trouvée. Ajoutez-en une ci-dessus.
              </div>
            ) : (
              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                gap: '1.5rem'
              }}>
                {matieres.map((matiere) => (
                  <div key={matiere.id} className="card">
                    <div className="card-body">
                      {editingId === matiere.id ? (
                        <div className="form-grid">
                          <input
                            type="text"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="form-input"
                            onKeyPress={(e) => e.key === 'Enter' && Modification(matiere.id)}
                            autoFocus
                          />
                          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                            <button
                              onClick={() => Modification(matiere.id)}
                              disabled={loading}
                              className="btn btn-primary"
                              title="Sauvegarder"
                            >
                              <Save size={16} />
                            </button>
                            <button onClick={handleCancel} className="btn btn-danger" title="Annuler">
                              <X size={16} />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="matiere-display">
                          <div className="matiere-info">
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                              {matiere.nom}
                            </h3>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                              ID: {matiere.id}
                            </p>
                          </div>
                          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                            <button
                              onClick={() => handleEdit(matiere)}
                              disabled={loading || editingId !== null}
                              className="btn btn-icon"
                              title="Modifier"
                              style={{ color: 'var(--primary)' }}
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(matiere.id)}
                              disabled={loading || editingId !== null}
                              className="btn btn-icon"
                              title="Supprimer"
                              style={{ color: 'var(--error)' }}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </DashboardLayout>
  );
}
