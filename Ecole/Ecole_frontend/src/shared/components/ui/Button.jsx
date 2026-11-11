/**
 * Button — Bouton de la proposition C
 *
 * Variants : primary (vert) | secondary | ghost | outline | danger
 * Sizes    : sm | md | lg
 */

import { forwardRef, useCallback, useEffect, useRef, useState } from 'react';
import { cn } from '@/shared/lib/utils';
import { useTranslation } from '@/shared/i18n';

const variants = {
  primary:
    'bg-[var(--action)] text-white hover:bg-[var(--action-hover)] active:bg-[var(--action-active)] shadow-[var(--shadow-1)] hover:shadow-[var(--shadow-2)]',
  secondary:
    'bg-[var(--action)] text-white hover:bg-[var(--action-hover)] active:bg-[var(--action-active)]',
  ghost:
    'text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] active:bg-[var(--surface-subtle)]',
  outline:
    'border border-[var(--border)] text-[var(--text-primary)] hover:bg-[var(--surface-hover)] active:bg-[var(--surface-subtle)]',
  danger:
    'bg-[var(--red)] text-white hover:bg-[var(--red-hover)]',
};

const sizes = {
  sm: 'min-h-11 px-3 py-2 text-sm gap-1.5 rounded-md',
  md: 'min-h-11 px-4 py-2.5 text-sm gap-2 rounded-md',
  lg: 'min-h-[52px] px-6 py-3 text-base gap-2.5 rounded-md',
};

const Button = forwardRef(function Button(
  {
    children,
    variant = 'primary',
    size = 'md',
    className,
    disabled,
    loading,
    icon,
    type = 'button',
    ...props
  },
  ref
) {
  const { t } = useTranslation();
  const local = useRef(null);
  const setRefs = useCallback((node) => {
    local.current = node;
    if (typeof ref === 'function') ref(node);
    else if (ref) ref.current = node;
  }, [ref]);

  // Un bouton sans action ne doit pas avoir l'air de fonctionner.
  //
  // L'audit a relevé 111 boutons (« Nouvel élève », « Nouveau paiement »,
  // « Exporter »…) qui ne faisaient rien au clic : ni gestionnaire, ni envoi de
  // formulaire, ni lien. Rien ne les distinguait d'un bouton câblé, et
  // l'utilisateur concluait à une panne. Un tel bouton est désormais désactivé
  // et annoncé « bientôt disponible », ici, pour toutes les pages à la fois.
  //
  // Sont considérés comme câblés : un gestionnaire de clic, `type="submit"` ou
  // `"reset"`, et un bouton placé dans un lien, une étiquette ou un `<summary>`
  // (c'est alors le parent qui agit) — d'où la vérification après montage.
  const sansGestionnaire = type === 'button' && !props.onClick && !props.onMouseDown
    && !props.onPointerDown && !props.formAction;
  const [inerte, setInerte] = useState(false);
  useEffect(() => {
    setInerte(sansGestionnaire && !local.current?.closest('a[href], label, summary'));
  }, [sansGestionnaire]);

  return (
    <button
      ref={setRefs}
      type={type}
      disabled={disabled || loading || inerte}
      data-indisponible={inerte ? 'true' : undefined}
      aria-busy={loading ? 'true' : undefined}
      className={cn(
        'inline-flex items-center justify-center font-semibold transition-all duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-ring)]',
        'disabled:pointer-events-none disabled:opacity-50',
        'select-none',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
      {...(inerte ? { title: t('common.coming_soon') } : {})}
    >
      {loading ? (
        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : icon ? (
        <span className="shrink-0">{icon}</span>
      ) : null}
      {children && <span>{children}</span>}
      {inerte && <span className="sr-only"> ({t('common.coming_soon')})</span>}
    </button>
  );
});

export default Button;
