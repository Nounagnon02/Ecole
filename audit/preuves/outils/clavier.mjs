// Parcours au seul clavier (lot 8.5) : aucun clic. Version de production servie
// en local (front :3002, API :8000, base de démonstration).
// Usage : node clavier.mjs [dossier-captures]   → mesures/parcours-clavier.json
import fs from 'node:fs';
import { launch, session, BASE } from './wf-lib.mjs';
const D = process.argv[2]; // captures seulement si un dossier est donné
const browser = await launch();
const res = []; const note = (etape, ok, detail = '') => { res.push({ etape, ok, detail }); console.log(ok ? 'OK ' : 'ÉCHEC', etape, detail); };

// Décrit l'élément focalisé et dit si son focus se voit.
const actif = (page) => page.evaluate(() => {
  const e = document.activeElement; if (!e || e === document.body) return { nom: '(body)', visible: false };
  const vis = (x) => { if (!x) return false; const c = getComputedStyle(x); return (c.outlineStyle !== 'none' && parseFloat(c.outlineWidth) > 0) || (c.boxShadow && c.boxShadow !== 'none'); };
  const nom = (e.getAttribute('aria-label') || e.innerText || e.value || e.placeholder || e.id || e.tagName).replace(/\s+/g, ' ').trim().slice(0, 40);
  return { nom, tag: e.tagName.toLowerCase(), id: e.id, role: e.getAttribute('role'), visible: vis(e) || vis(e.parentElement), dansDialogue: !!e.closest('[role=dialog],[role=alertdialog]') };
});
const tab = async (page, n = 1, sens = 'Tab') => { for (let i = 0; i < n; i++) await page.keyboard.press(sens); return actif(page); };
const jusqua = async (page, test, max = 60) => { for (let i = 0; i < max; i++) { const a = await tab(page); if (test(a)) return a; } return null; };

// 1. Connexion au clavier.
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } }); const page = await ctx.newPage();
  await page.goto(BASE + '/connexion'); await page.waitForSelector('#login-email');
  const arrets = []; for (let i = 0; i < 8; i++) arrets.push(await tab(page));
  note('connexion : ordre des tabulations', arrets.some((a) => a.id === 'login-email') && arrets.some((a) => a.id === 'login-password'), arrets.map((a) => a.nom).join(' → '));
  const invisibles = arrets.filter((a) => a.nom !== '(body)' && !a.visible).map((a) => a.nom);
  note('connexion : focus visible à chaque arrêt', invisibles.length === 0, invisibles.join(', '));
  await page.goto(BASE + '/connexion'); await page.waitForSelector('#login-email');
  await jusqua(page, (a) => a.id === 'login-email'); await page.keyboard.type('0195963594');
  await tab(page); await page.keyboard.type('password'); await page.keyboard.press('Enter');
  const arrive = await page.waitForSelector('#main-content h1', { timeout: 30000 }).then(() => true).catch(() => false);
  note('connexion au clavier jusqu’au tableau de bord', arrive, new URL(page.url()).pathname);

  // 2. Lien d'évitement : premier arrêt, et il mène au contenu.
  await page.reload(); await page.waitForSelector('#main-content h1');
  const premier = await tab(page);
  note('lien d’évitement en premier arrêt', /contenu principal/i.test(premier.nom) && premier.visible, premier.nom);
  await page.keyboard.press('Enter'); await page.waitForTimeout(300);
  const apres = await actif(page);
  note('le lien d’évitement place le focus dans le contenu', apres.id === 'main-content', apres.id || apres.nom);

  // 3. Menu au clavier.
  await page.reload(); await page.waitForSelector('#main-content h1');
  const lien = await jusqua(page, (a) => a.tag === 'a' && /^Notes$/.test(a.nom));
  if (lien) { await page.keyboard.press('Enter'); await page.waitForTimeout(1500); }
  note('menu : atteindre « Notes » au clavier et l’ouvrir', !!lien && new URL(page.url()).pathname === '/notes', new URL(page.url()).pathname);

  // 4. Focus visible sur 25 arrêts d'une page connectée.
  const arrets2 = []; for (let i = 0; i < 25; i++) arrets2.push(await tab(page));
  const inv2 = [...new Set(arrets2.filter((a) => a.nom !== '(body)' && !a.visible).map((a) => `${a.tag}:${a.nom}`))];
  note('page Notes : focus visible sur 25 arrêts', inv2.length === 0, inv2.join(', '));
  if (D) await page.screenshot({ path: D + '/clavier-focus-notes.png' });
  await ctx.close();
}

// 5. Fenêtre de dialogue : ouverture, piège du focus, Échap, retour du focus.
{
  const s = await session(browser, 'secretaire_ecole1'); const page = s.page;
  await page.goto(BASE + '/secretaire/planning'); await s.settle(800);
  const bouton = await jusqua(page, (a) => a.tag === 'button' && /nouvel/i.test(a.nom));
  if (bouton) await page.keyboard.press('Enter');
  await page.waitForTimeout(800);
  const dedans = await actif(page);
  note('dialogue : le focus entre dans la fenêtre', !!bouton && dedans.dansDialogue, bouton ? `${bouton.nom} → ${dedans.nom}` : 'bouton introuvable');
  let sorti = false; for (let i = 0; i < 20; i++) { const a = await tab(page); if (!a.dansDialogue) { sorti = true; break; } }
  for (let i = 0; i < 5; i++) { const a = await tab(page, 1, 'Shift+Tab'); if (!a.dansDialogue) { sorti = true; break; } }
  note('dialogue : le focus reste piégé (Tab et Maj+Tab)', !sorti);
  await page.keyboard.press('Escape'); await page.waitForTimeout(500);
  const ferme = await page.locator('[role=dialog]').count() === 0; const retour = await actif(page);
  note('dialogue : Échap ferme et rend le focus au bouton', ferme && /nouvel/i.test(retour.nom), retour.nom);
  await s.ctx.close();
}

// 6. Tableau trop large à 360 px : il défile aux flèches.
{
  const s = await session(browser, 'censeur_ecole1', { viewport: { width: 360, height: 740 } }); const page = s.page;
  await page.goto(BASE + '/censeur/absences'); await s.settle(1000);
  const zone = await jusqua(page, (a) => a.role === 'region', 80);
  let avant = 0, apres = 0;
  if (zone) {
    avant = await page.evaluate(() => document.activeElement.scrollLeft);
    for (let i = 0; i < 6; i++) await page.keyboard.press('ArrowRight');
    apres = await page.evaluate(() => document.activeElement.scrollLeft);
  }
  note('tableau à 360 px : atteint au clavier et défile aux flèches', !!zone && apres > avant, zone ? `${zone.nom} scrollLeft ${avant} → ${apres}` : 'zone introuvable');
  await s.ctx.close();
}

await browser.close();
fs.writeFileSync(new URL('../mesures/parcours-clavier.json', import.meta.url), JSON.stringify({ date: new Date().toISOString(), etapes: res }, null, 1));
console.log(`${res.filter((r) => r.ok).length}/${res.length} étapes validées`);
