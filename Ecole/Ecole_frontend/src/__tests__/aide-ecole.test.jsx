/**
 * Numéro d'aide de l'école sur la page de connexion.
 *
 * La page de connexion ne sait pas encore de quelle école vient la personne.
 * Elle affiche donc le numéro de la dernière école connectée sur cet appareil
 * (gardé à chaque connexion), sinon le message générique.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import LoginForm from '@/shared/components/auth/LoginForm';
import useAuthStore from '@/shared/stores/auth-store';
import { lireAide, lienTelephone } from '@/shared/lib/aideEcole';
import { resetAuth } from './helpers/render';

const CLE = 'ecole.aide';

function renderLogin() {
  return render(
    <MemoryRouter>
      <LoginForm />
    </MemoryRouter>
  );
}

beforeEach(() => {
  localStorage.removeItem(CLE);
  resetAuth();
});

afterEach(() => {
  localStorage.removeItem(CLE);
});

describe('Numéro d’aide de l’école', () => {
  it('garde le nom et le téléphone de l’école à la connexion', () => {
    useAuthStore.setState({
      user: { id: 1, role: 'parent', ecole: { id: 3, nom: 'CEG Les Palmiers', telephone: '+229 01 97 00 00 00' } },
      isAuthenticated: true,
    });

    expect(lireAide()).toEqual({ nom: 'CEG Les Palmiers', telephone: '+229 01 97 00 00 00' });
  });

  it('ne l’efface pas à la déconnexion : c’est la prochaine connexion qui en a besoin', () => {
    useAuthStore.setState({ user: { id: 1, ecole: { id: 3, nom: 'CEG Les Palmiers', telephone: '0197000000' } } });
    useAuthStore.setState({ user: null, isAuthenticated: false });

    expect(lireAide()?.telephone).toBe('0197000000');
  });

  it('affiche un lien d’appel vers l’école sur la page de connexion', () => {
    localStorage.setItem(CLE, JSON.stringify({ nom: 'CEG Les Palmiers', telephone: '+229 01 97 00 00 00' }));

    renderLogin();

    const lien = screen.getByRole('link', { name: /\+229 01 97 00 00 00/ });
    expect(lien).toHaveAttribute('href', 'tel:+2290197000000');
    expect(screen.getByText(/CEG Les Palmiers/)).toBeInTheDocument();
  });

  it('garde le message générique quand aucune école n’est connue', () => {
    renderLogin();

    expect(screen.getByText('Besoin d\'aide ? Contactez votre administrateur')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /^\+?\d/ })).not.toBeInTheDocument();
  });

  it('ignore une valeur illisible gardée sur l’appareil', () => {
    localStorage.setItem(CLE, '{pas du json');
    expect(lireAide()).toBeNull();
  });

  it('compose un lien tel: sans espaces ni tirets', () => {
    expect(lienTelephone('+229 01-97 00 00 00')).toBe('tel:+2290197000000');
  });
});
