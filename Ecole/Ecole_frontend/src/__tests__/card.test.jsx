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
