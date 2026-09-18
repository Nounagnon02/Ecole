/**
 * CommandPalette — ouverture, filtrage par rôle, recherche API, clavier
 * (audit P2.7)
 *
 * 512 lignes sans test, alors que le composant décide de ce qu'un rôle a le
 * droit de voir : il liste les routes accessibles à l'utilisateur courant.
 * Une erreur de filtrage y exposerait des destinations qu'un compte ne devrait
 * pas connaître.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, within, fireEvent, waitFor, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import CommandPalette from '@/shared/components/ui/CommandPalette';
import useUIStore from '@/shared/stores/ui-store';
import { signIn, resetAuth } from './helpers/render';

const navigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const reel = await vi.importActual('react-router-dom');
  return { ...reel, useNavigate: () => navigate };
});

// `CommandPalette` consomme l'export par défaut (`apiClient`), pas le
// raccourci nommé `api`.
const apiGet = vi.fn(() => Promise.resolve({ data: [] }));
vi.mock('@/shared/lib/api-client', () => ({
  default: { get: (...args) => apiGet(...args) },
  api: { get: (...args) => apiGet(...args) },
}));

function monter() {
  return render(
    <MemoryRouter>
      <CommandPalette />
    </MemoryRouter>,
  );
}

function ouvrir() {
  act(() => {
    useUIStore.setState({ commandPaletteOpen: true });
  });
}

describe('CommandPalette', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    navigate.mockClear();
    apiGet.mockClear();
    apiGet.mockResolvedValue({ data: [] });
    resetAuth();
    act(() => useUIStore.setState({ commandPaletteOpen: false }));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('reste fermée tant que le store ne l’ouvre pas', () => {
    signIn('directeur');
    monter();

    expect(screen.queryByRole('dialog', { name: /palette de commandes/i })).not.toBeInTheDocument();
  });

  it('s’ouvre depuis le store et donne le focus au champ', async () => {
    signIn('directeur');
    monter();
    ouvrir();

    const dialogue = await screen.findByRole('dialog', { name: /palette de commandes/i });
    expect(dialogue).toBeInTheDocument();
    expect(within(dialogue).getByRole('combobox')).toBeInTheDocument();
  });

  it('se ferme sur Échap', async () => {
    signIn('directeur');
    monter();
    ouvrir();

    const dialogue = await screen.findByRole('dialog', { name: /palette de commandes/i });

    // `handleKeyDown` est posé sur le conteneur de la palette, pas sur
    // `window` : la touche doit partir de l'intérieur du dialogue.
    fireEvent.keyDown(within(dialogue).getByRole('combobox'), { key: 'Escape' });

    await waitFor(() =>
      expect(useUIStore.getState().commandPaletteOpen).toBe(false),
    );
  });

  it('n’expose à un élève que des destinations de son rôle', async () => {
    signIn('eleve');
    monter();
    ouvrir();

    const dialogue = await screen.findByRole('dialog', { name: /palette de commandes/i });

    // Les surfaces d'administration ne doivent pas figurer dans la liste d'un
    // élève : la palette est une carte de l'application, pas un annuaire.
    expect(within(dialogue).queryByText(/écoles/i)).not.toBeInTheDocument();
    expect(within(dialogue).queryByText(/utilisateurs/i)).not.toBeInTheDocument();
  });

  it('interroge l’API après le debounce, pas à chaque frappe', async () => {
    signIn('directeur');
    monter();
    ouvrir();

    const dialogue = await screen.findByRole('dialog', { name: /palette de commandes/i });
    const champ = within(dialogue).getByRole('combobox');

    fireEvent.change(champ, { target: { value: 'Ad' } });
    fireEvent.change(champ, { target: { value: 'Adj' } });
    fireEvent.change(champ, { target: { value: 'Adjo' } });

    // Avant le debounce de 300 ms : aucun appel.
    expect(apiGet).not.toHaveBeenCalled();

    await act(async () => {
      vi.advanceTimersByTime(350);
    });

    await waitFor(() => expect(apiGet).toHaveBeenCalled());

    // Une seule salve, sur la dernière valeur saisie : `q` voyage dans les
    // paramètres, pas dans l'URL.
    const recherches = apiGet.mock.calls.map(([, config]) => config?.params?.q);
    expect(recherches).toContain('Adjo');
    expect(recherches).not.toContain('Ad');
    expect(recherches).not.toContain('Adj');
  });

  it('filtre les destinations sur la saisie', async () => {
    signIn('directeur');
    monter();
    ouvrir();

    const dialogue = await screen.findByRole('dialog', { name: /palette de commandes/i });
    const champ = within(dialogue).getByRole('combobox');

    fireEvent.change(champ, { target: { value: 'zzzzz-introuvable' } });

    await act(async () => {
      vi.advanceTimersByTime(350);
    });

    await waitFor(() => {
      expect(within(dialogue).queryByRole('option')).not.toBeInTheDocument();
    });
  });
});
