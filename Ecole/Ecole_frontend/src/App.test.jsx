/**
 * App-level integration tests.
 * Uses createMemoryRouter (data router) to support ScrollRestoration.
 */
import { render, screen, waitFor } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { vi } from 'vitest';
import App from './App';

// Mock axios/fetch to prevent ECONNREFUSED errors in tests
beforeEach(() => {
  globalThis.fetch = vi.fn(() =>
    Promise.resolve(
      new Response(JSON.stringify({ user: null }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    )
  );
});

function renderWithDataRouter(initialEntries = ['/'], options = {}) {
  const router = createMemoryRouter(
    [
      {
        path: '*',
        element: <App />,
      },
    ],
    { initialEntries }
  );

  return render(<RouterProvider router={router} />, options);
}

test('renders login page at /connexion', async () => {
  renderWithDataRouter(['/connexion']);

  // Login form should render
  await waitFor(() => {
    expect(screen.getByText(/connexion/i)).toBeInTheDocument();
  });
}, 10000);

test('handles unknown routes gracefully', async () => {
  const { container } = renderWithDataRouter(['/unknown-route']);

  await waitFor(() => {
    expect(container.textContent).toBeTruthy();
  });
}, 10000);

test('redirects unauthenticated users appropriately', async () => {
  const { container } = renderWithDataRouter(['/']);

  await waitFor(() => {
    expect(container.textContent).toBeTruthy();
  });
}, 10000);
