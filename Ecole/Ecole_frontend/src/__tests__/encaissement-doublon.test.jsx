/*
 * Encaissement au guichet (audit du 14/11, N-01 et N-02).
 *
 * Deux envois du même versement — double clic, réseau qui rejoue, onglet
 * resté ouvert — créditaient deux fois l'échéance. Le dialogue joint une clé
 * propre à ce versement, identique à chaque nouvel essai et renouvelée pour
 * le versement suivant.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import EncaissementDialog from '@/app/features/paiements/EncaissementDialog';
import apiClient from '@/shared/lib/api-client';
import { telechargerRecuVersement } from '@/shared/lib/telecharger';

vi.mock('@/shared/lib/api-client', () => ({ default: { get: vi.fn(), post: vi.fn() } }));

const echeance = (id) => ({ id, type: 'Scolarité', reste: 60000 });
const envoyer = () => fireEvent.click(screen.getByRole('button', { name: 'Enregistrer le versement' }));
const cleEnvoyee = (n) => apiClient.post.mock.calls[n][1].cle_idempotence;

describe('EncaissementDialog : un versement, une clé', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renvoie la même clé quand on réessaie le même versement', async () => {
    apiClient.post.mockRejectedValueOnce(new Error('Réseau indisponible')).mockResolvedValueOnce({ data: { data: { reference: 'R1' } } });
    const onDone = vi.fn();
    render(<EncaissementDialog echeance={echeance(7)} onClose={() => {}} onDone={onDone} />);

    envoyer();
    await screen.findByText('Réseau indisponible');
    envoyer();
    await waitFor(() => expect(onDone).toHaveBeenCalled());

    expect(cleEnvoyee(0)).toMatch(/^[\w-]{16,64}$/);
    expect(cleEnvoyee(1)).toBe(cleEnvoyee(0));
  });

  it('change de clé pour le versement suivant', async () => {
    apiClient.post.mockResolvedValue({ data: { data: { reference: 'R' } } });
    const { rerender } = render(<EncaissementDialog echeance={echeance(7)} onClose={() => {}} onDone={() => {}} />);
    envoyer();
    await waitFor(() => expect(apiClient.post).toHaveBeenCalledTimes(1));

    rerender(<EncaissementDialog echeance={echeance(8)} onClose={() => {}} onDone={() => {}} />);
    envoyer();
    await waitFor(() => expect(apiClient.post).toHaveBeenCalledTimes(2));

    expect(cleEnvoyee(1)).not.toBe(cleEnvoyee(0));
  });

  it('ne laisse pas partir un second envoi pendant le premier', async () => {
    let terminer;
    apiClient.post.mockReturnValue(new Promise((r) => { terminer = r; }));
    render(<EncaissementDialog echeance={echeance(7)} onClose={() => {}} onDone={() => {}} />);
    const bouton = screen.getByRole('button', { name: 'Enregistrer le versement' });
    fireEvent.submit(bouton.closest('form'));
    fireEvent.submit(bouton.closest('form'));
    terminer({ data: { data: {} } });
    await waitFor(() => expect(apiClient.post).toHaveBeenCalledTimes(1));
  });
});

describe('Reçu de versement', () => {
  it('télécharge le reçu du versement, pas la situation de l’échéance', async () => {
    apiClient.get.mockResolvedValue({ data: '<html></html>' });
    globalThis.URL.createObjectURL = vi.fn(() => 'blob:x');
    globalThis.URL.revokeObjectURL = vi.fn();
    await telechargerRecuVersement(42, 'VER/2026 01');
    expect(apiClient.get).toHaveBeenCalledWith('/comptable/versements/42/recu', { responseType: 'blob' });
  });
});
