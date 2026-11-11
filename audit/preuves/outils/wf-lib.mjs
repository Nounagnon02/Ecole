// Outils communs aux parcours métier joués dans Google Chrome visible.
import { createRequire } from 'node:module';
import crypto from 'node:crypto';
import fs from 'node:fs';
const require = createRequire('/home/rosegohoue/Mes_projets/Ecole/Ecole/Ecole_frontend/package.json');
export const { chromium } = require('@playwright/test');
export const BASE = 'http://localhost:3002';
export const OUT = '/home/rosegohoue/Mes_projets/Ecole/audit/preuves';
const SECRETS = new URL('./secrets.json', import.meta.url);

export function totp(secret) {
  const A = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'; let bits = '';
  for (const c of secret.replace(/=+$/, '').toUpperCase()) bits += A.indexOf(c).toString(2).padStart(5, '0');
  const key = Buffer.from(bits.match(/.{8}/g).map(b => parseInt(b, 2)));
  const ctr = Buffer.alloc(8); ctr.writeBigUInt64BE(BigInt(Math.floor(Date.now() / 30000)));
  const h = crypto.createHmac('sha1', key).update(ctr).digest(); const o = h[h.length - 1] & 0xf;
  return String((h.readUInt32BE(o) & 0x7fffffff) % 1e6).padStart(6, '0');
}
const secrets = () => { try { return JSON.parse(fs.readFileSync(SECRETS, 'utf8')); } catch { return {}; } };

export const results = [];
export function record(id, titre, statut, detail = '') {
  results.push({ id, titre, statut, detail: String(detail).replace(/\s+/g, ' ').slice(0, 400) });
  console.log(`${statut.padEnd(8)} ${id} ${titre}${detail ? ' — ' + String(detail).replace(/\s+/g, ' ').slice(0, 260) : ''}`);
}
export function save(nom) { fs.writeFileSync(`${OUT}/mesures/${nom}.json`, JSON.stringify(results, null, 1)); }

export async function launch(x = 0) {
  return chromium.launch({ channel: 'chrome', headless: false, slowMo: 60, args: [`--window-position=${x},0`, '--window-size=1320,900'] });
}

/** Nouvelle session connectée par l'interface. Renvoie { ctx, page, api, cons, path, settle }. */
export async function session(browser, id, { viewport = { width: 1280, height: 800 }, login = true } = {}) {
  const ctx = await browser.newContext({ viewport, acceptDownloads: true });
  await ctx.addInitScript(() => { window.print = () => { window.__impressions = (window.__impressions || 0) + 1; }; });
  const page = await ctx.newPage();
  const api = []; const cons = []; const dialogs = []; const downloads = []; const popups = [];
  page.on('response', async r => { const u = new URL(r.url()); if (u.pathname.startsWith('/api/')) api.push({ s: r.status(), m: r.request().method(), p: u.pathname }); });
  page.on('console', m => { if (m.type() === 'error') cons.push(m.text().slice(0, 200)); });
  page.on('pageerror', e => cons.push('PAGEERROR ' + String(e.message).slice(0, 200)));
  page.on('download', d => downloads.push(d.suggestedFilename()));
  const s = { ctx, page, api, cons, dialogs, downloads, popups, accept: false,
    path: () => new URL(page.url()).pathname,
    settle: async (ms = 400) => { await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {}); await page.waitForTimeout(ms); },
    shot: async nom => { await page.screenshot({ path: `${OUT}/captures/parcours/${nom}.jpg`, type: 'jpeg', quality: 55 }).catch(() => {}); },
    /** Liste les boutons et champs visibles : sert de diagnostic quand un sélecteur manque. */
    dump: async (scope = '#main-content') => page.evaluate(sel => {
      const root = document.querySelector(sel) || document.body; const vis = el => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
      const b = [...root.querySelectorAll('button')].filter(vis).map(x => (x.innerText.trim() || x.getAttribute('aria-label') || '∅').slice(0, 28));
      const f = [...root.querySelectorAll('input,select,textarea')].filter(vis).map(x => `${x.tagName.toLowerCase()}#${x.id || ''}[${x.getAttribute('placeholder') || x.getAttribute('aria-label') || x.name || x.type || ''}]`.slice(0, 50));
      return `BOUTONS: ${b.slice(0, 30).join(' | ')} || CHAMPS: ${f.slice(0, 20).join(' | ')}`;
    }, scope).catch(e => 'dump impossible: ' + e.message),
    toasts: async () => (await page.locator('[data-sonner-toast]').allInnerTexts().catch(() => [])).map(t => t.trim()).join(' / '),
    alerts: async () => (await page.locator('[role=alert]:visible').allInnerTexts().catch(() => [])).map(t => t.trim().slice(0, 140)).join(' / '),
  };
  page.on('dialog', async d => { dialogs.push(`${d.type()}: ${d.message().slice(0, 120)}`); if (s.accept) await d.accept().catch(() => {}); else await d.dismiss().catch(() => {}); });
  ctx.on('page', async p => { if (p !== page) { await p.waitForLoadState('domcontentloaded', { timeout: 5000 }).catch(() => {}); const body = (await p.locator('body').innerText().catch(() => '')).slice(0, 160); popups.push(`${p.url()} :: ${body}`); await p.close().catch(() => {}); } });
  fs.mkdirSync(`${OUT}/captures/parcours`, { recursive: true });
  if (login) await signIn(s, id);
  return s;
}

export async function signIn(s, id, password = 'password') {
  const { page } = s;
  await page.goto(BASE + '/connexion', { waitUntil: 'domcontentloaded' });
  await page.fill('#login-email', id); await page.fill('#login-password', password);
  await page.click('button[type="submit"]');
  await page.waitForURL(u => !u.pathname.startsWith('/connexion'), { timeout: 6000 }).catch(() => {});
  if (await page.locator('#two-factor-code').isVisible().catch(() => false)) {
    const secret = secrets()[id];
    if (secret) { await page.fill('#two-factor-code', totp(secret)); await page.getByRole('button', { name: 'Vérifier' }).click(); await page.waitForURL(u => !u.pathname.startsWith('/connexion'), { timeout: 8000 }).catch(() => {}); }
  }
  await s.settle();
  return s.path();
}
