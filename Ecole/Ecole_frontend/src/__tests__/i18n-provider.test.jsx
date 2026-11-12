/**
 * I18nProvider + LanguageSwitcher
 *
 * Le sélecteur de langue n'existait pas : tout le câblage `t()` était donc
 * invisible pour l'utilisateur. Ces tests fixent le contrat de bout en bout —
 * choisir une langue change le texte, persiste, et inverse la mise en page en
 * arabe, y compris après un rechargement.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { I18nProvider, useTranslation, translate } from '@/shared/i18n';
import LanguageSwitcher from '@/shared/components/layout/LanguageSwitcher';

function Probe() {
  const { t } = useTranslation();
  return <p data-testid="probe">{t('common.save')}</p>;
}

function monter() {
  return render(
    <I18nProvider>
      <LanguageSwitcher />
      <Probe />
    </I18nProvider>,
  );
}

beforeEach(() => {
  localStorage.clear();
  document.documentElement.lang = 'fr';
  document.documentElement.dir = 'ltr';
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('LanguageSwitcher', () => {
  it('propose les deux langues, nommées dans leur propre langue', () => {
    monter();
    const options = screen.getAllByRole('option').map((o) => o.textContent);
    // L'arabe, incomplet, a été retiré (lot 10).
    expect(options).toEqual(['Français', 'English']);
  });

  it('démarre en français', () => {
    monter();
    expect(screen.getByTestId('probe')).toHaveTextContent('Enregistrer');
    expect(screen.getByRole('combobox')).toHaveValue('fr');
  });

  it("change le texte à l'écran quand on choisit l'anglais", () => {
    monter();
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'en' } });

    expect(screen.getByTestId('probe')).toHaveTextContent('Save');
    expect(document.documentElement.lang).toBe('en');
    expect(document.documentElement.dir).toBe('ltr');
  });

  it('mémorise le choix et le restaure au montage', () => {
    const { unmount } = monter();
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'en' } });
    expect(localStorage.getItem('ecole-locale')).toBe('en');
    unmount();

    monter();
    expect(screen.getByRole('combobox')).toHaveValue('en');
    expect(document.documentElement.lang).toBe('en');
  });

  it('ramène au français, de gauche à droite, un appareil resté sur l’arabe', () => {
    // L'arabe a été retiré : une préférence ancienne ne doit ni afficher des
    // clés brutes ni laisser la page en lecture de droite à gauche.
    localStorage.setItem('ecole-locale', 'ar');
    monter();

    expect(screen.getByRole('combobox')).toHaveValue('fr');
    expect(screen.getByTestId('probe')).toHaveTextContent('Enregistrer');
    expect(document.documentElement.dir).toBe('ltr');
    expect(document.documentElement.lang).toBe('fr');
  });

  it('ignore une locale mémorisée inconnue', () => {
    localStorage.setItem('ecole-locale', 'klingon');
    monter();
    expect(screen.getByRole('combobox')).toHaveValue('fr');
  });

  it('reste utilisable quand le stockage est refusé', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('denied'); });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('denied'); });

    monter();
    expect(screen.getByTestId('probe')).toHaveTextContent('Enregistrer');

    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'en' } });
    expect(screen.getByTestId('probe')).toHaveTextContent('Save');
  });
});

describe('repli sur le français', () => {
  it("affiche le français, pas la clé, quand une locale n'a pas la clé", () => {
    // Locale inconnue = aucune ressource : l'équivalent le plus net d'une
    // traduction absente.
    expect(translate('common.save', 'xx')).toBe('Enregistrer');
  });

  it("ne renvoie la clé brute que si elle est absente partout", () => {
    expect(translate('pages.n_existe.pas', 'en')).toBe('pages.n_existe.pas');
  });

  it('interpole les paramètres', () => {
    expect(translate('pages.ai.predictive.trend', 'en', { n: 3 })).toBe('Trend 3');
    expect(translate('pages.ai.predictive.trend', 'fr', { n: 3 })).toBe('Tendance 3');
  });
});
