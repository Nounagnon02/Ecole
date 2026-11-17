/**
 * Card.Header — la prop `title`
 *
 * Huit `<Card.Header title="…" />` de la page Paramètres passaient un titre que
 * le composant ignorait (il ne rendait que `children`) : aucun de ces titres
 * n'apparaissait jamais à l'écran.
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Card from '@/shared/components/ui/Card';

describe('Card.Header', () => {
  it('affiche le titre passé en prop', () => {
    render(<Card><Card.Header title="Sessions actives" /></Card>);
    expect(screen.getByRole('heading', { name: 'Sessions actives' })).toBeInTheDocument();
  });

  it('continue d’afficher ses enfants, avec ou sans titre', () => {
    render(<Card><Card.Header><span>contenu libre</span></Card.Header></Card>);
    expect(screen.getByText('contenu libre')).toBeInTheDocument();
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
  });
});

describe('Card — marge intérieure', () => {
  // La prop `padding` était acceptée mais ignorée : un filtre posé directement
  // dans une carte touchait son bord (« Classe » collé au trait, emploi du temps).
  it('donne une marge quand on la demande', () => {
    const { container } = render(<Card padding><span>Classe</span></Card>);
    expect(container.firstChild.className).toMatch(/\bp-4\b/);
  });

  it('n’en donne pas par défaut : Card.Header et Card.Body ont la leur', () => {
    const { container } = render(<Card><Card.Body>contenu</Card.Body></Card>);
    expect(container.firstChild.className).not.toMatch(/\bp-4\b/);
  });

  it('laisse une classe de la page l’emporter', () => {
    const { container } = render(<Card padding className="p-0"><span>x</span></Card>);
    expect(container.firstChild.className).toMatch(/\bp-0\b/);
    expect(container.firstChild.className).not.toMatch(/\bp-4\b/);
  });
});
