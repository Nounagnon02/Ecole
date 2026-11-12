// Core Web Vitals (lot 9.4) sur la version de production servie en local (port 3002).
//
// Bridage = profil mobile par défaut de Lighthouse : 1,6 Mb/s descendant,
// 750 kb/s montant, 150 ms d'aller-retour, processeur ralenti 4 fois.
// Indicateurs : LCP, CLS, FCP, TTFB, et le temps bloquant total (TBT, somme
// des tâches longues au-delà de 50 ms) qui tient lieu d'INP faute de vraie
// interaction. Seuils « bon » de Google : LCP ≤ 2,5 s, CLS ≤ 0,1, TBT ≤ 200 ms.
//
// Usage : node vitals.mjs [fichier.json]   (API sur :8000, front sur :3002)
//
// Limite : la latence émulée par le protocole DevTools ne s'applique pas à la
// requête du document lui-même (TTFB de quelques ms) ; les ressources, elles,
// sont bridées.
//
// Scores Lighthouse (outil de Google, version épinglée, aucune dépendance
// ajoutée au projet), page publique puis page connectée :
//   npx -y lighthouse@12.6.1 http://localhost:3002/connexion --chrome-flags="--headless=new" \
//     --output=json --output=html --output-path=connexion
//   … --extra-headers=cookie.json   (fichier {"Cookie": "…"} d'une session de démonstration)
// Le serveur DevTools (outil lighthouse_audit) échoue sur ce Chrome
// (Network.emulateNetworkConditionsByRule) : passer par la ligne de commande.
import { chromium } from './wf-lib.mjs';
import fs from 'node:fs';

const BASE = 'http://localhost:3002';
const SORTIE = process.argv[2] || new URL('../mesures/core-web-vitals.json', import.meta.url).pathname;
const BRIDAGE = { d: 1.6e6 / 8, u: 750e3 / 8, l: 150, cpu: 4 };

const PARCOURS = [
  { nom: 'Connexion (première visite)', url: '/connexion' },
  { nom: 'Tableau de bord parent', url: '/parent/dashboard', compte: ['basile.adjovi@parent.bj', 'password'] },
  { nom: 'Notes (enseignant)', url: '/notes', compte: ['enseignant_ecole1', 'password'] },
];

// Observateurs posés avant tout script de la page.
const OBSERVATEURS = () => {
  window.__v = { lcp: 0, cls: 0, tbt: 0, fcp: 0 };
  new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__v.lcp = e.startTime; }).observe({ type: 'largest-contentful-paint', buffered: true });
  new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__v.cls += e.value; }).observe({ type: 'layout-shift', buffered: true });
  new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__v.tbt += Math.max(0, e.duration - 50); }).observe({ type: 'longtask', buffered: true });
  new PerformanceObserver((l) => { for (const e of l.getEntries()) if (e.name === 'first-contentful-paint') window.__v.fcp = e.startTime; }).observe({ type: 'paint', buffered: true });
};

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const lignes = [];

for (const p of PARCOURS) {
  const ctx = await browser.newContext({ viewport: { width: 360, height: 740 }, serviceWorkers: 'block' });

  // Connexion sans bridage : on mesure la page, pas le formulaire.
  if (p.compte) {
    const login = await ctx.newPage();
    await login.goto(BASE + '/connexion');
    await login.fill('#login-email', p.compte[0]);
    await login.fill('#login-password', p.compte[1]);
    await login.click('button[type="submit"]');
    await login.waitForSelector('#main-content h1', { timeout: 30000 });
    await login.close();
  }

  const page = await ctx.newPage();
  await page.addInitScript(OBSERVATEURS);
  const cdp = await ctx.newCDPSession(page);
  await cdp.send('Network.enable');
  await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
  await cdp.send('Network.emulateNetworkConditions', { offline: false, downloadThroughput: BRIDAGE.d, uploadThroughput: BRIDAGE.u, latency: BRIDAGE.l });
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: BRIDAGE.cpu });

  await page.goto(BASE + p.url, { waitUntil: 'load', timeout: 120000 });
  await page.waitForLoadState('networkidle', { timeout: 120000 }).catch(() => {});
  await page.waitForTimeout(1500);
  const v = await page.evaluate(() => {
    const n = performance.getEntriesByType('navigation')[0];
    return { ...window.__v, ttfb: n.responseStart };
  });
  const r = (x) => Math.round(x);
  const ligne = {
    parcours: p.nom,
    lcp_ms: r(v.lcp), cls: Math.round(v.cls * 1000) / 1000, fcp_ms: r(v.fcp), ttfb_ms: r(v.ttfb), tbt_ms: r(v.tbt),
    lcp_bon: v.lcp <= 2500, cls_bon: v.cls <= 0.1, tbt_bon: v.tbt <= 200,
  };
  lignes.push(ligne);
  console.log(JSON.stringify(ligne));
  await ctx.close();
}

await browser.close();
fs.writeFileSync(SORTIE, JSON.stringify({ date: new Date().toISOString(), bridage: 'Lighthouse mobile (1,6 Mb/s, 150 ms, CPU ×4)', mesures: lignes }, null, 1));
