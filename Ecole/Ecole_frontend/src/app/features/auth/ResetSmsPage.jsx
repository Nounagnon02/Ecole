/**
 * Mot de passe oublié par SMS (lot 7.3) : numéro, puis code et nouveau mot de passe.
 */

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MessageSquare } from 'lucide-react';
import apiClient from '@/shared/lib/api-client';
import Brand from '@/shared/components/ui/Brand';
import Button from '@/shared/components/ui/Button';
import Input from '@/shared/components/ui/Input';
import { useTranslation } from '@/shared/i18n';

export default function ResetSmsPage() {
  const { t } = useTranslation();
  const p = (cle) => t(`auth.reset_sms.${cle}`);
  const navigate = useNavigate();
  const [etape, setEtape] = useState('numero');
  const [telephone, setTelephone] = useState('');
  const [code, setCode] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [message, setMessage] = useState(null);
  const [erreur, setErreur] = useState(null);
  const [envoi, setEnvoi] = useState(false);

  const demander = async (e) => {
    e.preventDefault();
    setEnvoi(true); setErreur(null);
    try {
      const { data } = await apiClient.post('/auth/mot-de-passe-oublie/sms', { telephone });
      setMessage(data?.message ?? p('envoye'));
      setEtape('code');
    } catch (err) { setErreur(err?.message ?? p('echec')); } finally { setEnvoi(false); }
  };

  const confirmer = async (e) => {
    e.preventDefault();
    if (motDePasse.length < 8) { setErreur(p('trop_court')); return; }
    if (motDePasse !== confirmation) { setErreur(p('differents')); return; }
    setEnvoi(true); setErreur(null);
    try {
      await apiClient.post('/auth/mot-de-passe-oublie/sms/confirmer', { telephone, code, password: motDePasse, password_confirmation: confirmation });
      navigate('/connexion', { replace: true });
    } catch (err) { setErreur(err?.message ?? p('echec')); } finally { setEnvoi(false); }
  };

  return (
    <div className="ecole-auth">
      <aside className="ecole-auth-intro"><Brand /></aside>
      <main className="ecole-auth-form">
        <section className="ecole-auth-card" aria-labelledby="auth-title">
          <MessageSquare className="mb-4 text-[var(--accent)]" size={32} aria-hidden="true" />
          <h2 id="auth-title">{p('titre')}</h2>
          {message && <p role="status" className="mb-4 text-sm text-[var(--text-secondary)]">{message}</p>}
          {erreur && <p role="alert" className="auth-error">{erreur}</p>}
          {etape === 'numero' ? (
            <form onSubmit={demander} className="space-y-4" noValidate>
              <Input type="tel" inputMode="tel" label={p('telephone')} placeholder="01 97 00 00 00" value={telephone} onChange={(e) => setTelephone(e.target.value)} required autoComplete="tel" />
              <Button type="submit" className="w-full" loading={envoi} disabled={!telephone.trim()}>{p('recevoir')}</Button>
            </form>
          ) : (
            <form onSubmit={confirmer} className="space-y-4" noValidate>
              <Input label={p('code')} inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} required />
              <Input type="password" label={p('nouveau')} autoComplete="new-password" value={motDePasse} onChange={(e) => setMotDePasse(e.target.value)} required />
              <Input type="password" label={p('confirmation')} autoComplete="new-password" value={confirmation} onChange={(e) => setConfirmation(e.target.value)} required />
              <Button type="submit" className="w-full" loading={envoi} disabled={code.length !== 6}>{p('valider')}</Button>
              <button type="button" className="text-sm underline" onClick={() => { setEtape('numero'); setCode(''); setMessage(null); }}>{p('renvoyer')}</button>
            </form>
          )}
          <Link to="/connexion" className="mt-4 inline-flex min-h-11 items-center text-sm font-semibold text-[var(--accent)]">{p('retour')}</Link>
        </section>
      </main>
    </div>
  );
}
