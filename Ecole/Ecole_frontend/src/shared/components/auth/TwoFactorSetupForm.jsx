import { useCallback, useEffect, useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import Button from '@/shared/components/ui/Button';
import Input from '@/shared/components/ui/Input';
import { api } from '@/shared/services/api';
import useAuthStore from '@/shared/stores/auth-store';
import { useTranslation } from '@/shared/i18n';

/**
 * Activation de la 2FA : QR code, secret de secours, puis code à 6 chiffres.
 *
 * Partagé par Paramètres (activation volontaire) et /activation-2fa (activation
 * imposée par le rôle). Lance lui-même /auth/2fa/setup au montage ; sur un code
 * valide, /auth/2fa/verify active la 2FA et valide la session côté serveur, et
 * le store lève le blocage avant d'appeler `onActivated`.
 */
export default function TwoFactorSetupForm({ onActivated, onCancel, cancelLabel }) {
  const { t } = useTranslation();
  const completeTwoFactorSetup = useAuthStore((s) => s.completeTwoFactorSetup);
  const [status, setStatus] = useState('loading'); // 'loading' | 'ready' | 'failed'
  const [qrUrl, setQrUrl] = useState('');
  const [secret, setSecret] = useState('');
  const [code, setCode] = useState('');
  const [codesSecours, setCodesSecours] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const start = useCallback(async () => {
    setStatus('loading');
    setError('');
    try {
      const { data } = await api.post('/auth/2fa/setup');
      setQrUrl(data.qr_code_url);
      setSecret(data.secret);
      setStatus('ready');
    } catch (e) {
      // Une panne serveur (5xx, réseau) n'a rien d'utile à dire à la personne,
      // et son message peut être un chemin de fichier : texte générique.
      // Un refus métier (4xx : « La 2FA est déjà activée ») est affiché tel quel.
      const business = e.status >= 400 && e.status < 500 && e.message;
      setError(business || t('pages.parametres.parametres.erreur_lors_de_l_activation_de_la_2fa'));
      setStatus('failed');
    }
  }, [t]);

  // Une seule demande au montage : chaque appel à /auth/2fa/setup remplace le
  // secret côté serveur. En développement, StrictMode rejoue les effets ; sans
  // ce garde-fou, le QR affiché pouvait ne plus correspondre au secret retenu.
  const started = useRef(false);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    start();
  }, [start]);

  const confirm = async (e) => {
    e.preventDefault();
    if (code.length !== 6 || submitting) return;
    setSubmitting(true);
    setError('');
    try {
      const { data } = await api.post('/auth/2fa/verify', { code });
      // Les codes de secours ne sont montrés qu'une fois : on les affiche
      // avant de rendre l'accès, la personne confirme les avoir notés.
      if (Array.isArray(data?.codes_secours) && data.codes_secours.length) {
        setCodesSecours(data.codes_secours);
      } else {
        completeTwoFactorSetup();
        onActivated?.();
      }
    } catch (err) {
      setError(err.message || t('pages.parametres.parametres.code_invalide'));
      setCode('');
    } finally {
      setSubmitting(false);
    }
  };

  if (codesSecours) {
    return (
      <div className="space-y-4">
        <p role="status" className="text-sm text-[var(--text-primary)]">{t('auth.codes_secours.intro')}</p>
        <ul className="grid grid-cols-2 gap-2 rounded-md border border-[var(--border)] p-3 font-mono text-sm" data-testid="codes-secours">
          {codesSecours.map((c) => <li key={c}>{c}</li>)}
        </ul>
        <p className="text-xs text-[var(--text-secondary)]">{t('auth.codes_secours.conseil')}</p>
        <button type="button" className="text-sm underline" onClick={() => window.print()}>{t('auth.codes_secours.imprimer')}</button>
        <Button className="w-full" onClick={() => { completeTwoFactorSetup(); onActivated?.(); }}>{t('auth.codes_secours.notes')}</Button>
      </div>
    );
  }

  if (status === 'loading') {
    return <p role="status" className="text-sm text-[var(--text-secondary)]">{t('common.loading')}</p>;
  }

  if (status === 'failed') {
    return (
      <div role="alert" className="space-y-3">
        <p className="text-sm text-[var(--red)] [overflow-wrap:anywhere]">{error}</p>
        <div className="flex flex-wrap gap-2">
          <Button onClick={start}>{t('common.retry')}</Button>
          {onCancel && <Button variant="ghost" onClick={onCancel}>{cancelLabel || t('pages.parametres.parametres.annuler')}</Button>}
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={confirm} className="space-y-4" noValidate>
      <p className="text-sm text-[var(--text-secondary)]">
        {t('pages.parametres.parametres.scannez_ce_code_avec_votre_application')}
      </p>
      <div className="flex justify-center rounded-lg border border-[var(--border)] bg-white p-4">
        {/* Fond blanc fixe : un QR code doit rester lisible en thème sombre. */}
        <QRCodeSVG value={qrUrl} size={180} title={t('pages.parametres.parametres.scannez_ce_code_avec_votre_application')} />
      </div>
      <details className="text-sm text-[var(--text-secondary)]">
        <summary className="cursor-pointer min-h-11 flex items-center">
          {t('pages.parametres.parametres.je_ne_peux_pas_scanner_le_code')}
        </summary>
        <code className="mt-2 block break-all rounded bg-[var(--surface-subtle)] p-2 text-[var(--text-primary)]">
          {secret}
        </code>
      </details>
      <Input
        id="two-factor-setup-code"
        label={t('pages.parametres.parametres.code_de_confirmation')}
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={6}
        value={code}
        onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
        placeholder="000000"
        error={error || undefined}
      />
      <div className="flex flex-wrap justify-end gap-2">
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel}>
            {cancelLabel || t('pages.parametres.parametres.annuler')}
          </Button>
        )}
        <Button type="submit" loading={submitting} disabled={submitting || code.length !== 6}>
          {t('pages.parametres.parametres.confirmer')}
        </Button>
      </div>
    </form>
  );
}
