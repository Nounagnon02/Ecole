import React, { useState, useEffect } from 'react';
import { 
  FileText, Users, Phone, Calendar, 
  Mail, Plus, Edit2, Eye, Download, 
  Clock, CheckCircle, AlertCircle, Send, MessageSquare
} from 'lucide-react';
import api from '../api';
import Messagerie from '../components/Messagerie';
import NotificationBell from '../components/NotificationBell';
import '../styles/dashboard.css';

const DashboardSecretaire = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [dossiers, setDossiers] = useState([]);
  const [rendezVous, setRendezVous] = useState([]);
  const [courriers, setCourriers] = useState([]);
  const [certificats, setCertificats] = useState([]);
  const [visiteurs, setVisiteurs] = useState([]);
  const [statistiques, setStatistiques] = useState({});

  const [newDossier, setNewDossier] = useState({
    eleve_nom: '',
    eleve_prenom: '',
    classe_id: '',
    type_dossier: '',
    documents: []
  });

  const [newRendezVous, setNewRendezVous] = useState({
    nom_visiteur: '',
    telephone: '',
    motif: '',
    date_rdv: '',
    heure_rdv: '',
    type_visiteur: 'parent'
  });

  const [newCourrier, setNewCourrier] = useState({
    expediteur: '',
    destinataire: '',
    objet: '',
    type: 'entrant',
    date_reception: new Date().toISOString().split('T')[0]
  });

  const [newCertificat, setNewCertificat] = useState({
    eleve_id: '',
    type_certificat: '',
    motif: '',
    date_demande: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchSecretaireData();
  }, []);

  const fetchSecretaireData = async () => {
    try {
      setLoading(true);
      const [dossiersRes, rdvRes, courriersRes, statistiquesRes] = await Promise.all([
        api.get('/secretaire/dossiers'),
        api.get('/secretaire/rendez-vous'),
        api.get('/secretaire/courriers'),
        api.get('/secretaire/statistiques')
      ]);
      
      setDossiers(dossiersRes.data);
      setRendezVous(rdvRes.data);
      setCourriers(courriersRes.data);
      setStatistiques(statistiquesRes.data);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const creerDossier = async () => {
    try {
      await api.post('/dossiers-eleves', newDossier);
      setNewDossier({
        eleve_nom: '',
        eleve_prenom: '',
        classe_id: '',
        type_dossier: '',
        documents: []
      });
      fetchSecretaireData();
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const planifierRendezVous = async () => {
    try {
      await api.post('/rendez-vous', newRendezVous);
      setNewRendezVous({
        nom_visiteur: '',
        telephone: '',
        motif: '',
        date_rdv: '',
        heure_rdv: '',
        type_visiteur: 'parent'
      });
      fetchSecretaireData();
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const enregistrerCourrier = async () => {
    try {
      await api.post('/courriers', newCourrier);
      setNewCourrier({
        expediteur: '',
        destinataire: '',
        objet: '',
        type: 'entrant',
        date_reception: new Date().toISOString().split('T')[0]
      });
      fetchSecretaireData();
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const genererCertificat = async () => {
    try {
      const response = await api.post('/certificats', newCertificat);
      setNewCertificat({
        eleve_id: '',
        type_certificat: '',
        motif: '',
        date_demande: new Date().toISOString().split('T')[0]
      });
      alert('Certificat généré avec succès');
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const marquerVisiteur = async (nom, motif) => {
    try {
      await api.post('/visiteurs', {
        nom_visiteur: nom,
        motif: motif,
        heure_arrivee: new Date().toTimeString().split(' ')[0],
        date_visite: new Date().toISOString().split('T')[0]
      });
      alert('Visiteur enregistré');
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const renderOverview = () => (
    <div className="overview-grid">
      <div className="stat-card">
        <FileText className="stat-icon" />
        <div>
          <h3>Dossiers traités</h3>
          <p>{dossiers.length}</p>
        </div>
      </div>
      <div className="stat-card">
        <Calendar className="stat-icon" />
        <div>
          <h3>RDV aujourd'hui</h3>
          <p>{rendezVous.filter(rdv => rdv.date_rdv === new Date().toISOString().split('T')[0]).length}</p>
        </div>
      </div>
      <div className="stat-card">
        <Mail className="stat-icon" />
        <div>
          <h3>Courriers en attente</h3>
          <p>{courriers.filter(c => c.statut === 'en_attente').length}</p>
        </div>
      </div>
      <div className="stat-card">
        <Users className="stat-icon" />
        <div>
          <h3>Visiteurs aujourd'hui</h3>
          <p>{visiteurs.filter(v => v.date_visite === new Date().toISOString().split('T')[0]).length}</p>
        </div>
      </div>
    </div>
  );

  const renderDossiers = () => (
    <div className="dossiers-section">
      <div className="form-section">
        <h3>Créer un nouveau dossier</h3>
        <div className="form-grid">
          <input
            type="text"
            placeholder="Nom de l'élève"
            value={newDossier.eleve_nom}
            onChange={(e) => setNewDossier({...newDossier, eleve_nom: e.target.value})}
          />

          <input
            type="text"
            placeholder="Prénom de l'élève"
            value={newDossier.eleve_prenom}
            onChange={(e) => setNewDossier({...newDossier, eleve_prenom: e.target.value})}
          />

          <select
            value={newDossier.classe_id}
            onChange={(e) => setNewDossier({...newDossier, classe_id: e.target.value})}
          >
            <option value="">Sélectionner une classe</option>
          </select>

          <select
            value={newDossier.type_dossier}
            onChange={(e) => setNewDossier({...newDossier, type_dossier: e.target.value})}
          >
            <option value="">Type de dossier</option>
            <option value="inscription">Inscription</option>
            <option value="reinscription">Réinscription</option>
            <option value="transfert">Transfert</option>
            <option value="administratif">Administratif</option>
          </select>

          <button onClick={creerDossier} className="btn-primary">
            <Plus size={16} /> Créer
          </button>
        </div>
      </div>

      <div className="dossiers-list">
        <h3>Dossiers récents</h3>
        <table>
          <thead>
            <tr>
              <th>Élève</th>
              <th>Type</th>
              <th>Classe</th>
              <th>Date création</th>
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {dossiers.map(dossier => (
              <tr key={dossier.id}>
                <td>{dossier.eleve_nom} {dossier.eleve_prenom}</td>
                <td>{dossier.type_dossier}</td>
                <td>{dossier.classe_nom}</td>
                <td>{dossier.date_creation}</td>
                <td>
                  <span className={`status ${dossier.statut}`}>
                    {dossier.statut}
                  </span>
                </td>
                <td>
                  <button className="btn-action">
                    <Eye size={16} />
                  </button>
                  <button className="btn-action">
                    <Edit2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderRendezVous = () => (
    <div className="rdv-section">
      <div className="form-section">
        <h3>Planifier un rendez-vous</h3>
        <div className="form-grid">
          <input
            type="text"
            placeholder="Nom du visiteur"
            value={newRendezVous.nom_visiteur}
            onChange={(e) => setNewRendezVous({...newRendezVous, nom_visiteur: e.target.value})}
          />

          <input
            type="tel"
            placeholder="Téléphone"
            value={newRendezVous.telephone}
            onChange={(e) => setNewRendezVous({...newRendezVous, telephone: e.target.value})}
          />

          <select
            value={newRendezVous.type_visiteur}
            onChange={(e) => setNewRendezVous({...newRendezVous, type_visiteur: e.target.value})}
          >
            <option value="parent">Parent</option>
            <option value="fournisseur">Fournisseur</option>
            <option value="partenaire">Partenaire</option>
            <option value="autre">Autre</option>
          </select>

          <textarea
            placeholder="Motif du rendez-vous"
            value={newRendezVous.motif}
            onChange={(e) => setNewRendezVous({...newRendezVous, motif: e.target.value})}
          />

          <input
            type="date"
            value={newRendezVous.date_rdv}
            onChange={(e) => setNewRendezVous({...newRendezVous, date_rdv: e.target.value})}
          />

          <input
            type="time"
            value={newRendezVous.heure_rdv}
            onChange={(e) => setNewRendezVous({...newRendezVous, heure_rdv: e.target.value})}
          />

          <button onClick={planifierRendezVous} className="btn-primary">
            <Plus size={16} /> Planifier
          </button>
        </div>
      </div>

      <div className="rdv-list">
        <h3>Rendez-vous programmés</h3>
        {rendezVous.map(rdv => (
          <div key={rdv.id} className="rdv-card">
            <div className="rdv-header">
              <h4>{rdv.nom_visiteur}</h4>
              <span className="rdv-time">{rdv.date_rdv} à {rdv.heure_rdv}</span>
            </div>
            <p><strong>Type:</strong> {rdv.type_visiteur}</p>
            <p><strong>Motif:</strong> {rdv.motif}</p>
            <p><strong>Téléphone:</strong> {rdv.telephone}</p>
            <div className="rdv-actions">
              <button className="btn-confirm">
                <CheckCircle size={16} /> Confirmer
              </button>
              <button className="btn-edit">
                <Edit2 size={16} /> Modifier
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderCourriers = () => (
    <div className="courriers-section">
      <div className="form-section">
        <h3>Enregistrer un courrier</h3>
        <div className="form-grid">
          <select
            value={newCourrier.type}
            onChange={(e) => setNewCourrier({...newCourrier, type: e.target.value})}
          >
            <option value="entrant">Courrier entrant</option>
            <option value="sortant">Courrier sortant</option>
          </select>

          <input
            type="text"
            placeholder="Expéditeur"
            value={newCourrier.expediteur}
            onChange={(e) => setNewCourrier({...newCourrier, expediteur: e.target.value})}
          />

          <input
            type="text"
            placeholder="Destinataire"
            value={newCourrier.destinataire}
            onChange={(e) => setNewCourrier({...newCourrier, destinataire: e.target.value})}
          />

          <input
            type="text"
            placeholder="Objet"
            value={newCourrier.objet}
            onChange={(e) => setNewCourrier({...newCourrier, objet: e.target.value})}
          />

          <input
            type="date"
            value={newCourrier.date_reception}
            onChange={(e) => setNewCourrier({...newCourrier, date_reception: e.target.value})}
          />

          <button onClick={enregistrerCourrier} className="btn-primary">
            <Plus size={16} /> Enregistrer
          </button>
        </div>
      </div>

      <div className="courriers-list">
        <h3>Courriers récents</h3>
        <table>
          <thead>
            <tr>
              <th>Type</th>
              <th>Expéditeur</th>
              <th>Destinataire</th>
              <th>Objet</th>
              <th>Date</th>
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {courriers.map(courrier => (
              <tr key={courrier.id}>
                <td>
                  <span className={`type ${courrier.type}`}>
                    {courrier.type}
                  </span>
                </td>
                <td>{courrier.expediteur}</td>
                <td>{courrier.destinataire}</td>
                <td>{courrier.objet}</td>
                <td>{courrier.date_reception}</td>
                <td>
                  <span className={`status ${courrier.statut}`}>
                    {courrier.statut}
                  </span>
                </td>
                <td>
                  <button className="btn-action">
                    <Eye size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderCertificats = () => (
    <div className="certificats-section">
      <div className="form-section">
        <h3>Générer un certificat</h3>
        <div className="form-grid">
          <select
            value={newCertificat.eleve_id}
            onChange={(e) => setNewCertificat({...newCertificat, eleve_id: e.target.value})}
          >
            <option value="">Sélectionner un élève</option>
          </select>

          <select
            value={newCertificat.type_certificat}
            onChange={(e) => setNewCertificat({...newCertificat, type_certificat: e.target.value})}
          >
            <option value="">Type de certificat</option>
            <option value="scolarite">Certificat de scolarité</option>
            <option value="presence">Certificat de présence</option>
            <option value="inscription">Certificat d'inscription</option>
            <option value="niveau">Certificat de niveau</option>
          </select>

          <textarea
            placeholder="Motif de la demande"
            value={newCertificat.motif}
            onChange={(e) => setNewCertificat({...newCertificat, motif: e.target.value})}
          />

          <button onClick={genererCertificat} className="btn-primary">
            <Plus size={16} /> Générer
          </button>
        </div>
      </div>

      <div className="certificats-list">
        <h3>Certificats récents</h3>
        {certificats.map(certificat => (
          <div key={certificat.id} className="certificat-card">
            <div className="certificat-header">
              <h4>{certificat.type_certificat}</h4>
              <span className="date">{certificat.date_demande}</span>
            </div>
            <p><strong>Élève:</strong> {certificat.eleve_nom}</p>
            <p><strong>Motif:</strong> {certificat.motif}</p>
            <div className="certificat-actions">
              <button className="btn-download">
                <Download size={16} /> Télécharger
              </button>
              <button className="btn-send">
                <Send size={16} /> Envoyer
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderAccueil = () => (
    <div className="accueil-section">
      <h3>Gestion de l'accueil</h3>
      
      <div className="visiteur-form">
        <h4>Enregistrer un visiteur</h4>
        <div className="form-inline">
          <input type="text" placeholder="Nom du visiteur" id="visiteur-nom" />
          <input type="text" placeholder="Motif de la visite" id="visiteur-motif" />
          <button 
            onClick={() => {
              const nom = document.getElementById('visiteur-nom').value;
              const motif = document.getElementById('visiteur-motif').value;
              marquerVisiteur(nom, motif);
            }}
            className="btn-primary"
          >
            <Plus size={16} /> Enregistrer
          </button>
        </div>
      </div>

      <div className="visiteurs-jour">
        <h4>Visiteurs du jour</h4>
        <table>
          <thead>
            <tr>
              <th>Nom</th>
              <th>Motif</th>
              <th>Heure d'arrivée</th>
              <th>Statut</th>
            </tr>
          </thead>
          <tbody>
            {visiteurs.map(visiteur => (
              <tr key={visiteur.id}>
                <td>{visiteur.nom_visiteur}</td>
                <td>{visiteur.motif}</td>
                <td>{visiteur.heure_arrivee}</td>
                <td>
                  <span className={`status ${visiteur.statut}`}>
                    {visiteur.statut}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="dashboard-secretaire">
      <div className="sidebar">
        <div className="sidebar-header">
          <h2>Espace Secrétaire</h2>
        </div>
        <nav className="sidebar-nav">
          <button 
            className={activeTab === 'overview' ? 'active' : ''}
            onClick={() => setActiveTab('overview')}
          >
            <FileText size={20} /> Aperçu
          </button>
          <button 
            className={activeTab === 'dossiers' ? 'active' : ''}
            onClick={() => setActiveTab('dossiers')}
          >
            <Users size={20} /> Dossiers élèves
          </button>
          <button 
            className={activeTab === 'rdv' ? 'active' : ''}
            onClick={() => setActiveTab('rdv')}
          >
            <Calendar size={20} /> Rendez-vous
          </button>
          <button 
            className={activeTab === 'courriers' ? 'active' : ''}
            onClick={() => setActiveTab('courriers')}
          >
            <Mail size={20} /> Courriers
          </button>
          <button 
            className={activeTab === 'certificats' ? 'active' : ''}
            onClick={() => setActiveTab('certificats')}
          >
            <FileText size={20} /> Certificats
          </button>
          <button 
            className={activeTab === 'accueil' ? 'active' : ''}
            onClick={() => setActiveTab('accueil')}
          >
            <Phone size={20} /> Accueil
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
          <h1>Dashboard Secrétaire</h1>
          <div className="header-actions">
            <NotificationBell userId={localStorage.getItem('userId')} />
          </div>
        </header>

        <main className="content-area">
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'dossiers' && renderDossiers()}
          {activeTab === 'rdv' && renderRendezVous()}
          {activeTab === 'courriers' && renderCourriers()}
          {activeTab === 'certificats' && renderCertificats()}
          {activeTab === 'accueil' && renderAccueil()}
          {activeTab === 'messages' && <Messagerie userId={localStorage.getItem('userId')} userName={localStorage.getItem('userName') || 'Secrétaire'} />}
        </main>
      </div>
    </div>
  );
};

export default DashboardSecretaire;