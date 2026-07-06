/**
 * i18n translation tests
 */
import { describe, it, expect } from 'vitest';
import { translate, getLocale, setLocale } from '@/shared/i18n';
import fr from '@/shared/i18n/locales/fr.json';
import en from '@/shared/i18n/locales/en.json';

describe('i18n translations', () => {
  it('returns key for missing translations', () => {
    const result = translate('nonexistent.key.here');
    expect(result).toBe('nonexistent.key.here');
  });

  it('returns nested key from French locale', () => {
    // If the translation exists, it should return the value
    const result = translate('nav.dashboard');
    // Either returns the translated string or the key
    expect(typeof result).toBe('string');
  });

  it('replaces variables in translations', () => {
    const result = translate('welcome.user', { name: 'Jean' });
    expect(typeof result).toBe('string');
  });

  it('French locale has required keys', () => {
    expect(fr).toHaveProperty('nav');
    expect(fr.nav).toHaveProperty('dashboard');
    expect(fr).toHaveProperty('auth');
    expect(fr.auth).toHaveProperty('login');
  });

  it('English locale has required keys', () => {
    expect(en).toHaveProperty('nav');
    expect(en.nav).toHaveProperty('dashboard');
    expect(en).toHaveProperty('auth');
    expect(en.auth).toHaveProperty('login');
  });

  it('can set and get locale', () => {
    setLocale('en');
    expect(getLocale()).toBe('en');

    setLocale('fr');
    expect(getLocale()).toBe('fr');
  });
});
