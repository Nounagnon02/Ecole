import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { getRoleNavigation } from '@/features/roles/navigation-config';
import { PROTECTED_ROUTES } from '@/features/roles/route-config';
import { ROLES, hasRole } from '@/shared/types/roles';
import DataTable from '@/shared/components/ui/DataTable';
import Header from '@/shared/components/layout/Header';
import { signIn } from './helpers/render';
import PaiementCallbackPage from '@/app/features/paiements/PaiementCallbackPage';
import apiClient from '@/shared/lib/api-client';

vi.mock('@/shared/lib/api-client', () => ({ default: { get: vi.fn() } }));

describe('Proposition C : navigation métier', () => {
  it.each(Object.values(ROLES))('ne propose aucun lien interdit pour %s', role => {
    const routes = Object.values(PROTECTED_ROUTES);
    const items = getRoleNavigation(role);
    expect(items.length).toBeGreaterThan(0);
    expect(new Set(items.map(item => item.path)).size).toBe(items.length);
    for (const item of items) expect(hasRole(role, routes.find(route => route.path === item.path)?.roles)).toBe(true);
  });
  it('rend les dossiers médicaux et les soins accessibles avec leurs vrais libellés', () => {
    signIn('infirmier');
    render(<MemoryRouter><Header /></MemoryRouter>);
    expect(screen.getByRole('link', { name: 'Dossiers médicaux' })).toHaveAttribute('href', '/infirmier/dossiers');
    expect(screen.queryByRole('link', { name: 'Bibliothèque' })).not.toBeInTheDocument();
  });
  it('ouvre le menu mobile et le referme avec Échap', () => {
    signIn('parent');
    render(<MemoryRouter><Header /></MemoryRouter>);
    const button = screen.getByRole('button', { name: 'Ouvrir le menu' });
    fireEvent.click(button);
    expect(button).toHaveAttribute('aria-expanded', 'true');
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(button).toHaveAttribute('aria-expanded', 'false');
  });
});

describe('Proposition C : listes', () => {
  const columns = [{ key:'name', header:'Nom' }, { key:'code', header:'Code', sortable:false }];
  const data = Array.from({ length:60 }, (_,i) => ({ id:i+1, name:`Élève ${String(i+1).padStart(2,'0')}`, code:60-i }));
  it('permet 50 lignes et ne reste pas sur une page vide après une suppression', () => {
    const view = render(<DataTable data={data} columns={columns} />);
    fireEvent.change(screen.getByLabelText('Lignes par page'), { target:{ value:'50' } });
    expect(within(screen.getByRole('table').querySelector('tbody')).getAllByRole('row')).toHaveLength(50);
    fireEvent.click(screen.getByLabelText('Page suivante'));
    view.rerender(<DataTable data={data.slice(0,2)} columns={columns} />);
    expect(screen.getByText('Élève 01')).toBeVisible();
  });
  it('respecte les colonnes non triables et permet le tri au clavier', () => {
    render(<DataTable data={data.slice(0,2)} columns={columns} />);
    fireEvent.click(screen.getByRole('columnheader', { name:'Code' }));
    expect(screen.getByRole('table').querySelector('tbody tr')).toHaveTextContent('Élève 01');
    const name = screen.getByRole('columnheader', { name:'Nom' });
    fireEvent.keyDown(name, { key:'Enter' });
    expect(name).toHaveAttribute('aria-sort','ascending');
  });
});

describe('Proposition C : confirmation de paiement', () => {
  beforeEach(() => vi.clearAllMocks());
  const show = () => render(<MemoryRouter initialEntries={['/paiement/callback?transaction_id=123']}><PaiementCallbackPage /></MemoryRouter>);
  it('ne transforme pas une panne réseau en paiement refusé et permet de vérifier à nouveau', async () => {
    apiClient.get.mockRejectedValueOnce(new Error('Network')).mockResolvedValueOnce({ data:{ success:true, status:'approved' } });
    show();
    expect(await screen.findByText('Confirmation indisponible')).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name:'Vérifier à nouveau' }));
    expect(await screen.findByRole('heading', { name:/confirmé|réussi/i })).toBeVisible();
  });
  it('conserve le statut en attente et laisse quitter la page sans déclarer un succès', async () => {
    apiClient.get.mockResolvedValue({ data:{ success:true, status:'pending' } });
    show();
    expect(await screen.findByText(/attend la confirmation de l’opérateur/)).toBeVisible();
    expect(screen.getByRole('button', { name:/retour/i })).toBeEnabled();
    expect(screen.queryByRole('heading', { name:/confirmé|réussi/i })).not.toBeInTheDocument();
  });
});
