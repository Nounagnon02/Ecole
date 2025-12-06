import React, { useEffect } from 'react';
import './home.css';
import { useNavigate } from 'react-router-dom';

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="landing-page">
      {/* Header */}
      <header className="header">
        <nav className="nav">
          <div className="logo">School Management</div>
          <div className="nav-buttons">
            <button className="btn-student" onClick={() => navigate('/connexionE')}>
              Espace étudiant
            </button>
            <button className="btn-login" onClick={() => navigate('/connexion')}>
              Se connecter
            </button>
            <button className="btn-signup" onClick={() => navigate('/inscription')}>
              S'inscrire
            </button>
          </div>
        </nav>
      </header>

      {/* Main Content */}
      
        {/* Hero Section */}
        <section className="hero-section">
          {/* Icon/Logo */}
          <div className="hero-icon-wrapper">
            <div className="hero-icon">
              <svg className="icon-svg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
          </div>

          {/* Mission Statement */}
          <h1 className="hero-title">
            Votre succès, <br />
            <span className="title-gradient">Notre mission</span>
          </h1>

          <p className="hero-description">
            Nous vous accompagnons dans la gestion de votre école avec des outils innovants 
            et une plateforme intuitive. Rejoignez des milliers d'utilisateurs qui nous font confiance.
          </p>

          {/* CTA Buttons */}
          <div className="cta-buttons">
            <button className="btn-primary" onClick={() => navigate('/inscription')}>
              Commencer gratuitement
            </button>
            <button className="btn-secondary">
              En savoir plus
            </button>
          </div>

          {/* Features */}
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">
                <svg className="icon-svg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
              </div>
              <h3 className="feature-title">Simple & Intuitif</h3>
              <p className="feature-text">
                Une interface conçue pour une prise en main immédiate et une expérience utilisateur fluide
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <svg className="icon-svg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="feature-title">Sécurisé</h3>
              <p className="feature-text">
                Vos données protégées avec les dernières technologies de cryptage et de sécurité
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <svg className="icon-svg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="feature-title">Performant</h3>
              <p className="feature-text">
                Des résultats rapides et une optimisation maximale pour booster votre productivité
              </p>
            </div>
          </div>
        </section>
      

      {/* Footer */}
      <footer className="footer">
        <p>© 2025 School Management. Tous droits réservés.</p>
      </footer>
    </div>
  );
}