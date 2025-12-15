import React from 'react';
import { User, Calendar, Bell, AlertCircle, CheckCircle, TrendingUp } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

const OverviewPage = ({
    child,
    notifications,
    absences = [],
    payments = []
}) => {
    if (!child) return <div className="p-4">Aucun enfant sélectionné</div>;

    const childAbsences = absences[child.id] || [];
    const childPayments = payments; // Assuming payments are passed filtered or global

    return (
        <div className="overview-container">
            {/* Child Header Card */}
            <div className="child-welcome-card" style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                padding: '2rem',
                borderRadius: '16px',
                marginBottom: '2rem',
                display: 'flex',
                alignItems: 'center',
                gap: '2rem'
            }}>
                <div className="child-avatar" style={{
                    width: '80px', height: '80px', background: 'white', borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#764ba2'
                }}>
                    <User size={40} />
                </div>
                <div>
                    <h2 style={{ marginBottom: '0.5rem' }}>Bonjour, {child.prenom} {child.nom}</h2>
                    <p style={{ opacity: 0.9 }}>Classe: {child.classe || child.class} | Matricule: {child.matricule || 'N/A'}</p>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                <div className="stat-card card">
                    <div className="stat-header">
                        <AlertCircle className="text-warning" />
                        <span>Absences</span>
                    </div>
                    <h3>{childAbsences.length}</h3>
                    <p className="text-muted">Ce semestre</p>
                </div>
                <div className="stat-card card">
                    <div className="stat-header">
                        <CheckCircle className="text-success" />
                        <span>Retards</span>
                    </div>
                    <h3>0</h3>
                    <p className="text-muted">Ce semestre</p>
                </div>
                <div className="stat-card card">
                    <div className="stat-header">
                        <TrendingUp className="text-primary" />
                        <span>Moyenne Générale</span>
                    </div>
                    <h3>{child.moyenne || '-'} / 20</h3>
                    <p className="text-muted">Dernière période</p>
                </div>
            </div>

            <div className="dashboard-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                {/* Notifications Section */}
                <div className="card">
                    <h3><Bell size={18} /> Notifications Récentes</h3>
                    <div className="notifications-list">
                        {notifications.length === 0 ? (
                            <p className="text-muted p-4">Aucune nouvelle notification</p>
                        ) : (
                            notifications.map(notif => (
                                <div key={notif.id} className={`notification-item ${notif.read ? 'read' : 'unread'}`} style={{ padding: '1rem', borderBottom: '1px solid #eee' }}>
                                    <p style={{ margin: 0 }}>{notif.message}</p>
                                    <small className="text-muted">{notif.date || 'Récemment'}</small>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Absences List */}
                <div className="card">
                    <h3><Calendar size={18} /> Dernières Absences</h3>
                    <div className="absences-list">
                        {childAbsences.length === 0 ? (
                            <div className="empty-state p-4 text-center">
                                <CheckCircle size={40} className="text-success mb-2" />
                                <p>Aucune absence enregistrée</p>
                            </div>
                        ) : (
                            childAbsences.map((abs, idx) => (
                                <div key={idx} className="absence-item" style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', borderBottom: '1px solid #eee' }}>
                                    <div>
                                        <strong>{abs.date}</strong>
                                        <p style={{ margin: 0, fontSize: '0.9em' }}>{abs.reason}</p>
                                    </div>
                                    <span className={`badge ${abs.justified ? 'badge-success' : 'badge-warning'}`}>
                                        {abs.justified ? 'Justifiée' : 'Non justifiée'}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OverviewPage;
