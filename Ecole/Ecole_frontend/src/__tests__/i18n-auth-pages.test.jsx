/**
 * Écrans d'authentification en anglais et en arabe
 *
 * Ce sont les premiers écrans qu'un visiteur voit, avant de pouvoir toucher
 * quoi que ce soit : s'ils ne suivent pas la langue choisie, le sélecteur ne
 * sert à rien. On vérifie donc, sur les vraies pages, que la langue mémorisée
 * s'applique, que le sélecteur est présent, et que l'arabe inverse le sens.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { I18nProvider } from '@/shared/i18n';
import LoginForm from '@/shared/components/auth/LoginForm';
import ForgotPassword from '@/app/features/auth/ForgotPassword';
import ResetPassword from '@/app/features/auth/ResetPassword';
import { resetAuth } from './helpers/render';

function monter(element, entry = '/') {
  return render(
    <MemoryRouter initialEntries={[entry]}>
      <I18nProvider>{element}</I18nProvider>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  localStorage.clear();
  document.documentElement.lang = 'fr';
  document.documentElement.dir = 'ltr';
  resetAuth();
});

describe('LoginForm', () => {
  it('reste en français par défaut, avec les accents corrects', () => {
    monter(<LoginForm />);
    expect(screen.getByText('Connectez-vous à votre espace')).toBeInTheDocument();
    expect(screen.getByText('Mot de passe oublié ?')).toBeInTheDocument();
  });

  it("s'affiche en anglais quand l'anglais est mémorisé", () => {
    localStorage.setItem('ecole-locale', 'en');
    monter(<LoginForm />);

    expect(screen.getByText('Log in to your account')).toBeInTheDocument();
    expect(screen.getByLabelText(/^Email or username/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Log in/ })).toBeInTheDocument();
    expect(screen.queryByText('Connectez-vous à votre espace')).not.toBeInTheDocument();
  });

  it("propose le sélecteur de langue et bascule à l'arabe", () => {
    monter(<LoginForm />);
    fireEvent.change(screen.getByRole('combobox', { name: 'Langue' }), { target: { value: 'ar' } });

    expect(document.documentElement.dir).toBe('rtl');
    expect(screen.getByText('سجّل الدخول إلى فضائك')).toBeInTheDocument();
  });

  it('traduit les erreurs de validation du formulaire', () => {
    localStorage.setItem('ecole-locale', 'en');
    monter(<LoginForm />);

    fireEvent.click(screen.getByRole('button', { name: /^Log in/ }));

    expect(screen.getByText('Please enter your username or email')).toBeInTheDocument();
  });
});

describe('ForgotPassword', () => {
  it("s'affiche en anglais, sélecteur compris", () => {
    localStorage.setItem('ecole-locale', 'en');
    monter(<ForgotPassword />, '/mot-de-passe-oublie');

    expect(screen.getByRole('heading', { name: 'Forgot password' })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Language' })).toBeInTheDocument();
  });

  it("traduit l'erreur de champ vide", () => {
    localStorage.setItem('ecole-locale', 'en');
    monter(<ForgotPassword />, '/mot-de-passe-oublie');

    fireEvent.click(screen.getByRole('button', { name: /Send the link/ }));

    expect(screen.getByText('Please enter your email address')).toBeInTheDocument();
  });
});

describe('ResetPassword', () => {
  it("affiche l'écran de lien invalide dans la langue choisie", () => {
    localStorage.setItem('ecole-locale', 'en');
    monter(<ResetPassword />, '/reinitialiser-mot-de-passe');

    expect(screen.getByRole('heading', { name: 'Invalid link' })).toBeInTheDocument();
  });
});
