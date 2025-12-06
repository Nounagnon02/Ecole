import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, GraduationCap, Building2, BookOpen, FileText, LogOut } from 'lucide-react';
import './UniversiteNavbar.css';

const UniversiteNavbar = () => {
    const location = useLocation();
    const isRecteur = location.pathname.includes('recteur') ||
        location.pathname.includes('etudiants') ||
        location.pathname.includes('facultes') ||
        location.pathname.includes('enseignants');

    const links = isRecteur ? [
        { path: '/universite/recteur', label: 'Tableau de bord', icon: LayoutDashboard },
        { path: '/universite/etudiants', label: 'Étudiants', icon: Users },
        { path: '/universite/enseignants', label: 'Enseignants', icon: GraduationCap },
        { path: '/universite/facultes', label: 'Facultés', icon: Building2 },
        { path: '/universite/filieres', label: 'Filières', icon: BookOpen },
        { path: '/universite/notes', label: 'Notes', icon: FileText },
    ] : [
        { path: '/universite/etudiant', label: 'Mon Espace', icon: LayoutDashboard },
    ];

    return (
        <nav className="univ-navbar">
            <div className="univ-navbar-container">
                <div className="univ-logo">
                    <GraduationCap size={32} />
                    <span>Université</span>
                </div>

                <ul className="univ-nav-links">
                    {links.map((link) => {
                        const Icon = link.icon;
                        const isActive = location.pathname === link.path;
                        return (
                            <li key={link.path}>
                                <Link to={link.path} className={`univ-nav-link ${isActive ? 'active' : ''}`}>
                                    <Icon size={20} />
                                    <span>{link.label}</span>
                                </Link>
                            </li>
                        );
                    })}
                </ul>

                <div className="univ-nav-actions">
                    <button className="univ-btn-logout">
                        <LogOut size={20} />
                        <span>Déconnexion</span>
                    </button>
                </div>
            </div>
        </nav>
    );
};

export default UniversiteNavbar;
