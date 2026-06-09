/**
 * OverviewPage — Page d'accueil du tableau de bord Élève
 *
 * Affiche : cartes de synthèse, graphiques de progression,
 * assiduité, planning du jour, devoirs et notifications.
 */
import React from 'react';
import {
  PieChart, Pie, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, BarChart, Bar, Cell,
} from 'recharts';
import {
  ChevronDown, ChevronUp, Clock, Award,
  Bookmark, FileText, CheckCircle, Bell,
} from 'lucide-react';

export default function OverviewPage({
  gradeData,
  attendanceData,
  courseCompletion,
  upcomingAssignments,
  schedule,
  notifications,
  COLORS,
  expandedSection,
  toggleSection,
}) {
  return (
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
                      cx="50%" cy="50%"
                      labelLine={false} outerRadius={80}
                      fill="#8884d8" dataKey="value"
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
                  <p className="schedule-details">{item.room} • {item.teacher}</p>
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
                {assignment.status === 'À faire' ? (
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
                    assignment.status === 'À faire' ? 'status-todo' :
                    assignment.status === 'En cours' ? 'status-in-progress' :
                    'status-done'
                  }`}>
                    {assignment.status}
                  </span>
                </p>
              </div>
            </div>
          ))}
          <div className="view-all-container">
            <button className="view-all-link">Voir tous les devoirs →</button>
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
          <button className="view-all-link">Voir toutes les notifications →</button>
        </div>
      </div>
    </>
  );
}
