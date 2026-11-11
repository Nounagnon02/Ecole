// Audit interactif dans Google Chrome visible : pour chaque compte, connexion par
// l'interface, visite de chaque route, clic sur chaque onglet et chaque bouton,
// relevé des erreurs console / API, de l'accessibilité de base et du débordement mobile.
// Usage : node audit-crawl.mjs <dossier-sortie> <x-fenêtre> compte:accueil [...]
import { createRequire } from 'node:module';
import crypto from 'node:crypto';
import fs from 'node:fs';
const require = createRequire('/home/rosegohoue/Mes_projets/Ecole/Ecole/Ecole_frontend/package.json');
const { chromium } = require('@playwright/test');

const BASE = 'http://localhost:3002';
const [OUT, WINX, ...ACCOUNTS] = process.argv.slice(2);
const ROUTES = fs.readFileSync(new URL('./routes.txt', import.meta.url), 'utf8').split('\n').map(s => s.trim()).filter(Boolean);
const SECRETS_FILE = new URL('./secrets.json', import.meta.url);
const MAX_BUTTONS = 30;

function totp(secret) {
  const A = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'; let bits = '';
  for (const c of secret.replace(/=+$/, '').toUpperCase()) bits += A.indexOf(c).toString(2).padStart(5, '0');
  const key = Buffer.from(bits.match(/.{8}/g).map(b => parseInt(b, 2)));
  const ctr = Buffer.alloc(8); ctr.writeBigUInt64BE(BigInt(Math.floor(Date.now() / 30000)));
  const h = crypto.createHmac('sha1', key).update(ctr).digest(); const o = h[h.length - 1] & 0xf;
  return String((h.readUInt32BE(o) & 0x7fffffff) % 1e6).padStart(6, '0');
}
const loadSecrets = () => { try { return JSON.parse(fs.readFileSync(SECRETS_FILE, 'utf8')); } catch { return {}; } };
const saveSecret = (id, s) => { const all = loadSecrets(); all[id] = s; fs.writeFileSync(SECRETS_FILE, JSON.stringify(all, null, 1)); };

let browser; const launch = async () => { browser = await chromium.launch({ channel: 'chrome', headless: false, slowMo: 25, args: [`--window-position=${WINX || 0},0`, '--window-size=1300,900'] }); };
await launch();

for (const spec of ACCOUNTS) {
  const [id, home] = spec.split(':');
  const outFile = `${OUT}/mesures/crawl-${id.replace(/[^\w-]/g, '_')}.json`;
  try { if (JSON.parse(fs.readFileSync(outFile, 'utf8')).termine) { console.log(id + ': déjà terminé'); continue; } } catch {}
  for (let essai = 1; essai <= 2; essai++) {
  try {
  if (!browser.isConnected()) await launch();
  const dir = `${OUT}/captures/${id.replace(/[^\w-]/g, '_')}`; fs.mkdirSync(dir, { recursive: true });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, acceptDownloads: true });
  await ctx.addInitScript(() => { window.print = () => { window.__impressions = (window.__impressions || 0) + 1; }; });
  const page = await ctx.newPage();
  const api = []; const cons = []; const downloads = []; const jsDialogs = [];
  page.on('response', r => { const u = new URL(r.url()); if (u.pathname.startsWith('/api/')) api.push({ s: r.status(), m: r.request().method(), p: u.pathname.replace(/\/\d+(?=\/|$)/g, '/:id') }); });
  page.on('console', m => { if (m.type() === 'error') cons.push(m.text().slice(0, 160)); });
  page.on('pageerror', e => cons.push('PAGEERROR ' + String(e.message).slice(0, 160)));
  page.on('download', d => downloads.push(d.suggestedFilename()));
  page.on('dialog', async d => { jsDialogs.push(`${d.type()}: ${d.message().slice(0, 80)}`); await d.dismiss().catch(() => {}); });
  ctx.on('page', async p => { if (p !== page) { await p.waitForTimeout(300).catch(() => {}); jsDialogs.push('popup: ' + p.url().slice(0, 80)); await p.close().catch(() => {}); } });
  const path = () => new URL(page.url()).pathname;
  const settle = async (ms = 350) => { await page.waitForLoadState('networkidle', { timeout: 6000 }).catch(() => {}); await page.waitForTimeout(ms); };
  const result = { compte: id, accueilAttendu: home, login: {}, nav: [], pages: [] };

  // ── Connexion ─────────────────────────────────────────────────────────
  const t0 = Date.now();
  await page.goto(BASE + '/connexion', { waitUntil: 'domcontentloaded' });
  await page.fill('#login-email', id); await page.fill('#login-password', 'password');
  await page.click('button[type="submit"]');
  await page.waitForURL(u => !u.pathname.startsWith('/connexion'), { timeout: 8000 }).catch(() => {});
  await settle();
  if (path() === '/activation-2fa') {
    await page.waitForSelector('#two-factor-setup-code', { timeout: 8000 }).catch(() => {});
    await page.locator('.ecole-auth-card details summary').click().catch(() => {});
    const secret = (await page.locator('.ecole-auth-card details code').innerText().catch(() => '')).trim();
    if (secret) { saveSecret(id, secret); await page.fill('#two-factor-setup-code', totp(secret)); await page.getByRole('button', { name: 'Confirmer' }).click(); await page.waitForURL(u => u.pathname !== '/activation-2fa', { timeout: 8000 }).catch(() => {}); await settle(); result.login.deuxFacteurs = 'activée pendant le test'; }
    else result.login.deuxFacteurs = 'ÉCHEC : secret introuvable';
  } else if (await page.locator('#two-factor-code').isVisible().catch(() => false)) {
    const secret = loadSecrets()[id];
    if (secret) { await page.fill('#two-factor-code', totp(secret)); await page.getByRole('button', { name: 'Vérifier' }).click(); await page.waitForURL(u => !u.pathname.startsWith('/connexion'), { timeout: 8000 }).catch(() => {}); await settle(); result.login.deuxFacteurs = 'code saisi'; }
  }
  result.login.arrivee = path(); result.login.ok = path() === home; result.login.ms = Date.now() - t0;
  result.login.erreur = result.login.ok ? '' : (await page.locator('[role="alert"], .auth-error').first().innerText().catch(() => '')).slice(0, 160);
  if (path() === '/connexion') { result.pages = []; result.termine = true; fs.writeFileSync(`${OUT}/mesures/crawl-${id.replace(/[^\w-]/g, '_')}.json`, JSON.stringify(result, null, 1)); await ctx.close(); continue; }

  // ── Liens de navigation réellement affichés ───────────────────────────
  await page.locator('.ecole-navigation details summary').click().catch(() => {});
  result.nav = await page.$$eval('.ecole-navigation a[href]', as => as.map(a => ({ href: a.getAttribute('href'), texte: a.textContent.trim() })));
  await page.keyboard.press('Escape').catch(() => {});

  // ── Chaque route ──────────────────────────────────────────────────────
  for (const route of ROUTES) {
    api.length = 0; cons.length = 0;
    const t = Date.now();
    await page.goto(BASE + route, { waitUntil: 'domcontentloaded' }).catch(() => {});
    await page.waitForFunction(() => !document.body.innerText.includes('Vérification des permissions'), { timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(250);
    const landed = path();
    const entry = { route, arrivee: landed, acces: landed === route ? 'autorisé' : landed === '/unauthorized' ? 'refusé' : `redirigé ${landed}` };
    if (landed !== route) { result.pages.push(entry); continue; }
    await settle(400);
    if (path() !== route) { entry.arrivee = path(); entry.acces = path() === '/unauthorized' ? 'refusé' : `redirigé ${path()}`; entry.redirectionTardive = true; result.pages.push(entry); continue; }
    entry.ms = Date.now() - t;
    Object.assign(entry, await page.evaluate(() => {
      const main = document.querySelector('#main-content') || document.body;
      const vis = el => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
      const name = el => (el.innerText || '').trim() || el.getAttribute('aria-label') || el.getAttribute('title') || '';
      const buttons = [...main.querySelectorAll('button')].filter(vis);
      const inputs = [...main.querySelectorAll('input:not([type=hidden]), select, textarea')].filter(vis);
      const labelled = el => el.getAttribute('aria-label') || el.getAttribute('aria-labelledby') || (el.id && document.querySelector(`label[for="${CSS.escape(el.id)}"]`)) || el.closest('label');
      const text = main.innerText || '';
      return {
        h1: [...document.querySelectorAll('h1')].map(h => h.textContent.trim()).join(' | ').slice(0, 80),
        nbH1: document.querySelectorAll('h1').length,
        boutons: buttons.length, onglets: main.querySelectorAll('[role=tab]').length,
        liens: [...main.querySelectorAll('a[href]')].filter(vis).map(a => a.getAttribute('href')),
        champs: inputs.length, tableaux: main.querySelectorAll('table').length, lignes: main.querySelectorAll('tbody tr').length,
        boutonsSansNom: buttons.filter(b => !name(b)).length,
        champsSansLabel: inputs.filter(i => !labelled(i)).length,
        imagesSansAlt: [...main.querySelectorAll('img')].filter(i => !i.hasAttribute('alt')).length,
        petitesCibles: buttons.filter(b => { const r = b.getBoundingClientRect(); return r.height < 32 || r.width < 32; }).length,
        clesNonTraduites: [...new Set(text.match(/\b[a-z_]{2,}\.[a-z_]{2,}\.[a-z0-9_.]{2,}\b/g) || [])].slice(0, 5),
        texteVide: /Aucun|aucune donnée|Pas de |No data/i.test(text),
        alerte: [...main.querySelectorAll('[role=alert]')].filter(vis).map(a => a.innerText.trim().slice(0, 120)).slice(0, 2),
        debord1280: document.documentElement.scrollWidth - innerWidth,
      };
    }));
    entry.apiErreurs = api.filter(a => a.s >= 400).map(a => `${a.s} ${a.m} ${a.p}`);
    entry.apiAppels = api.length; entry.console = [...new Set(cons)].slice(0, 4);
    await page.screenshot({ path: `${dir}/${route.slice(1).replace(/\//g, '_') || 'racine'}.jpg`, type: 'jpeg', quality: 45 }).catch(() => {});
    await page.setViewportSize({ width: 390, height: 800 }); await page.waitForTimeout(250);
    entry.debord390 = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    await page.setViewportSize({ width: 1280, height: 800 }); await page.waitForTimeout(150);

    // ── Onglets puis boutons ────────────────────────────────────────────
    entry.vues = [];
    const tabCount = Math.min(await page.locator('#main-content [role=tab]').count(), 8);
    for (let ti = -1; ti < tabCount; ti++) {
      const vue = { onglet: 'vue initiale', clics: [] };
      if (ti >= 0) {
        const tab = page.locator('#main-content [role=tab]').nth(ti);
        vue.onglet = (await tab.innerText().catch(() => '')).trim().slice(0, 40);
        api.length = 0; cons.length = 0;
        await tab.click({ timeout: 2000 }).catch(e => { vue.erreur = String(e.message).slice(0, 80); });
        await settle(250);
        vue.apiErreurs = api.filter(a => a.s >= 400).map(a => `${a.s} ${a.m} ${a.p}`); vue.console = [...new Set(cons)].slice(0, 3);
        vue.debord = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
      } else if (tabCount > 0) continue; // la vue initiale = le premier onglet
      const sel = '#main-content button:visible:not([role=tab])';
      const n = Math.min(await page.locator(sel).count(), MAX_BUTTONS);
      vue.boutonsVus = await page.locator(sel).count();
      for (let i = 0; i < n; i++) {
        const b = page.locator(sel).nth(i);
        if (!(await b.count())) break;
        const label = ((await b.innerText().catch(() => '')).trim() || await b.getAttribute('aria-label') || await b.getAttribute('title') || '(sans nom)').replace(/\s+/g, ' ').slice(0, 50);
        if (await b.isDisabled().catch(() => false)) { vue.clics.push({ bouton: label, effet: 'désactivé' }); continue; }
        api.length = 0; cons.length = 0; downloads.length = 0; jsDialogs.length = 0;
        const before = await page.evaluate(() => ({ t: (document.querySelector('#main-content')?.innerText || '').length, h: document.body.innerHTML.length, d: document.querySelectorAll('[role=dialog],[aria-modal=true]').length }));
        let err = '';
        let force = false;
        await b.click({ timeout: 1500 }).catch(async () => {
          await b.evaluate(el => el.scrollIntoView({ block: 'center' })).catch(() => {});
          await b.click({ timeout: 1500 }).catch(async e => {
            force = true;
            await b.evaluate(el => el.click()).catch(() => { err = String(e.message).split('\n')[0].slice(0, 80); });
          });
        });
        await page.waitForTimeout(550);
        const effets = [];
        if (err) effets.push('clic impossible: ' + err);
        if (path() !== route) effets.push('navigation ' + path());
        const dlg = page.locator('[role=dialog]:visible, [aria-modal=true]:visible').first();
        const dlgOpen = await dlg.isVisible().catch(() => false);
        const c = { bouton: label }; if (force) c.clicForce = true;
        if (dlgOpen) {
          c.dialogue = { titre: (await dlg.locator('h1,h2,h3').first().innerText().catch(() => '')).slice(0, 50), champs: await dlg.locator('input:not([type=hidden]),select,textarea').count() };
          effets.push('dialogue');
          const submit = dlg.locator('button[type=submit]').first();
          if (c.dialogue.champs > 0 && await submit.count()) {
            const apiBefore = api.length;
            await submit.click({ timeout: 1500 }).catch(() => {});
            await page.waitForTimeout(600);
            c.dialogue.envoiVide = {
              invalides: await dlg.locator('[aria-invalid=true]').count().catch(() => 0),
              messages: (await dlg.locator('[role=alert], .text-red-600, .text-\\[var\\(--red\\)\\]').allInnerTexts().catch(() => [])).map(s => s.trim().slice(0, 70)).filter(Boolean).slice(0, 3),
              api: api.slice(apiBefore).map(a => `${a.s} ${a.m} ${a.p}`).slice(0, 3),
              resteOuvert: await dlg.isVisible().catch(() => false),
            };
          }
          await page.keyboard.press('Escape'); await page.waitForTimeout(250);
          if (await dlg.isVisible().catch(() => false)) { await dlg.getByRole('button', { name: /Annuler|Fermer|Close/i }).first().click({ timeout: 1000 }).catch(() => {}); await page.waitForTimeout(250); c.dialogue.echapFerme = false; }
        }
        const calls = api.map(a => `${a.s} ${a.m} ${a.p}`);
        if (calls.length) effets.push('api ' + [...new Set(calls)].slice(0, 3).join(', '));
        if (await page.evaluate(() => { const n = window.__impressions || 0; window.__impressions = 0; return n; }).catch(() => 0)) effets.push('impression (window.print)');
        if (downloads.length) effets.push('téléchargement ' + downloads.join(','));
        if (jsDialogs.length) effets.push(jsDialogs.join(' ; '));
        if (cons.length) c.console = [...new Set(cons)].slice(0, 2);
        const after = await page.evaluate(() => ({ t: (document.querySelector('#main-content')?.innerText || '').length, h: document.body.innerHTML.length })).catch(() => before);
        if (!effets.length && (after.t !== before.t || Math.abs(after.h - before.h) > 40)) effets.push('changement d’affichage');
        const toast = await page.locator('[data-sonner-toast]').allInnerTexts().catch(() => []);
        if (toast.length) c.toast = toast.map(s => s.trim().slice(0, 70)).slice(0, 2);
        c.effet = effets.join(' + ') || 'AUCUN EFFET VISIBLE';
        vue.clics.push(c);
        if (path() !== route) { await page.goto(BASE + route, { waitUntil: 'domcontentloaded' }).catch(() => {}); await settle(300); if (ti >= 0) { await page.locator('#main-content [role=tab]').nth(ti).click({ timeout: 2000 }).catch(() => {}); await page.waitForTimeout(300); } }
      }
      entry.vues.push(vue);
    }
    result.pages.push(entry);
    fs.writeFileSync(`${OUT}/mesures/crawl-${id.replace(/[^\w-]/g, '_')}.json`, JSON.stringify(result, null, 1));
  }
  fs.writeFileSync(`${OUT}/mesures/crawl-${id.replace(/[^\w-]/g, '_')}.json`, JSON.stringify(result, null, 1));
  result.termine = true; fs.writeFileSync(outFile, JSON.stringify(result, null, 1));
  console.log(`${id}: ${result.pages.filter(p => p.acces === 'autorisé').length} pages autorisées, connexion ${result.login.ok ? 'OK' : 'ÉCHEC ' + result.login.arrivee}`);
  await ctx.close();
  break;
  } catch (e) { console.log(`${id}: essai ${essai} interrompu — ${String(e.message).split('\n')[0].slice(0, 100)}`); }
  }
}
await browser.close();
