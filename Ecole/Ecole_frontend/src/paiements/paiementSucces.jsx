import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';

export default function PaymentSuccess() {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/');
    }, 5000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div style={{ textAlign: 'center', padding: '2rem' }}>
      <CheckCircle size={48} color="green" />
      <h2>Paiement réussi!</h2>
      <p>Vous allez être redirigé dans 5 secondes...</p>
    </div>
  );
}