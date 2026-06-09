import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App';

test('renders the home page with accueil content', async () => {
  render(
    <MemoryRouter initialEntries={['/']}>
      <App />
    </MemoryRouter>
  );

  // Home is lazy-loaded — findByText waits for Suspense to resolve
  const homeElement = await screen.findByText(/éCOLE|Accueil|Bienvenue/i);
  expect(homeElement).toBeInTheDocument();
});

test('renders login page at /connexion', async () => {
  render(
    <MemoryRouter initialEntries={['/connexion']}>
      <App />
    </MemoryRouter>
  );

  // LoginForm is eagerly imported, so it renders immediately
  expect(screen.getByRole('heading', { name: /connexion/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /connecter/i })).toBeInTheDocument();
  expect(screen.getByRole('combobox')).toBeInTheDocument();
});

test('redirects unknown routes without crashing', async () => {
  const { container } = render(
    <MemoryRouter initialEntries={['/unknown-route']}>
      <App />
    </MemoryRouter>
  );

  // Should render something (the redirect target or loading state)
  await waitFor(() => {
    expect(container.textContent).toBeTruthy();
  });
});
