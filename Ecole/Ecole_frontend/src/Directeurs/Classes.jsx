import { useState, useEffect } from 'react';
import './Mes_CSS_directeur/Classe.css';
import axios from 'axios';
import { Edit2, Trash2, Save, X, Plus, Menu, Home, Users, Book, Calendar, User, Settings, LogOut, Bell } from 'lucide-react';

export  function Classe() {
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
        <div className="container">
            <form className="corps" onSubmit={HandleSubmit}>
                <h2 className="H2">Enregistrement d'une classe</h2>
                {message && (
                    <div className={error ? 'error' : 'success'}>
                        {message}
                    </div>
                )}
                <div className="toust">
                    <input
                        type="text"
                        className="tous"
                        name="nom_classe"
                        value={classe.nom_classe}
                        onChange={HandleChange}
                        placeholder="Le Nom de la classe"
                    />
                </div>
                <div className="toust">
                    <select name="categorie_classe" className='tous' value={classe.categorie_classe} onChange={HandleChange}>
                        <option value="">Choisir une catégorie</option>
                        <option value="maternelle">Maternelle</option>
                        <option value="primaire">Primaire</option>
                        <option value="secondaire">Secondaire</option>
                    </select>
                </div>
                <button className="bi" type="submit">Enregistrer</button>
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
            await axios.put(`http://localhost:8000/api/classes/update/${id}`, {
                nom_classe: editValue,
                categorie_classe: editCategorie
            }, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            await fetchClasses();
            setMessage('Classe modifiée avec succès');
            setEditingId(null);
            setEditValue('');
            setEditCategorie('');
            setError('');
            setLoading(false);
        } catch (err) {
            setError('Erreur lors de la modification');
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
                <div className="add-form">
                    <h2 className="form-title">Ajouter une nouvelle classe</h2>
                    <div className="form-controls">
                        <input
                            type="text"
                            value={newnom_classe}
                            onChange={(e) => setNewnom_classe(e.target.value)}
                            placeholder="Nom de la classe"
                            className="input-field"
                            onKeyPress={(e) => e.key === 'Enter' && AjouterClasses()}
                        />
                        <select
                            value={newcategorie_classe}
                            onChange={(e) => setNewcategorie_classe(e.target.value)}
                            className="input-field"
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
                <div className="matieres-list">
                    <div className="list-header">
                        <h2 className="list-title">Liste des Classes</h2>
                    </div>

                    {loading && classes.length === 0 ? (
                        <div className="empty-state">
                            Chargement des classes...
                        </div>
                    ) : classes.length === 0 ? (
                        <div className="empty-state">
                            Aucune classe trouvée. Ajoutez-en une ci-dessus.
                        </div>
                    ) : (
                        <div className="matieres-items">
                            {classes.map((classe) => (
                                <div key={classe.id} className="matiere-item">
                                    <div className="matiere-content">
                                        <div className="matiere-details">
                                            {editingId === classe.id ? (
                                                <div className="edit-form">
                                                    <input
                                                        type="text"
                                                        value={editValue}
                                                        onChange={(e) => setEditValue(e.target.value)}
                                                        className="edit-input"
                                                        onKeyPress={(e) => e.key === 'Enter' && Modification(classe.id)}
                                                        autoFocus
                                                    />
                                                    <select
                                                        value={editCategorie}
                                                        onChange={(e) => setEditCategorie(e.target.value)}
                                                        className="edit-input"
                                                    >
                                                        <option value="">Choisir une catégorie</option>
                                                        <option value="maternelle">Maternelle</option>
                                                        <option value="primaire">Primaire</option>
                                                        <option value="secondaire">Secondaire</option>
                                                    </select>
                                                    <div className="edit-actions">
                                                        <button
                                                            onClick={() => Modification(classe.id)}
                                                            disabled={loading}
                                                            className="btn btn-success"
                                                            title="Sauvegarder"
                                                        >
                                                            <Save size={16} />
                                                        </button>
                                                        <button
                                                            onClick={handleCancel}
                                                            className="btn btn-secondary"
                                                            title="Annuler"
                                                        >
                                                            <X size={16} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="matiere-display">
                                                    <div className="matiere-info">
                                                        <h3 className="matiere-name">{classe.nom_classe}</h3>
                                                        <p className="matiere-categorie">Catégorie: {classe.categorie_classe}</p>
                                                        <p className="matiere-id">ID: {classe.id}</p>
                                                    </div>
                                                    <div className="matiere-actions">
                                                        <button
                                                            onClick={() => handleEdit(classe)}
                                                            disabled={loading || editingId !== null}
                                                            className="btn btn-edit"
                                                            title="Modifier"
                                                        >
                                                            <Edit2 size={16} />
                                                            Modifier
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(classe.id)}
                                                            disabled={loading || editingId !== null}
                                                            className="btn btn-danger"
                                                            title="Supprimer"
                                                        >
                                                            <Trash2 size={16} />
                                                            Supprimer
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
        <div className="app-container">
            {/* Sidebar */}
            <div className={`sidebar ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
                <div className="sidebar-header">
                    {sidebarOpen && <h1 className="sidebar-title">EcoleGestion</h1>}
                    <button onClick={toggleSidebar} className="sidebar-toggle">
                        {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>
                </div>
                <nav className="sidebar-nav">
                    <div
                        className={`nav-item ${activeTab === 'accueil' ? 'nav-item-active' : ''}`}
                        onClick={() => setActiveTab('accueil')}
                    >
                        <Home size={20} />
                        {sidebarOpen && <span className="nav-text">Accueil</span>}
                    </div>
                    <div
                        className={`nav-item ${activeTab === 'eleves' ? 'nav-item-active' : ''}`}
                        onClick={() => setActiveTab('eleves')}
                    >
                        <Users size={20} />
                        {sidebarOpen && <span className="nav-text">Élèves</span>}
                    </div>
                    <div
                        className={`nav-item ${activeTab === 'matieres' ? 'nav-item-active' : ''}`}
                        onClick={() => setActiveTab('matieres')}
                    >
                        <Book size={20} />
                        {sidebarOpen && <span className="nav-text">Classes</span>}
                    </div>
                    <div
                        className={`nav-item ${activeTab === 'calendrier' ? 'nav-item-active' : ''}`}
                        onClick={() => setActiveTab('calendrier')}
                    >
                        <Calendar size={20} />
                        {sidebarOpen && <span className="nav-text">Calendrier</span>}
                    </div>
                    <div
                        className={`nav-item ${activeTab === 'personnel' ? 'nav-item-active' : ''}`}
                        onClick={() => setActiveTab('personnel')}
                    >
                        <User size={20} />
                        {sidebarOpen && <span className="nav-text">Personnel</span>}
                    </div>
                    <div
                        className={`nav-item ${activeTab === 'parametres' ? 'nav-item-active' : ''}`}
                        onClick={() => setActiveTab('parametres')}
                    >
                        <Settings size={20} />
                        {sidebarOpen && <span className="nav-text">Paramètres</span>}
                    </div>
                    <div className="nav-item nav-logout">
                        <LogOut size={20} />
                        {sidebarOpen && <span className="nav-text">Déconnexion</span>}
                    </div>
                </nav>
            </div>

            {/* Main content */}
            <div className="main-content">
                {/* Header */}
                <header className="main-header">
                    <div className="header-content">
                        <h2 className="page-title">
                            {activeTab === 'matieres' ? 'Gestion des Classes' :
                                activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
                        </h2>
                        <div className="header-actions">
                            <div className="notification-wrapper">
                                <button className="notification-btn">
                                    <Bell size={20} />
                                    <span className="notification-badge">4</span>
                                </button>
                            </div>
                            <div className="user-info">
                                <img src="/api/placeholder/40/40" alt="Profile" className="user-avatar" />
                                {sidebarOpen && <span className="user-name">Administrateur</span>}
                            </div>
                        </div>
                    </div>
                </header>

                {/* Content area */}
                <main className="content-area">
                    {renderContent()}
                </main>
            </div>
        </div>
    );
}