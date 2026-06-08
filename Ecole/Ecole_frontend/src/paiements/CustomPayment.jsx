import React, { useState, useEffect } from 'react';
import api from '../api';
import paymentService from '../paymentService';
import './CustomPayment.css';

const CustomPayment = ({ booking, transactionId: initialTransactionId, onPaymentSuccess, onPaymentError }) => {
  const [paymentMethod, setPaymentMethod] = useState('mobile');
  const [loading, setLoading] = useState(false);
  const [transactionId, setTransactionId] = useState(initialTransactionId);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Mobile Money
  const [phoneNumber, setPhoneNumber] = useState('');
  const [operator, setOperator] = useState('mtn');

  const [checkingStatus, setCheckingStatus] = useState(false);

  useEffect(() => {
    if (transactionId && !success) {
      const interval = setInterval(checkPaymentStatus, 3000);
      return () => clearInterval(interval);
    }
  }, [transactionId, success]);

  const createTransaction = async () => {
    // Si on a déjà un transactionId, on l'utilise
    if (transactionId) {
      return transactionId;
    }

    try {
      const response = await paymentService.createPayment({
        booking_id: booking.id,
        amount: booking.total_amount,
        currency: booking.currency || 'XOF',
        customer_name: booking.customer_name,
        customer_email: booking.customer_email,
        customer_phone: booking.customer_phone
      });

      if (response.success) {
        setTransactionId(response.data.transaction_id);
        return response.data;
      } else {
        throw new Error(response.message);
      }
    } catch (err) {
      throw new Error(err.message || 'Erreur lors de la création de la transaction');
    }
  };

  const processMobileMoneyPayment = async () => {
    setLoading(true);
    setError(null);

    try {
      let txId = transactionId;
      if (!txId) {
        const data = await createTransaction();
        txId = data.transaction_id;
      }

      const response = await api.post('/payments/mobile-money', {
        transaction_id: String(txId),
        phone_number: phoneNumber,
        operator: operator
      });

      const data = response.data;

      if (data.success) {
        setCheckingStatus(true);
        setError(null);
      } else {
        setError(data.message || 'Erreur lors du paiement Mobile Money');
      }
    } catch (err) {
      setError(err.message || 'Erreur lors du paiement');
    } finally {
      setLoading(false);
    }
  };

  const processCardPayment = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await paymentService.createPayment({
        booking_id: booking.id,
        amount: booking.total_amount,
        currency: booking.currency || 'XOF',
        customer_name: booking.customer_name,
        customer_email: booking.customer_email,
        customer_phone: booking.customer_phone
      });

      if (response.success && response.data.checkout_url) {
        // Redirection vers le checkout sécurisé FedaPay
        window.location.href = response.data.checkout_url;
      } else {
        setError('Erreur lors de l\'initialisation du paiement');
      }
    } catch (err) {
      setError(err.message || 'Erreur lors du paiement');
    } finally {
      setLoading(false);
    }
  };

  const checkPaymentStatus = async () => {
    if (!transactionId) return;

    try {
      const response = await paymentService.checkPaymentStatus(transactionId);

      if (response.success) {
        if (response.data.status === 'approved') {
          setSuccess(true);
          setCheckingStatus(false);
          if (onPaymentSuccess) {
            onPaymentSuccess(booking);
          }
        } else if (response.data.status === 'declined') {
          setError('Paiement refusé');
          setCheckingStatus(false);
        }
      }
    } catch (err) {
      console.error('Erreur vérification statut:', err);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (paymentMethod === 'mobile') {
      if (!phoneNumber) {
        setError('Veuillez saisir votre numéro de téléphone');
        return;
      }
      processMobileMoneyPayment();
    } else {
      processCardPayment();
    }
  };

  if (success) {
    return (
      <div className="payment-success">
        <div className="success-icon">✅</div>
        <h2>Paiement réussi !</h2>
        <p>Votre réservation a été confirmée.</p>
        <div className="booking-details">
          <p><strong>Réservation #{booking.id}</strong></p>
          <p>Montant payé: {booking.total_amount} {booking.currency || 'XOF'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="custom-payment">
      <div className="booking-summary">
        <h3>Résumé de votre réservation</h3>
        <div className="summary-item">
          <span>Chambre:</span>
          <strong>{booking.room_name}</strong>
        </div>
        <div className="summary-item">
          <span>Montant total:</span>
          <strong>{booking.total_amount} {booking.currency || 'XOF'}</strong>
        </div>
      </div>

      <div className="payment-methods">
        <h3>Choisissez votre méthode de paiement</h3>
        
        <div className="method-selector">
          <button 
            className={`method-btn ${paymentMethod === 'mobile' ? 'active' : ''}`}
            onClick={() => setPaymentMethod('mobile')}
          >
            📱 Mobile Money
          </button>
          <button 
            className={`method-btn ${paymentMethod === 'card' ? 'active' : ''}`}
            onClick={() => setPaymentMethod('card')}
          >
            💳 Carte bancaire
          </button>
        </div>

        <form onSubmit={handleSubmit} className="payment-form">
          {paymentMethod === 'mobile' ? (
            <div className="mobile-money-form">
              <div className="form-group">
                <label>Opérateur</label>
                <select value={operator} onChange={(e) => setOperator(e.target.value)}>
                  <option value="mtn">MTN Mobile Money</option>
                  <option value="moov">Moov Money</option>
                </select>
              </div>
              <div className="form-group">
                <label>Numéro de téléphone</label>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+229 XX XX XX XX"
                  required
                />
              </div>
            </div>
          ) : (
            <div className="card-redirect">
              <div className="redirect-info">
                <p>🔒 Paiement sécurisé via FedaPay</p>
                <p className="redirect-description">
                  Vous serez redirigé vers une page de paiement sécurisée pour saisir vos informations bancaires.
                </p>
                <p className="redirect-description">
                  Aucune donnée bancaire n'est collectée sur ce site.
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          {checkingStatus && (
            <div className="status-message">
              <div className="spinner"></div>
              Vérification du paiement en cours...
            </div>
          )}

          <button 
            type="submit" 
            className="pay-button"
            disabled={loading || checkingStatus}
          >
            {loading ? (
              <>
                <div className="spinner"></div>
                Traitement...
              </>
            ) : (
              `Payer ${booking.total_amount} ${booking.currency || 'XOF'}`
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CustomPayment;