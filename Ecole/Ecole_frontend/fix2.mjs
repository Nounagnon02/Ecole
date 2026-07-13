import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

const root = join('/home/prince-kangbode/Mes_projets/Ecole/Ecole/Ecole_frontend', 'src/app/features');
const replacements = JSON.parse(readFileSync(join('/home/prince-kangbode/Mes_projets/Ecole/Ecole/Ecole_frontend', 'replacements.json'), 'utf8'));

function* walk(dir) {
  for (const e of readdirSync(dir)) {
    const f = join(dir, e);
    if (statSync(f).isDirectory()) yield* walk(f);
    else if (f.endsWith('.jsx')) yield f;
  }
}

let changed = 0;
for (const f of walk(root)) {
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

console.log(`✅ ${changed} fichiers modifiés`);

const remaining = [...walk(root)].filter(f => readFileSync(f, 'utf8').includes('indigo'));
console.log(`📊 ${remaining.length} fichiers avec encore 'indigo'`);
for (const f of remaining) {
  const rel = f.replace(root, '').replace(/^\//, '');
  const cnt = readFileSync(f, 'utf8').split('indigo').length - 1;
  console.log(`  • ${rel}: ${cnt} occurrence(s)`);
}
