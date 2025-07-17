import React, { useState, useEffect, useCallback } from 'react';
import { CreditCard, Loader2, CheckCircle, XCircle } from 'lucide-react';
import './paiement.css';

const PaymentForm = () => {
  const [paymentData, setPaymentData] = useState({
    amount: '',
    phone: '',
    firstName: '',
    lastName: '',
    email: ''
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentResult, setPaymentResult] = useState(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [kkiapayLoaded, setKkiapayLoaded] = useState(false);

  const isLocalDevelopment = window.location.hostname === 'localhost' || 
                           window.location.hostname === '127.0.0.1';

  // Solution garantie pour initialiser KKiaPay
  useEffect(() => {
    // 1. Vérifier si KKiaPay est déjà disponible
    const checkKkiapay = () => {
      return window.kkiapay && typeof window.kkiapay.open === 'function' &&
             window.addKkiapayListener && typeof window.addKkiapayListener === 'function';
    };

    if (checkKkiapay()) {
      setKkiapayLoaded(true);
      return;
    }

    // 2. Créer un élément script
    const script = document.createElement('script');
    script.src = 'https://cdn.kkiapay.me/k.js';
    script.async = true;
    script.id = 'kkiapay-script';

    // 3. Solution de fallback globale
    window.initKkiapay = () => {
      console.log('KKiaPay initialisé via window.initKkiapay');
      setKkiapayLoaded(true);
    };

    script.onload = () => {
      console.log('Script KKiaPay chargé');
      
      // 4. Double méthode d'initialisation
      if (checkKkiapay()) {
        setKkiapayLoaded(true);
        return;
      }

      // Attente active avec timeout
      let attempts = 0;
      const maxAttempts = 30;
      const interval = setInterval(() => {
        attempts++;
        if (checkKkiapay()) {
          clearInterval(interval);
          console.log('KKiaPay détecté après', attempts, 'tentatives');
          setKkiapayLoaded(true);
        } else if (attempts >= maxAttempts) {
          clearInterval(interval);
          console.error('Échec d\'initialisation après', maxAttempts, 'tentatives');
          setStatusMessage('Rechargez la page pour réessayer');
        }
      }, 100);
    };

    script.onerror = () => {
      console.error('Échec de chargement du script KKiaPay');
      setStatusMessage('Service de paiement indisponible');
    };

    document.body.appendChild(script);

    // 5. Nettoyage
    return () => {
      const script = document.getElementById('kkiapay-script');
      if (script) script.remove();
      delete window.initKkiapay;
      
      if (window.removeKkiapayListener) {
        window.removeKkiapayListener('success');
        window.removeKkiapayListener('failed');
        window.removeKkiapayListener('pending');
      }
    };
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setPaymentData(prev => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    if (!paymentData.amount || !paymentData.phone || 
        !paymentData.firstName || !paymentData.lastName || !paymentData.email) {
      setStatusMessage('Veuillez remplir tous les champs');
      return false;
    }

    if (isNaN(paymentData.amount) || parseInt(paymentData.amount) < 100) {
      setStatusMessage('Le montant minimum est 100 FCFA');
      return false;
    }

    const phoneRegex = /^(\+229|229|00229)?\d{8}$/;
    if (!phoneRegex.test(paymentData.phone.replace(/\D/g, ''))) {
      setStatusMessage('Numéro invalide. Format: +229XXXXXXXX');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(paymentData.email)) {
      setStatusMessage('Email invalide');
      return false;
    }

    return true;
  };

  const handlePayment = useCallback(() => {
    if (!window.kkiapay) {
      setStatusMessage('Rechargement du service...');
      window.location.reload();
      return;
    }

    setIsProcessing(true);
    setStatusMessage('');
    
    // Configuration des listeners
    window.addKkiapayListener('success', (response) => {
      console.log('Paiement réussi:', response);
      setIsProcessing(false);
      setPaymentResult('success');
      setStatusMessage('Paiement effectué avec succès!');
    });

    window.addKkiapayListener('failed', (response) => {
      console.log('Paiement échoué:', response);
      setIsProcessing(false);
      setPaymentResult('failed');
      setStatusMessage('Paiement échoué. Veuillez réessayer.');
    });

    window.addKkiapayListener('pending', (response) => {
      console.log('Paiement en attente:', response);
      setIsProcessing(false);
      setPaymentResult('pending');
      setStatusMessage('Paiement en attente de confirmation...');
    });

    // Configuration du paiement
    const paymentConfig = {
      amount: Math.max(100, parseInt(paymentData.amount) || 100),
      phone: paymentData.phone.replace(/\D/g, ''),
      callback: isLocalDevelopment 
        ? 'http://localhost:3000/payment-success' 
        : `${window.location.origin}/payment-success`,
      data: {
        firstName: paymentData.firstName,
        lastName: paymentData.lastName,
        email: paymentData.email
      },
      theme: "#0891b2",
      key: "4bdb53c05f9b11f0a92639a78a9aeb42", // Remplacez par votre clé
      sandbox: isLocalDevelopment
    };

    try {
      console.log('Lancement du paiement avec config:', paymentConfig);
      window.kkiapay.open(paymentConfig);
    } catch (error) {
      console.error('Erreur KKiaPay:', error);
      setIsProcessing(false);
      setStatusMessage('Erreur lors du paiement. Veuillez réessayer.');
    }
  }, [paymentData, isLocalDevelopment]);

  const handlePaymentSubmit = () => {
    if (!validateForm()) return;
    handlePayment();
  };

  const PaymentStatusIndicator = () => {
    switch (paymentResult) {
      case 'success':
        return <CheckCircle className="payment-status-icon payment-success" />;
      case 'failed':
        return <XCircle className="payment-status-icon payment-failed" />;
      case 'pending':
        return <Loader2 className="payment-status-icon payment-pending" />;
      default:
        return null;
    }
  };

  if (paymentResult) {
    return (
      <div className="payment-result-container">
        <div className="payment-result-content">
          <PaymentStatusIndicator />
          <h2 className="payment-result-title">
            {paymentResult === 'success' ? 'Paiement réussi' : 
             paymentResult === 'failed' ? 'Paiement échoué' : 'Paiement en attente'}
          </h2>
          <p className="payment-result-message">{statusMessage}</p>
          <button
            onClick={() => {
              setPaymentResult(null);
              setStatusMessage('');
              setPaymentData({
                amount: '',
                phone: '',
                firstName: '',
                lastName: '',
                email: ''
              });
            }}
            className="payment-new-transaction-btn"
          >
            Nouveau paiement
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="payment-form-container">
      <div className="payment-form-header">
        <CreditCard className="payment-form-icon" />
        <h1 className="payment-form-title">Paiement KKiaPay</h1>
        <p className="payment-form-subtitle">Effectuez votre paiement en toute sécurité</p>
      </div>

      <div className="payment-status-indicator">
        {!kkiapayLoaded ? (
          <div className="loading-indicator">
            <Loader2 className="loading-icon" />
            <span>Initialisation du service de paiement...</span>
          </div>
        ) : (
          <div className="success-indicator">
            <CheckCircle className="success-icon" />
            <span>Service de paiement prêt</span>
          </div>
        )}
      </div>

      <div className="payment-form-fields">
        <div className="payment-form-group">
          <label className="payment-form-label">Montant (FCFA)</label>
          <input
            type="number"
            name="amount"
            value={paymentData.amount}
            onChange={handleInputChange}
            className="payment-form-input"
            placeholder="1000"
            min="100"
            required
          />
        </div>

        <div className="payment-form-group">
          <label className="payment-form-label">Téléphone</label>
          <input
            type="tel"
            name="phone"
            value={paymentData.phone}
            onChange={handleInputChange}
            className="payment-form-input"
            placeholder="+229XXXXXXXX"
            required
          />
        </div>

        <div className="payment-form-row">
          <div className="payment-form-group">
            <label className="payment-form-label">Prénom</label>
            <input
              type="text"
              name="firstName"
              value={paymentData.firstName}
              onChange={handleInputChange}
              className="payment-form-input"
              required
            />
          </div>
          <div className="payment-form-group">
            <label className="payment-form-label">Nom</label>
            <input
              type="text"
              name="lastName"
              value={paymentData.lastName}
              onChange={handleInputChange}
              className="payment-form-input"
              required
            />
          </div>
        </div>

        <div className="payment-form-group">
          <label className="payment-form-label">Email</label>
          <input
            type="email"
            name="email"
            value={paymentData.email}
            onChange={handleInputChange}
            className="payment-form-input"
            placeholder="email@example.com"
            required
          />
        </div>

        {statusMessage && (
          <div className="payment-form-alert">
            {statusMessage}
          </div>
        )}

        <button
          type="button"
          onClick={handlePaymentSubmit}
          disabled={isProcessing || !kkiapayLoaded}
          className="payment-submit-btn"
        >
          {isProcessing ? (
            <>
              <Loader2 className="payment-btn-icon processing" />
              Traitement en cours...
            </>
          ) : !kkiapayLoaded ? (
            <>
              <Loader2 className="payment-btn-icon processing" />
              Initialisation...
            </>
          ) : (
            <>
              <CreditCard className="payment-btn-icon" />
              Payer maintenant
            </>
          )}
        </button>
      </div>

      <div className="payment-form-footer">
        <p className="payment-security-info">
          Paiement sécurisé par KKiaPay - {isLocalDevelopment ? 'Mode Sandbox (Test)' : 'Mode Production'}
        </p>
        {isLocalDevelopment && (
          <div className="dev-notice">
            <p>Utilisez un numéro de test: +22901234567</p>
            <p>Montant minimum: 100 FCFA</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentForm;