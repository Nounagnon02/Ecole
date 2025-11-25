import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import CustomPayment from './CustomPayment';

const paiement = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { booking, transactionId } = location.state || {};
  
  if (!booking) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>Erreur</h2>
        <p>Aucune réservation trouvée</p>
        <button onClick={() => navigate('/')}>Retour à l'accueil</button>
      </div>
    );
  }
  
  const handlePaymentSuccess = () => {
    navigate('/payment/success', { state: { booking } });
  };
  
  const handlePaymentError = (error) => {
    console.error('Erreur de paiement:', error);
  };

  return (
    <CustomPayment 
      booking={booking}
      transactionId={transactionId}
      onPaymentSuccess={handlePaymentSuccess}
      onPaymentError={handlePaymentError}
    />
  );
};

export default paiement;