import React from 'react';
import { Users, BookOpen, Calendar, ClipboardList } from 'lucide-react';

const OverviewPage = ({ stats }) => {
    const { classesCount, elevesCount, notesCount, devoirsCount } = stats;

    return (
        <div className="overview-container">
            <h2 className="mb-4">Vue d'ensemble</h2>
            <div className="overview-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
                <div className="card stat-card p-4 d-flex align-items-center gap-3">
                    <div className="icon-bg bg-light-primary p-3 rounded-circle">
                        <Users className="text-primary" size={24} />
                    </div>
                    <div>
                        <h3 className="m-0">{classesCount}</h3>
                        <p className="text-muted m-0">Classes</p>
                    </div>
                </div>

                <div className="card stat-card p-4 d-flex align-items-center gap-3">
                    <div className="icon-bg bg-light-success p-3 rounded-circle">
                        <BookOpen className="text-success" size={24} />
                    </div>
                    <div>
                        <h3 className="m-0">{elevesCount || '-'}</h3>
                        <p className="text-muted m-0">Élèves (Total)</p>
                    </div>
                </div>

                <div className="card stat-card p-4 d-flex align-items-center gap-3">
                    <div className="icon-bg bg-light-warning p-3 rounded-circle">
                        <ClipboardList className="text-warning" size={24} />
                    </div>
                    <div>
                        <h3 className="m-0">{notesCount || '-'}</h3>
                        <p className="text-muted m-0">Notes Saisies</p>
                    </div>
                </div>

                <div className="card stat-card p-4 d-flex align-items-center gap-3">
                    <div className="icon-bg bg-light-info p-3 rounded-circle">
                        <Calendar className="text-info" size={24} />
                    </div>
                    <div>
                        <h3 className="m-0">{devoirsCount}</h3>
                        <p className="text-muted m-0">Devoirs Donnés</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OverviewPage;
