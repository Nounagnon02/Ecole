/**
 * DesktopReserve — écran affiché dans l'application de bureau à un compte
 * qui n'est pas administratif (parent, enseignant, élève, étudiant).
 *
 * Voir `shared/lib/plateforme.js` : ce n'est pas une protection, l'API
 * vérifie les droits ; on oriente vers l'application prévue pour ce compte.
 */
import { useState } from 'react';
import useAuthStore from '@/shared/stores/auth-store';
import Button from '@/shared/components/ui/Button';

export default function DesktopReserve() {
  const logout = useAuthStore((s) => s.logout);
  const role = useAuthStore((s) => s.user?.role);
  const [envoi, setEnvoi] = useState(false);
  const mobile = ['parent', 'enseignant', 'enseignement', 'enseignementM', 'enseignementP', 'professeur'].includes(role);

  return (
    <main id="main-content" className="flex min-h-screen items-center justify-center bg-[var(--surface)] p-6">
      <div className="max-w-md rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] p-6 text-center">
        <h1 className="text-xl font-bold text-[var(--text-primary)]">Application réservée à l’administration</h1>
        <p className="mt-3 text-sm text-[var(--text-secondary)]">
          {mobile
            ? 'Les parents et les enseignants utilisent l’application mobile École (ou le site web).'
            : 'Votre compte s’utilise sur le site web de l’école.'}
        </p>
        <Button className="mt-5" loading={envoi} onClick={async () => { setEnvoi(true); await logout(); }}>
          Se déconnecter
        </Button>
      </div>
    </main>
  );
}
