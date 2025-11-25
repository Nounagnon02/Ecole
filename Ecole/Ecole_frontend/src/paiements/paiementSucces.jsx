import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import axios from 'axios';

// Page de succès
const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const bookingId = searchParams.get('booking_id');
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (bookingId) {
      fetchBooking();
    }
  }, [bookingId]);

  const fetchBooking = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/bookings/${bookingId}`);
      setBooking(response.data);
    } catch (error) {
      console.error('Error fetching booking:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="payment-status-container success">
      <div className="status-card">
        <div className="status-icon success-icon">
          <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
            <circle cx="40" cy="40" r="38" stroke="#28a745" strokeWidth="4"/>
            <path d="M25 40L35 50L55 30" stroke="#28a745" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        
        <h1>Paiement réussi !</h1>
        <p className="success-message">
          Votre réservation a été confirmée avec succès.
        </p>

        {loading ? (
          <div className="loading">Chargement des détails...</div>
        ) : booking ? (
          <div className="booking-details">
            <h3>Détails de votre réservation</h3>
            <div className="detail-row">
              <span>Numéro de réservation:</span>
              <strong>#{booking.id}</strong>
            </div>
            <div className="detail-row">
              <span>Chambre:</span>
              <strong>{booking.room_name}</strong>
            </div>
            <div className="detail-row">
              <span>Arrivée:</span>
              <strong>{new Date(booking.start_at).toLocaleDateString('fr-FR')}</strong>
            </div>
            <div className="detail-row">
              <span>Départ:</span>
              <strong>{new Date(booking.end_at).toLocaleDateString('fr-FR')}</strong>
            </div>
            <div className="detail-row">
              <span>Montant payé:</span>
              <strong>{booking.total_amount} {booking.currency}</strong>
            </div>
          </div>
        ) : (
          <p>Réservation #{bookingId}</p>
        )}

        <div className="notification-info">
          <p>📧 Un email de confirmation a été envoyé à votre adresse.</p>
        </div>

        <div className="action-buttons">
          <Link to="/" className="btn btn-primary">
            Retour à l'accueil
          </Link>
          <Link to={`/bookings/${bookingId}`} className="btn btn-secondary">
            Voir ma réservation
          </Link>
        </div>
      </div>
      <style jsx>{styles}</style>
    </div>
  );
};

export default PaymentSuccess;

// Page d'échec
export const PaymentFailed = () => {
  const [searchParams] = useSearchParams();
  const bookingId = searchParams.get('booking_id');

  return (
    <div className="payment-status-container failed">
      <div className="status-card">
        <div className="status-icon failed-icon">
          <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
            <circle cx="40" cy="40" r="38" stroke="#dc3545" strokeWidth="4"/>
            <path d="M30 30L50 50M50 30L30 50" stroke="#dc3545" strokeWidth="4" strokeLinecap="round"/>
          </svg>
        </div>
        
        <h1>Paiement échoué</h1>
        <p className="error-message">
          Votre paiement n'a pas pu être traité.
        </p>

        <div className="error-reasons">
          <h3>Raisons possibles :</h3>
          <ul>
            <li>Fonds insuffisants</li>
            <li>Transaction annulée</li>
            <li>Problème de connexion</li>
            <li>Carte expirée ou invalide</li>
          </ul>
        </div>

        <div className="action-buttons">
          <Link to={`/booking/payment/${bookingId}`} className="btn btn-primary">
            Réessayer le paiement
          </Link>
          <Link to="/" className="btn btn-secondary">
            Retour à l'accueil
          </Link>
        </div>
      </div>
      <style jsx>{styles}</style>
    </div>
  );
};

// Page d'erreur générale
export const PaymentError = () => {
  const [searchParams] = useSearchParams();
  const message = searchParams.get('message') || 'Une erreur inattendue est survenue';

  return (
    <div className="payment-status-container error">
      <div className="status-card">
        <div className="status-icon error-icon">
          <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
            <circle cx="40" cy="40" r="38" stroke="#ffc107" strokeWidth="4"/>
            <path d="M40 25V45M40 55V58" stroke="#ffc107" strokeWidth="4" strokeLinecap="round"/>
          </svg>
        </div>
        
        <h1>Erreur</h1>
        <p className="error-message">{message}</p>

        <div className="action-buttons">
          <Link to="/" className="btn btn-primary">
            Retour à l'accueil
          </Link>
          <a href="mailto:support@votrehotel.com" className="btn btn-secondary">
            Contacter le support
          </a>
        </div>
      </div>
      <style jsx>{styles}</style>
    </div>
  );
};

const styles = `
  .payment-status-container {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  }

  .status-card {
    background: white;
    border-radius: 16px;
    padding: 40px;
    max-width: 600px;
    width: 100%;
    box-shadow: 0 10px 40px rgba(0,0,0,0.1);
    text-align: center;
  }

  .status-icon {
    margin: 0 auto 30px;
    width: 80px;
    height: 80px;
  }

  h1 {
    font-size: 2em;
    margin: 0 0 15px 0;
    color: #333;
  }

  .success-message {
    color: #28a745;
    font-size: 1.1em;
    margin-bottom: 30px;
  }

  .error-message {
    color: #dc3545;
    font-size: 1.1em;
    margin-bottom: 30px;
  }

  .booking-details {
    background: #f8f9fa;
    border-radius: 8px;
    padding: 20px;
    margin: 30px 0;
    text-align: left;
  }

  .booking-details h3 {
    margin: 0 0 15px 0;
    text-align: center;
    color: #333;
  }

  .detail-row {
    display: flex;
    justify-content: space-between;
    padding: 10px 0;
    border-bottom: 1px solid #e0e0e0;
  }

  .detail-row:last-child {
    border-bottom: none;
  }

  .notification-info {
    background: #e7f3ff;
    border: 1px solid #b3d9ff;
    border-radius: 8px;
    padding: 15px;
    margin: 20px 0;
  }

  .notification-info p {
    margin: 0;
    color: #004085;
  }

  .error-reasons {
    background: #fff3cd;
    border: 1px solid #ffc107;
    border-radius: 8px;
    padding: 20px;
    margin: 20px 0;
    text-align: left;
  }

  .error-reasons h3 {
    margin: 0 0 15px 0;
    color: #856404;
  }

  .error-reasons ul {
    margin: 0;
    padding-left: 20px;
    color: #856404;
  }

  .error-reasons li {
    margin: 8px 0;
  }

  .action-buttons {
    display: flex;
    gap: 15px;
    margin-top: 30px;
    flex-wrap: wrap;
  }

  .btn {
    flex: 1;
    min-width: 200px;
    padding: 15px 30px;
    border-radius: 8px;
    text-decoration: none;
    font-weight: bold;
    transition: all 0.3s;
    display: inline-block;
  }

  .btn-primary {
    background: #28a745;
    color: white;
    border: 2px solid #28a745;
  }

  .btn-primary:hover {
    background: #218838;
    border-color: #218838;
  }

  .btn-secondary {
    background: white;
    color: #333;
    border: 2px solid #ddd;
  }

  .btn-secondary:hover {
    background: #f8f9fa;
    border-color: #ccc;
  }

  .loading {
    padding: 20px;
    color: #666;
  }

  @media (max-width: 600px) {
    .status-card {
      padding: 30px 20px;
    }

    h1 {
      font-size: 1.5em;
    }

    .action-buttons {
      flex-direction: column;
    }

    .btn {
      min-width: 100%;
    }
  }
`;