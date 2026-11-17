// Mesures de chargement sur la version de production (port 3003), réseau et processeur bridés via le protocole DevTools de Chrome.
import { chromium, OUT } from './wf-lib.mjs';
import fs from 'node:fs';
const BASE = 'http://localhost:3002';
const PROFILS = {
  'Fibre / Wi-Fi (non bridé)': null,
  '4G correcte (9 Mb/s, 170 ms)': { d: 9e6 / 8, u: 9e6 / 8, l: 170, cpu: 4 },
  '3G (1,6 Mb/s, 300 ms)': { d: 1.6e6 / 8, u: 750e3 / 8, l: 300, cpu: 4 },
  '3G lente (400 kb/s, 400 ms)': { d: 400e3 / 8, u: 400e3 / 8, l: 400, cpu: 6 },
  '2G / EDGE (240 kb/s, 800 ms)': { d: 240e3 / 8, u: 200e3 / 8, l: 800, cpu: 6 },
};
const browser = await chromium.launch({ channel: 'chrome', headless: false, args: ['--window-size=420,860'] });
const rows = [];
for (const [nom, p] of Object.entries(PROFILS)) {
  for (const scen of ['Première visite : page de connexion', 'Connexion puis tableau de bord parent']) {
    const ctx = await browser.newContext({ viewport: { width: 360, height: 740 }, serviceWorkers: 'block' });
    const page = await ctx.newPage(); const cdp = await ctx.newCDPSession(page);
    await cdp.send('Network.enable');
    if (p) { await cdp.send('Network.emulateNetworkConditions', { offline: false, downloadThroughput: p.d, uploadThroughput: p.u, latency: p.l }); await cdp.send('Emulation.setCPUThrottlingRate', { rate: p.cpu }); }
    let bytes = 0, reqs = 0; cdp.on('Network.loadingFinished', e => { bytes += e.encodedDataLength; reqs++; });
    const t0 = Date.now(); let detail = '';
    try {
      await page.goto(BASE + '/connexion', { waitUntil: 'domcontentloaded', timeout: 100000 });
      await page.waitForSelector('#login-email', { timeout: 100000 }); const tForm = Date.now() - t0;
      if (scen.startsWith('Première')) {
        await page.waitForLoadState('networkidle', { timeout: 100000 }).catch(() => {});
        const v = await page.evaluate(() => { const n = performance.getEntriesByType('navigation')[0]; const fcp = performance.getEntriesByName('first-contentful-paint')[0]; return { fcp: Math.round(fcp?.startTime || 0), dcl: Math.round(n.domContentLoadedEventEnd), load: Math.round(n.loadEventEnd) }; });
        rows.push({ profil: nom, scenario: scen, formulaireUtilisable_ms: tForm, fcp_ms: v.fcp, load_ms: v.load, requetes: reqs, ko: Math.round(bytes / 1024) });
      } else {
        const b0 = bytes, r0 = reqs; await page.fill('#login-email', 'basile.adjovi@parent.bj'); await page.fill('#login-password', 'password'); const t1 = Date.now();
        await page.click('button[type="submit"]'); await page.waitForSelector('#main-content h1', { timeout: 100000 }); const tH1 = Date.now() - t1;
        await page.waitForLoadState('networkidle', { timeout: 100000 }).catch(() => {}); const tDone = Date.now() - t1;
        rows.push({ profil: nom, scenario: scen, titreVisible_ms: tH1, donneesChargees_ms: tDone, requetes: reqs - r0, ko: Math.round((bytes - b0) / 1024) });
      }
    } catch (e) { rows.push({ profil: nom, scenario: scen, erreur: String(e.message).split('\n')[0].slice(0, 90), apres_ms: Date.now() - t0 }); }
    await ctx.close();
    console.log(JSON.stringify(rows[rows.length-1])); fs.writeFileSync(`${OUT}/mesures/performance-reseau.json`, JSON.stringify(rows, null, 1));
  }
}
await browser.close();
fs.writeFileSync(`${OUT}/mesures/performance-reseau.json`, JSON.stringify(rows, null, 1));

