/** Identité de la proposition C : livre, toit et soleil. */
export default function Brand({ compact = false, className = '' }) {
  return (
    <span className={`ecole-brand ${className}`}>
      <svg width="34" height="34" viewBox="0 0 48 48" fill="none" aria-hidden="true">
        <path d="M5 25 24 9l19 16" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M10 30c5-2 10-1 14 2 4-3 9-4 14-2v10c-5-2-10-1-14 2-4-3-9-4-14-2V30Z" fill="currentColor" />
        <path d="M24 33v9" stroke="var(--brand)" strokeWidth="1.5" />
        <circle cx="24" cy="21" r="3.5" fill="var(--highlight)" />
      </svg>
      {!compact && <span>École</span>}
    </span>
  );
}
