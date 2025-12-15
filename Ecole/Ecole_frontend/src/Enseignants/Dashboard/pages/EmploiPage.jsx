import React from 'react';
import { Calendar, Clock } from 'lucide-react';

const EmploiPage = ({ emploiTemps = [] }) => {
    // Optional: Sort by day/time
    const daysOrder = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
    const sortedEmploi = [...emploiTemps].sort((a, b) => {
        const dayDiff = daysOrder.indexOf(a.jour) - daysOrder.indexOf(b.jour);
        if (dayDiff !== 0) return dayDiff;
        return a.heure_debut.localeCompare(b.heure_debut);
    });

    return (
        <div className="emploi-container">
            <h3 className="mb-4"><Calendar size={20} /> Mon Emploi du temps</h3>

            {sortedEmploi.length === 0 ? (
                <div className="card p-5 text-center text-muted">
                    <Calendar size={40} />
                    <p className="mt-3">Aucun cours programmé.</p>
                </div>
            ) : (
                <div className="schedule-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                    {sortedEmploi.map((cours, idx) => (
                        <div key={idx} className="card p-3 border-start-primary" style={{ borderLeft: '4px solid #6c5ce7' }}>
                            <div className="d-flex justify-content-between mb-2">
                                <span className="badge badge-light-primary">{cours.jour}</span>
                                <small className="text-muted d-flex align-items-center gap-1">
                                    <Clock size={14} /> {cours.heure_debut} - {cours.heure_fin}
                                </small>
                            </div>
                            <h4 className="m-0">{cours.matiere}</h4>
                            <p className="text-muted m-0">{cours.classe}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default EmploiPage;
