/**
 * LanguageSwitcher — choix de la langue de l'interface.
 *
 * Les libellés sont écrits dans leur propre langue (« Français », « English »)
 * pour rester lisibles quelle que soit la locale active : quelqu'un qui s'est
 * trompé de langue doit pouvoir la retrouver sans la comprendre.
 */

import { Languages } from 'lucide-react';
import { LOCALES, useTranslation } from '@/shared/i18n';

export default function LanguageSwitcher({ className = '' }) {
  const { locale, setLocale, t } = useTranslation();

  return (
    <label
      className={
        // Texte secondaire (contraste suffisant) et anneau de focus : le `select`
        // n'a pas de contour propre.
        'flex h-9 items-center gap-1.5 rounded-lg px-2 text-[var(--text-secondary)] transition-all focus-within:ring-2 focus-within:ring-[var(--action)] ' +
        'hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)] ' + className
      }
    >
      <Languages className="h-4 w-4 shrink-0" aria-hidden="true" />
      <select
        value={locale}
        onChange={(e) => setLocale(e.target.value)}
        aria-label={t('header.language')}
        className="cursor-pointer bg-transparent text-xs font-medium outline-none"
      >
        {LOCALES.map(({ code, label }) => (
          <option key={code} value={code} className="bg-[var(--surface-raised)] text-[var(--text-primary)]  ">
            {label}
          </option>
        ))}
      </select>
    </label>
  );
}
