/**
 * LoadingSpinner - Composant de chargement réutilisable
 */
import React from 'react';

const LoadingSpinner = ({ message = 'Chargement...' }) => (
    <div
        className="loading-container"
        style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100%',
            minHeight: '200px',
            flexDirection: 'column',
            gap: '1rem'
        }}
    >
        <div
            className="spinner"
            style={{
                width: '40px',
                height: '40px',
                border: '4px solid #f3f3f3',
                borderTop: '4px solid var(--primary)',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
            }}
        />
        <p style={{ color: 'var(--text-muted)' }}>{message}</p>
        <style>{`
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `}</style>
    </div>
);

export default LoadingSpinner;
