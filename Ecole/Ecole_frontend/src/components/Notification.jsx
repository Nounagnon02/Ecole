import React, { useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

const Notification = ({ 
  message, 
  type = 'info', 
  duration = 3000, 
  onClose,
  show = false 
}) => {
  useEffect(() => {
    if (show && duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [show, duration, onClose]);

  if (!show) return null;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle size={20} />;
      case 'error':
        return <AlertCircle size={20} />;
      case 'warning':
        return <AlertCircle size={20} />;
      default:
        return <Info size={20} />;
    }
  };

  const getStyles = () => {
    const baseStyles = {
      position: 'fixed',
      top: '20px',
      right: '20px',
      padding: '1rem',
      borderRadius: '8px',
      color: 'white',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      minWidth: '300px',
      maxWidth: '500px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      animation: 'slideIn 0.3s ease'
    };

    const typeStyles = {
      success: { backgroundColor: '#48bb78' },
      error: { backgroundColor: '#e53e3e' },
      warning: { backgroundColor: '#ed8936' },
      info: { backgroundColor: '#4299e1' }
    };

    return { ...baseStyles, ...typeStyles[type] };
  };

  return (
    <>
      <style>
        {`
          @keyframes slideIn {
            from {
              transform: translateX(100%);
              opacity: 0;
            }
            to {
              transform: translateX(0);
              opacity: 1;
            }
          }
        `}
      </style>
      <div style={getStyles()}>
        {getIcon()}
        <span style={{ flex: 1 }}>{message}</span>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: 'white',
            cursor: 'pointer',
            padding: '0.25rem'
          }}
        >
          <X size={16} />
        </button>
      </div>
    </>
  );
};

export default Notification;