/**
 * PaiementCallbackPage — Page de retour après paiement FedaPay
 *
 * FedaPay redirige l'utilisateur ici avec ?transaction_id=...
 * Cette page :
 *  - Appelle l'API de vérification
 *  - Affiche le résultat (succès / échec)
 *  - Redirige vers l'échéancier après 3s
 */

import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2, ArrowRight } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import Card from '@/shared/components/ui/Card';
import Button from '@/shared/components/ui/Button';

export default function PaiementCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const transactionId = searchParams.get('transaction_id');
  const [status, setStatus] = useState<'pending' | 'approved' | 'failed' | 'unknown'>('pending');
  const [message, setMessage] = useState('Vérification du paiement en cours...');

  useEffect(() => {
    if (!transactionId) {
      setStatus('failed');
      setMessage('Identifiant de transaction manquant.');
      return;
    }

    const verify = async () => {
      try {
        const res = await fetch(`/api/comptable/paiement/verifier/${transactionId}`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` },
        });
        const data = await res.json();
        if (data.success) {
          setStatus(data.status === 'approved' ? 'approved' : data.status === 'pending' ? 'pending' : 'failed');
          setMessage(data.status === 'approved'
            ? 'Paiement confirmé avec succès !'
            : data.status === 'pending'
              ? 'Paiement en attente de confirmation...'
              : 'Le paiement a échoué.');
        } else {
          setStatus('failed');
          setMessage(data.message ?? 'Échec de la vérification.');
        }
      } catch (e) {
        setStatus('failed');
        setMessage('Erreur réseau lors de la vérification.');
      }
    };

    verify();
  }, [transactionId]);

  useEffect(() => {
    if (status === 'approved' || status === 'failed') {
      const timer = setTimeout(() => navigate('/paiements?tab=echeancier'), 3000);
      return () => clearTimeout(timer);
    }
  }, [status, navigate]);

  const iconMap = {
    pending: Loader2,
    approved: CheckCircle,
    failed: XCircle,
    unknown: XCircle,
  };
  const Icon = iconMap[status];

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--surface)] px-4">
      <Card className="w-full max-w-md text-center p-8">
        <div className={cn(
          'inline-flex items-center justify-center w-16 h-16 rounded-full mb-6',
          status === 'approved' && 'bg-[var(--green-subtle)] text-[var(--green)]',
          status === 'failed' && 'bg-[var(--red-subtle)] text-[var(--red)]',
          status === 'pending' && 'bg-[var(--accent-subtle)] text-[var(--accent)]'
        )}>
          <Icon className="h-8 w-8" />
        </div>

        <h1 className="text-xl font-semibold text-[var(--text-primary)] mb-2">
          {status === 'approved' && 'Paiement confirmé'}
          {status === 'failed' && 'Échec du paiement'}
          {status === 'pending' && 'Vérification en cours...'}
          {status === 'unknown' && 'Statut indéterminé'}
        </h1>

        <p className="text-[var(--text-secondary)] mb-6">{message}</p>

        {status !== 'pending' && (
          <div className="flex flex-col gap-3">
            <Button
              onClick={() => navigate('/paiements?tab=echeancier')}
              icon={<ArrowRight className="h-4 w-4" />}
            >
              Retour à l'échéancier
            </Button>
            <p className="text-xs text-[var(--text-muted)]">
              Redirection automatique dans 3 secondes...
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}