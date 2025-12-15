/**
 * StatisticsCard - Composant pour afficher une carte de statistiques
 */
import React from 'react';

const StatisticsCard = ({
    icon: Icon,
    value,
    label,
    trend,
    trendValue,
    gradient
}) => {
    const getTrendColor = () => {
        if (!trend) return 'var(--text-muted)';
        return trend === 'up' ? 'var(--success)' : 'var(--error)';
    };

    return (
        <div className="stat-card">
            <div
                className="stat-icon"
                style={{
                    background: gradient || 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)'
                }}
            >
                {Icon && <Icon size={24} />}
            </div>
            <div className="stat-content">
                <h3>{value}</h3>
                <p>{label}</p>
                {trendValue && (
                    <p style={{ fontSize: '0.8rem', color: getTrendColor() }}>
                        {trendValue}
                    </p>
                )}
            </div>
        </div>
    );
};

export default StatisticsCard;
