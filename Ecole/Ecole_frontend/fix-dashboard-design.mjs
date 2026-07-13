/**
 * fix-dashboard-design.mjs — Érudit dashboard redesign
 *
 * - Replace indigo/hex chart colors with warm Érudit palette
 * - Add font-fraunces to headings
 * - Clean up tooltip styles
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

const base = '/home/prince-kangbode/Mes_projets/Ecole/Ecole/Ecole_frontend/src/app/dashboards';

/* ─── Replacements ─────────────────────────────────────────────────── */
const replacements = [

  // ── COLORS arrays: replace indigo/purple/cyan with warm palette ──
  [`['#6366f1', '#10b981', '#f59e0b', '#ef4444']`, `['var(--accent)', '#5A7A63', '#C4943A', '#BA4A4A']`],
  [`['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']`, `['var(--accent)', '#5A7A63', '#C4943A', '#BA4A4A', '#1A3A3C']`],
  [`['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#8b5cf6', '#14b8a6']`, `['var(--accent)', '#5A7A63', '#C4943A', '#BA4A4A', '#4A6A8A', '#1A3A3C', '#787066']`],
  [`['#6366f1', '#10b981', '#f59e0b', '#06b6d4', '#8b5cf6', '#ef4444']`, `['var(--accent)', '#5A7A63', '#C4943A', '#4A6A8A', '#1A3A3C', '#BA4A4A']`],
  [`['#6366f1', '#ef4444', '#f59e0b', '#10b981']`, `['var(--accent)', '#BA4A4A', '#C4943A', '#5A7A63']`],

  // ── Individual pie chart colors ──
  ["couleur: '#6366f1'", "couleur: 'var(--accent)'"],
  ["couleur: '#10b981'", "couleur: '#5A7A63'"],
  ["couleur: '#f59e0b'", "couleur: '#C4943A'"],
  ["couleur: '#ef4444'", "couleur: '#BA4A4A'"],
  ["couleur: '#06b6d4'", "couleur: '#4A6A8A'"],
  ["couleur: '#8b5cf6'", "couleur: '#1A3A3C'"],
  ["couleur: '#14b8a6'", "couleur: '#787066'"],

  // ── Gradient definitions (stopColor) ──
  ['stopColor="#6366f1"', 'stopColor="var(--accent)"'],
  ['stopColor="#10b981"', 'stopColor="#5A7A63"'],
  ['stopColor="#f59e0b"', 'stopColor="#C4943A"'],
  ['stopColor="#ef4444"', 'stopColor="#BA4A4A"'],

  // ── Chart stroke/fill colors ──
  ['stroke="#6366f1"', 'stroke="var(--accent)"'],
  ['stroke="#10b981"', 'stroke="#5A7A63"'],
  ['fill="#6366f1"', 'fill="var(--accent)"'],
  ['fill="#10b981"', 'fill="#5A7A63"'],
  ['fill="#f59e0b"', 'fill="#C4943A"'],
  ['fill="#ef4444"', 'fill="#BA4A4A"'],

  // ── Radar chart fill ──
  ['fill="#6366f1" fillOpacity={0.3}', 'fill="var(--accent)" fillOpacity={0.3}'],

  // ── Grid / Axis stroke (neutral) ──
  ['stroke="#e5e7eb"', 'stroke="var(--border)"'],
  ['stroke="#9ca3af"', 'stroke="var(--text-tertiary)"'],

  // ── Tooltip border radius (12px → 8px clean) ──
  [`borderRadius: '12px', border: '1px solid #e5e7eb'`, `borderRadius: '8px', border: '1px solid var(--border)'`],
  [`borderRadius: '12px', border: '1px solid #e5e7eb',\n                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'`, `borderRadius: '8px', border: '1px solid var(--border)'`],
  [`borderRadius: '12px', border: '1px solid #e5e7eb'`, `borderRadius: '8px', border: '1px solid var(--border)'`],

  // ── Headings: add font-fraunces ──

  // Section headings (h2 text-xl font-semibold)
  [`<h2 className="text-xl font-semibold text-neutral-900 dark:text-white">`, `<h2 className="font-fraunces text-xl font-semibold text-neutral-900 dark:text-white">`],

  // Page title h1 (text-2xl font-bold)
  [`h1\n            initial={{ opacity: 0, y: -10 }}\n            animate={{ opacity: 1, y: 0 }}\n            className="text-2xl font-bold text-neutral-900 dark:text-white"\n          >`, `h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-fraunces text-2xl font-bold text-neutral-900 dark:text-white"
          >`],

  // m差异化: some files use slightly different formatting for the h1
  ['className="text-2xl font-bold text-neutral-900 dark:text-white">', 'className="font-fraunces text-2xl font-bold text-neutral-900 dark:text-white">'],
];

/* ─── Walk helper ──────────────────────────────────────────────────── */
function* walk(dir) {
  for (const e of readdirSync(dir)) {
    const f = join(dir, e);
    if (statSync(f).isDirectory()) yield* walk(f);
    else if (f.endsWith('.jsx')) yield f;
  }
}

/* ─── Apply ────────────────────────────────────────────────────────── */
let changed = 0;
let processed = 0;

for (const f of walk(base)) {
  processed++;
  let content = readFileSync(f, 'utf8');
  const before = content;
  for (const [from, to] of replacements) {
    content = content.split(from).join(to);
  }
  if (content !== before) {
    writeFileSync(f, content);
    changed++;
    console.log(`✓ ${f.replace(base, '').replace(/^\//, '')}`);
  }
}

console.log(`\n✅ ${changed}/${processed} fichiers modifiés`);

/* ─── Final scan ──────────────────────────────────────────────────── */
console.log('\n── Résiduels :');
const remaining = [];
for (const f of walk(base)) {
  const content = readFileSync(f, 'utf8');
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('#6366f1') || (lines[i].includes('font-bold') && !lines[i].includes('font-fraunces') && !lines[i].includes('sr-only') && !lines[i].includes('hover:'))) {
      remaining.push({ file: f.replace(base, '').replace(/^\//, ''), line: i + 1, text: lines[i].trim() });
    }
  }
}
if (remaining.length === 0) {
  console.log('  Aucun résiduel — c’est propre ✓');
} else {
  for (const r of remaining) {
    console.log(`  • ${r.file}:${r.line}  ${r.text.substring(0, 100)}`);
  }
}
