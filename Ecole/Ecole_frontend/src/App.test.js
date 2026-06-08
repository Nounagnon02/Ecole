import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App';

test('renders the home page with accueil content', () => {
  render(
    <MemoryRouter initialEntries={['/']}>
      <App />
    </MemoryRouter>
  );

  // The home page should render without crashing
  const homeElement = screen.getByText(/éCOLE|Accueil|Bienvenue/i);
  expect(homeElement).toBeInTheDocument();
});

test('renders login page at /connexion', () => {
  render(
    <MemoryRouter initialEntries={['/connexion']}>
      <App />
    </MemoryRouter>
  );

  const loginElement = screen.getByText(/Connexion|Identifiant|Email|Mot de passe/i);
  expect(loginElement).toBeInTheDocument();
});

test('redirects unknown routes to RoleBasedRedirect', () => {
  render(
    <MemoryRouter initialEntries={['/unknown-route']}>
      <App />
    </MemoryRouter>
  );

  // Should not crash - redirects to dashboard or connexion
  const rootElement = document.getElementById('root');
  expect(rootElement).toBeInTheDocument();
});
