// Parcours E : affectations (classe de lycée), paiements côté comptable, accessibilité (axe-core), clavier.
import { BASE, launch, session, record, save, OUT } from './wf-lib.mjs';
import fs from 'node:fs';
const AXE = fs.readFileSync('/home/rosegohoue/Mes_projets/Ecole/Ecole/Ecole_frontend/node_modules/axe-core/axe.min.js', 'utf8');
const browser = await launch(0);
const step = async (id, titre, fn) => { try { const [st, d] = await fn(); record(id, titre, st, d); } catch (e) { record(id, titre, 'ERREUR', String(e.message).split('\n')[0]); } save('parcours-e'); };
const writes = (s, from) => s.api.slice(from).filter(a => a.m !== 'GET').map(a => `${a.s} ${a.m} ${a.p}`).join(', ') || 'aucun appel d’écriture';
const main = async (s, n = 300) => (await s.page.locator('#main-content').innerText().catch(() => '')).replace(/\s+/g, ' ').slice(0, n);
const axe = async (s, nom) => { await s.page.evaluate(AXE); const r = await s.page.evaluate(async () => { const r = await window.axe.run(document, { runOnly: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'] }); return r.violations.map(v => ({ id: v.id, impact: v.impact, n: v.nodes.length, aide: v.help })); }); axeAll[nom] = r; fs.writeFileSync(`${OUT}/mesures/accessibilite-axe.json`, JSON.stringify(axeAll, null, 1)); return r; };
const axeAll = {};

{ const s = await session(browser, null, { login: false }); const { page } = s;
  await step('X1', 'Accessibilité (axe-core) : page de connexion', async () => { await page.goto(BASE + '/connexion'); await s.settle(); const r = await axe(s, '/connexion'); return [r.length ? 'PARTIEL' : 'VALIDÉ', r.map(v => `${v.id} (${v.impact}, ${v.n})`).join(' ; ') || 'aucune violation détectée']; });
  await step('X2', 'Clavier : parcourir la connexion sans souris', async () => {
    await page.goto(BASE + '/connexion'); await s.settle(); const ordre = [];
    for (let i = 0; i < 8; i++) { await page.keyboard.press('Tab'); ordre.push(await page.evaluate(() => { const e = document.activeElement; const st = getComputedStyle(e); return `${e.tagName.toLowerCase()}${e.id ? '#' + e.id : ''}[${(e.innerText || e.getAttribute('aria-label') || '').trim().slice(0, 18)}]${st.outlineStyle !== 'none' && parseFloat(st.outlineWidth) > 0 || st.boxShadow !== 'none' ? '' : ' !SANS-FOCUS-VISIBLE'}`; })); }
    await page.fill('#login-email', 'enseignant_ecole1'); await page.fill('#login-password', 'password'); await page.locator('#login-password').press('Enter'); await page.waitForURL(u => !u.pathname.startsWith('/connexion'), { timeout: 8000 }).catch(() => {});
    return [s.path() === '/enseignant/dashboard' && !ordre.some(o => o.includes('SANS-FOCUS')) ? 'VALIDÉ' : 'PARTIEL', `ordre: ${ordre.join(' → ')} ; Entrée dans le mot de passe → ${s.path()}`]; });
  await step('X3', 'Clavier : lien d’évitement et menu', async () => {
    await page.keyboard.press('Tab'); const skip = await page.evaluate(() => document.activeElement?.innerText?.trim().slice(0, 40)); await page.keyboard.press('Enter'); const cible = await page.evaluate(() => document.activeElement?.id);
    return [/contenu/i.test(skip || '') && cible === 'main-content' ? 'VALIDÉ' : 'PARTIEL', `premier élément au Tab: « ${skip} » ; après Entrée, focus sur #${cible}`]; });
  await s.ctx.close(); }

for (const [id, compte, routes] of [['X4', 'basile.adjovi@parent.bj', ['/parent/dashboard', '/parent/enfants', '/messagerie']], ['X5', 'directeur_ecole1', ['/directeur/dashboard', '/eleves', '/notes', '/emploi-du-temps', '/parametres']], ['X6', 'comptable_ecole1', ['/comptable/dashboard', '/comptable/transactions', '/paiements']]]) {
  const s = await session(browser, compte);
  for (const r of routes) await step(`${id}${r}`, `Accessibilité (axe-core) : ${r}`, async () => { await s.page.goto(BASE + r); await s.settle(600); const v = await axe(s, r); return [v.some(x => ['critical', 'serious'].includes(x.impact)) ? 'ÉCHEC' : v.length ? 'PARTIEL' : 'VALIDÉ', v.map(x => `${x.id} (${x.impact}, ${x.n})`).join(' ; ') || 'aucune violation détectée']; });
  if (compte === 'directeur_ecole1') {
    const { page } = s;
    await step('X7', 'Accessibilité (axe-core) en thème sombre : /directeur/dashboard', async () => { await page.goto(BASE + '/directeur/dashboard'); await s.settle(); await page.evaluate(() => document.documentElement.classList.add('dark')); await page.waitForTimeout(300); const v = await axe(s, '/directeur/dashboard (sombre)'); await s.shot('X7-sombre'); await page.evaluate(() => document.documentElement.classList.remove('dark')); return [v.some(x => ['critical', 'serious'].includes(x.impact)) ? 'ÉCHEC' : 'VALIDÉ', v.map(x => `${x.id} (${x.impact}, ${x.n})`).join(' ; ') || 'aucune violation']; });
    await step('K1', 'Affectations : affecter un enseignant à une classe de lycée', async () => {
      await page.goto(BASE + '/affectations'); await s.settle(); const sels = page.locator('#main-content select');
      await sels.nth(0).selectOption({ index: 1 }); await s.settle(400); await sels.nth(1).selectOption({ label: '2nde C' }).catch(async () => { await sels.nth(1).selectOption({ index: 12 }); }); await s.settle(600);
      const series = await sels.nth(2).locator('option').allInnerTexts(); if (series.length > 1) { await sels.nth(2).selectOption({ index: 1 }); await s.settle(600); }
      const mats = await sels.nth(3).locator('option').allInnerTexts(); if (mats.length > 1) { await sels.nth(3).selectOption({ index: 1 }); await s.settle(400); }
      const btn = page.getByRole('button', { name: /^Affecter/ }); const dis = await btn.isDisabled(); const from = s.api.length; if (!dis) { await btn.click(); await s.settle(900); }
      const msg = [await s.toasts(), await s.alerts()].filter(Boolean).join(' / '); await s.shot('K1-affectations'); await page.reload(); await s.settle();
      return [!dis && / 20\d POST/.test(' ' + writes(s, from)) ? 'VALIDÉ' : dis ? 'BLOQUÉ' : 'ÉCHEC', `séries: ${series.length - 1} ; matières: ${mats.length - 1} ; bouton ${dis ? 'désactivé' : 'actif'} ; API: ${writes(s, from)} ; message: « ${msg} » ; après rechargement: ${(await main(s, 900)).slice(-200)}`]; });
  }
  if (compte === 'comptable_ecole1') {
    const { page } = s;
    await step('J3', 'Comptable : liste des paiements, filtres et reçu', async () => {
      await page.goto(BASE + '/paiements'); await s.settle(); const lignes = await page.locator('#main-content tbody tr').count(); const stats = await main(s, 260);
      await page.locator('#main-content select').first().selectOption({ index: 1 }).catch(() => {}); await page.waitForTimeout(600); const filtrees = await page.locator('#main-content tbody tr').count();
      await page.locator('#main-content select').first().selectOption({ index: 0 }).catch(() => {}); await page.waitForTimeout(400);
      s.popups.length = 0; const recu = page.locator('#main-content tbody').getByRole('button').first(); const lbl = await recu.innerText().catch(() => ''); await recu.click().catch(() => {}); await page.waitForTimeout(2500); await s.shot('J3-paiements-comptable');
      return [lignes > 1 ? 'OBSERVÉ' : 'ÉCHEC', `${lignes} lignes ; filtre statut → ${filtrees} ; ${stats} ; bouton « ${lbl} » → ${s.popups.join(' | ').slice(0, 260) || 'rien'}`]; });
    await step('J4', 'Comptable : échéancier et paiement en ligne (sans déclencher FedaPay)', async () => {
      await page.getByRole('button', { name: /Échéancier/ }).click(); await s.settle(700); const d = await s.dump(); const t = await main(s, 1500); await s.shot('J4-echeancier-comptable');
      const sel = page.locator('#main-content select'); const n = await sel.count(); let ech = '';
      for (let i = 0; i < n; i++) { const o = await sel.nth(i).locator('option').count(); if (o > 1) { await sel.nth(i).selectOption({ index: 1 }).catch(() => {}); await s.settle(700); } }
      ech = (await main(s, 2200)).slice(-520); const payer = await page.getByRole('button', { name: /Payer|Régler|en ligne/i }).count(); await s.shot('J4-echeancier-eleve');
      return ['BLOQUÉ', `${d.slice(0, 260)} ; après sélection d’un élève: ${ech} ; boutons de paiement en ligne visibles: ${payer} — non cliqués : le clic appelle le service FedaPay réel (aucune clé de bac à sable fournie, aucune autorisation de transaction)`]; });
  }
  await s.ctx.close();
}
await browser.close();
