/**
 * ConfigurationPage était ~90 % en français codé en dur : seuls le titre, le
 * sous-titre et les boutons passaient par `t()`, les 5 sections (titres,
 * descriptions, ~20 libellés de champs) venaient d'un tableau statique
 * jamais traduit. Ce test fixe le contrat : un visiteur anglophone doit
 * réellement voir un texte différent, pas la même chaîne française qu'un
 * francophone.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { I18nProvider } from '@/shared/i18n';
import ConfigurationPage from '@/app/features/admin/ConfigurationPage';

function monter(initialLocale = 'fr') {
  return render(
    <I18nProvider initialLocale={initialLocale}>
      <ConfigurationPage />
    </I18nProvider>,
  );
}

beforeEach(() => {
  localStorage.clear();
});

describe('ConfigurationPage — i18n', () => {
  it('affiche les libellés de la section active en français par défaut', () => {
    monter('fr');
    expect(screen.getByRole('heading', { name: 'Général' })).toBeInTheDocument();
    // La description apparaît deux fois (nav latérale tronquée + section
    // active) : les deux doivent être la même chaîne traduite.
    expect(screen.getAllByText("Paramètres généraux de l'application").length).toBeGreaterThan(0);
    expect(screen.getByText("Nom de l'application")).toBeInTheDocument();
  });

  it('traduit les titres de section, descriptions et libellés en anglais', () => {
    monter('en');
    expect(screen.getByRole('heading', { name: 'General' })).toBeInTheDocument();
    expect(screen.getAllByText('General application settings').length).toBeGreaterThan(0);
    expect(screen.getByText('Application name')).toBeInTheDocument();
  });

  it('traduit aussi le contenu des autres sections, pas seulement celle affichée par défaut', () => {
    monter('en');
    fireEvent.click(screen.getByText('Security'));

    expect(screen.getByRole('heading', { name: 'Security' })).toBeInTheDocument();
    expect(screen.getByText('Two-factor authentication')).toBeInTheDocument();
    // Valeur traduite (une vraie phrase), pas seulement le libellé du champ.
    expect(screen.getByText('Optional')).toBeInTheDocument();
  });

  it("ne traduit pas les valeurs non linguistiques (année, fuseau, devise)", () => {
    monter('en');
    expect(screen.getByText('2025-2026')).toBeInTheDocument();
    expect(screen.getByText('Africa/Abidjan (UTC+0)')).toBeInTheDocument();
  });
});
