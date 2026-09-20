/**
 * DataTable — tri, recherche, pagination, sélection, états (audit P2.7)
 *
 * 475 lignes portant le tri, la recherche, la pagination et la sélection de
 * presque toutes les listes de l'application, sans aucun test. Une régression
 * y serait passée inaperçue sur chaque page à la fois.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, within, fireEvent } from '@testing-library/react';
import DataTable from '@/shared/components/ui/DataTable';

// `fireEvent` plutôt que `userEvent.setup()` : le projet est sur
// `@testing-library/user-event` 13, où `setup()` n'existe pas encore. C'est la
// convention des tests existants.

const COLONNES = [
  { key: 'nom', header: 'Nom', accessor: 'nom' },
  { key: 'classe', header: 'Classe', accessor: 'classe.nom' },
  { key: 'moyenne', header: 'Moyenne', accessor: 'moyenne' },
];

const ELEVES = [
  { id: 1, nom: 'Chabi', classe: { nom: '6e A' }, moyenne: 12 },
  { id: 2, nom: 'Adjovi', classe: { nom: '5e B' }, moyenne: 17 },
  { id: 3, nom: 'Bio', classe: { nom: '6e A' }, moyenne: 9 },
];

function lignesDeCorps() {
  const tableau = screen.getByRole('table');
  const corps = tableau.querySelector('tbody');
  return within(corps).getAllByRole('row');
}

function premiereColonneVisible() {
  return lignesDeCorps().map((ligne) => within(ligne).getAllByRole('cell')[0].textContent.trim());
}

describe('DataTable', () => {
  it('rend une ligne par élément et résout les accesseurs imbriqués', () => {
    render(<DataTable data={ELEVES} columns={COLONNES} />);

    expect(lignesDeCorps()).toHaveLength(3);
    // `classe.nom` doit être traversé, pas rendu comme [object Object].
    // Deux élèves partagent la 6e A, d'où `getAllByText`.
    expect(screen.getAllByText('6e A')).toHaveLength(2);
    expect(screen.getAllByText('5e B')).toHaveLength(1);
    expect(screen.queryByText(/\[object Object\]/)).not.toBeInTheDocument();
  });

  it('trie sur la colonne cliquée, puis inverse au second clic', () => {
    render(<DataTable data={ELEVES} columns={COLONNES} />);

    fireEvent.click(screen.getByRole('columnheader', { name: /nom/i }));
    expect(premiereColonneVisible()).toEqual(['Adjovi', 'Bio', 'Chabi']);

    fireEvent.click(screen.getByRole('columnheader', { name: /nom/i }));
    expect(premiereColonneVisible()).toEqual(['Chabi', 'Bio', 'Adjovi']);
  });

  it('expose la direction du tri via aria-sort', () => {
    render(<DataTable data={ELEVES} columns={COLONNES} />);

    const entete = screen.getByRole('columnheader', { name: /nom/i });
    expect(entete).toHaveAttribute('aria-sort', 'none');

    fireEvent.click(entete);
    expect(entete).toHaveAttribute('aria-sort', 'ascending');

    fireEvent.click(entete);
    expect(entete).toHaveAttribute('aria-sort', 'descending');
  });

  it('filtre sur la recherche, toutes colonnes confondues', () => {
    render(<DataTable data={ELEVES} columns={COLONNES} />);

    fireEvent.change(screen.getByLabelText(/rechercher dans le tableau/i), { target: { value: 'Adjovi' } });
    expect(premiereColonneVisible()).toEqual(['Adjovi']);
  });

  it('affiche le message vide quand la recherche ne rend rien', () => {
    render(<DataTable data={ELEVES} columns={COLONNES} emptyMessage="Aucun élève" />);

    fireEvent.change(screen.getByLabelText(/rechercher dans le tableau/i), { target: { value: 'zzzz' } });
    expect(screen.getByText('Aucun élève')).toBeInTheDocument();
  });

  it('pagine au-delà de itemsPerPage et navigue entre les pages', () => {
    const beaucoup = Array.from({ length: 12 }, (_, i) => ({
      id: i + 1,
      nom: `Eleve ${String(i + 1).padStart(2, '0')}`,
      classe: { nom: '6e A' },
      moyenne: 10,
    }));

    render(<DataTable data={beaucoup} columns={COLONNES} itemsPerPage={5} />);

    expect(lignesDeCorps()).toHaveLength(5);
    expect(screen.getByText(/12 résultats/)).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText(/page suivante/i));
    expect(premiereColonneVisible()[0]).toBe('Eleve 06');
  });

  it('remonte la sélection au parent', () => {
    const onSelectionChange = vi.fn();
    render(
      <DataTable
        data={ELEVES}
        columns={COLONNES}
        selectable
        onSelectionChange={onSelectionChange}
      />,
    );

    const cases = screen.getAllByRole('checkbox');
    fireEvent.click(cases[1]); // la première case est « tout sélectionner »

    expect(onSelectionChange).toHaveBeenCalled();
    const dernierAppel = onSelectionChange.mock.calls.at(-1)[0];
    expect(dernierAppel).toHaveLength(1);
  });

  it('déclenche onRowClick avec l’élément de la ligne', () => {
    const onRowClick = vi.fn();
    render(<DataTable data={ELEVES} columns={COLONNES} onRowClick={onRowClick} />);

    fireEvent.click(screen.getByText('Chabi'));

    expect(onRowClick).toHaveBeenCalledTimes(1);
    expect(onRowClick.mock.calls[0][0]).toMatchObject({ nom: 'Chabi' });
  });

  it('n’affiche aucune ligne de données pendant le chargement', () => {
    render(<DataTable data={[]} columns={COLONNES} loading />);

    expect(screen.queryByText('Chabi')).not.toBeInTheDocument();
  });
});
