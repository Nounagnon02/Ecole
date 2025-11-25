import React, { useState, useEffect } from 'react';
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

  // Carte bancaire
  const [cardData, setCardData] = useState({
    number: '',
    expiry_month: '',
    expiry_year: '',
    cvv: '',
    name: ''
  });

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
        return response.data.transaction_id;
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
        txId = await createTransaction();
      }

      const response = await fetch(`${process.env.REACT_APP_API_URL}/payment/mobile-money`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transaction_id: String(txId),
          phone_number: phoneNumber,
          operator: operator
        })
      });

      const data = await response.json();

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
      let txId = transactionId;
      if (!txId) {
        txId = await createTransaction();
      }

      const response = await fetch(`${process.env.REACT_APP_API_URL}/payment/card`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transaction_id: String(txId),
          card_number: cardData.number,
          expiry_month: cardData.expiry_month,
          expiry_year: cardData.expiry_year,
          cvv: cardData.cvv,
          cardholder_name: cardData.name
        })
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        if (onPaymentSuccess) {
          onPaymentSuccess(booking);
        }
      } else {
        setError(data.message || 'Erreur lors du paiement par carte');
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
      if (!cardData.number || !cardData.expiry_month || !cardData.expiry_year || !cardData.cvv || !cardData.name) {
        setError('Veuillez remplir tous les champs de la carte');
        return;
      }
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
            <div className="card-form">
              <div className="form-group">
                <label>Nom du porteur</label>
                <input
                  type="text"
                  value={cardData.name}
                  onChange={(e) => setCardData({...cardData, name: e.target.value})}
                  placeholder="Jean Dupont"
                  required
                />
              </div>
              <div className="form-group">
                <label>Numéro de carte</label>
                <input
                  type="text"
                  value={cardData.number}
                  onChange={(e) => setCardData({...cardData, number: e.target.value})}
                  placeholder="1234 5678 9012 3456"
                  maxLength="19"
                  required
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Mois</label>
                  <select 
                    value={cardData.expiry_month}
                    onChange={(e) => setCardData({...cardData, expiry_month: e.target.value})}
                    required
                  >
                    <option value="">MM</option>
                    {Array.from({length: 12}, (_, i) => (
                      <option key={i+1} value={String(i+1).padStart(2, '0')}>
                        {String(i+1).padStart(2, '0')}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Année</label>
                  <select 
                    value={cardData.expiry_year}
                    onChange={(e) => setCardData({...cardData, expiry_year: e.target.value})}
                    required
                  >
                    <option value="">YYYY</option>
                    {Array.from({length: 10}, (_, i) => (
                      <option key={i} value={new Date().getFullYear() + i}>
                        {new Date().getFullYear() + i}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>CVV</label>
                  <input
                    type="text"
                    value={cardData.cvv}
                    onChange={(e) => setCardData({...cardData, cvv: e.target.value})}
                    placeholder="123"
                    maxLength="4"
                    required
                  />
                </div>
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