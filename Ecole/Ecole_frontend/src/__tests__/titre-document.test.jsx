/*
 * Titre de l'onglet (audit BUG-026) : toutes les pages s'appelaient
 * « École — Gestion Scolaire ». Un lecteur d'écran, l'historique et la liste
 * des onglets ne permettaient pas de savoir où l'on était.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { render, act, cleanup } from '@testing-library/react';
import TitreDocument, { TITRE_PAR_DEFAUT } from '@/shared/components/layout/TitreDocument';

const attendre = () => act(() => new Promise((r) => setTimeout(r, 30)));

describe('TitreDocument', () => {
  afterEach(() => { cleanup(); document.title = ''; });

  it('reprend le titre principal de la page', async () => {
    render(<><TitreDocument /><main><h1>Paiements</h1></main></>);
    await attendre();
    expect(document.title).toBe('Paiements · École');
  });

  it('suit le titre quand la page change', async () => {
    const { rerender } = render(<><TitreDocument /><main><h1>Paiements</h1></main></>);
    await attendre();
    rerender(<><TitreDocument /><main><h1>Programme des classes</h1></main></>);
    await attendre();
    expect(document.title).toBe('Programme des classes · École');
  });

  it('préfère le titre de la zone principale à celui d’un dialogue ou d’un en-tête', async () => {
    render(<><TitreDocument /><header><h1>Menu</h1></header><main id="main-content"><h1>Bulletins</h1></main></>);
    await attendre();
    expect(document.title).toBe('Bulletins · École');
  });

  it('revient au titre de l’application sans titre de page', async () => {
    render(<><TitreDocument /><main><p>Chargement</p></main></>);
    await attendre();
    expect(document.title).toBe(TITRE_PAR_DEFAUT);
  });
});
