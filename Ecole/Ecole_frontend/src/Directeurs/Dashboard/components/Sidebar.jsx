/**
 * Sidebar - Composant de navigation latérale du dashboard
 */
import React from 'react';
import { NavLink } from 'react-router-dom';
import {
    Home, Users, Book, BookOpen, GraduationCap, ClipboardList,
    Link, UserCheck, Calendar, MessageSquare, Settings, LogOut
} from 'lucide-react';

const navItems = [
    { id: 'aperçu', icon: Home, label: 'Aperçu' },
    { id: 'élèves', icon: Users, label: 'Élèves' },
    { id: 'classes', icon: Book, label: 'Classes' },
    { id: 'matieres', icon: BookOpen, label: 'Matières' },
    { id: 'series', icon: GraduationCap, label: 'Séries' },
    { id: 'notes', icon: ClipboardList, label: 'Notes' },
    { id: 'LiaisonSeriesClass', icon: Link, label: 'Lier Series Classes' },
    { id: 'LiaisonMatieresAvecCoefficientEtSerieClasses', icon: Link, label: 'Lier Matieres Classes' },
    { id: 'LierElevesAuxParents', icon: Users, label: 'Lier Parents Eleves' },
    { id: 'enseignantsauxclasses', icon: UserCheck, label: 'Lier enseignant classes' },
    { id: 'emploi', icon: Calendar, label: 'Emploi du temps' },
    { id: 'presence', icon: Users, label: 'Marquage Présence' },
    { id: 'messages', icon: MessageSquare, label: 'Messages' },
    { id: 'personnel', icon: UserCheck, label: 'Personnel' },
    { id: 'paramètres', icon: Settings, label: 'Paramètres' },
];

const Sidebar = ({ activeTab, onTabChange }) => {
    return (
        <div className="sidebar">
            <div className="sidebar-header">
                <h2>EcoleGestion</h2>
            </div>
            <nav className="sidebar-nav">
                {navItems.map(item => {
                    const Icon = item.icon;
                    return (
                        <button
                            key={item.id}
                            className={activeTab === item.id ? 'active' : ''}
                            onClick={() => onTabChange(item.id)}
                        >
                            <Icon size={20} /> {item.label}
                        </button>
                    );
                })}
                <div className="sidebar-logout" style={{ marginTop: 'auto', padding: '1rem' }}>
                    <NavLink
                        to='/connexion'
                        className="btn btn-danger"
                        style={{ width: '100%', justifyContent: 'center' }}
                    >
                        <LogOut size={20} /> Déconnexion
                    </NavLink>
                </div>
            </nav>
        </div>
    );
};

export default Sidebar;
