/**
 * fix-dashboards.mjs — Scan dashboards/ + landing/ + features/ for indigo, fix all
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

const base = '/home/prince-kangbode/Mes_projets/Ecole/Ecole/Ecole_frontend';

const DIRS = [
  join(base, 'src/app/dashboards'),
  join(base, 'src/app/landing'),
  join(base, 'src/app/features'),
  join(base, 'src/shared/components'),
  join(base, 'src/app/error'),
];

const replacements = [
  // StatsCard colors (single-quoted)
  ["color: 'indigo'", "color: 'primary'"],
  ["color={'indigo'}", "color={'primary'}"],

  // Gradient to accent solid
  ["bg-gradient-to-r from-indigo-600 to-sky-500", "bg-[var(--accent)]"],
  ["bg-gradient-to-br from-indigo-500 to-purple-600", "bg-[var(--accent)]"],
  ["bg-gradient-to-br from-indigo-50 to-white", "bg-[var(--accent-subtle)]"],

  // Large glow/blur blobs → remove or mute
  ["bg-indigo-50/70 blur-3xl dark:bg-indigo-950/20", "bg-[var(--accent-subtle)]/30 blur-3xl"],
  ["bg-indigo-50/30 blur-3xl dark:bg-indigo-950/10", "bg-[var(--accent-subtle)]/20 blur-3xl"],

  // Pill/badge tags with indigo
  ["border-indigo-200 bg-indigo-50 px-4 py-1.5 text-xs font-medium text-indigo-700 dark:border-indigo-800/50 dark:bg-indigo-950/30 dark:text-indigo-300", "border-[var(--accent)]/30 bg-[var(--accent-subtle)] px-4 py-1.5 text-xs font-medium text-[var(--accent)] dark:border-[var(--accent)]/20"],

  // Indigo live dot
  ["bg-indigo-500", "bg-[var(--accent)]"],

  // Gradient text
  ["from-indigo-600 to-sky-500 bg-clip-text text-transparent", "text-[var(--accent)]"],

  // Card hover states with indigo
  ["border-neutral-200 bg-white p-6 transition-all hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-50 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-indigo-800 dark:hover:shadow-indigo-950/20", "border-[var(--border)] bg-white p-6 transition-all hover:border-[var(--accent)]/30 hover:shadow-3 dark:border-neutral-800 dark:bg-neutral-900"],

  // Stat number in indigo
  ["text-4xl font-bold text-indigo-600 dark:text-indigo-400", "text-4xl font-bold text-[var(--accent)] dark:text-[var(--accent)]"],

  // Large CTA buttons
  ["rounded-xl bg-indigo-600 px-8 py-3 text-sm font-semibold text-white shadow-xl shadow-indigo-200 transition-all hover:bg-indigo-500 active:scale-[0.98] dark:shadow-indigo-900/30", "rounded-lg bg-[var(--accent)] px-8 py-3 text-sm font-semibold text-white shadow-3 transition-all hover:bg-[var(--accent-hover)] active:scale-[0.98]"],

  ["rounded-xl bg-indigo-600 px-5 py-2 text-sm font-medium text-white shadow-lg shadow-indigo-200 transition-colors hover:bg-indigo-500 dark:shadow-indigo-900/30", "rounded-lg bg-[var(--accent)] px-5 py-2 text-sm font-medium text-white shadow-2 transition-colors hover:bg-[var(--accent-hover)]"],

  // Small accent icon containers
  ["flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600", "flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent)]"],

  ["flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600", "flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--accent)]"],

  // Feature icon containers in dashboards
  ["flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-900/30", "flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--accent-subtle)]"],

  ["flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400", "flex h-8 w-8 items-center justify-center rounded-full bg-[var(--accent-subtle)] text-xs font-semibold text-[var(--accent)]"],

  // Skeleton placeholder items
  ["h-4 w-20 rounded-full bg-indigo-100 dark:bg-indigo-900/30", "h-4 w-20 rounded-full bg-[var(--border-light)]"],
  ["h-6 flex-1 rounded-full bg-indigo-100 dark:bg-indigo-900/30", "h-6 flex-1 rounded-full bg-[var(--border-light)]"],

  // Active tabs/borders pattern (same used everywhere in dashboards)
  ["border-indigo-500 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400", "border-[var(--accent)] text-[var(--accent)] dark:text-[var(--accent)] dark:border-[var(--accent)]"],
  ["border-indigo-500 text-indigo-600 dark:text-indigo-400", "border-[var(--accent)] text-[var(--accent)] dark:text-[var(--accent)]"],
  ["border-indigo-500 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400 dark:text-indigo-400", "border-[var(--accent)] text-[var(--accent)] dark:text-[var(--accent)] dark:border-[var(--accent)]"],

  // Subject/class time indicators
  ["text-xs font-semibold text-indigo-600 dark:text-indigo-400", "text-xs font-semibold text-[var(--accent)] dark:text-[var(--accent)]"],
  ["font-semibold text-indigo-600 dark:text-indigo-400", "font-semibold text-[var(--accent)] dark:text-[var(--accent)]"],

  // Blue-dot activity indicators
  ["bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400", "bg-[var(--accent-subtle)] text-[var(--accent)]"],
  ["bg-indigo-50/30 dark:bg-indigo-500/5", "bg-[var(--accent-subtle)]"],
  ["h-2 w-2 rounded-full bg-indigo-500", "h-2 w-2 rounded-full bg-[var(--accent)]"],
  ["h-2.5 w-2.5 rounded-full bg-indigo-500", "h-2.5 w-2.5 rounded-full bg-[var(--accent)]"],

  // Unread message indicators
  ["msg.unread && 'bg-indigo-50/30 dark:bg-indigo-500/5'", "msg.unread && 'bg-[var(--accent-subtle)]'"],

  // Time badges in enseignant dashboard
  ["w-16 h-14 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400", "w-16 h-14 rounded-lg bg-[var(--accent-subtle)] text-[var(--accent)]"],

  // Skip-to-content link
  ["sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-xl focus:bg-indigo-600 focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-white focus:shadow-lg focus:outline-none", "sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-[var(--accent)] focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-white focus:shadow-3 focus:outline-none"],

  // Motif badges colors (recharts data)
  ["color: 'bg-indigo-500'", "color: 'bg-[var(--accent)]'"],

  // General indigo bg subtle
  ["bg-indigo-100 dark:bg-indigo-900/30", "bg-[var(--accent-subtle)]"],
  ["bg-indigo-50 dark:bg-indigo-500/10", "bg-[var(--accent-subtle)]"],
  ["bg-indigo-50/30", "bg-[var(--accent-subtle)]/30"],

  // General indigo text
  ["text-indigo-700", "text-[var(--accent)]"],
  ["text-indigo-600 dark:text-indigo-400", "text-[var(--accent)]"],
  ["text-indigo-600", "text-[var(--accent)]"],
  ["text-indigo-400", "text-[var(--accent)]"],
  ["text-indigo-300", "text-[var(--accent)]"],
  ["text-indigo-200", "text-[var(--accent)]/60"],

  // General indigo borders
  ["border-indigo-200", "border-[var(--accent)]/30"],
  ["border-indigo-500", "border-[var(--accent)]"],
  ["border-indigo-300", "border-[var(--accent)]/40"],

  // Shadows
  ["shadow-xl shadow-indigo-200", "shadow-3"],
  ["shadow-lg shadow-indigo-200", "shadow-2"],
  ["shadow-indigo-50", "shadow-1"],
  ["hover:shadow-indigo-50 dark:hover:shadow-indigo-950/20", "hover:shadow-2"],
  ["hover:shadow-indigo-50", "hover:shadow-2"],
  ["dark:shadow-indigo-900/30", ""],
  ["dark:shadow-indigo-950/20", ""],

  // dark: variants
  ["dark:bg-indigo-500/10", "bg-[var(--accent-subtle)]"],
  ["dark:bg-indigo-900/30", "bg-[var(--accent-subtle)]"],
  ["dark:bg-indigo-950/30", "bg-[var(--accent-subtle)]"],
  ["dark:bg-indigo-950/20", "bg-[var(--accent-subtle)]"],
  ["dark:bg-indigo-950/10", "bg-[var(--accent-subtle)]/50"],
  ["dark:bg-indigo-500/5", "bg-[var(--accent-subtle)]"],
  ["dark:bg-indigo-500/8", "bg-[var(--accent-subtle)]"],
  ["dark:bg-indigo-500/15", "bg-[var(--accent-subtle)]"],
  ["dark:text-indigo-400", "text-[var(--accent)]"],
  ["dark:text-indigo-300", "text-[var(--accent)]"],
  ["dark:border-indigo-800/50", "border-[var(--accent)]/20"],
  ["dark:border-indigo-800", "border-[var(--accent)]/20"],
  ["dark:border-indigo-700", "border-[var(--accent)]/30"],
  ["dark:border-indigo-600", "border-[var(--accent)]/40"],
  ["dark:border-indigo-500", "border-[var(--accent)]"],
  ["dark:border-indigo-400", "border-[var(--accent)]"],
  ["dark:hover:border-indigo-800", "hover:border-[var(--accent)]/20"],
  ["dark:hover:border-indigo-700", "hover:border-[var(--accent)]/30"],
  ["dark:hover:text-indigo-400", "hover:text-[var(--accent)]"],
  ["dark:hover:text-indigo-300", "hover:text-[var(--accent)]"],
  ["dark:hover:bg-indigo-950/50", "hover:bg-[var(--accent-subtle)]"],
  ["dark:hover:bg-indigo-950/30", "hover:bg-[var(--accent-subtle)]"],
  ["dark:hover:bg-indigo-950/20", "hover:bg-[var(--accent-subtle)]"],
  ["dark:hover:bg-indigo-900/20", "hover:bg-[var(--accent-subtle)]"],
  ["dark:hover:bg-indigo-900/10", "hover:bg-[var(--accent-subtle)]"],

  // hover variants
  ["hover:border-indigo-200", "hover:border-[var(--accent)]/30"],
  ["hover:border-indigo-300", "hover:border-[var(--accent)]/30"],
  ["hover:border-indigo-700", "hover:border-[var(--accent)]"],
  ["hover:bg-indigo-100", "hover:bg-[var(--accent-subtle)]"],
  ["hover:bg-indigo-50", "hover:bg-[var(--accent-subtle)]"],
  ["hover:bg-indigo-600", "hover:bg-[var(--accent-hover)]"],
  ["hover:bg-indigo-500", "hover:bg-[var(--accent-hover)]"],
  ["hover:text-indigo-600", "hover:text-[var(--accent)]"],
  ["hover:text-indigo-400", "hover:text-[var(--accent)]"],

  // focus variants
  ["dark:focus:border-indigo-600", "dark:focus:border-[var(--accent)]"],
  ["dark:focus:ring-indigo-900/30", "dark:focus:ring-[var(--accent-subtle)]"],
  ["focus:ring-indigo-500/40", "focus:ring-[var(--accent)]/40"],
  ["focus:ring-indigo-100", "focus:ring-[var(--accent-subtle)]"],
  ["focus:ring-indigo-400/20", "focus:ring-[var(--accent)]/20"],
  ["focus:border-indigo-400", "focus:border-[var(--accent)]"],
  ["ring-indigo-500", "ring-[var(--accent)]"],
];

function* walk(dir) {
  if (!statSync(dir).isDirectory()) return;
  for (const e of readdirSync(dir)) {
    const f = join(dir, e);
    if (statSync(f).isDirectory()) yield* walk(f);
    else if (f.endsWith('.jsx') || f.endsWith('.js') || f.endsWith('.css')) yield f;
  }
}

let changed = 0;
let processed = 0;

for (const dir of DIRS) {
  try {
    for (const f of walk(dir)) {
      processed++;
      let content = readFileSync(f, 'utf8');
      const before = content;
      for (const [from, to] of replacements) {
        content = content.split(from).join(to);
      }
      if (content !== before) {
        writeFileSync(f, content);
        changed++;
      }
    }
  } catch (e) {
    console.error(`⚠️ Error scanning ${dir}: ${e.message}`);
  }
}

console.log(`✅ ${changed} fichiers modifiés (parcourus: ${processed})`);

// Final scan
const allDirs = DIRS;
let total = 0;
for (const dir of allDirs) {
  try {
    for (const f of walk(dir)) {
      const content = readFileSync(f, 'utf8');
      if (content.includes('indigo')) {
        const count = content.split('indigo').length - 1;
        const rel = f.replace(base, '').replace(/^\//, '');
        console.log(`  • ${rel}: ${count} occurrence(s)`);
        total++;
      }
    }
  } catch (e) { /* skip */ }
}

if (total === 0) {
  console.log('🎉 ZERO occurrences restantes !');
} else {
  console.log(`📊 ${total} fichiers avec encore 'indigo'`);
}
