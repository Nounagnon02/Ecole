/**
 * OverviewTab - Composant pour l'onglet Aperçu du dashboard
 */
import React from 'react';
import { Users, CheckCircle, User, Book, Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import StatisticsCard from './StatisticsCard';
import { EffectifsLineChart, GradesPieChart, AttendanceBarChart } from './ChartComponents';

const attendanceData = [
    { name: 'Lundi', présent: 92, absent: 8 },
    { name: 'Mardi', présent: 95, absent: 5 },
    { name: 'Mercredi', présent: 90, absent: 10 },
    { name: 'Jeudi', présent: 88, absent: 12 },
    { name: 'Vendredi', présent: 85, absent: 15 },
];

const OverviewTab = ({
    studentData,
    gradeData,
    evenements,
    notifications,
    expandedSection,
    onToggleSection
}) => {
    return (
        <>
            {/* Cartes de statistiques */}
            <div className="stats-grid">
                <StatisticsCard
                    icon={Users}
                    value="350"
                    label="Total Élèves"
                    trend="up"
                    trendValue="+2,8% depuis le mois dernier"
                    gradient="linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)"
                />
                <StatisticsCard
                    icon={CheckCircle}
                    value="92%"
                    label="Présence Moyenne"
                    trend="down"
                    trendValue="-1,5% depuis la semaine dernière"
                    gradient="linear-gradient(135deg, var(--success) 0%, #1aa179 100%)"
                />
                <StatisticsCard
                    icon={User}
                    value="24"
                    label="Enseignants"
                    trendValue="Stable depuis le mois dernier"
                    gradient="linear-gradient(135deg, var(--warning) 0%, #e8590c 100%)"
                />
                <StatisticsCard
                    icon={Book}
                    value="15"
                    label="Classes"
                    trendValue="Stable depuis la rentrée"
                    gradient="linear-gradient(135deg, var(--secondary-1) 0%, #7209b7 100%)"
                />
            </div>

            {/* Section Statistiques avec graphiques */}
            <div style={{ marginBottom: '2rem' }}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '1rem'
                }}>
                    <h3 style={{
                        fontSize: '1.25rem',
                        fontWeight: 'bold',
                        color: 'var(--text-main)'
                    }}>
                        Statistiques
                    </h3>
                    <button
                        className="btn btn-icon"
                        onClick={() => onToggleSection('statistiques')}
                    >
                        {expandedSection === 'statistiques' ?
                            <ChevronUp size={20} /> : <ChevronDown size={20} />
                        }
                    </button>
                </div>

                {expandedSection === 'statistiques' && (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
                        gap: '1.5rem'
                    }}>
                        <EffectifsLineChart data={studentData} />
                        <GradesPieChart data={gradeData} />
                    </div>
                )}
            </div>

            {/* Section Présence */}
            <div className="section-container">
                <div className="section-header">
                    <h3 className="section-title">Présence cette semaine</h3>
                    <button
                        className="section-toggle"
                        onClick={() => onToggleSection('presence')}
                    >
                        {expandedSection === 'presence' ? (
                            <>Réduire <ChevronUp size={16} /></>
                        ) : (
                            <>Voir plus <ChevronDown size={16} /></>
                        )}
                    </button>
                </div>

                {expandedSection === 'presence' && (
                    <AttendanceBarChart data={attendanceData} />
                )}
            </div>

            {/* Événements et Messages */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '1.5rem'
            }}>
                {/* Événements à venir */}
                <div className="card">
                    <h3 style={{ marginBottom: '1rem', fontWeight: '600' }}>
                        Événements à venir
                    </h3>
                    {evenements.map(event => (
                        <div
                            key={event.id}
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '0.5rem',
                                padding: '1rem',
                                borderBottom: '1px solid var(--border)'
                            }}
                        >
                            <h4 style={{ fontWeight: '600', color: 'var(--primary)' }}>
                                {event.titre}
                            </h4>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                fontSize: '0.9rem',
                                color: 'var(--text-muted)'
                            }}>
                                <Calendar size={14} />
                                {event.date}
                            </div>
                            <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                                {event.lieu}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Messages récents */}
                <div className="card">
                    <h3 style={{ marginBottom: '1rem', fontWeight: '600' }}>
                        Messages récents
                    </h3>
                    {notifications.slice(0, 3).map(notif => (
                        <div key={notif.id} className="message" style={{ marginBottom: '1rem' }}>
                            <p style={{ margin: 0 }}>{notif.message}</p>
                            <span style={{
                                fontSize: '0.8rem',
                                color: 'var(--text-muted)',
                                display: 'block',
                                marginTop: '0.5rem'
                            }}>
                                {notif.date}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
};

export default OverviewTab;
