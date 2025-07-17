import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

const PaymentForm = () => {
  const { paiementId, tranche } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState(null);

  const initiatePayment = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.post('http://localhost:8000/api/payments/initiate', {
        paiement_eleve_id: paiementId,
        tranche: tranche || 'PREMIERE'
      });
      
      if (response.data.success) {
        window.location.href = response.data.payment_url;
      } else {
        setError(response.data.message);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur de connexion au service de paiement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('transaction_id')) {
      checkPaymentStatus(params.get('transaction_id'));
    }
  }, []);

  const checkPaymentStatus = async (transactionId) => {
    try {
      const response = await axios.get(`/api/payments/status/${transactionId}`);
      setStatus(response.data.status === 'ACCEPTED' ? 'success' : 'failed');
    } catch (err) {
      setStatus('failed');
    }
  };

  if (status) {
    return (
      <div className="payment-status-container">
        <div className={`status-card ${status}`}>
          {status === 'success' ? (
            <>
              <CheckCircle className="status-icon" />
              <h2>Paiement confirmé</h2>
              <p>Votre transaction a été effectuée avec succès.</p>
              <button 
                onClick={() => navigate('/dashboard')}
                className="status-button"
              >
                Retour à l'accueil
              </button>
            </>
          ) : (
            <>
              <XCircle className="status-icon" />
              <h2>Paiement échoué</h2>
              <p>Votre transaction n'a pas pu aboutir.</p>
              <button 
                onClick={() => window.location.reload()}
                className="status-button"
              >
                Réessayer
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="payment-wrapper">
      <div className="payment-card">
        <h1 className="payment-title">Paiement scolaire</h1>
        <p className="payment-description">Tranche: {tranche || 'Première'}</p>
        
        {error && <div className="payment-error">{error}</div>}
        
        <button 
          onClick={initiatePayment}
          disabled={loading}
          className={`payment-button ${loading ? 'loading' : ''}`}
        >
          {loading ? (
            <>
              <Loader2 className="button-spinner" />
              <span>Connexion sécurisée...</span>
            </>
          ) : (
            'Procéder au paiement'
          )}
        </button>
        
        <div className="payment-security">
          <div className="security-badge">
            <LockIcon />
            <span>Transaction sécurisée SSL</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const LockIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
  </svg>
);

export default PaymentForm;