// Parcours C : parent réel (avec enfants), recherche, affectations, saisie de notes, statut élève retiré.
import { BASE, launch, session, record, save } from './wf-lib.mjs';
const browser = await launch(0);
const step = async (id, titre, fn) => { try { const [st, d] = await fn(); record(id, titre, st, d); } catch (e) { record(id, titre, 'ERREUR', String(e.message).split('\n')[0]); } save('parcours-c'); };
const writes = (s, from) => s.api.slice(from).filter(a => a.m !== 'GET').map(a => `${a.s} ${a.m} ${a.p}`).join(', ') || 'aucun appel d’écriture';
const errs = (s, from = 0) => [...new Set(s.api.slice(from).filter(a => a.s >= 400 && !a.p.endsWith('/auth/me')).map(a => `${a.s} ${a.m} ${a.p}`))].join(', ') || 'aucune';
const main = async (s, n = 300) => (await s.page.locator('#main-content').innerText().catch(() => '')).replace(/\s+/g, ' ').slice(0, n);

{ const s = await session(browser, 'basile.adjovi@parent.bj'); const { page } = s;
  await step('P1', 'Parent (avec enfant) : tableau de bord', async () => { await s.shot('P1-parent-dashboard'); return [s.path() === '/parent/dashboard' ? 'OBSERVÉ' : 'ÉCHEC', `arrivée ${s.path()} ; ${await main(s, 420)} ; erreurs API: ${errs(s)}`]; });
  for (const tab of ['Notes', 'Emploi du temps', 'Paiements', 'Échanges']) await step('P2-' + tab, `Parent : onglet « ${tab} » du tableau de bord`, async () => {
    const from = s.api.length; await page.locator('[role=tab]').filter({ hasText: tab }).first().click(); await s.settle(600); await s.shot('P2-parent-' + tab.replace(/\s/g, '_'));
    const t = await main(s, 1200); return ['OBSERVÉ', `${t.slice(t.indexOf(tab) > 200 ? 0 : 180, 620)} ; erreurs API: ${errs(s, from)} ; ${(await s.dump()).slice(0, 220)}`]; });
  await step('P3', 'Parent : « Mes enfants »', async () => { const from = s.api.length; await page.goto(BASE + '/parent/enfants'); await s.settle(); await s.shot('P3-mes-enfants'); return [/ADJOVI/.test(await main(s, 600)) ? 'VALIDÉ' : 'ÉCHEC', `${await main(s, 380)} ; erreurs API: ${errs(s, from)} ; ${(await s.dump()).slice(0, 200)}`]; });
  await step('P4', 'Parent : page « Paiements » et échéancier', async () => {
    const from = s.api.length; await page.goto(BASE + '/paiements'); await s.settle(); const liste = await main(s, 420); await s.shot('P4-paiements-parent');
    await page.getByRole('button', { name: /Échéancier/ }).click(); await s.settle(700); const t = await main(s, 1400); await s.shot('P4-echeancier-parent');
    const payer = page.getByRole('button', { name: /Payer|Régler/ }).first(); let pay = 'aucun bouton « Payer » visible';
    if (await payer.count()) { const f2 = s.api.length; await payer.click(); await page.waitForTimeout(3500); pay = `clic « Payer » → API: ${writes(s, f2)} ; URL: ${page.url().slice(0, 90)} ; message: ${[await s.toasts(), await s.alerts()].filter(Boolean).join(' / ')}`; }
    return [/Unauthorized|Erreur/.test(liste) ? 'ÉCHEC' : 'OBSERVÉ', `LISTE: ${liste} ; ÉCHÉANCIER: ${t.slice(-420)} ; ${pay} ; erreurs API: ${errs(s, from)}`]; });
  await step('P5', 'Parent : page « Notes »', async () => { const from = s.api.length; await page.goto(BASE + '/notes'); await s.settle(); await s.shot('P5-notes-parent'); return ['OBSERVÉ', `${await main(s, 420)} ; lignes: ${await page.locator('#main-content tbody tr').count()} ; erreurs API: ${errs(s, from)}`]; });
  await step('P6', 'Parent : assistant IA', async () => { const from = s.api.length; await page.goto(BASE + '/parent/ai-report'); await s.settle(1200); await s.shot('P6-ia-parent'); return ['OBSERVÉ', `${await main(s, 360)} ; erreurs API: ${errs(s, from)} ; ${(await s.dump()).slice(0, 160)}`]; });
  await s.ctx.close(); }

{ const s = await session(browser, 'directeur_ecole1'); const { page } = s;
  await step('C4', 'Recherche globale (Ctrl+K)', async () => {
    await page.goto(BASE + '/notes'); await s.settle(); await page.locator('h1').first().click(); await page.keyboard.press('Control+k'); await page.waitForTimeout(700);
    const dlg = page.locator('[role=dialog][aria-modal=true]').first(); if (!(await dlg.isVisible().catch(() => false))) return ['ÉCHEC', 'la palette ne s’ouvre pas avec Ctrl+K'];
    await page.keyboard.type('AGBODJAN', { delay: 50 }); await page.waitForTimeout(900); const r1 = (await dlg.innerText()).replace(/\s+/g, ' ').slice(0, 170);
    await page.keyboard.press('Control+a'); await page.keyboard.type('paiements', { delay: 50 }); await page.waitForTimeout(700); const r2 = (await dlg.innerText()).replace(/\s+/g, ' ').slice(0, 170); await s.shot('C4-recherche');
    await page.keyboard.press('Enter'); await page.waitForTimeout(900);
    return [s.path() === '/paiements' ? 'PARTIEL' : 'ÉCHEC', `« AGBODJAN » → ${r1} ; « paiements » → ${r2} ; Entrée → ${s.path()}`]; });
  await step('C5', 'Notifications et menu du compte', async () => {
    await page.keyboard.press('Escape'); const sums = page.locator('.ecole-header-top summary'); const n = await sums.count();
    await sums.first().click({ timeout: 4000 }); await page.waitForTimeout(300); const notif = (await page.locator('.ecole-popover:visible').first().innerText().catch(() => '')).replace(/\s+/g, ' ').slice(0, 100); await page.keyboard.press('Escape');
    await sums.last().click({ timeout: 4000 }); await page.waitForTimeout(300); const compte = (await page.locator('.ecole-popover:visible').first().innerText().catch(() => '')).replace(/\s+/g, ' ').slice(0, 100); await page.keyboard.press('Escape');
    return [notif && compte ? 'VALIDÉ' : 'ÉCHEC', `${n} menus ; notifications: « ${notif} » ; compte: « ${compte} »`]; });
  await step('H2', 'Élèves : état affiché de l’élève retiré (DJOKO Yvette)', async () => {
    await page.goto(BASE + '/eleves'); await s.settle(); await page.locator('#main-content input').first().fill('DJOKO'); await page.waitForTimeout(900);
    const ligne = (await page.locator('#main-content tbody').innerText().catch(() => '')).replace(/\s+/g, ' ').slice(0, 140); await s.shot('H2-eleve-retire');
    const boutons = (await page.locator('#main-content tbody tr').first().locator('button').allInnerTexts().catch(() => [])).join(' | ');
    return [/inactif|retiré|inactive/i.test(ligne) ? 'VALIDÉ' : 'ÉCHEC', `en base: statut = inactive ; ligne affichée: « ${ligne} » ; actions proposées: ${boutons || 'aucune'}`]; });
  await step('K1', 'Affectations : affecter un enseignant', async () => {
    await page.goto(BASE + '/affectations'); await s.settle(); const sels = page.locator('#main-content select'); const detail = [];
    for (let i = 0; i < await sels.count(); i++) { const opts = await sels.nth(i).locator('option').allInnerTexts(); detail.push(`${await sels.nth(i).getAttribute('aria-label') || i}: ${opts.length - 1} choix`); if (opts.length > 1 && !(await sels.nth(i).isDisabled())) { await sels.nth(i).selectOption({ index: 1 }).catch(() => {}); await s.settle(500); } }
    const btn = page.getByRole('button', { name: /^Affecter/ }); const dis = await btn.isDisabled(); const from = s.api.length;
    if (!dis) { await btn.click(); await s.settle(900); } await s.shot('K1-affectations');
    const msg = [await s.toasts(), await s.alerts()].filter(Boolean).join(' / ');
    return [!dis && / 20\d POST/.test(' ' + writes(s, from)) ? 'VALIDÉ' : dis ? 'BLOQUÉ' : 'ÉCHEC', `listes: ${detail.join(' ; ')} ; bouton « Affecter » ${dis ? 'désactivé' : 'actif'} ; API: ${writes(s, from)} ; message: « ${msg} » ; ${(await main(s, 900)).slice(-260)}`]; });
  await step('N1', 'Directeur : page « Notes » (volume de données)', async () => { await page.goto(BASE + '/notes'); await s.settle(); return ['OBSERVÉ', `${await main(s, 420)} ; lignes: ${await page.locator('#main-content tbody tr').count()} (641 notes en base)`]; });
  await s.ctx.close(); }

{ const s = await session(browser, 'enseignant_ecole1'); const { page } = s;
  await step('I2', 'Enseignant : onglet « Notes » et saisie', async () => {
    await page.locator('[role=tab]').filter({ hasText: 'Notes' }).first().click({ timeout: 4000 }); await s.settle(600); const avant = (await s.dump()).slice(0, 300);
    const b = page.locator('#main-content').getByText('Saisir des notes').first(); const from = s.api.length; const tag = await b.evaluate(e => e.closest('a,button')?.tagName + ' ' + (e.closest('a')?.getAttribute('href') || ''));
    await b.click({ timeout: 4000 }); await s.settle(900); await s.shot('I2-saisie-notes');
    return ['OBSERVÉ', `élément: ${tag} ; après clic → ${s.path()} ; dialogue: ${await page.locator('[role=dialog]:visible').count()} ; ${writes(s, from)} ; ${avant} ; APRÈS: ${(await s.dump()).slice(0, 300)} ; ${(await main(s, 500)).slice(-200)}`]; });
  await s.ctx.close(); }
await browser.close();
