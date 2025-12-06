import { useState, useEffect } from 'react';
import '../styles/GlobalStyles.css';
import axios from 'axios';
import { Edit2, Trash2, Save, X, Plus, Menu, Home, Users, Book, Calendar, User, Settings, LogOut, Bell } from 'lucide-react';

export function Classe() {
    const [classe, SetClasse] = useState({
        nom_classe: "",
        categorie_classe: "",
    });

    const [error, SetError] = useState(false);
    const [message, SetMessage] = useState('');

    const HandleChange = (e) => {
        SetClasse({ ...classe, [e.target.name]: e.target.value });
    };

    const HandleSubmit = (e) => {
        e.preventDefault();

        if (!classe.nom_classe) {
            SetError(true);
            SetMessage('Tous les champs sont requis');
            return;
        }
        if (!classe.categorie_classe) {
            SetError(true);
            SetMessage('le champ categorie_classe est requis');
            return;
        }

        axios.post('http://localhost:8000/api/classes/store', classe, {
            headers: {
                'Content-Type': 'application/json'
            }
        })
            .then(res => {
                SetMessage('Classe ajoutée avec succès');
                SetError(false);
                SetClasse({
                    nom_classe: "",
                    categorie_classe: "",
                });
            })
            .catch(err => {
                const errorMessage = err.response?.data?.message || "Erreur lors de l'ajout";
                const errorDetails = err.response?.data?.errors || err.response?.data?.error || err.message;
                SetMessage(`${errorMessage}: ${JSON.stringify(errorDetails)}`);
                SetError(true);
                console.error('Erreur détaillée:', err.response?.data || err.message);
            });
    };

    return (
        <div className="form-container">
            <form onSubmit={HandleSubmit}>
                <h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem', fontWeight: 'bold' }}>Enregistrement d'une classe</h2>
                {message && (
                    <div className={`message ${error ? 'error' : 'success'}`}>
                        {message}
                    </div>
                )}
                <div className="form-group">
                    <input
                        type="text"
                        className="form-input"
                        name="nom_classe"
                        value={classe.nom_classe}
                        onChange={HandleChange}
                        placeholder="Le Nom de la classe"
                    />
                </div>
                <div className="form-group">
                    <select name="categorie_classe" className='form-select' value={classe.categorie_classe} onChange={HandleChange}>
                        <option value="">Choisir une catégorie</option>
                        <option value="maternelle">Maternelle</option>
                        <option value="primaire">Primaire</option>
                        <option value="secondaire">Secondaire</option>
                    </select>
                </div>
                <button className="btn btn-primary" type="submit">Enregistrer</button>
            </form>
        </div>
    );
}

export default function Classes() {
    const [classes, setClasses] = useState([]);
    const [editingId, setEditingId] = useState(null);
    const [editValue, setEditValue] = useState('');
    const [editCategorie, setEditCategorie] = useState('');
    const [newnom_classe, setNewnom_classe] = useState("");
    const [newcategorie_classe, setNewcategorie_classe] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [activeTab, setActiveTab] = useState('matieres');
    const [message, setMessage] = useState('');

    useEffect(() => {
        fetchClasses();
    }, []);

    const fetchClasses = async () => {
        try {
            setLoading(true);
            const res = await axios.get('http://localhost:8000/api/classes');
            setClasses(res.data);
            setLoading(false);
        } catch (err) {
            setError('Erreur lors du chargement des classes');
            setLoading(false);
        }
    };

    const AjouterClasses = async () => {
        if (!newnom_classe.trim()) {
            setError('Le nom de la classe ne peut pas être vide');
            return;
        }
        if (!newcategorie_classe.trim()) {
            setError('La catégorie de la classe ne peut pas être vide');
            return;
        }

        try {
            setLoading(true);
            const res = await axios.post('http://localhost:8000/api/classes/store', {
                nom_classe: newnom_classe,
                categorie_classe: newcategorie_classe
            }, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            setClasses([...classes, res.data]);
            setNewnom_classe('');
            setNewcategorie_classe('');
            setError('');
            setLoading(false);
        } catch (err) {
            const errorMessage = err.response?.data?.message || "Erreur lors de l'ajout";
            const errorDetails = err.response?.data?.errors || err.response?.data?.error || err.message;
            setMessage(`${errorMessage}: ${JSON.stringify(errorDetails)}`);
            setError(true);
            setLoading(false);
        }
    };

    const handleEdit = (classe) => {
        setEditingId(classe.id);
        setEditValue(classe.nom_classe);
        setEditCategorie(classe.categorie_classe);
        setError('');
    };

    const Modification = async (id) => {
        if (!editValue.trim()) {
            setError('Le nom de la classe ne peut pas être vide');
            return;
        }
        if (!editCategorie.trim()) {
            setError('La catégorie de la classe ne peut pas être vide');
            return;
        }

        try {
            setLoading(true);
            const response = await axios.put(`http://localhost:8000/api/classes/update/${id}`, {
                nom_classe: editValue,
                categorie_classe: editCategorie
            });

            // Mise à jour du state local
            setClasses(classes.map(classe =>
                classe.id === id
                    ? { ...classe, nom_classe: editValue, categorie_classe: editCategorie }
                    : classe
            ));

            setMessage('Classe modifiée avec succès');
            setEditingId(null);
            setEditValue('');
            setEditCategorie('');
            setError('');
        } catch (err) {
            console.error('Erreur de modification:', err);
            setError(err.response?.data?.message || 'Erreur lors de la modification');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        setEditingId(null);
        setEditValue('');
        setEditCategorie('');
        setError('');
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette classe ?')) {
            return;
        }

        try {
            setLoading(true);
            await axios.delete(`http://localhost:8000/api/classes/delete/${id}`);
            await fetchClasses();
            setLoading(false);
        } catch (err) {
            setError('Erreur lors de la suppression');
            setLoading(false);
        }
    };

    const toggleSidebar = () => {
        setSidebarOpen(!sidebarOpen);
    };

    const renderContent = () => {
        if (activeTab !== 'matieres') {
            return (
                <div className="section-placeholder">
                    <div className="placeholder-content">
                        <h3 className="placeholder-title">Section {activeTab} en cours de développement</h3>
                        <p className="placeholder-text">Cette fonctionnalité sera disponible prochainement</p>
                    </div>
                </div>
            );
        }

        return (
            <>
                {error && (
                    <div className="error-message">
                        {error}
                    </div>
                )}

                {/* Formulaire d'ajout */}
                <div className="form-container" style={{ marginBottom: '2rem' }}>
                    <h2 style={{ marginBottom: '1.5rem', fontSize: '1.25rem', fontWeight: 'bold' }}>Ajouter une nouvelle classe</h2>
                    <div className="form-group" style={{ flexDirection: 'row', gap: '1rem' }}>
                        <input
                            type="text"
                            value={newnom_classe}
                            onChange={(e) => setNewnom_classe(e.target.value)}
                            placeholder="Nom de la classe"
                            className="form-input"
                            style={{ flex: 1 }}
                            onKeyPress={(e) => e.key === 'Enter' && AjouterClasses()}
                        />
                        <select
                            value={newcategorie_classe}
                            onChange={(e) => setNewcategorie_classe(e.target.value)}
                            className="form-select"
                            style={{ flex: 1 }}
                            onKeyPress={(e) => e.key === 'Enter' && AjouterClasses()}
                        >
                            <option value="">Choisir une catégorie</option>
                            <option value="maternelle">Maternelle</option>
                            <option value="primaire">Primaire</option>
                            <option value="secondaire">Secondaire</option>
                        </select>
                        <button
                            onClick={AjouterClasses}
                            disabled={loading}
                            className="btn btn-primary"
                        >
                            <Plus size={18} />
                            Ajouter
                        </button>
                    </div>
                </div>

                {/* Liste des classes */}
                <div>
                    <h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem', fontWeight: 'bold' }}>Liste des Classes</h2>

                    {loading && classes.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                            Chargement des classes...
                        </div>
                    ) : classes.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                            Aucune classe trouvée. Ajoutez-en une ci-dessus.
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                            {classes.map((classe) => (
                                <div key={classe.id} className="card">
                                    <div className="card-body">
                                        <div className="matiere-details">
                                            {editingId === classe.id ? (
                                                <div className="form-grid">
                                                    <input
                                                        type="text"
                                                        value={editValue}
                                                        onChange={(e) => setEditValue(e.target.value)}
                                                        className="form-input"
                                                        onKeyPress={(e) => e.key === 'Enter' && Modification(classe.id)}
                                                        autoFocus
                                                    />
                                                    <select
                                                        value={editCategorie}
                                                        onChange={(e) => setEditCategorie(e.target.value)}
                                                        className="form-select"
                                                    >
                                                        <option value="">Choisir une catégorie</option>
                                                        <option value="maternelle">Maternelle</option>
                                                        <option value="primaire">Primaire</option>
                                                        <option value="secondaire">Secondaire</option>
                                                    </select>
                                                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                                                        <button
                                                            onClick={() => Modification(classe.id)}
                                                            disabled={loading}
                                                            className="btn btn-primary"
                                                            title="Sauvegarder"
                                                        >
                                                            <Save size={16} />
                                                        </button>
                                                        <button
                                                            onClick={handleCancel}
                                                            className="btn btn-danger"
                                                            title="Annuler"
                                                        >
                                                            <X size={16} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="matiere-display">
                                                    <div className="matiere-info">
                                                        <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>{classe.nom_classe}</h3>
                                                        <p style={{ color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Catégorie: {classe.categorie_classe}</p>
                                                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>ID: {classe.id}</p>
                                                    </div>
                                                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                                                        <button
                                                            onClick={() => handleEdit(classe)}
                                                            disabled={loading || editingId !== null}
                                                            className="btn btn-icon"
                                                            title="Modifier"
                                                            style={{ color: 'var(--primary)' }}
                                                        >
                                                            <Edit2 size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(classe.id)}
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
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </>
        );
    };

    return (
    return (
        <div className="app-dashboard">
            {/* Sidebar */}
            <div className="sidebar">
                <div className="sidebar-header">
                    <h1 className="sidebar-title">EcoleGestion</h1>
                </div>
                <nav className="sidebar-nav">
                    <button
                        className={`sidebar-link ${activeTab === 'accueil' ? 'active' : ''}`}
                        onClick={() => setActiveTab('accueil')}
                    >
                        <Home size={20} />
                        <span>Accueil</span>
                    </button>
                    <button
                        className={`sidebar-link ${activeTab === 'eleves' ? 'active' : ''}`}
                        onClick={() => setActiveTab('eleves')}
                    >
                        <Users size={20} />
                        <span>Élèves</span>
                    </button>
                    <button
                        className={`sidebar-link ${activeTab === 'matieres' ? 'active' : ''}`}
                        onClick={() => setActiveTab('matieres')}
                    >
                        <Book size={20} />
                        <span>Classes</span>
                    </button>
                    <button
                        className={`sidebar-link ${activeTab === 'calendrier' ? 'active' : ''}`}
                        onClick={() => setActiveTab('calendrier')}
                    >
                        <Calendar size={20} />
                        <span>Calendrier</span>
                    </button>
                    <button
                        className={`sidebar-link ${activeTab === 'personnel' ? 'active' : ''}`}
                        onClick={() => setActiveTab('personnel')}
                    >
                        <User size={20} />
                        <span>Personnel</span>
                    </button>
                    <button
                        className={`sidebar-link ${activeTab === 'parametres' ? 'active' : ''}`}
                        onClick={() => setActiveTab('parametres')}
                    >
                        <Settings size={20} />
                        <span>Paramètres</span>
                    </button>
                    <div className="sidebar-footer">
                        <button className="sidebar-link">
                            <LogOut size={20} />
                            <span>Déconnexion</span>
                        </button>
                    </div>
                </nav>
            </div>

            {/* Main content */}
            <div className="main-content">
                {/* Header */}
                <header className="page-header">
                    <div className="header-content">
                        <h2 className="header-title">
                            {activeTab === 'matieres' ? 'Gestion des Classes' :
                                activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
                        </h2>
                        <div className="header-actions">
                            <button className="btn btn-icon">
                                <Bell size={20} />
                                <span className="notification-badge">4</span>
                            </button>
                            <div className="user-profile">
                                <div className="avatar-circle">A</div>
                                <span className="user-name">Administrateur</span>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Content area */}
                <main className="content-container">
                    {renderContent()}
                </main>
            </div>
        </div>
    );
}