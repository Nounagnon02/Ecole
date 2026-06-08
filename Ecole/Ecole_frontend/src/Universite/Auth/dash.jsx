import React, { useState } from 'react';
import { PieChart, Pie, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { Bell, Calendar, Book, User, Settings, LogOut, Menu, X, Home, ChevronDown, ChevronUp, Clock, Award, Bookmark, FileText, CheckCircle } from 'lucide-react';
import './Mes_CSS/dash.css';

// Données fictives pour un élève
const gradeData = [
  { subject: 'Mathématiques', note: 15, moyenne: 13 },
  { subject: 'Français', note: 14, moyenne: 12 },
  { subject: 'Histoire-Géo', note: 16, moyenne: 14 },
  { subject: 'Sciences', note: 17, moyenne: 15 },
  { subject: 'Anglais', note: 13, moyenne: 12 },
  { subject: 'Sport', note: 18, moyenne: 15 },
];

const attendanceData = [
  { month: 'Septembre', présence: 98 },
  { month: 'Octobre', présence: 96 },
  { month: 'Novembre', présence: 94 },
  { month: 'Décembre', présence: 92 },
  { month: 'Janvier', présence: 95 },
  { month: 'Février', présence: 97 },
];

const courseCompletion = [
  { name: 'Complété', value: 68 },
  { name: 'À faire', value: 32 },
];

const upcomingAssignments = [
  { id: 1, title: "Dissertation Français", dueDate: "20 Mai 2025", subject: "Français", status: "À faire" },
  { id: 2, title: "Projet Sciences", dueDate: "22 Mai 2025", subject: "Sciences", status: "En cours" },
  { id: 3, title: "Exercices Mathématiques", dueDate: "25 Mai 2025", subject: "Mathématiques", status: "À faire" },
];

const notifications = [
  { id: 1, message: "Note de mathématiques disponible", date: "Aujourd'hui, 10:30" },
  { id: 2, message: "Nouveau document partagé par M. Martin", date: "Hier, 15:45" },
  { id: 3, message: "Rappel: Remise du devoir de français", date: "18/05, 09:15" },
];

const schedule = [
  { id: 1, title: "Mathématiques", time: "08:00 - 09:30", room: "Salle B201", teacher: "M. Dupont" },
  { id: 2, title: "Français", time: "09:45 - 11:15", room: "Salle C102", teacher: "Mme Bernard" },
  { id: 3, title: "Pause déjeuner", time: "11:15 - 12:30", room: "", teacher: "" },
  { id: 4, title: "Histoire-Géo", time: "12:30 - 14:00", room: "Salle A305", teacher: "M. Leroy" },
  { id: 5, title: "Sciences", time: "14:15 - 15:45", room: "Labo S103", teacher: "Mme Petit" },
];

const COLORS = ['#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe', '#dbeafe', '#eff6ff'];

export default function StudentDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showNotifications, setShowNotifications] = useState(false);
  const [expandedSection, setExpandedSection] = useState('progressions');

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const toggleSection = (section) => {
    if (expandedSection === section) {
      setExpandedSection(null);
    } else {
      setExpandedSection(section);
    }
  };

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <div className={`sidebar ${sidebarOpen ? 'sidebar-open' : 'sidebar-collapsed'}`}>
        <div className="sidebar-header">
          {sidebarOpen && <h1 className="sidebar-title">MonÉcole</h1>}
          <button onClick={toggleSidebar} className="sidebar-toggle-btn">
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
        <nav className="sidebar-nav">
          <div 
            className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`} 
            onClick={() => setActiveTab('dashboard')}
          >
            <Home size={20} className="nav-icon" />
            {sidebarOpen && <span className="nav-text">Tableau de bord</span>}
          </div>
          <div 
            className={`nav-item ${activeTab === 'cours' ? 'active' : ''}`} 
            onClick={() => setActiveTab('cours')}
          >
            <Book size={20} className="nav-icon" />
            {sidebarOpen && <span className="nav-text">Mes cours</span>}
          </div>
          <div 
            className={`nav-item ${activeTab === 'planning' ? 'active' : ''}`} 
            onClick={() => setActiveTab('planning')}
          >
            <Calendar size={20} className="nav-icon" />
            {sidebarOpen && <span className="nav-text">Planning</span>}
          </div>
          <div 
            className={`nav-item ${activeTab === 'devoirs' ? 'active' : ''}`} 
            onClick={() => setActiveTab('devoirs')}
          >
            <FileText size={20} className="nav-icon" />
            {sidebarOpen && <span className="nav-text">Devoirs</span>}
          </div>
          <div 
            className={`nav-item ${activeTab === 'notes' ? 'active' : ''}`} 
            onClick={() => setActiveTab('notes')}
          >
            <Award size={20} className="nav-icon" />
            {sidebarOpen && <span className="nav-text">Mes notes</span>}
          </div>
          <div 
            className={`nav-item ${activeTab === 'paramètres' ? 'active' : ''}`} 
            onClick={() => setActiveTab('paramètres')}
          >
            <Settings size={20} className="nav-icon" />
            {sidebarOpen && <span className="nav-text">Paramètres</span>}
          </div>
          <div className="nav-item logout-item">
            <LogOut size={20} className="nav-icon" />
            {sidebarOpen && <span className="nav-text">Déconnexion</span>}
          </div>
        </nav>
      </div>

      {/* Main content */}
      <div className="main-content">
        {/* Header */}
        <header className="header">
          <div className="header-content">
            <h2 className="header-title">
              {activeTab === 'dashboard' ? 'Tableau de bord' : 
               activeTab === 'cours' ? 'Mes cours' :
               activeTab === 'planning' ? 'Planning' :
               activeTab === 'devoirs' ? 'Devoirs' :
               activeTab === 'notes' ? 'Mes notes' :
               'Paramètres'}
            </h2>
            <div className="header-actions">
              <div className="notification-wrapper">
                <button 
                  onClick={() => setShowNotifications(!showNotifications)} 
                  className="notification-btn"
                >
                  <Bell size={20} />
                  <span className="notification-badge">3</span>
                </button>
                {showNotifications && (
                  <div className="notification-dropdown">
                    <h3 className="notification-header">Notifications</h3>
                    {notifications.map(notif => (
                      <div key={notif.id} className="notification-item">
                        <p className="notification-message">{notif.message}</p>
                        <span className="notification-date">{notif.date}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="user-profile">
                <img src="/api/placeholder/40/40" alt="Profile" className="user-avatar" />
                <span className="user-name">Thomas Dubois</span>
              </div>
            </div>
          </div>
        </header>

        {/* Content area */}
        <main className="content-area">
          {activeTab === 'dashboard' && (
            <>
              {/* Top Cards */}
              <div className="card-grid">
                <div className="card">
                  <h3 className="card-title">Moyenne générale</h3>
                  <p className="card-value">15,5/20</p>
                  <p className="card-detail positive">+0,5 depuis le trimestre précédent</p>
                </div>
                <div className="card">
                  <h3 className="card-title">Taux de présence</h3>
                  <p className="card-value">97%</p>
                  <p className="card-detail positive">+2% ce mois-ci</p>
                </div>
                <div className="card">
                  <h3 className="card-title">Progression cours</h3>
                  <p className="card-value">68%</p>
                  <p className="card-detail neutral">3 cours terminés cette semaine</p>
                </div>
                <div className="card">
                  <h3 className="card-title">Devoirs à rendre</h3>
                  <p className="card-value">3</p>
                  <p className="card-detail negative">1 devoir pour demain</p>
                </div>
              </div>

              {/* Progress Charts */}
              <div className="section-container">
                <div className="section-header">
                  <h3 className="section-title">Mes progressions</h3>
                  <button 
                    className="section-toggle"
                    onClick={() => toggleSection('progressions')}
                  >
                    {expandedSection === 'progressions' ? (
                      <>Réduire <ChevronUp size={16} /></>
                    ) : (
                      <>Voir plus <ChevronDown size={16} /></>
                    )}
                  </button>
                </div>
                
                {expandedSection === 'progressions' && (
                  <div className="chart-grid">
                    <div className="chart-container">
                      <h4 className="chart-title">Notes par matière</h4>
                      <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={gradeData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="subject" />
                          <YAxis domain={[0, 20]} />
                          <Tooltip />
                          <Legend />
                          <Bar name="Ma note" dataKey="note" fill="#3b82f6" />
                          <Bar name="Moyenne classe" dataKey="moyenne" fill="#93c5fd" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="chart-container">
                      <h4 className="chart-title">Progression des cours</h4>
                      <div className="pie-chart-container">
                        <ResponsiveContainer width="100%" height={200}>
                          <PieChart>
                            <Pie
                              data={courseCompletion}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            >
                              {courseCompletion.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Attendance Chart */}
              <div className="section-container">
                <div className="section-header">
                  <h3 className="section-title">Mon assiduité</h3>
                  <button 
                    className="section-toggle"
                    onClick={() => toggleSection('assiduité')}
                  >
                    {expandedSection === 'assiduité' ? (
                      <>Réduire <ChevronUp size={16} /></>
                    ) : (
                      <>Voir plus <ChevronDown size={16} /></>
                    )}
                  </button>
                </div>
                
                {expandedSection === 'assiduité' && (
                  <div className="chart-container">
                    <ResponsiveContainer width="100%" height={250}>
                      <LineChart data={attendanceData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis domain={[85, 100]} />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="présence" stroke="#3b82f6" activeDot={{ r: 8 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              {/* Schedule and Assignments */}
              <div className="double-column">
                <div className="card">
                  <h3 className="section-title">Planning d'aujourd'hui</h3>
                  {schedule.map((item, index) => (
                    <div key={item.id} className={`schedule-item ${index !== schedule.length - 1 ? 'with-border' : ''}`}>
                      <div className="schedule-icon">
                        <Clock size={20} className="icon-blue" />
                      </div>
                      <div className="schedule-content">
                        <h4 className="schedule-title">{item.title}</h4>
                        <p className="schedule-time">{item.time}</p>
                        {item.room && (
                          <p className="schedule-details">
                            {item.room} • {item.teacher}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="card">
                  <h3 className="section-title">Devoirs à venir</h3>
                  {upcomingAssignments.map((assignment, index) => (
                    <div key={assignment.id} className={`assignment-item ${index !== upcomingAssignments.length - 1 ? 'with-border' : ''}`}>
                      <div className="assignment-icon">
                        {assignment.status === "À faire" ? (
                          <Bookmark size={20} className="icon-red" />
                        ) : (
                          <CheckCircle size={20} className="icon-green" />
                        )}
                      </div>
                      <div className="assignment-content">
                        <h4 className="assignment-title">{assignment.title}</h4>
                        <p className="assignment-info">{assignment.subject} • Échéance: {assignment.dueDate}</p>
                        <p className="assignment-status">
                          <span className={`status-badge ${
                            assignment.status === "À faire" ? "status-todo" : 
                            assignment.status === "En cours" ? "status-in-progress" : 
                            "status-done"
                          }`}>
                            {assignment.status}
                          </span>
                        </p>
                      </div>
                    </div>
                  ))}
                  <div className="view-all-container">
                    <button className="view-all-link">
                      Voir tous les devoirs →
                    </button>
                  </div>
                </div>
              </div>

              {/* Recent notifications */}
              <div className="card">
                <h3 className="section-title">Notifications récentes</h3>
                <div className="notification-list">
                  {notifications.map(notif => (
                    <div key={notif.id} className="notification-list-item">
                      <div className="notification-list-icon">
                        <Bell size={18} className="icon-blue" />
                      </div>
                      <div className="notification-list-content">
                        <p className="notification-list-message">{notif.message}</p>
                        <span className="notification-list-date">{notif.date}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="view-all-container">
                  <button className="view-all-link">
                    Voir toutes les notifications →
                  </button>
                </div>
              </div>
            </>
          )}

          {activeTab !== 'dashboard' && (
            <div className="coming-soon">
              <div className="coming-soon-content">
                <h3 className="coming-soon-title">Section {activeTab} en cours de développement</h3>
                <p className="coming-soon-text">Cette fonctionnalité sera disponible prochainement</p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}