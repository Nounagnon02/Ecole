import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ResetSmsPage from '@/app/features/auth/ResetSmsPage';
import { installHttpMock } from './helpers/http-mock';

let http;
beforeEach(() => { http = installHttpMock(); vi.spyOn(console, 'error').mockImplementation(() => {}); });
afterEach(() => { http.restore(); vi.restoreAllMocks(); });

const monter = () => render(
  <MemoryRouter initialEntries={['/mot-de-passe-oublie/sms']}>
    <Routes>
      <Route path="/mot-de-passe-oublie/sms" element={<ResetSmsPage />} />
      <Route path="/connexion" element={<div>CONNEXION</div>} />
    </Routes>
  </MemoryRouter>,
);
const saisir = (libelle, valeur) => fireEvent.change(screen.getByLabelText(libelle, { selector: 'input' }), { target: { value: valeur } });

describe('mot de passe oublié par SMS', () => {
  it('demande un code, puis change le mot de passe et renvoie à la connexion', async () => {
    http.onPost('/auth/mot-de-passe-oublie/sms').reply(200, { message: 'Si ce numéro correspond à un compte, un code vient d’être envoyé par SMS.' });
    http.onPost('/auth/mot-de-passe-oublie/sms/confirmer').reply(200, { message: 'ok' });
    monter();

    saisir(/Numéro de téléphone/, '01 97 12 34 56');
    fireEvent.click(screen.getByRole('button', { name: /Recevoir un code/ }));
    expect(await screen.findByRole('status')).toHaveTextContent(/Si ce numéro/);

    saisir(/Code reçu/, '123456');
    saisir(/^Nouveau mot de passe/, 'Nouveau2026');
    saisir(/Confirmez/, 'Nouveau2026');
    fireEvent.click(screen.getByRole('button', { name: /Changer le mot de passe/ }));

    expect(await screen.findByText('CONNEXION')).toBeInTheDocument();
    expect(http.callsTo('post', '/auth/mot-de-passe-oublie/sms/confirmer')[0].body).toEqual({
      telephone: '01 97 12 34 56', code: '123456', password: 'Nouveau2026', password_confirmation: 'Nouveau2026',
    });
  });

  it('montre un code refusé', async () => {
    http.onPost('/auth/mot-de-passe-oublie/sms').reply(200, { message: 'ok' });
    http.onPost('/auth/mot-de-passe-oublie/sms/confirmer').reply(422, { message: 'Code incorrect.' });
    monter();
    saisir(/Numéro de téléphone/, '0197123456');
    fireEvent.click(screen.getByRole('button', { name: /Recevoir un code/ }));
    await screen.findByLabelText(/Code reçu/, { selector: 'input' });
    saisir(/Code reçu/, '000000'); saisir(/^Nouveau mot de passe/, 'Nouveau2026'); saisir(/Confirmez/, 'Nouveau2026');
    fireEvent.click(screen.getByRole('button', { name: /Changer le mot de passe/ }));

    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Code incorrect.'));
  });
});
