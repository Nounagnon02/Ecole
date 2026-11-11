import { useEffect, useState, useCallback, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Clock, RefreshCw, AlertCircle } from 'lucide-react';
import Card from '@/shared/components/ui/Card';
import Button from '@/shared/components/ui/Button';
import apiClient from '@/shared/lib/api-client';
import { useTranslation } from '@/shared/i18n';

/** Le retour de l'opérateur ne suffit pas : le statut est relu auprès du serveur. */
export default function PaiementCallbackPage() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const transactionId = searchParams.get('transaction_id');
  const [status, setStatus] = useState('pending');
  const [checking, setChecking] = useState(false);
  const [message, setMessage] = useState('pages.paiements.callback.messages.verifying');
  const requestRef = useRef(null);

  const verify = useCallback(async () => {
    requestRef.current?.abort();
    const controller = new AbortController();
    requestRef.current = controller;
    if (!transactionId) {
      setStatus('unknown');
      setMessage('pages.paiements.callback.messages.missing_id');
      return;
    }
    setChecking(true);
    try {
      const { data } = await apiClient.get('/comptable/paiement/verifier/' + encodeURIComponent(transactionId), { signal: controller.signal });
      if (controller.signal.aborted) return;
      const verified = data.success && data.status === 'approved' ? 'approved'
        : data.success && ['declined', 'canceled', 'cancelled', 'failed', 'expired'].includes(data.status) ? 'failed'
        : data.success && data.status === 'pending' ? 'pending' : 'unknown';
      setStatus(verified);
      setMessage(verified === 'approved' ? 'pages.paiements.callback.messages.approved'
        : verified === 'failed' ? 'pages.paiements.callback.messages.failed'
        : verified === 'pending' ? 'c.payment_pending' : 'c.payment_unknown_detail');
    } catch {
      if (controller.signal.aborted) return;
      setStatus('unknown');
      setMessage('c.payment_unknown_detail');
    } finally {
      if (!controller.signal.aborted) setChecking(false);
    }
  }, [transactionId]);

  useEffect(() => {
    verify();
    return () => requestRef.current?.abort();
  }, [verify]);

  const Icon = { approved:CheckCircle, failed:XCircle, pending:Clock, unknown:AlertCircle }[status];
  const color = status === 'approved' ? 'green' : status === 'failed' ? 'red' : 'amber';
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-xl items-center justify-center py-8">
      <Card className="w-full p-6 sm:p-8 text-center">
        <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-lg" style={{ background:'var(--'+color+'-subtle)', color:'var(--'+color+')' }}><Icon size={32} aria-hidden="true" /></div>
        <div role="status" aria-live="polite">
          <h1>{status === 'unknown' ? t('c.payment_unknown') : t(`pages.paiements.callback.status.${status}`)}</h1>
          <p className="my-5 leading-relaxed text-[var(--text-secondary)]">{t(message)}</p>
        </div>
        {transactionId && <p className="mb-6 break-all text-sm text-[var(--text-secondary)]">{t('nav.transactions')} · {transactionId}</p>}
        <div className="flex flex-col gap-3">
          {status !== 'approved' && transactionId && <Button onClick={verify} loading={checking} icon={<RefreshCw size={18} />}>{t('c.verify_again')}</Button>}
          <Button variant={status === 'approved' ? 'primary' : 'outline'} onClick={() => navigate('/paiements?tab=echeancier')}>{t('pages.paiements.callback.back')}</Button>
        </div>
      </Card>
    </div>
  );
}
