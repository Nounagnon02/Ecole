/**
 * Button — un bouton sans action est désactivé et annoncé comme tel.
 *
 * L'audit a relevé 111 boutons distincts qui ne faisaient rien au clic
 * (BUG-002). Rien ne les distinguait d'un bouton qui fonctionne.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Link } from 'react-router-dom';
import Button from '@/shared/components/ui/Button';

describe('Button sans action', () => {
  it('est désactivé et dit « bientôt disponible »', () => {
    render(<Button>Nouvel élève</Button>);
    const bouton = screen.getByRole('button', { name: /Nouvel élève/ });
    expect(bouton).toBeDisabled();
    expect(bouton).toHaveAttribute('title', 'Bientôt disponible');
    expect(bouton).toHaveAccessibleName(/bientôt disponible/i);
  });

  it('reste actif avec un gestionnaire de clic', () => {
    render(<Button onClick={vi.fn()}>Publier</Button>);
    expect(screen.getByRole('button', { name: 'Publier' })).toBeEnabled();
  });

  it('reste actif quand il envoie un formulaire', () => {
    render(<form><Button type="submit">Enregistrer</Button></form>);
    expect(screen.getByRole('button', { name: 'Enregistrer' })).toBeEnabled();
  });

  it('reste actif dans un lien : c’est le lien qui agit', () => {
    render(<MemoryRouter><Link to="/notes"><Button>Voir les notes</Button></Link></MemoryRouter>);
    expect(screen.getByRole('button', { name: 'Voir les notes' })).toBeEnabled();
  });

  it('reste actif dans une étiquette de champ (choix de fichier)', () => {
    render(<label><Button>Choisir un fichier</Button><input type="file" /></label>);
    expect(screen.getByRole('button')).toBeEnabled();
  });

  it('garde son propre titre quand il est câblé', () => {
    render(<Button onClick={vi.fn()} title="Actualiser la liste">↻</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('title', 'Actualiser la liste');
  });
});
