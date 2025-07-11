import React, { useState, useMemo, useCallback, memo } from 'react';
import { PieChart, Pie, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { Bell, Calendar, Book, Settings, LogOut, Menu, X, Home, ChevronDown, ChevronUp, Clock, Award, Bookmark, FileText, CheckCircle } from 'lucide-react';
import './Mes_CSS/dash.css';

// Static data moved outside component to prevent recreation on every render
const STATIC_DATA = {
  gradeData: [
    { subject: 'Mathématiques', note: 15, moyenne: 13 },
    { subject: 'Français', note: 14, moyenne: 12 },
    { subject: 'Histoire-Géo', note: 16, moyenne: 14 },
    { subject: 'Sciences', note: 17, moyenne: 15 },
    { subject: 'Anglais', note: 13, moyenne: 12 },
    { subject: 'Sport', note: 18, moyenne: 15 },
  ],
  
  attendanceData: [
    { month: 'Septembre', présence: 98 },
    { month: 'Octobre', présence: 96 },
    { month: 'Novembre', présence: 94 },
    { month: 'Décembre', présence: 92 },
    { month: 'Janvier', présence: 95 },
    { month: 'Février', présence: 97 },
  ],
  
  courseCompletion: [
    { name: 'Complété', value: 68 },
    { name: 'À faire', value: 32 },
  ],
  
  upcomingAssignments: [
    { id: 1, title: "Dissertation Français", dueDate: "20 Mai 2025", subject: "Français", status: "À faire" },
    { id: 2, title: "Projet Sciences", dueDate: "22 Mai 2025", subject: "Sciences", status: "En cours" },
    { id: 3, title: "Exercices Mathématiques", dueDate: "25 Mai 2025", subject: "Mathématiques", status: "À faire" },
  ],
  
  notifications: [
    { id: 1, message: "Note de mathématiques disponible", date: "Aujourd'hui, 10:30" },
    { id: 2, message: "Nouveau document partagé par M. Martin", date: "Hier, 15:45" },
    { id: 3, message: "Rappel: Remise du devoir de français", date: "18/05, 09:15" },
  ],
  
  schedule: [
    { id: 1, title: "Mathématiques", time: "08:00 - 09:30", room: "Salle B201", teacher: "M. Dupont" },
    { id: 2, title: "Français", time: "09:45 - 11:15", room: "Salle C102", teacher: "Mme Bernard" },
    { id: 3, title: "Pause déjeuner", time: "11:15 - 12:30", room: "", teacher: "" },
    { id: 4, title: "Histoire-Géo", time: "12:30 - 14:00", room: "Salle A305", teacher: "M. Leroy" },
    { id: 5, title: "Sciences", time: "14:15 - 15:45", room: "Labo S103", teacher: "Mme Petit" },
  ],
  
  COLORS: ['#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe', '#dbeafe', '#eff6ff']
};

// Memoized components for better performance
const StatCard = memo(({ title, value, detail, detailClass }) => (
  <div className="card">
    <h3 className="card-title">{title}</h3>
    <p className="card-value">{value}</p>
    <p className={`card-detail ${detailClass}`}>{detail}</p>
  </div>
));

StatCard.displayName = 'StatCard';

const ChartContainer = memo(({ title, children }) => (
  <div className="chart-container">
    <h4 className="chart-title">{title}</h4>
    {children}
  </div>
));

ChartContainer.displayName = 'ChartContainer';

const GradeChart = memo(({ data }) => (
  <ChartContainer title="Notes par matière">
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="subject" />
        <YAxis domain={[0, 20]} />
        <Tooltip />
        <Legend />
        <Bar name="Ma note" dataKey="note" fill="#3b82f6" />
        <Bar name="Moyenne classe" dataKey="moyenne" fill="#93c5fd" />
      </BarChart>
    </ResponsiveContainer>
  </ChartContainer>
));

GradeChart.displayName = 'GradeChart';

const CourseProgressChart = memo(({ data, colors }) => (
  <ChartContainer title="Progression des cours">
    <div className="pie-chart-container">
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>
  </ChartContainer>
));

CourseProgressChart.displayName = 'CourseProgressChart';

const AttendanceChart = memo(({ data }) => (
  <ChartContainer title="Mon assiduité">
    <ResponsiveContainer width="100%" height={250}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" />
        <YAxis domain={[85, 100]} />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="présence" stroke="#3b82f6" activeDot={{ r: 8 }} />
      </LineChart>
    </ResponsiveContainer>
  </ChartContainer>
));

AttendanceChart.displayName = 'AttendanceChart';

const ScheduleItem = memo(({ item, isLast }) => (
  <div className={`schedule-item ${!isLast ? 'with-border' : ''}`}>
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
));

ScheduleItem.displayName = 'ScheduleItem';

const AssignmentItem = memo(({ assignment, isLast }) => (
  <div className={`assignment-item ${!isLast ? 'with-border' : ''}`}>
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
));

AssignmentItem.displayName = 'AssignmentItem';

const NotificationItem = memo(({ notification }) => (
  <div className="notification-list-item">
    <div className="notification-list-icon">
      <Bell size={18} className="icon-blue" />
    </div>
    <div className="notification-list-content">
      <p className="notification-list-message">{notification.message}</p>
      <span className="notification-list-date">{notification.date}</span>
    </div>
  </div>
));

NotificationItem.displayName = 'NotificationItem';

const Sidebar = memo(({ sidebarOpen, toggleSidebar, activeTab, setActiveTab }) => (
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
));

Sidebar.displayName = 'Sidebar';

const StudentDashboard = memo(() => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showNotifications, setShowNotifications] = useState(false);
  const [expandedSection, setExpandedSection] = useState('progressions');

  const toggleSidebar = useCallback(() => {
    setSidebarOpen(prev => !prev);
  }, []);

  const toggleSection = useCallback((section) => {
    setExpandedSection(prev => prev === section ? null : section);
  }, []);

  const toggleNotifications = useCallback(() => {
    setShowNotifications(prev => !prev);
  }, []);

  // Memoize tab title to prevent unnecessary recalculations
  const tabTitle = useMemo(() => {
    switch (activeTab) {
      case 'dashboard': return 'Tableau de bord';
      case 'cours': return 'Mes cours';
      case 'planning': return 'Planning';
      case 'devoirs': return 'Devoirs';
      case 'notes': return 'Mes notes';
      default: return 'Paramètres';
    }
  }, [activeTab]);

  // Memoize dashboard stats to prevent recalculations
  const dashboardStats = useMemo(() => [
    { title: 'Moyenne générale', value: '15,5/20', detail: '+0,5 depuis le trimestre précédent', detailClass: 'positive' },
    { title: 'Taux de présence', value: '97%', detail: '+2% ce mois-ci', detailClass: 'positive' },
    { title: 'Progression cours', value: '68%', detail: '3 cours terminés cette semaine', detailClass: 'neutral' },
    { title: 'Devoirs à rendre', value: '3', detail: '1 devoir pour demain', detailClass: 'negative' },
  ], []);

  return (
    <div className="dashboard-container">
      <Sidebar 
        sidebarOpen={sidebarOpen} 
        toggleSidebar={toggleSidebar} 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
      />

      <div className="main-content">
        <header className="header">
          <div className="header-content">
            <h2 className="header-title">{tabTitle}</h2>
            <div className="header-actions">
              <div className="notification-wrapper">
                <button 
                  onClick={toggleNotifications}
                  className="notification-btn"
                >
                  <Bell size={20} />
                  <span className="notification-badge">3</span>
                </button>
                {showNotifications && (
                  <div className="notification-dropdown">
                    <h3 className="notification-header">Notifications</h3>
                    {STATIC_DATA.notifications.map(notif => (
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

        <main className="content-area">
          {activeTab === 'dashboard' && (
            <>
              <div className="card-grid">
                {dashboardStats.map((stat, index) => (
                  <StatCard key={index} {...stat} />
                ))}
              </div>

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
                    <GradeChart data={STATIC_DATA.gradeData} />
                    <CourseProgressChart 
                      data={STATIC_DATA.courseCompletion} 
                      colors={STATIC_DATA.COLORS} 
                    />
                  </div>
                )}
              </div>

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
                  <AttendanceChart data={STATIC_DATA.attendanceData} />
                )}
              </div>

              <div className="double-column">
                <div className="card">
                  <h3 className="section-title">Planning d'aujourd'hui</h3>
                  {STATIC_DATA.schedule.map((item, index) => (
                    <ScheduleItem 
                      key={item.id} 
                      item={item} 
                      isLast={index === STATIC_DATA.schedule.length - 1}
                    />
                  ))}
                </div>

                <div className="card">
                  <h3 className="section-title">Devoirs à venir</h3>
                  {STATIC_DATA.upcomingAssignments.map((assignment, index) => (
                    <AssignmentItem 
                      key={assignment.id} 
                      assignment={assignment} 
                      isLast={index === STATIC_DATA.upcomingAssignments.length - 1}
                    />
                  ))}
                  <div className="view-all-container">
                    <button className="view-all-link">
                      Voir tous les devoirs →
                    </button>
                  </div>
                </div>
              </div>

              <div className="card">
                <h3 className="section-title">Notifications récentes</h3>
                <div className="notification-list">
                  {STATIC_DATA.notifications.map(notif => (
                    <NotificationItem key={notif.id} notification={notif} />
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
});

StudentDashboard.displayName = 'StudentDashboard';

export default StudentDashboard;