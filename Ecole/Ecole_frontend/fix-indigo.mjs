#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, 'src/app/features');
const files = [];
function walk(dir) {
  for (const e of fs.readdirSync(dir)) {
    const f = path.join(dir, e);
    if (fs.statSync(f).isDirectory()) walk(f);
    else if (f.endsWith('.jsx')) files.push(f);
  }
}
walk(root);

const map = [
  ['color="indigo"', 'color="primary"'],
  ['bg-indigo-100', 'bg-[var(--primary-subtle)]'],
  ['bg-indigo-50', 'bg-[var(--accent-subtle)]'],
  ['bg-indigo-500', 'bg-[var(--accent)]'],
  ['bg-indigo-600', 'bg-[var(--accent)]'],
  ['text-indigo-700', 'text-[var(--accent)]'],
  ['text-indigo-600', 'text-[var(--accent)]'],
  ['text-indigo-500', 'text-[var(--accent)]'],
  ['text-indigo-400', 'text-[var(--accent)]'],
  ['text-indigo-300', 'text-[var(--accent)]'],
  ['border-indigo-500', 'border-[var(--accent)]'],
  ['ring-indigo-500', 'ring-[var(--accent)]'],
  ['dark:bg-indigo-900/20', 'bg-[var(--primary-subtle)]'],
  ['dark:bg-indigo-950/40', 'bg-[var(--primary-subtle)]'],
  ['dark:bg-indigo-950/30', 'bg-[var(--accent-subtle)]'],
  ['dark:bg-indigo-950/20', 'bg-[var(--accent-subtle)]'],
  ['dark:bg-indigo-500/5', 'bg-[var(--accent-subtle)]'],
  ['dark:bg-indigo-500/8', 'bg-[var(--accent-subtle)]'],
  ['dark:text-indigo-400', 'text-[var(--accent)]'],
  ['dark:text-indigo-300', 'text-[var(--accent)]'],
  ['dark:border-indigo-700', 'border-[var(--accent)]'],
  ['dark:border-indigo-600', 'border-[var(--accent)]'],
  ['dark:border-indigo-500', 'border-[var(--accent)]'],
  ['dark:focus:border-indigo-600', 'dark:focus:border-[var(--accent)]'],
  ['dark:focus:ring-indigo-900/30', 'dark:focus:ring-[var(--accent-subtle)]'],
  ['focus:ring-indigo-500/40', 'focus:ring-[var(--accent)]/40'],
  ['focus:ring-indigo-100', 'focus:ring-[var(--accent-subtle)]'],
  ['focus:ring-indigo-400/20', 'focus:ring-[var(--accent)]/20'],
  ['focus:border-indigo-400', 'focus:border-[var(--accent)]'],
  ['hover:border-indigo-200', 'hover:border-[var(--accent)]/30'],
  ['hover:border-indigo-300', 'hover:border-[var(--accent)]/30'],
  ['hover:border-indigo-700', 'hover:border-[var(--accent)]'],
  ['hover:bg-indigo-100', 'hover:bg-[var(--accent-subtle)]'],
  ['hover:bg-indigo-50', 'hover:bg-[var(--accent-subtle)]'],
  ['hover:bg-indigo-600', 'hover:bg-[var(--accent-hover)]'],
  ['hover:text-indigo-600', 'hover:text-[var(--accent)]'],
  ['hover:text-indigo-400', 'hover:text-[var(--accent)]'],
  ['dark:hover:bg-indigo-950/50', 'hover:bg-[var(--accent-subtle)]'],
  ['dark:hover:bg-indigo-950/30', 'hover:bg-[var(--accent-subtle)]'],
  ['dark:hover:bg-indigo-950/20', 'hover:bg-[var(--accent-subtle)]'],
  ['dark:hover:bg-indigo-900/20', 'hover:bg-[var(--accent-subtle)]'],
  ['dark:hover:bg-indigo-900/10', 'hover:bg-[var(--accent-subtle)]'],
  ['dark:hover:border-indigo-700', 'hover:border-[var(--accent)]'],
  ['dark:hover:border-indigo-600', 'hover:border-[var(--accent)]'],
  ['dark:hover:border-indigo-500', 'hover:border-[var(--accent)]'],
  ['dark:hover:text-indigo-400', 'hover:text-[var(--accent)]'],
  ['dark:hover:text-indigo-300', 'hover:text-[var(--accent)]'],
  ['bg-gradient-to-br from-indigo-500 to-purple-600', 'bg-[var(--accent)]'],
  ['from-indigo-500/20 to-purple-600/20', 'bg-[var(--accent-subtle)]'],
  ['shadow-lg shadow-indigo-500/20', 'shadow-3'],
];

let changed = 0;
for (const f of files) {
  let content = fs.readFileSync(f, 'utf8');
  let before = content;
  for (const [from, to] of map) {
    content = content.split(from).join(to);
  }
  if (content !== before) {
    fs.writeFileSync(f, content);
    changed++;
  }
}

console.log(`✅ ${changed} files modifiés`);

const remaining = files.filter(f => fs.readFileSync(f, 'utf8').includes('indigo'));
console.log(`📊 ${remaining.length} fichiers avec encore 'indigo'`);
for (const f of remaining) {
  const rel = f.replace(root, '').replace(/^\//, '');
  const lines = fs.readFileSync(f, 'utf8').split('\n').filter(l => l.includes('indigo'));
  console.log(`  ${rel}: ${lines.length} lignes`);
}
