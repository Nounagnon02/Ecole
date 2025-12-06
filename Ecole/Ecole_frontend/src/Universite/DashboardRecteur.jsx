import React, { useState, useEffect } from 'react';
import { Users, BookOpen, GraduationCap, Building2 } from 'lucide-react';
import api from '../api';
import './DashboardUniversite.css';

const DashboardRecteur = () => {
  const [stats, setStats] = useState({ etudiants: 0, enseignants: 0, facultes: 0, filieres: 0 });

  useEffect(() => {
    Promise.all([
      api.get('/universite/etudiants'),
      api.get('/universite/enseignants'),
      api.get('/universite/facultes'),
      api.get('/universite/filieres')
    ]).then(([e, en, f, fi]) => {
      setStats({ etudiants: e.data.length, enseignants: en.data.length, facultes: f.data.length, filieres: fi.data.length });
    }).catch(console.error);
  }, []);

  return (
    <div className="univ-dashboard">
      <div className="univ-header">
        <h1>Tableau de Bord - Recteur</h1>
        <p>Vue d'ensemble de l'université</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">
            <Users size={28} />
          </div>
          <div className="stat-content">
            <h3>{stats.etudiants}</h3>
            <p>Étudiants</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <GraduationCap size={28} />
          </div>
          <div className="stat-content">
            <h3>{stats.enseignants}</h3>
            <p>Enseignants</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <Building2 size={28} />
          </div>
          <div className="stat-content">
            <h3>{stats.facultes}</h3>
            <p>Facultés</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <BookOpen size={28} />
          </div>
          <div className="stat-content">
            <h3>{stats.filieres}</h3>
            <p>Filières</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardRecteur;
