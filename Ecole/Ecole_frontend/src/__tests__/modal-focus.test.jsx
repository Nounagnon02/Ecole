/**
 * Modal — le focus reste dans le champ pendant la saisie.
 *
 * Vu sur l'application installée sous Windows (16/11/2026, parcours 1) : dans
 * « Inscrire un élève », seule la première lettre de chaque champ passait.
 * L'effet du piège à focus dépendait de `onClose` ; le formulaire passe une
 * fonction neuve à chaque rendu, donc chaque frappe relançait l'effet, qui
 * remettait le focus sur le bouton de fermeture.
 */
import { describe, it, expect } from 'vitest';
import { useState } from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Modal from '@/shared/components/ui/Modal';

function Formulaire() {
  const [nom, setNom] = useState('');
  return (
    // `onClose` en ligne : une fonction neuve à chaque rendu, comme dans les formulaires réels.
    <Modal open onClose={() => setNom('')} title="Inscrire un élève">
      <label htmlFor="nom">Nom</label>
      <input id="nom" value={nom} onChange={(e) => setNom(e.target.value)} />
    </Modal>
  );
}

const unRendu = () => new Promise((r) => requestAnimationFrame(() => r()));

describe('Modal', () => {
  it('place le focus sur le bouton de fermeture à l’ouverture', async () => {
    render(<Formulaire />);
    await waitFor(() => expect(document.activeElement).toBe(screen.getByRole('button', { name: /fermer/i })));
  });

  it('garde le focus dans le champ pendant la saisie', async () => {
    render(<Formulaire />);
    await unRendu();
    const champ = screen.getByLabelText('Nom');
    champ.focus();

    for (const valeur of ['R', 'RE', 'REC']) {
      fireEvent.change(champ, { target: { value: valeur } });
      await unRendu();
      await unRendu();
      expect(document.activeElement).toBe(champ);
    }
    expect(champ).toHaveValue('REC');
  });

  it('ferme avec Échap en appelant la fonction de fermeture la plus récente', async () => {
    const appels = [];
    const { rerender } = render(<Modal open onClose={() => appels.push('ancienne')} title="Dialogue"><p>Contenu</p></Modal>);
    rerender(<Modal open onClose={() => appels.push('récente')} title="Dialogue"><p>Contenu</p></Modal>);

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(appels).toEqual(['récente']);
  });
});
