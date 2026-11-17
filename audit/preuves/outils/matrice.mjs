// Matrice d'accès fiable : 20 comptes × 59 routes, sur la version de production, un seul navigateur.
import { BASE, launch, session, OUT } from './wf-lib.mjs';
import fs from 'node:fs';
const ROUTES = fs.readFileSync(new URL('./routes.txt', import.meta.url), 'utf8').split('\n').filter(Boolean);
const [WX, ...COMPTES] = process.argv.slice(2);
const browser = await launch(Number(WX)); const M = {}; fs.mkdirSync(`${OUT}/mesures/matrice`, { recursive: true });
for (const c of COMPTES) {
  const s = await session(browser, c); const { page } = s; M[c] = {}; const home = s.path();
  for (const r of ROUTES) {
    s.api.length = 0; const t = Date.now();
    await page.goto(BASE + r, { waitUntil: 'domcontentloaded' }).catch(() => {});
    await page.waitForFunction(route => location.pathname !== route || !!document.querySelector('#main-content'), r, { timeout: 15000 }).catch(() => {});
    const p = s.path(); let v;
    if (p === '/unauthorized') v = 'refusé'; else if (p !== r) v = 'redirigé ' + p;
    else if (await page.locator('#main-content').count()) { await page.waitForLoadState('networkidle', { timeout: 3000 }).catch(() => {}); const e = [...new Set(s.api.filter(a => a.s >= 400 && !a.p.endsWith('/auth/me')).map(a => `${a.s} ${a.p}`))]; const vide = (await page.locator('#main-content').innerText()).replace(/\s+/g, ' ').length; v = e.length ? 'autorisé mais API ' + e.join(' ; ') : 'autorisé'; M[c][r + '#ms'] = Date.now() - t; M[c][r + '#car'] = vide; }
    else v = 'bloqué sur le chargement (>15 s)';
    M[c][r] = v;
  }
  const n = Object.entries(M[c]).filter(([k, v]) => !k.includes('#') && String(v).startsWith('autorisé')).length;
  console.log(`${c}: accueil ${home}, ${n} routes autorisées, ${Object.entries(M[c]).filter(([k, v]) => !k.includes('#') && /API/.test(v)).length} avec refus API, ${Object.values(M[c]).filter(v => /bloqué/.test(v)).length} bloquées`);
  fs.writeFileSync(`${OUT}/mesures/matrice/${c.replace(/[^\w-]/g,'_')}.json`, JSON.stringify({ [c]: M[c] }, null, 1)); await s.ctx.close();
}
await browser.close();
