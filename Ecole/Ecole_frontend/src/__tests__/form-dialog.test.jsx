import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import FormDialog from '@/shared/components/ui/FormDialog';

const champs = [
  { name: 'titre', label: 'Titre', required: true },
  { name: 'type', label: 'Type', type: 'select', options: [{ value: 'a', label: 'A' }] },
  { name: 'places', label: 'Places', type: 'number' },
  { name: 'note', label: 'Note', type: 'textarea' },
];

describe('FormDialog', () => {
  it('signale un champ obligatoire vide sans envoyer', async () => {
    const onSubmit = vi.fn();
    render(<FormDialog open title="Nouveau" fields={champs} onSubmit={onSubmit} onClose={() => {}} />);

    fireEvent.click(screen.getByRole('button', { name: /Enregistrer/ }));

    expect(await screen.findByText('Champ obligatoire.')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('envoie des valeurs nettoyées et ferme sur succès', async () => {
    const onSubmit = vi.fn().mockResolvedValue({});
    const onClose = vi.fn();
    render(<FormDialog open title="Nouveau" fields={champs} initial={{ type: 'a' }} onSubmit={onSubmit} onClose={onClose} />);

    fireEvent.change(screen.getByLabelText(/^Titre/), { target: { value: '  Réunion  ' } });
    fireEvent.change(screen.getByLabelText(/^Places/), { target: { value: '12' } });
    fireEvent.click(screen.getByRole('button', { name: /Enregistrer/ }));

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(onSubmit).toHaveBeenCalledWith({ titre: 'Réunion', type: 'a', places: 12, note: null });
  });

  it('place l’erreur de l’API sous son champ, et le reste en bas', async () => {
    const onSubmit = vi.fn().mockRejectedValue({ errors: { titre: ['Titre déjà pris.'], autre: ['Quota atteint.'] } });
    render(<FormDialog open title="Nouveau" fields={champs} onSubmit={onSubmit} onClose={() => {}} />);

    fireEvent.change(screen.getByLabelText(/^Titre/), { target: { value: 'X' } });
    fireEvent.click(screen.getByRole('button', { name: /Enregistrer/ }));

    expect(await screen.findByText('Titre déjà pris.')).toBeInTheDocument();
    expect(within(screen.getByRole('dialog')).getByText('Quota atteint.')).toBeInTheDocument();
  });
});
