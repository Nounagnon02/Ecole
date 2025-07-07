import React, { useState, useEffect } from 'react';
import { Calendar, Users, FileText, Clock, Bell, Mail, Phone, CheckSquare, TrendingUp, Settings } from 'lucide-react';
import './Mes_CSS_secretaire/dashboard_secretaire.css'
const Dashboard_Secretaire = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [tasks, setTasks] = useState([
    { id: 1, text: "Préparer rapport mensuel", completed: false, priority: "high" },
    { id: 2, text: "Organiser réunion équipe", completed: true, priority: "medium" },
    { id: 3, text: "Répondre aux emails clients", completed: false, priority: "high" },
    { id: 4, text: "Mise à jour calendrier", completed: false, priority: "low" }
  ]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const toggleTask = (id) => {
    setTasks(tasks.map(task => 
      task.id === id ? { ...task, completed: !task.completed } : task
    ));
  };

  const upcomingMeetings = [
    { time: "09:30", title: "Réunion équipe marketing", attendees: 5 },
    { time: "14:00", title: "Entretien candidat", attendees: 3 },
    { time: "16:30", title: "Point avec direction", attendees: 2 }
  ];

  const recentMessages = [
    { sender: "Marie Dubois", subject: "Demande de congé", time: "10:45" },
    { sender: "Jean Martin", subject: "Facture fournisseur", time: "11:20" },
    { sender: "Sophie Laurent", subject: "Réservation salle", time: "12:15" }
  ];

  return (
    <div className="dashboard">
      <div className="dashboard-container">
        {/* Header */}
        <div className="header">
          <div className="header-content">
            <div className="welcome-section">
              <h1>Tableau de Bord</h1>
              <p>Bonjour ! Voici votre résumé quotidien</p>
            </div>
            <div className="time-display">
              <div className="current-time">
                {currentTime.toLocaleTimeString('fr-FR', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </div>
              <div className="current-date">
                {currentTime.toLocaleDateString('fr-FR', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon blue">
              <FileText size={24} />
            </div>
            <div className="stat-content">
              <h3>24</h3>
              <p>Documents traités</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon green">
              <CheckSquare size={24} />
            </div>
            <div className="stat-content">
              <h3>12</h3>
              <p>Tâches complétées</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon purple">
              <Users size={24} />
            </div>
            <div className="stat-content">
              <h3>8</h3>
              <p>Réunions planifiées</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon orange">
              <Mail size={24} />
            </div>
            <div className="stat-content">
              <h3>36</h3>
              <p>Emails reçus</p>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="main-grid">
          {/* Tasks */}
          <div className="card">
            <div className="card-header">
              <CheckSquare className="card-icon" />
              <h2>Tâches du jour</h2>
            </div>
            <ul className="task-list">
              {tasks.map(task => (
                <li key={task.id} className="task-item">
                  <div 
                    className={`task-checkbox ${task.completed ? 'completed' : ''}`}
                    onClick={() => toggleTask(task.id)}
                  >
                    {task.completed && '✓'}
                  </div>
                  <span className={`task-text ${task.completed ? 'completed' : ''}`}>
                    {task.text}
                  </span>
                  <span className={`priority-badge ${task.priority}`}>
                    {task.priority}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Meetings */}
          <div className="card">
            <div className="card-header">
              <Calendar className="card-icon" />
              <h2>Réunions aujourd'hui</h2>
            </div>
            <ul className="meeting-list">
              {upcomingMeetings.map((meeting, index) => (
                <li key={index} className="meeting-item">
                  <div className="meeting-time">{meeting.time}</div>
                  <div className="meeting-details">
                    <h4>{meeting.title}</h4>
                    <div className="meeting-attendees">
                      {meeting.attendees} participants
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Grid */}
        <div className="bottom-grid">
          {/* Messages */}
          <div className="card">
            <div className="card-header">
              <Mail className="card-icon" />
              <h2>Messages récents</h2>
            </div>
            <ul className="message-list">
              {recentMessages.map((message, index) => (
                <li key={index} className="message-item">
                  <div className="message-avatar">
                    {message.sender.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div className="message-content">
                    <h4>{message.sender}</h4>
                    <p>{message.subject}</p>
                  </div>
                  <div className="message-time">{message.time}</div>
                </li>
              ))}
            </ul>
          </div>

          {/* Quick Actions */}
          <div className="card">
            <div className="card-header">
              <Settings className="card-icon" />
              <h2>Actions rapides</h2>
            </div>
            <div className="quick-actions">
              <button className="action-btn">
                <Mail size={18} />
                Nouveau message
              </button>
              <button className="action-btn">
                <Calendar size={18} />
                Planifier réunion
              </button>
              <button className="action-btn">
                <FileText size={18} />
                Créer document
              </button>
              <button className="action-btn">
                <Phone size={18} />
                Carnet d'adresses
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard_Secretaire;