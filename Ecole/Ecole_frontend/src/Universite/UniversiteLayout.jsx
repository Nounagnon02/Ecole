import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Users, BookOpen, GraduationCap, Building2, Home, LogOut, Menu, X } from 'lucide-react';
import './DashboardUniversite.css';

const UniversiteLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { path: '/universite/recteur', icon: Home, label: 'Dashboard' },
    { path: '/universite/etudiants', icon: Users, label: 'Étudiants' },
    { path: '/universite/facultes', icon: Building2, label: 'Facultés' },
    { path: '/universite/departements', icon: BookOpen, label: 'Départements' },
    { path: '/universite/filieres', icon: GraduationCap, label: 'Filières' },
    { path: '/universite/enseignants', icon: GraduationCap, label: 'Enseignants' },
    { path: '/universite/matieres', icon: BookOpen, label: 'Matières' },
    { path: '/universite/notes', icon: BookOpen, label: 'Notes' },
  ];

  return (
    <div className="universite-theme" style={{ display: 'flex', minHeight: '100vh', background: '#f5f7fa' }}>
      {/* Sidebar */}
      <div style={{
        width: sidebarOpen ? '280px' : '80px',
        background: 'linear-gradient(135deg, #4361ee 0%, #7209b7 100%)',
        color: 'white',
        transition: 'width 0.3s',
        position: 'fixed',
        height: '100vh',
        overflowY: 'auto',
        zIndex: 100
      }}>
        <div style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          {sidebarOpen && <h2 style={{ margin: 0, fontSize: '1.3rem' }}>Université</h2>}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
            {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        <nav style={{ padding: '1rem 0' }}>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <div
                key={item.path}
                onClick={() => navigate(item.path)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  padding: '1rem 1.5rem',
                  cursor: 'pointer',
                  background: isActive ? 'rgba(255,255,255,0.15)' : 'transparent',
                  borderLeft: isActive ? '4px solid white' : '4px solid transparent',
                  transition: 'all 0.3s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                onMouseLeave={(e) => e.currentTarget.style.background = isActive ? 'rgba(255,255,255,0.15)' : 'transparent'}
              >
                <Icon size={20} />
                {sidebarOpen && <span>{item.label}</span>}
              </div>
            );
          })}

          <div
            onClick={() => navigate('/connexion')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              padding: '1rem 1.5rem',
              cursor: 'pointer',
              marginTop: '2rem',
              borderTop: '1px solid rgba(255,255,255,0.1)'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            <LogOut size={20} />
            {sidebarOpen && <span>Déconnexion</span>}
          </div>
        </nav>
      </div>

      {/* Main Content */}
      <div style={{ marginLeft: sidebarOpen ? '280px' : '80px', flex: 1, transition: 'margin-left 0.3s' }}>
        <Outlet />
      </div>
    </div>
  );
};

export default UniversiteLayout;
