import React, { useState } from 'react';
import { CreditCard, DollarSign, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import api from '../../../api';

const PaiementsPage = ({ payments = [] }) => {
    const [processingId, setProcessingId] = useState(null);

    const initierPaiement = async (paymentId) => {
        try {
            setProcessingId(paymentId);
            const token = localStorage.getItem('token');
            // Adding return_url for automatic redirection back to our dashboard
            // Note: This requires backend to support reading 'return_url' from request or config
            const res = await api.post(`/fedapay/init/${paymentId}`, {
                return_url: window.location.href // Tell backend to redirect here
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.data.payment_url) {
                // UX: Visual feedback before redirect
                const confirmed = confirm("Vous allez être redirigé vers FedaPay pour effectuer le paiement sécurisé. Continuer ?");
                if (confirmed) {
                    window.location.href = res.data.payment_url;
                }
            } else {
                alert('Erreur: ' + (res.data.message || 'Impossible d\'initialiser le paiement FedaPay'));
            }
        } catch (err) {
            console.error(err);
            alert("Erreur lors de l'initialisation du paiement");
        } finally {
            setProcessingId(null);
        }
    };

    return (
        <div className="paiements-container">
            <h2 className="mb-4">Historique des Paiements</h2>

            <div className="payments-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                {payments.length === 0 ? (
                    <div className="empty-state card p-5 text-center col-span-full">
                        <CreditCard size={40} className="text-muted" />
                        <p className="mt-3">Aucun historique de paiement disponible.</p>
                    </div>
                ) : (
                    payments.map(payment => (
                        <div key={payment.id} className="card payment-card" style={{ borderLeft: `5px solid ${payment.status === 'Payé' ? '#2ecc71' : '#f1c40f'}` }}>
                            <div className="d-flex justify-content-between align-items-start mb-3">
                                <div>
                                    <h3 className="m-0" style={{ fontSize: '1.1rem' }}>{payment.description}</h3>
                                    <small className="text-muted">{payment.date}</small>
                                </div>
                                <div className={`badge ${payment.status === 'Payé' ? 'badge-success' : 'badge-warning'}`}>
                                    {payment.status}
                                </div>
                            </div>

                            <div className="amount text-center my-3" style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                                {parseInt(payment.amount).toLocaleString()} FCFA
                            </div>

                            {payment.status !== 'Payé' && (
                                <button
                                    className="btn btn-primary w-100"
                                    onClick={() => initierPaiement(payment.id)}
                                    disabled={processingId === payment.id}
                                >
                                    {processingId === payment.id ? 'Chargement...' : 'Payer maintenant'}
                                </button>
                            )}

                            {payment.status === 'Payé' && (
                                <button className="btn btn-outline w-100" disabled>
                                    <CheckCircle size={16} /> Reçu disponible
                                </button>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default PaiementsPage;
