/**
 * Zones qui défilent (axe : scrollable-region-focusable).
 *
 * Un tableau plus large que l'écran défile dans son cadre. Sans tabindex,
 * la personne qui navigue au clavier ne pouvait pas le faire défiler : les
 * colonnes de droite lui restaient inaccessibles.
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Table from '@/shared/components/ui/Table';

describe('Table partagé', () => {
  it('est une région nommée, atteignable au clavier', () => {
    render(<Table><tbody><tr><td>1</td></tr></tbody></Table>);

    const zone = screen.getByRole('region', { name: 'Tableau (défilement horizontal)' });
    expect(zone).toHaveAttribute('tabindex', '0');
  });

  it('prend le nom donné par la page quand il y en a un', () => {
    render(<Table label="Élèves de 6e A"><tbody><tr><td>1</td></tr></tbody></Table>);

    expect(screen.getByRole('region', { name: 'Élèves de 6e A' })).toBeInTheDocument();
  });
});
