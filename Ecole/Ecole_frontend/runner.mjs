const fs = require('fs');
const path = require('path');

const root = '/home/prince-kangbode/Mes_projets/Ecole/Ecole/Ecole_frontend/src/app/features';

const files = [];
function walk(dir) {
  for (const e of fs.readdirSync(dir)) {
    const f = path.join(dir, e);
    if (fs.statSync(f).isDirectory()) walk(f);
    else if (f.endsWith('.jsx')) files.push(f);
  }
}
walk(root);

// Read all replacements from a config file
const raw = fs.readFileSync('/home/prince-kangbode/Mes_projets/Ecole/Ecole/Ecole_frontend/replacements.json', 'utf8');
const map = JSON.parse(raw);

let changed = 0;
for (const f of files) {
  let content = fs.readFileSync(f, 'utf8');
  const before = content;
  for (const [from, to] of map) {
    content = content.split(from).join(to);
  }
  if (content !== before) {
    fs.writeFileSync(f, content);
    changed++;
  }
}

console.log(`Changed ${changed} files`);

const remaining = files.filter(f => fs.readFileSync(f, 'utf8').includes('indigo'));
console.log(`${remaining.length} files still have 'indigo'`);
for (const f of remaining) {
  const rel = f.replace(root, '').replace(/^\//, '');
  const lines = fs.readFileSync(f, 'utf8').split('\n').filter(l => l.includes('indigo'));
  console.log(`  ${rel}: ${lines.length} lines`);
}
