import React, { useState, useEffect } from 'react';
import { 
  User, 
  BookOpen, 
  Calendar, 
  MessageSquare, 
  CreditCard, 
  Bell, 
  TrendingUp,
  Clock,
  Award,
  AlertCircle,
  CheckCircle,
  Users,
  FileText,
  DollarSign,
  RefreshCw
} from 'lucide-react';
import './Mes_CSS_parent/dashboard_parent.css';
import axios from 'axios';
import  jsPDF  from "jspdf";
//import autoTable from  'jspdf-autotable';
import  'jspdf-autotable';
import { useNavigate } from 'react-router-dom'; // Ajoute ceci en haut

const ParentDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [parentData, setParentData] = useState(null);
  const [children, setChildren] = useState([]);
  const [bulletins, setBulletins] = useState({});
  const [bulletinLoading, setBulletinLoading] = useState({});
  const [bulletinErrors, setBulletinErrors] = useState({});
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedChild, setSelectedChild] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [currentPeriode, setCurrentPeriode] = useState('Semestre 1');
  const [debugMode, setDebugMode] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const navigate = useNavigate(); // Ajoute ceci dans ParentDashboard

  // Données mockées pour les absences
  const absences = 
  {
    1: [
      { date: "2025-05-28", reason: "Maladie", justified: true },
      { date: "2025-05-15", reason: "Rendez-vous médical", justified: true }
    ],
    2: [
      { date: "2025-05-20", reason: "Maladie", justified: true }
    ]
  };

  const payments = [
    { id: 1, description: "Frais de scolarité - Mai 2025", amount: 250, status: "Payé", date: "2025-05-01" },
    { id: 2, description: "Cantine - Mai 2025", amount: 85, status: "Payé", date: "2025-05-01" },
    { id: 3, description: "Frais de scolarité - Juin 2025", amount: 250, status: "En attente", date: "2025-06-01" },
    { id: 4, description: "Sortie pédagogique", amount: 35, status: "En attente", date: "2025-06-15" }
  ];

  const messages = [
    {
      id: 1,
      from: "M. Martin - Professeur de Mathématiques",
      subject: "Contrôle de mathématiques",
      date: "2025-06-03",
      content: "Bonjour, je vous informe qu'Antoine a obtenu une excellente note au dernier contrôle.",
      read: false
    },
    {
      id: 2,
      from: "Administration",
      subject: "Réunion parents-professeurs",
      date: "2025-06-01",
      content: "La réunion parents-professeurs aura lieu le 15 juin à 18h00.",
      read: true
    }
  ];

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    const handleClick = (e) => {
      if (!e.target.closest('.profile-container')) setShowProfileMenu(false);
    };
    if (showProfileMenu) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showProfileMenu]);

  // Fonction utilitaire pour récupérer l'ID parent
  const getParentId = () => {
    const possibleKeys = ['parentId', 'userId', 'user_id', 'id'];

    // 1. Vérifie dans les clés simples
    for (const key of possibleKeys) {
      const id = localStorage.getItem(key) || sessionStorage.getItem(key);
      if (id) {
        console.log(`ID trouvé avec la clé ${key}:`, id);
        return id;
      }
    }

    // 2. Vérifie si un objet user est stocké
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        const userObj = JSON.parse(userStr);
        if (userObj.id) {
          console.log("ID trouvé dans l'objet user:", userObj.id);
          return userObj.id;
        }
      } catch (e) {
        console.error("Erreur de parsing JSON sur 'user':", e);
      }
    }

    // 3. Affiche tout pour debug
    console.log("Contenu complet du localStorage:");
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      console.log(`${key}: ${localStorage.getItem(key)}`);
    }

    return null;
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const parentId = getParentId();

      if (!parentId) {
        console.error("Aucun ID parent trouvé dans le stockage");
        throw new Error("Session expirée. Veuillez vous reconnecter.");
      }

      console.log("ID parent utilisé pour la requête:", parentId);
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error("Token d'authentification manquant");
      }

      const response = await axios.get(`http://localhost:8000/api/parents/${parentId}/dashboard`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log("Réponse complète du serveur:", response);

      if (!response.data.success) {
        throw new Error(response.data.message || "Erreur inconnue du serveur");
      }

      setParentData(response.data.data.parent);
      setChildren(response.data.data.children || []);

      // Chargement séquentiel des bulletins pour éviter les conflits
      if (response.data.data.children?.length > 0) {
        for (const child of response.data.data.children) {
          await fetchChildBulletin(child.id, parentId, currentPeriode);
        }
      }

    } catch (err) {
      console.error('Erreur détaillée:', {
        message: err.message,
        response: err.response,
        stack: err.stack
      });
      
      setError(err.response?.data?.message || err.message || 'Erreur lors du chargement des données');
      
      if (err.response?.status === 401 || err.message.includes("reconnecter")) {
        localStorage.clear();
        sessionStorage.clear();
        window.location.href = '/Connexion';
      }
    } finally {
      setLoading(false);
    }
  };

  // Fonction améliorée pour récupérer le bulletin d'un enfant
const fetchChildBulletin = async (childId, parentId, periode = currentPeriode) => {
    try {
        setBulletinLoading(prev => ({ ...prev, [childId]: true }));
        setBulletinErrors(prev => ({ ...prev, [childId]: null }));
        
        const token = localStorage.getItem('token');
        
        const response = await axios.get(
            `http://localhost:8000/api/eleves/${childId}/bulletin`,
            { 
                params: { periode },
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        console.log("PASS1");
        console.log("Réponse du serveur pour le bulletin:", response.data); 

        if (response.data?.success) {
            setBulletins(prev => ({
                ...prev,
                [childId]: {
                    ...response.data.data,
                    periode: periode
                }
            }));
        } else {
            throw new Error(response.data?.message || 'Données de bulletin invalides');
        }
    } catch (err) {
        console.error("Détails de l'erreur:", err.response?.data);
        const errorMessage = err.response?.data?.message || 
                          err.response?.data?.exception?.message || 
                          err.message || 
                          'Erreur lors du chargement du bulletin';
        setBulletinErrors(prev => ({ ...prev, [childId]: errorMessage }));
    } finally {
        setBulletinLoading(prev => ({ ...prev, [childId]: false }));
    }
};


  // Fonction pour débugger un élève
  const debugEleve = async (childId) => {
    try {
      const parentId = getParentId();
      const token = localStorage.getItem('token');
      
      const response = await axios.get(
        `http://localhost:8000/api/bulletin/debug/${childId}`,
        { 
          params: { periode: currentPeriode },
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log(`Debug élève ${childId}:`, response.data);
      alert(`Debug pour l'élève ${childId} - Voir console pour détails`);
    } catch (err) {
      console.error(`Erreur debug élève ${childId}:`, err);
    }
  };

/*const generateBulletinPDF = () => {

  
  const child = children[selectedChild];
  const bulletin = bulletins[child.id];
  const isLoading = bulletinLoading[child.id];
  const error = bulletinErrors[child.id];

  const formatNumber = (num) => {
    if (num === null || num === undefined) return 'N/A';
    return typeof num === 'number' ? num.toFixed(2) : num;
  };
  if (!bulletin || !child) return;

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Styles
  const mainColor = [44, 62, 80]; // Couleur bleu foncé
  const secondaryColor = [231, 76, 60]; // Couleur rouge

  // En-tête avec logo et informations
  doc.setFontSize(16);
  doc.setTextColor(...mainColor);
  doc.setFont("helvetica", "bold");
  doc.text("COMPLEXE SCOLAIRE JACQUES-WILLIAM 1er", pageWidth / 2, 20, { align: 'center' });
  
  doc.setFontSize(12);
  doc.setTextColor(100);
  doc.setFont("helvetica", "normal");
  doc.text("Établissement d'enseignement général, technique et professionnel", pageWidth / 2, 28, { align: 'center' });
  
  // Ligne séparatrice
  doc.setDrawColor(...mainColor);
  doc.setLineWidth(0.5);
  doc.line(15, 35, pageWidth - 15, 35);

  // Informations élève
  doc.setFontSize(12);
  doc.setTextColor(0);
  doc.setFont("helvetica", "bold");
  doc.text("ÉLÈVE", 20, 45);
  
  doc.setFont("helvetica", "normal");
  doc.text(`Nom : ${child.lastName || 'N/A'}`, 20, 55);
  doc.text(`Prénom : ${child.name}`, 20, 65);
  doc.text(`Date de naissance : ${child.birthDate || 'N/A'}`, 20, 75);
  doc.text(`Classe : ${child.class}`, 100, 55);
  doc.text(`Année scolaire : 2024-2025`, 100, 65);

  // Titre bulletin
  doc.setFontSize(14);
  doc.setTextColor(...secondaryColor);
  doc.setFont("helvetica", "bold");
  doc.text(`BULLETIN DE NOTES DU ${currentPeriode.toUpperCase()}`, pageWidth / 2, 90, { align: 'center' });

  // Tableau des notes
  const notesHeaders = [
    "Matières",
    "Coef",
    "Devoir 1",
    "Devoir 2",
    "Moyenne des interrogations",
    "Moyenne dans la matieres",
    "Moyenne Pondérée"
  ];

  const notesData = bulletin.moyennes_par_matiere.map(matiere => [
    matiere.matiere,
    matiere.coefficient,
    formatNumber(matiere.details.devoir1),
    formatNumber(matiere.details.devoir2),
    formatNumber(matiere.details.moyenne_interrogations),
    formatNumber(matiere.moyenne),
    formatNumber(matiere.moyenne_ponderee)
  ]);

  doc.autoTable({
    startY: 100,
    head: [notesHeaders],
    body: notesData,
    margin: { left: 15 },
    styles: {
      fontSize: 8,
      cellPadding: 2,
      valign: 'middle',
    },
    headStyles: {
      fillColor: mainColor,
      textColor: [255, 255, 255],
      fontStyle: 'bold'
    },
    columnStyles: {
      0: { cellWidth: 40 }, // Matière
      1: { cellWidth: 10 }, // Coef
      2: { cellWidth: 20 }, // Note1
      3: { cellWidth: 20 }, // Note2
      4: { cellWidth: 30 }, // Note3
      5: { cellWidth: 30 }, // Moy
      6: { cellWidth: 15 }  // Moy. Pond
    },
    didDrawCell: (data) => {
      // Colorer les notes en fonction de leur valeur
      if (data.column.index >= 2 && data.column.index <= 5) {
        const note = parseFloat(data.cell.raw);
        if (!isNaN(note)) {
          if (note < 10) {
            doc.setTextColor(231, 76, 60); // Rouge
          } else if (note < 12) {
            doc.setTextColor(230, 126, 34); // Orange
          } else {
            doc.setTextColor(39, 174, 96); // Vert
          }
        }
      }
    }
  });

  // Totaux et rang
  const finalY = doc.lastAutoTable.finalY + 10;
  
  doc.setFontSize(10);
  doc.setTextColor(0);
  doc.setFont("helvetica", "bold");
  doc.text("TOTAUX", 20, finalY);
  
  doc.setFont("helvetica", "normal");
  doc.text(`Moyenne Générale: ${formatNumber(bulletin.moyenne_generale)}`, 20, finalY + 10);
  doc.text(`Rang: ${bulletin.rang?.position ? `${bulletin.rang.position}/${bulletin.rang.total_eleves}` : 'N/A'}`, 20, finalY + 20);

  // Appréciations
  doc.setFont("helvetica", "bold");
  doc.text("APPRÉCIATIONS", 100, finalY);
  
  doc.setFont("helvetica", "normal");
  doc.text("Conduite: Très bien", 100, finalY + 10);
  doc.text("Travail: Satisfaisant", 100, finalY + 20);
  doc.text("Observations:", 100, finalY + 30);
  doc.text("Élève sérieux et appliqué", 100, finalY + 40);

  // Pied de page
  doc.setFontSize(8);
  doc.setTextColor(100);
  doc.text("Fait à Cotonou, le " + new Date().toLocaleDateString(), 20, 280);
  doc.text("Le Directeur", pageWidth - 40, 280, { align: 'right' });

  // Signature
  doc.setLineWidth(0.5);
  doc.line(pageWidth - 40, 285, pageWidth - 10, 285);

  // Enregistrement du PDF
  doc.save(`Bulletin_${child.name}_${currentPeriode.replace(' ', '_')}.pdf`);
};*/

const generateBulletinPDF = () => {
  const child = children[selectedChild];
  const bulletin = bulletins[child.id];
  const categorie = getCategorieClasse(child);

  const formatNumber = (num) => {
    if (num === null || num === undefined) return 'N/A';
    return typeof num === 'number' ? num.toFixed(2) : num;
  };
  if (!bulletin || !child) return;

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Styles
  const mainColor = [44, 62, 80];
  const secondaryColor = [231, 76, 60];

  // En-tête
  doc.setFontSize(16);
  doc.setTextColor(...mainColor);
  doc.setFont("helvetica", "bold");
  doc.text("COMPLEXE SCOLAIRE JACQUES-WILLIAM 1er", pageWidth / 2, 20, { align: 'center' });

  doc.setFontSize(12);
  doc.setTextColor(100);
  doc.setFont("helvetica", "normal");
  doc.text("Établissement d'enseignement général, technique et professionnel", pageWidth / 2, 28, { align: 'center' });

  // Ligne séparatrice
  doc.setDrawColor(...mainColor);
  doc.setLineWidth(0.5);
  doc.line(15, 35, pageWidth - 15, 35);

  // Cadre pour la photo d'identité (en haut à droite)
  doc.setDrawColor(150);
  doc.rect(pageWidth - 40, 40, 25, 30); // x, y, largeur, hauteur
  doc.setFontSize(8);
  doc.text("Photo", pageWidth - 27, 57, { align: 'center' });

  // Informations élève
  doc.setFontSize(12);
  doc.setTextColor(0);
  doc.setFont("helvetica", "bold");
  doc.text("ÉLÈVE", 20, 45);

  doc.setFont("helvetica", "normal");
  doc.text(`Nom : ${child.lastName || 'N/A'}`, 20, 55);
  doc.text(`Prénom : ${child.name}`, 20, 65);
  doc.text(`Date de naissance : ${child.birthDate || 'N/A'}`, 20, 75);
  doc.text(`Classe : ${child.class}`, 100, 55);
  doc.text(`Année scolaire : 2024-2025`, 100, 65);

  // Titre bulletin
  doc.setFontSize(14);
  doc.setTextColor(...secondaryColor);
  doc.setFont("helvetica", "bold");
  doc.text(`BULLETIN DE NOTES DU ${currentPeriode.toUpperCase()}`, pageWidth / 2, 90, { align: 'center' });

  let finalY = 100;

  // ----------- Maternelle -----------
  if (categorie === 'maternelle' && bulletin.evaluations) {
    const evalHeaders = ["Matière", ...bulletin.evaluations[0]?.evaluations.map(e => e.type) || []];
    const evalBody = bulletin.evaluations.map(matiere => [
      matiere.matiere,
      ...matiere.evaluations.map(evalItem =>
        `${formatNumber(evalItem.note)}\nRang: ${evalItem.rang?.position ? `${evalItem.rang.position}/${evalItem.rang.total_eleves}` : 'N/A'}`
      )
    ]);
    doc.autoTable({
      startY: finalY,
      head: [evalHeaders],
      body: evalBody,
      margin: { left: 15 },
      styles: { fontSize: 8, cellPadding: 2, valign: 'middle' },
      headStyles: { fillColor: mainColor, textColor: [255, 255, 255], fontStyle: 'bold' }
    });
    finalY = doc.lastAutoTable.finalY + 10;
  }

  // ----------- Primaire -----------
  else if (categorie === 'primaire' && bulletin.evaluations) {
    const evalHeaders = ["Matière", ...bulletin.evaluations[0]?.evaluations.map(e => e.type) || []];
    const evalBody = bulletin.evaluations.map(matiere => [
      matiere.matiere,
      ...matiere.evaluations.map(evalItem =>
        `${formatNumber(evalItem.note)}\nRang: ${evalItem.rang?.position ? `${evalItem.rang.position}/${evalItem.rang.total_eleves}` : 'N/A'}`
      )
    ]);
    doc.autoTable({
      startY: finalY,
      head: [evalHeaders],
      body: evalBody,
      margin: { left: 15 },
      styles: { fontSize: 8, cellPadding: 2, valign: 'middle' },
      headStyles: { fillColor: mainColor, textColor: [255, 255, 255], fontStyle: 'bold' }
    });
    finalY = doc.lastAutoTable.finalY + 10;
  }

  // ----------- Secondaire -----------
  else if ((categorie === 'secondaire' || !categorie) && bulletin.moyennes_par_matiere) {
    const notesHeaders = [
      "Matières",
      "Coef",
      "Devoir 1",
      "Devoir 2",
      "Moy. Interros",
      "Moyenne",
      "Moy. Pondérée",
      "Rang matière"
    ];
    const notesData = bulletin.moyennes_par_matiere.map(matiere => [
      matiere.matiere,
      matiere.coefficient,
      formatNumber(matiere.details.devoir1),
      formatNumber(matiere.details.devoir2),
      formatNumber(matiere.details.moyenne_interrogations),
      formatNumber(matiere.moyenne),
      formatNumber(matiere.moyenne_ponderee),
      matiere.rang?.position
        ? `${matiere.rang.position}/${matiere.rang.total_eleves}`
        : 'N/A'
    ]);
    doc.autoTable({
      startY: finalY,
      head: [notesHeaders],
      body: notesData,
      margin: { left: 15 },
      styles: { fontSize: 8, cellPadding: 2, valign: 'middle' },
      headStyles: { fillColor: mainColor, textColor: [255, 255, 255], fontStyle: 'bold' },
      columnStyles: {
        0: { cellWidth: 40 },
        1: { cellWidth: 10 },
        2: { cellWidth: 20 },
        3: { cellWidth: 20 },
        4: { cellWidth: 30 },
        5: { cellWidth: 20 },
        6: { cellWidth: 20 },
        7: { cellWidth: 20 }
      }
    });
    finalY = doc.lastAutoTable.finalY + 10;
  }

  // Totaux et rang général (pour secondaire)
  if (categorie === 'secondaire' || !categorie) {
    doc.setFontSize(10);
    doc.setTextColor(0);
    doc.setFont("helvetica", "bold");
    doc.text("TOTAUX", 20, finalY);

    doc.setFont("helvetica", "normal");
    doc.text(`Moyenne Générale: ${formatNumber(bulletin.moyenne_generale)}`, 20, finalY + 10);
    doc.text(`Rang général: ${bulletin.rang?.position ? `${bulletin.rang.position}/${bulletin.rang.total_eleves}` : 'N/A'}`, 20, finalY + 20);
    finalY += 30;
  }

  // Appréciations
  doc.setFont("helvetica", "bold");
  doc.text("APPRÉCIATIONS", 100, finalY);

  doc.setFont("helvetica", "normal");
  doc.text("Conduite: Très bien", 100, finalY + 10);
  doc.text("Travail: Satisfaisant", 100, finalY + 20);
  doc.text("Observations:", 100, finalY + 30);
  doc.text("Élève sérieux et appliqué", 100, finalY + 40);

  // Pied de page
  doc.setFontSize(8);
  doc.setTextColor(100);
  doc.text("Fait à Cotonou, le " + new Date().toLocaleDateString(), 20, 280);
  doc.text("Le Directeur", pageWidth - 40, 280, { align: 'right' });

  // Signature
  doc.setLineWidth(0.5);
  doc.line(pageWidth - 40, 285, pageWidth - 10, 285);

  // Enregistrement du PDF
  doc.save(`Bulletin_${child.name}_${currentPeriode.replace(' ', '_')}.pdf`);
};

const getCategorieClasse = (child) => {
  // Si la catégorie est déjà dans l'objet child
  if (child.categorie_classe) return child.categorie_classe;
  // Sinon, essayez de la trouver dans la liste des classes
  /*const classe = classes?.find(c => c.id === child.class_id || c.nom_classe === child.class);
  return classe?.categorie_classe || '';*/
};


const renderBulletins = () => {
  if (!children.length) {
    return <div className="no-data">Aucun enfant associé à ce compte</div>;
  }

  const child = children[selectedChild];
  const bulletin = bulletins[child.id];
  const isLoading = bulletinLoading[child.id];
  const error = bulletinErrors[child.id];
  const categorie = getCategorieClasse(child);

  const formatNumber = (num) => {
    if (num === null || num === undefined) return 'N/A';
    return typeof num === 'number' ? num.toFixed(2) : num;
  };

  return (
    <div className="bulletin-container">
      <div className="bulletin-header">
        <h2>Bulletin de {child.name}</h2>
        <p>Classe: {child.class}</p>
        <div className="bulletin-controls">
          <select
            value={currentPeriode}
            onChange={(e) => {
              setCurrentPeriode(e.target.value);
              const parentId = getParentId();
              if (parentId) {
                fetchChildBulletin(child.id, parentId, e.target.value);
              }
            }}
            className="periode-select"
            disabled={isLoading}
          >
            <option value="Semestre 1">Semestre 1</option>
            <option value="Semestre 2">Semestre 2</option>
          </select>

          <button
            onClick={() => {
              const parentId = getParentId();
              if (parentId) fetchChildBulletin(child.id, parentId, currentPeriode);
            }}
            className="refresh-btn"
            disabled={isLoading}
          >
            <RefreshCw className={isLoading ? 'spinning' : ''} />
            Actualiser
          </button>
        </div>
      </div>
      {isLoading ? (
        <div className="bulletin-loading-full">
          <div className="loading-spinner"></div>
          <p>Chargement du bulletin en cours...</p>
        </div>
      ) : error ? (
        <div className="bulletin-error-full">
          <AlertCircle className="error-icon-large" />
          <h3>Erreur de chargement</h3>
          <p>{error}</p>
          <div className="error-actions">
            <button
              onClick={() => {
                const parentId = getParentId();
                if (parentId) fetchChildBulletin(child.id, parentId, currentPeriode);
              }}
              className="retry-button"
            >
              Réessayer
            </button>
            <button
              onClick={() => debugEleve(child.id)}
              className="debug-btn"
            >
              Debug élève
            </button>
          </div>
        </div>
      ) : bulletin ? (
        <>
          {categorie === 'maternelle' && bulletin.evaluations ? (
            <div className="notes-table">
              <table>
                <thead>
                  <tr>
                    <th>Matière</th>
                    {bulletin.evaluations[0]?.evaluations.map((e, i) => (
                      <th key={i}>{e.type}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {bulletin.evaluations.map((matiere, idx) => (
                    <tr key={idx}>
                      <td>{matiere.matiere}</td>
                      {matiere.evaluations.map((evalItem, i) => (
                        <td key={i}>
                          <div>Note : {formatNumber(evalItem.note)}</div>
                          <div>
                            Rang matière : {evalItem.rang?.position
                              ? `${evalItem.rang.position}/${evalItem.rang.total_eleves}`
                              : 'N/A'}
                          </div>
                          <div>
                            <b>Rang général : {evalItem.rang_general?.position
                              ? `${evalItem.rang_general.position}/${evalItem.rang_general.total_eleves}`
                              : 'N/A'}</b>
                          </div>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}

          {categorie === 'primaire' && bulletin.evaluations ? (
            <div className="notes-table">
              <table>
                <thead>
                  <tr>
                    <th>Matière</th>
                    {bulletin.evaluations[0]?.evaluations.map((e, i) => (
                      <th key={i}>{e.type}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {bulletin.evaluations.map((matiere, idx) => (
                    <tr key={idx}>
                      <td>{matiere.matiere}</td>
                      {matiere.evaluations.map((evalItem, i) => (
                        <td key={i}>
                          <div>Note : {formatNumber(evalItem.note)}</div>
                          <div>
                            Rang matière : {evalItem.rang?.position
                              ? `${evalItem.rang.position}/${evalItem.rang.total_eleves}`
                              : 'N/A'}
                          </div>
                          <div>
                            <b>Rang général : {evalItem.rang_general?.position
                              ? `${evalItem.rang_general.position}/${evalItem.rang_general.total_eleves}`
                              : 'N/A'}</b>
                          </div>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}

          {/* Bloc Secondaire */}
          {(categorie === 'secondaire' || !categorie) && bulletin.moyennes_par_matiere ? (
            <div className="notes-table">
              <table>
                <thead>
                  <tr>
                    <th>Matière</th>
                    <th>Coefficient</th>
                    <th>Moyenne</th>
                    <th>Détails</th>
                    <th>Moyenne pondérée</th>
                    <th>Rang matière</th>
                  </tr>
                </thead>
                <tbody>
                  {bulletin.moyennes_par_matiere.map((matiere, index) => (
                    <tr key={index}>
                      <td>{matiere.matiere}</td>
                      <td>{matiere.coefficient}</td>
                      <td>{formatNumber(matiere.moyenne)}</td>
                      <td className="details-cell">
                        <div>Interros: {formatNumber(matiere.details?.moyenne_interrogations)}</div>
                        <div>Devoir 1: {formatNumber(matiere.details?.devoir1)}</div>
                        <div>Devoir 2: {formatNumber(matiere.details?.devoir2)}</div>
                      </td>
                      <td>{formatNumber(matiere.moyenne_ponderee)}</td>
                      <td>
                        {matiere.rang?.position
                          ? `${matiere.rang.position}/${matiere.rang.total_eleves}`
                          : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <th colSpan="5">Moyenne générale</th>
                    <th>
                      {formatNumber(bulletin.moyenne_generale)}
                    </th>
                  </tr>
                  <tr>
                    <th colSpan="5">Rang général</th>
                    <td>
                        {bulletin.rang?.position
                          ? `${bulletin.rang.position}/${bulletin.rang.total_eleves}`
                          : 'N/A'}
                      </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          ) : null}

          

          {debugMode && bulletin.debug_info && (
            <div className="debug-info">
              <h4>Informations de debug:</h4>
              <p>Total notes: {bulletin.debug_info.total_notes}</p>
              <p>Total matières: {bulletin.debug_info.total_matieres}</p>
              <p>Total coefficients: {bulletin.debug_info.total_coefficients}</p>
            </div>
          )}

          <div className="bulletin-actions">
            <button onClick={() => window.print()}>Imprimer le bulletin</button>
            <button onClick={generateBulletinPDF}>Télécharger en PDF</button>
            {!debugMode ? (
              <button onClick={() => setDebugMode(true)} className="debug-toggle">
                Activer debug
              </button>
            ) : (
              <button onClick={() => setDebugMode(false)} className="debug-toggle">
                Désactiver debug
              </button>
            )}
          </div>
        </>
      ) : (
        <div className="no-bulletin-data">
          <FileText className="no-data-icon" />
          <h3>Aucune donnée de bulletin</h3>
          <p>Le bulletin pour cette période n'est pas encore disponible.</p>
          <button
            onClick={() => {
              const parentId = getParentId();
              if (parentId) fetchChildBulletin(child.id, parentId, currentPeriode);
            }}
            className="retry-button"
          >
            Réessayer le chargement
          </button>
        </div>
      )}
    </div>
  );
};


  const renderOverview = () => {
    if (!children.length) {
      return <div className="no-data">Aucun enfant associé à ce compte</div>;
    }

    return (
      <div className="overview-container">
        {children.map((child, index) => (
          <div key={child.id} className="child-card">
            <div className="child-header">
              <h3>{child.name}</h3>
              <p className="child-info">Classe: {child.class}</p>
              <p className="child-info">Matricule: {child.matricule}</p>
            </div>
            <div className="child-body">
              {bulletinLoading[child.id] ? (
                <div className="bulletin-loading">
                  <RefreshCw className="spinning" />
                  <p>Chargement du bulletin...</p>
                </div>
              ) : bulletinErrors[child.id] ? (
                <div className="bulletin-error">
                  <AlertCircle className="error-icon" />
                  <p>Erreur: {bulletinErrors[child.id]}</p>
                  <button 
                    onClick={() => {
                      const parentId = getParentId();
                      if (parentId) fetchChildBulletin(child.id, parentId);
                    }}
                    className="retry-btn"
                  >
                    Réessayer
                  </button>
                </div>
              ) : bulletins[child.id] ? (
                <div className="bulletin-preview">
                  <p>Moyenne générale: {bulletins[child.id].moyenne_generale || 'N/A'}</p>
                  <p>Rang: {bulletins[child.id].rang?.position ? 
                    `${bulletins[child.id].rang.position}/${bulletins[child.id].rang.total_eleves}` : 'N/A'}</p>
                  <button 
                    onClick={() => {
                      setSelectedChild(index);
                      setActiveTab('bulletins');
                    }}
                    className="view-details-btn"
                  >
                    Voir les détails
                  </button>
                </div>
              ) : (
                <div className="bulletin-not-available">
                  <p className="no-bulletin">Bulletin non disponible</p>
                  <button 
                    onClick={() => {
                      const parentId = getParentId();
                      if (parentId) fetchChildBulletin(child.id, parentId);
                    }}
                    className="load-bulletin-btn"
                  >
                    Charger le bulletin
                  </button>
                </div>
              )}
            </div>
            
            {/* Bouton de debug (optionnel) */}
            {debugMode && (
              <div className="debug-section">
                <button 
                  onClick={() => debugEleve(child.id)}
                  className="debug-btn"
                >
                  Debug élève
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderAbsences = () => (
    <div className="absences-section">
      <div className="dashboard-card">
        <h3 className="dashboard-card__title">
          <Calendar className="dashboard-card__title-icon dashboard-card__title-icon--red" />
          Suivi des Absences
        </h3>
        
        {children.map((child, index) => (
          <div key={child.id} className="absence-child-section">
            <h4 className="absence-child-section__title">
              <User className="absence-child-section__icon" />
              {child.name}
            </h4>
            <div className="absence-list">
              {absences[child.id]?.map((absence, idx) => (
                <div key={idx} className="absence-item">
                  <div className="absence-item__info">
                    <Calendar className="absence-item__icon" />
                    <div className="absence-item__details">
                      <p className="absence-item__date">{absence.date}</p>
                      <p className="absence-item__reason">{absence.reason}</p>
                    </div>
                  </div>
                  <div className="absence-item__status">
                    {absence.justified ? (
                      <span className="absence-status absence-status--justified">
                        <CheckCircle className="absence-status__icon" />
                        Justifiée
                      </span>
                    ) : (
                      <span className="absence-status absence-status--unjustified">
                        <AlertCircle className="absence-status__icon" />
                        Non justifiée
                      </span>
                    )}
                  </div>
                </div>
              )) || <p className="absence-empty">Aucune absence enregistrée</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderMessages = () => (
    <div className="messages-section">
      <div className="dashboard-card">
        <h3 className="dashboard-card__title">
          <MessageSquare className="dashboard-card__title-icon dashboard-card__title-icon--green" />
          Messages
        </h3>
        
        <div className="messages-list">
          {messages.map(message => (
            <div key={message.id} className={`message-item ${
              message.read ? 'message-item--read' : 'message-item--unread'
            }`}>
              <div className="message-item__header">
                <h4 className="message-item__subject">{message.subject}</h4>
                <span className="message-item__date">{message.date}</span>
              </div>
              <p className="message-item__from">De: {message.from}</p>
              <p className="message-item__content">{message.content}</p>
              {!message.read && (
                <div className="message-item__badge">
                  <span className="message-badge">
                    Nouveau
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderPayments = () => (
    <div className="payments-section">
      <div className="dashboard-card">
        <h3 className="dashboard-card__title">
          <CreditCard className="dashboard-card__title-icon dashboard-card__title-icon--purple" />
          Gestion des Paiements
        </h3>
        
        <div className="payments-table-container">
          <table className="payments-table">
            <thead>
              <tr className="payments-table__header">
                <th className="payments-table__th payments-table__th--left">Description</th>
                <th className="payments-table__th payments-table__th--center">Montant</th>
                <th className="payments-table__th payments-table__th--center">Date</th>
                <th className="payments-table__th payments-table__th--center">Statut</th>
                <th className="payments-table__th payments-table__th--center">Action</th>
              </tr>
            </thead>
            <tbody>
              {payments.map(payment => (
                <tr key={payment.id} className="payments-table__row">
                  <td className="payments-table__td">{payment.description}</td>
                  <td className="payments-table__td payments-table__td--center payments-table__amount">{payment.amount}€</td>
                  <td className="payments-table__td payments-table__td--center">{payment.date}</td>
                  <td className="payments-table__td payments-table__td--center">
                    <span className={`payment-status ${
                      payment.status === 'Payé' 
                        ? 'payment-status--paid' 
                        : 'payment-status--pending'
                    }`}>
                      {payment.status}
                    </span>
                  </td>
                  <td className="payments-table__td payments-table__td--center">
                    {payment.status === 'En attente' && (
                      <button className="payment-button">
                        Payer
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Chargement de votre espace parent...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error-icon">!</div>
        <h3>Erreur</h3>
        <p>{error}</p>
        <button 
          onClick={fetchDashboardData}
          className="retry-button"
        >
          Réessayer
        </button>
        {error.includes("reconnecter") && (
          <a href="/Connexion" className="login-link">Se connecter</a>
        )}
      </div>
    );
  }

  return (
    <div className="parent-dashboard">
      <header className="dashboard-header">
        <div className="dashboard-header__container">
          <div className="dashboard-header__content">
            <div className="dashboard-header__brand">
              <div className="dashboard-header__logo">
                <div className="dashboard-header__logo-icon">
                  <BookOpen className="dashboard-header__logo-icon-svg" />
                </div>
                <div className="dashboard-header__brand-info">
                  <h1 className="dashboard-header__title">Espace Parent</h1>
                  <p
                      className="dashboard-header__subtitle"
                      onClick={() => setShowProfileMenu((v) => !v)}
                      style={{ cursor: 'pointer' }}
                      aria-haspopup="true"
                      aria-expanded={showProfileMenu}
                      tabIndex={0}
                      onKeyDown={e => {
                        if (e.key === 'Enter' || e.key === ' ') setShowProfileMenu(v => !v);
                      }}
                    >
                      Bienvenue, {parentData?.name}
                    </p>
                    <span className="profile-name"></span>
                  

                </div>
              </div>
            </div>
            <div className="dashboard-header__actions">
              <div className="dashboard-header__notifications">
                <Bell className="dashboard-header__notification-icon" />
                {notifications.length > 0 && (
                  <span className="dashboard-header__notification-badge">
                    {notifications.length}
                  </span>
                )}
              </div>
              <div className="profile-container" style={{ position: 'relative' }} tabIndex={0}>
                <User className="dashboard-header__user-icon" />
                <span
                  className="dashboard-header__user-name"
                  onClick={() => setShowProfileMenu((v) => !v)}
                  style={{ cursor: 'pointer' }}
                  aria-haspopup="true"
                  aria-expanded={showProfileMenu}
                  tabIndex={0}
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ' ') setShowProfileMenu(v => !v);
                  }}
                >
                  {parentData?.name}
                </span>
                <span className="profile-name"></span>
                {showProfileMenu && (
                  <div
                    className="profile-menu"
                    role="menu"
                    style={{
                      position: 'absolute',
                      top: '100%',
                      right: 0,
                      background: '#fff',
                      border: '1px solid #ddd',
                      borderRadius: 4,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                      zIndex: 10,
                      minWidth: 140
                    }}
                    onKeyDown={e => {
                      if (e.key === 'Escape') setShowProfileMenu(false);
                    }}
                  >
                    <button
                      className="profile-menu-item"
                      style={{ width: '100%', padding: '8px', border: 'none', background: 'none', textAlign: 'left', cursor: 'pointer' }}
                      onClick={() => {
                        setShowProfileMenu(false);
                        setActiveTab('profil');
                        // navigate('/profil'); // décommente si tu veux naviguer
                      }}
                      role="menuitem"
                    >
                      Profil
                    </button>
                    <button
                      className="profile-menu-item"
                      style={{ width: '100%', padding: '8px', border: 'none', background: 'none', textAlign: 'left', cursor: 'pointer' }}
                      onClick={() => {
                        setShowProfileMenu(false);
                        localStorage.clear();
                        sessionStorage.clear();
                        window.location.href = '/connexion';
                      }}
                      role="menuitem"
                    >
                      Déconnexion
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <nav className="dashboard-nav">
        <div className="dashboard-nav__container">
          <div className="dashboard-nav__content">
            {[
              { id: 'overview', label: 'Vue d\'ensemble', icon: TrendingUp },
              { id: 'bulletins', label: 'Bulletins', icon: FileText },
              { id: 'absences', label: 'Absences', icon: Calendar },
              { id: 'messages', label: 'Messages', icon: MessageSquare },
              { id: 'payments', label: 'Paiements', icon: CreditCard }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`dashboard-nav__tab ${
                  activeTab === tab.id
                    ? 'dashboard-nav__tab--active'
                    : ''
                }`}
              >
                <tab.icon className="dashboard-nav__tab-icon" />
                <span className="dashboard-nav__tab-label">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      <main className="dashboard-main">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'bulletins' && renderBulletins()}
        {activeTab === 'absences' && renderAbsences()}
        {activeTab === 'messages' && renderMessages()}
        {activeTab === 'payments' && renderPayments()}
      </main>
    </div>
  );
};

export default ParentDashboard;

