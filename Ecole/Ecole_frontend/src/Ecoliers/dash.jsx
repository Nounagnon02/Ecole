import { useState } from 'react';
import './Mes_CSS/dash.css';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Calendar, Clock, BookOpen, Award, Bell, User, Settings, ChevronRight, PieChart } from 'lucide-react';

// Données factices pour le tableau de bord
const coursesData = [
  { id: 1, name: "Mathématiques", grade: 16, progress: 80, color: "#3498db" },
  { id: 2, name: "Français", grade: 14, progress: 65, color: "#e74c3c" },
  { id: 3, name: "Histoire", grade: 18, progress: 90, color: "#2ecc71" },
  { id: 4, name: "Physique", grade: 13, progress: 55, color: "#f39c12" }
];

const upcomingEvents = [
  { id: 1, title: "Devoir de Mathématiques", date: "20 Mai", time: "14:00" },
  { id: 2, title: "Examen de Français", date: "22 Mai", time: "10:00" },
  { id: 3, title: "Projet d'Histoire", date: "25 Mai", time: "09:30" }
];

const performanceData = [
  { subject: "Maths", score: 16 },
  { subject: "Français", score: 14 },
  { subject: "Histoire", score: 18 },
  { subject: "Physique", score: 13 },
  { subject: "SVT", score: 15 },
  { subject: "Anglais", score: 17 }
];

// Composant principal
export default function DashboardE() {
  const [activePage, setActivePage] = useState('overview');
  const [sidebarActive, setSidebarActive] = useState(false);
  const studentName = "Prince Ayo Ogofoluwa KANGBODE";
  const studentClass = "Terminale C";

  // Moyenne générale calculée
  const averageGrade = coursesData.length > 0
    ? coursesData.reduce((sum, course) => sum + course.grade, 0) / coursesData.length
    : 0;

  return (
    <div className="dash-container">
      {/* Overlay pour mobile */}
      <div 
        className={`dash-overlay ${sidebarActive ? 'active' : ''}`} 
        onClick={() => setSidebarActive(false)}
      />

      {/* Sidebar */}
      <div className={`dash-sidebar ${sidebarActive ? 'active' : ''}`}>
        <div className="dash-sidebar-header">
          <div className="dash-logo">
            <BookOpen className="dash-logo-icon" />
            <span>AfricaShool</span>
          </div>
        </div>
        
        <div className="dash-user-profile">
          <div className="dash-user-avatar">
            {studentName.split(' ').map(part => part[0]).join('')}
          </div>
          <div className="dash-user-info">
            <div className="dash-user-name">{studentName}</div>
            <div className="dash-user-class">{studentClass}</div>
          </div>
        </div>
      
        <nav className="dash-nav">
          {[
            { page: 'overview', label: "Vue d'ensemble", icon: <PieChart className="dash-nav-icon" /> },
            { page: 'courses', label: "Mes cours", icon: <BookOpen className="dash-nav-icon" /> },
            { page: 'calendar', label: "Calendrier", icon: <Calendar className="dash-nav-icon" /> },
            { page: 'grades', label: "Mes notes", icon: <Award className="dash-nav-icon" /> },
            { page: 'settings', label: "Paramètres", icon: <Settings className="dash-nav-icon" /> }
          ].map(({ page, label, icon }) => (
            <button 
              key={page}
              onClick={() => setActivePage(page)}
              className={`dash-nav-button ${activePage === page ? 'active' : ''}`}
              aria-label={label}
            >
              {icon}
              <span>{label}</span>
            </button>
          ))}
        </nav>
      </div>
      
      {/* Main content */}
      <div className="dash-main">
        <header className="dash-header">
          <button 
            className="dash-nav-icon" 
            onClick={() => setSidebarActive(!sidebarActive)}
            style={{ marginRight: '1rem' }}
            aria-label="Ouvrir le menu"
          >
            &#9776;
          </button>
          <h1 className="dash-title">
            {activePage === 'overview' && 'Tableau de bord'}
            {activePage === 'courses' && 'Mes cours'}
            {activePage === 'calendar' && 'Calendrier'}
            {activePage === 'grades' && 'Mes notes'}
            {activePage === 'settings' && 'Paramètres'}
          </h1>
          <div className="dash-actions">
            <button className="dash-notification-button" aria-label="Notifications">
              <Bell size={20} />
              <span className="dash-notification-badge"></span>
            </button>
            <button className="dash-profile-button" aria-label="Profil">
              <User size={20} />
            </button>
          </div>
        </header>
        
        {activePage === 'overview' && (
          <div className="dash-grid">
            {/* Carte de moyenne */}
            <div className="dash-card">
              <div className="dash-card-header">
                <h2 className="dash-card-title">Moyenne générale</h2>
                <span className="dash-card-link">Ce semestre</span>
              </div>
              <div className="dash-average-container">
                <div className="dash-average-circle">
                  <div className="dash-average-bg"></div>
                  <div className="dash-average-progress"></div>
                  <div className="text-center">
                    <div className="dash-average-value">{averageGrade.toFixed(1)}</div>
                    <div className="dash-average-label">sur 20</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}