import React, { useState, useEffect } from 'react';
import { 
  BookOpen, Users, Calendar, Search, 
  Plus, Edit2, Eye, Trash2, Clock, 
  Award, TrendingUp, FileText, Download, MessageSquare
} from 'lucide-react';
import api from '../api';
import Messagerie from '../components/Messagerie';
import NotificationBell from '../components/NotificationBell';
import '../styles/dashboard.css';

const DashboardBibliothecaire = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [livres, setLivres] = useState([]);
  const [emprunts, setEmprunts] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [statistiques, setStatistiques] = useState({});
  const [animations, setAnimations] = useState([]);

  const [newLivre, setNewLivre] = useState({
    titre: '',
    auteur: '',
    isbn: '',
    categorie: '',
    editeur: '',
    annee_publication: '',
    nombre_exemplaires: 1
  });

  const [newEmprunt, setNewEmprunt] = useState({
    eleve_id: '',
    livre_id: '',
    date_emprunt: new Date().toISOString().split('T')[0],
    date_retour_prevue: ''
  });

  const [newAnimation, setNewAnimation] = useState({
    titre: '',
    description: '',
    date_animation: '',
    type: '',
    public_cible: ''
  });

  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchBibliothequeData();
  }, []);

  const fetchBibliothequeData = async () => {
    try {
      setLoading(true);
      const [livresRes, empruntsRes, statistiquesRes] = await Promise.all([
        api.get('/bibliotheque/livres'),
        api.get('/bibliotheque/emprunts'),
        api.get('/bibliotheque/statistiques')
      ]);
      
      setLivres(livresRes.data);
      setEmprunts(empruntsRes.data);
      setStatistiques(statistiquesRes.data);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const ajouterLivre = async () => {
    try {
      await api.post('/bibliotheque/livres', newLivre);
      setNewLivre({
        titre: '',
        auteur: '',
        isbn: '',
        categorie: '',
        editeur: '',
        annee_publication: '',
        nombre_exemplaires: 1
      });
      fetchBibliothequeData();
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const enregistrerEmprunt = async () => {
    try {
      await api.post('/bibliotheque/emprunts', newEmprunt);
      setNewEmprunt({
        eleve_id: '',
        livre_id: '',
        date_emprunt: new Date().toISOString().split('T')[0],
        date_retour_prevue: ''
      });
      fetchBibliothequeData();
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const retournerLivre = async (empruntId) => {
    try {
      await api.put(`/bibliotheque/emprunts/${empruntId}/retour`);
      fetchBibliothequeData();
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const prolongerEmprunt = async (empruntId) => {
    try {
      await api.put(`/bibliotheque/emprunts/${empruntId}/prolonger`);
      fetchBibliothequeData();
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const ajouterAnimation = async () => {
    try {
      await api.post('/bibliotheque/animations', newAnimation);
      setNewAnimation({
        titre: '',
        description: '',
        date_animation: '',
        type: '',
        public_cible: ''
      });
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const filteredLivres = livres.filter(livre =>
    livre.titre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    livre.auteur.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderOverview = () => (
    <div className="overview-grid">
      <div className="stat-card">
        <BookOpen className="stat-icon" />
        <div>
          <h3>Total livres</h3>
          <p>{statistiques.total_livres || 0}</p>
        </div>
      </div>
      <div className="stat-card">
        <Users className="stat-icon" />
        <div>
          <h3>Emprunts en cours</h3>
          <p>{emprunts.filter(e => e.statut === 'en_cours').length}</p>
        </div>
      </div>
      <div className="stat-card">
        <Clock className="stat-icon" />
        <div>
          <h3>Retards</h3>
          <p>{emprunts.filter(e => e.en_retard).length}</p>
        </div>
      </div>
      <div className="stat-card">
        <TrendingUp className="stat-icon" />
        <div>
          <h3>Fréquentation mensuelle</h3>
          <p>{statistiques.frequentation_mois || 0}</p>
        </div>
      </div>
    </div>
  );

  const renderCatalogue = () => (
    <div className="catalogue-section">
      <div className="catalogue-header">
        <h3>Catalogue des livres</h3>
        <div className="search-bar">
          <Search size={20} />
          <input
            type="text"
            placeholder="Rechercher un livre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="form-section">
        <h4>Ajouter un nouveau livre</h4>
        <div className="form-grid">
          <input
            type="text"
            placeholder="Titre"
            value={newLivre.titre}
            onChange={(e) => setNewLivre({...newLivre, titre: e.target.value})}
          />

          <input
            type="text"
            placeholder="Auteur"
            value={newLivre.auteur}
            onChange={(e) => setNewLivre({...newLivre, auteur: e.target.value})}
          />

          <input
            type="text"
            placeholder="ISBN"
            value={newLivre.isbn}
            onChange={(e) => setNewLivre({...newLivre, isbn: e.target.value})}
          />

          <select
            value={newLivre.categorie}
            onChange={(e) => setNewLivre({...newLivre, categorie: e.target.value})}
          >
            <option value="">Catégorie</option>
            <option value="roman">Roman</option>
            <option value="science">Science</option>
            <option value="histoire">Histoire</option>
            <option value="mathematiques">Mathématiques</option>
            <option value="litterature">Littérature</option>
          </select>

          <input
            type="text"
            placeholder="Éditeur"
            value={newLivre.editeur}
            onChange={(e) => setNewLivre({...newLivre, editeur: e.target.value})}
          />

          <input
            type="number"
            placeholder="Année de publication"
            value={newLivre.annee_publication}
            onChange={(e) => setNewLivre({...newLivre, annee_publication: e.target.value})}
          />

          <input
            type="number"
            placeholder="Nombre d'exemplaires"
            value={newLivre.nombre_exemplaires}
            onChange={(e) => setNewLivre({...newLivre, nombre_exemplaires: e.target.value})}
          />

          <button onClick={ajouterLivre} className="btn-primary">
            <Plus size={16} /> Ajouter
          </button>
        </div>
      </div>

      <div className="livres-grid">
        {filteredLivres.map(livre => (
          <div key={livre.id} className="livre-card">
            <div className="livre-header">
              <h4>{livre.titre}</h4>
              <span className={`disponibilite ${livre.disponible ? 'disponible' : 'indisponible'}`}>
                {livre.disponible ? 'Disponible' : 'Emprunté'}
              </span>
            </div>
            <div className="livre-details">
              <p><strong>Auteur:</strong> {livre.auteur}</p>
              <p><strong>Catégorie:</strong> {livre.categorie}</p>
              <p><strong>ISBN:</strong> {livre.isbn}</p>
              <p><strong>Exemplaires:</strong> {livre.exemplaires_disponibles}/{livre.nombre_exemplaires}</p>
            </div>
            <div className="livre-actions">
              <button className="btn-view">
                <Eye size={16} />
              </button>
              <button className="btn-edit">
                <Edit2 size={16} />
              </button>
              <button className="btn-delete">
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderEmprunts = () => (
    <div className="emprunts-section">
      <div className="form-section">
        <h3>Nouvel emprunt</h3>
        <div className="form-grid">
          <select
            value={newEmprunt.eleve_id}
            onChange={(e) => setNewEmprunt({...newEmprunt, eleve_id: e.target.value})}
          >
            <option value="">Sélectionner un élève</option>
          </select>

          <select
            value={newEmprunt.livre_id}
            onChange={(e) => setNewEmprunt({...newEmprunt, livre_id: e.target.value})}
          >
            <option value="">Sélectionner un livre</option>
            {livres.filter(l => l.disponible).map(livre => (
              <option key={livre.id} value={livre.id}>
                {livre.titre} - {livre.auteur}
              </option>
            ))}
          </select>

          <input
            type="date"
            value={newEmprunt.date_retour_prevue}
            onChange={(e) => setNewEmprunt({...newEmprunt, date_retour_prevue: e.target.value})}
          />

          <button onClick={enregistrerEmprunt} className="btn-primary">
            <Plus size={16} /> Enregistrer
          </button>
        </div>
      </div>

      <div className="emprunts-list">
        <h3>Emprunts en cours</h3>
        <table>
          <thead>
            <tr>
              <th>Élève</th>
              <th>Livre</th>
              <th>Date emprunt</th>
              <th>Retour prévu</th>
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {emprunts.map(emprunt => (
              <tr key={emprunt.id} className={emprunt.en_retard ? 'retard' : ''}>
                <td>{emprunt.eleve_nom}</td>
                <td>{emprunt.livre_titre}</td>
                <td>{emprunt.date_emprunt}</td>
                <td>{emprunt.date_retour_prevue}</td>
                <td>
                  <span className={`status ${emprunt.statut}`}>
                    {emprunt.en_retard ? 'En retard' : emprunt.statut}
                  </span>
                </td>
                <td>
                  <button 
                    onClick={() => retournerLivre(emprunt.id)}
                    className="btn-return"
                  >
                    Retour
                  </button>
                  <button 
                    onClick={() => prolongerEmprunt(emprunt.id)}
                    className="btn-extend"
                  >
                    Prolonger
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderReservations = () => (
    <div className="reservations-section">
      <h3>Réservations</h3>
      <div className="reservations-list">
        {reservations.map(reservation => (
          <div key={reservation.id} className="reservation-card">
            <div className="reservation-header">
              <h4>{reservation.livre_titre}</h4>
              <span className="date">{reservation.date_reservation}</span>
            </div>
            <p><strong>Élève:</strong> {reservation.eleve_nom}</p>
            <p><strong>Classe:</strong> {reservation.classe}</p>
            <div className="reservation-actions">
              <button className="btn-confirm">Confirmer</button>
              <button className="btn-cancel">Annuler</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderAnimations = () => (
    <div className="animations-section">
      <div className="form-section">
        <h3>Nouvelle animation</h3>
        <div className="form-grid">
          <input
            type="text"
            placeholder="Titre de l'animation"
            value={newAnimation.titre}
            onChange={(e) => setNewAnimation({...newAnimation, titre: e.target.value})}
          />

          <textarea
            placeholder="Description"
            value={newAnimation.description}
            onChange={(e) => setNewAnimation({...newAnimation, description: e.target.value})}
          />

          <input
            type="date"
            value={newAnimation.date_animation}
            onChange={(e) => setNewAnimation({...newAnimation, date_animation: e.target.value})}
          />

          <select
            value={newAnimation.type}
            onChange={(e) => setNewAnimation({...newAnimation, type: e.target.value})}
          >
            <option value="">Type d'animation</option>
            <option value="lecture">Lecture</option>
            <option value="exposition">Exposition</option>
            <option value="concours">Concours</option>
            <option value="atelier">Atelier</option>
          </select>

          <select
            value={newAnimation.public_cible}
            onChange={(e) => setNewAnimation({...newAnimation, public_cible: e.target.value})}
          >
            <option value="">Public cible</option>
            <option value="maternelle">Maternelle</option>
            <option value="primaire">Primaire</option>
            <option value="secondaire">Secondaire</option>
            <option value="tous">Tous niveaux</option>
          </select>

          <button onClick={ajouterAnimation} className="btn-primary">
            <Plus size={16} /> Programmer
          </button>
        </div>
      </div>

      <div className="animations-list">
        <h3>Animations programmées</h3>
        {animations.map(animation => (
          <div key={animation.id} className="animation-card">
            <h4>{animation.titre}</h4>
            <p>{animation.description}</p>
            <div className="animation-meta">
              <span>Date: {animation.date_animation}</span>
              <span>Type: {animation.type}</span>
              <span>Public: {animation.public_cible}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderStatistiques = () => (
    <div className="statistiques-section">
      <h3>Statistiques de la bibliothèque</h3>
      <div className="stats-grid">
        <div className="stat-card">
          <h4>Livres les plus empruntés</h4>
          <div className="top-livres">
            {statistiques.livres_populaires?.map((livre, index) => (
              <div key={index} className="livre-populaire">
                <span>{livre.titre}</span>
                <span className="count">{livre.emprunts} emprunts</span>
              </div>
            ))}
          </div>
        </div>

        <div className="stat-card">
          <h4>Fréquentation par mois</h4>
          <div className="frequentation-chart">
            {/* Ici vous pourriez ajouter un graphique */}
            <p>Graphique de fréquentation</p>
          </div>
        </div>

        <div className="stat-card">
          <h4>Catégories populaires</h4>
          <div className="categories-stats">
            {statistiques.categories_populaires?.map((cat, index) => (
              <div key={index} className="categorie-stat">
                <span>{cat.nom}</span>
                <span className="pourcentage">{cat.pourcentage}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="dashboard-bibliothecaire">
      <div className="sidebar">
        <div className="sidebar-header">
          <h2>Espace Bibliothécaire</h2>
        </div>
        <nav className="sidebar-nav">
          <button 
            className={activeTab === 'overview' ? 'active' : ''}
            onClick={() => setActiveTab('overview')}
          >
            <BookOpen size={20} /> Aperçu
          </button>
          <button 
            className={activeTab === 'catalogue' ? 'active' : ''}
            onClick={() => setActiveTab('catalogue')}
          >
            <FileText size={20} /> Catalogue
          </button>
          <button 
            className={activeTab === 'emprunts' ? 'active' : ''}
            onClick={() => setActiveTab('emprunts')}
          >
            <Users size={20} /> Emprunts
          </button>
          <button 
            className={activeTab === 'reservations' ? 'active' : ''}
            onClick={() => setActiveTab('reservations')}
          >
            <Clock size={20} /> Réservations
          </button>
          <button 
            className={activeTab === 'animations' ? 'active' : ''}
            onClick={() => setActiveTab('animations')}
          >
            <Calendar size={20} /> Animations
          </button>
          <button 
            className={activeTab === 'statistiques' ? 'active' : ''}
            onClick={() => setActiveTab('statistiques')}
          >
            <TrendingUp size={20} /> Statistiques
          </button>
          <button 
            className={activeTab === 'messages' ? 'active' : ''}
            onClick={() => setActiveTab('messages')}
          >
            <MessageSquare size={20} /> Messages
          </button>
        </nav>
      </div>

      <div className="main-content">
        <header className="main-header">
          <h1>Dashboard Bibliothécaire</h1>
          <div className="header-actions">
            <NotificationBell userId={localStorage.getItem('userId')} />
          </div>
        </header>

        <main className="content-area">
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'catalogue' && renderCatalogue()}
          {activeTab === 'emprunts' && renderEmprunts()}
          {activeTab === 'reservations' && renderReservations()}
          {activeTab === 'animations' && renderAnimations()}
          {activeTab === 'statistiques' && renderStatistiques()}
          {activeTab === 'messages' && <Messagerie userId={localStorage.getItem('userId')} userName={localStorage.getItem('userName') || 'Bibliothécaire'} />}
        </main>
      </div>
    </div>
  );
};

export default DashboardBibliothecaire;