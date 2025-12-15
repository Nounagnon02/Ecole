/**
 * Header - Composant d'en-tête du dashboard
 */
import React from 'react';
import NotificationBell from '../../../components/NotificationBell';

const Header = ({ activeTab }) => {
    const formatTabName = (tab) => {
        return tab.charAt(0).toUpperCase() + tab.slice(1);
    };

    return (
        <header className="page-header">
            <h1>{formatTabName(activeTab)}</h1>
            <div className="header-actions">
                <NotificationBell userId={localStorage.getItem('userId')} />
                <div className="profile-container">
                    <img
                        src="/api/placeholder/40/40"
                        alt="Profile"
                        className="profile-image"
                        style={{ borderRadius: '50%' }}
                    />
                    <span
                        className="profile-name"
                        style={{ marginLeft: '0.5rem', fontWeight: '500' }}
                    >
                        Directeur
                    </span>
                </div>
            </div>
        </header>
    );
};

export default Header;
