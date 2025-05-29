import React from 'react';
import { Link } from 'react-router-dom';

const Navigation = ({ user }) => {
    return (
        <nav>
            <ul>
                <li>
                    <Link to="/">Accueil</Link>
                </li>
                {user?.role === 'admin' && (
                    <li>
                        <Link to="/admin">Tableau de bord Admin</Link>
                    </li>
                )}
                {(user?.role === 'school' || user?.role === 'admin') && (
                    <li>
                        <Link to="/school">Tableau de bord École</Link>
                    </li>
                )}
                {(user?.role === 'candidate' || user?.role === 'school' || user?.role === 'admin') && (
                    <li>
                        <Link to="/dashboard">Tableau de bord Candidat</Link>
                    </li>
                )}
                {user && (
                    <li>
                        <button onClick={handleLogout}>Déconnexion</button>
                    </li>
                )}
            </ul>
        </nav>
    );
};

export default Navigation;
