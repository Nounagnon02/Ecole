// Parcours B : déconnexion, recherche, messagerie, écoles, élèves, notes, paiements, affectations, mobile.
import { BASE, launch, session, record, save } from './wf-lib.mjs';
const browser = await launch(0);
const step = async (id, titre, fn) => { try { const [st, d] = await fn(); record(id, titre, st, d); } catch (e) { record(id, titre, 'ERREUR', String(e.message).split('\n')[0]); } save('parcours-b'); };
const STAMP = String(Date.now()).slice(-5);
const writes = (s, from) => s.api.slice(from).filter(a => a.m !== 'GET').map(a => `${a.s} ${a.m} ${a.p}`).join(', ') || 'aucun appel d’écriture';

{ const s = await session(browser, 'enseignant_ecole1'); const { page } = s;
  await step('A6', 'Déconnexion puis bouton « Précédent »', async () => {
    await page.locator('.ecole-header-actions summary').last().click(); await page.getByRole('button', { name: /Déconnexion/ }).click();
    await page.waitForURL('**/connexion', { timeout: 6000 }).catch(() => {}); const out = s.path(); await page.goBack().catch(() => {}); await page.waitForTimeout(1500);
    return [out === '/connexion' && s.path() === '/connexion' ? 'VALIDÉ' : 'ÉCHEC', `après déconnexion: ${out} ; après « Précédent »: ${s.path()}`]; });
  await s.ctx.close(); }

{ const s = await session(browser, 'directeur_ecole1'); const { page } = s;
  await step('C4', 'Recherche globale (Ctrl+K) : chercher un élève puis une page', async () => {
    await page.keyboard.press('Control+k'); await page.waitForTimeout(600); const dlg = page.locator('[role=dialog]').first();
    await page.keyboard.type('AGBODJAN', { delay: 50 }); await page.waitForTimeout(900);
    const r1 = (await dlg.innerText()).replace(/\s+/g, ' ').slice(0, 160);
    await page.keyboard.press('Control+a'); await page.keyboard.type('paiements', { delay: 50 }); await page.waitForTimeout(700);
    const r2 = (await dlg.innerText()).replace(/\s+/g, ' ').slice(0, 160); await s.shot('C4-recherche');
    await page.keyboard.press('Enter'); await page.waitForTimeout(900);
    return [s.path() === '/paiements' ? (/AGBODJAN/.test(r1.replace('AGBODJAN', '')) ? 'VALIDÉ' : 'PARTIEL') : 'ÉCHEC', `« AGBODJAN » → ${r1} ; « paiements » → ${r2} ; Entrée → ${s.path()}`]; });
  await step('C5', 'Notifications et menu du compte', async () => {
    await page.locator('.ecole-header-actions summary').first().click(); await page.waitForTimeout(300);
    const notif = (await page.locator('.ecole-popover:visible').first().innerText().catch(() => '')).replace(/\s+/g, ' ').slice(0, 100); await page.keyboard.press('Escape');
    await page.locator('.ecole-header-actions summary').last().click(); await page.waitForTimeout(300);
    const compte = (await page.locator('.ecole-popover:visible').first().innerText().catch(() => '')).replace(/\s+/g, ' ').slice(0, 100); await page.keyboard.press('Escape');
    return [notif && compte ? 'VALIDÉ' : 'ÉCHEC', `notifications: « ${notif} » ; compte: « ${compte} »`]; });

  await step('H1', 'Élèves : recherche par nom', async () => {
    await page.goto(BASE + '/eleves'); await s.settle(); const total = await page.locator('#main-content tbody tr').count();
    await page.locator('#main-content input').first().fill('AGBODJAN'); await page.waitForTimeout(900); const n = await page.locator('#main-content tbody tr').count();
    const txt = (await page.locator('#main-content tbody').innerText().catch(() => '')).replace(/\s+/g, ' ').slice(0, 120);
    await page.locator('#main-content input').first().fill("N'existe pas"); await page.waitForTimeout(900); const vide = (await page.locator('#main-content').innerText()).match(/Aucun[^\n]*/)?.[0] || 'pas de message d’état vide';
    await page.locator('#main-content input').first().fill(''); await page.waitForTimeout(600);
    return [n > 0 && n < total ? 'VALIDÉ' : 'ÉCHEC', `${total} lignes → ${n} pour « AGBODJAN » (${txt}) ; recherche sans résultat: « ${vide} »`]; });
  await step('H2', 'Élèves : retirer un élève des effectifs', async () => {
    const row = page.locator('#main-content tbody tr').last(); const nom = (await row.innerText()).replace(/\s+/g, ' ').slice(0, 40); const before = s.api.length; const avant = await page.locator('#main-content tbody tr').count();
    s.accept = true; await row.getByRole('button', { name: /Retirer/ }).click(); await s.settle(900); s.accept = false;
    const apres = await page.locator('#main-content tbody tr').count(); const msg = await s.toasts();
    await page.reload(); await s.settle(); const persiste = await page.locator('#main-content tbody tr').count();
    return [apres === avant - 1 && persiste === apres ? 'VALIDÉ' : 'ÉCHEC', `élève: ${nom} ; confirmation: ${s.dialogs.slice(-1)[0]?.slice(0, 60)} ; API: ${writes(s, before)} ; lignes ${avant} → ${apres} → ${persiste} après rechargement ; message: « ${msg} » ; restauration possible depuis l’interface: non proposée`]; });
  await step('H3', 'Élèves : créer un élève', async () => {
    const before = s.api.length; await page.getByRole('button', { name: /Nouvel élève/ }).click(); await page.waitForTimeout(800);
    const dlg = await page.locator('[role=dialog]:visible').count();
    return [dlg ? 'VALIDÉ' : 'ÉCHEC', `clic sur « Nouvel élève » : ${dlg ? 'dialogue ouvert' : 'rien ne se passe'} ; ${writes(s, before)} ; le bouton n’a aucune action dans le code (ElevesPage.jsx:97)`]; });

  await step('I1', 'Notes : filtres, classement, bulletins, export', async () => {
    await page.goto(BASE + '/notes'); await s.settle(); const lignes = await page.locator('#main-content tbody tr').count();
    const opts = await page.locator('#main-content select').first().locator('option').allInnerTexts();
    if (opts.length > 1) { await page.locator('#main-content select').first().selectOption({ index: 1 }); await s.settle(600); }
    const filtrees = await page.locator('#main-content tbody tr').count();
    await page.getByRole('button', { name: /^Classement/ }).click(); await s.settle(600); const classement = (await s.dump()).slice(0, 260);
    await page.getByRole('button', { name: /^Bulletins/ }).click(); await s.settle(600); const bulletins = (await s.dump()).slice(0, 330); await s.shot('I1-bulletins');
    const txtB = (await page.locator('#main-content').innerText()).replace(/\s+/g, ' ').slice(-260);
    await page.getByRole('button', { name: /^Notes$/ }).click(); await page.waitForTimeout(400);
    s.popups.length = 0; s.downloads.length = 0; await page.getByRole('button', { name: /^Exporter/ }).click(); await page.waitForTimeout(2500);
    return ['OBSERVÉ', `${lignes} lignes ; filtre « ${opts[1] || '—'} » → ${filtrees} ; CLASSEMENT: ${classement} ; BULLETINS: ${bulletins} … ${txtB} ; EXPORT → téléchargement: ${s.downloads.join(',') || 'aucun'} ; nouvel onglet: ${s.popups.join(' | ').slice(0, 200) || 'aucun'}`]; });

  await step('K1', 'Affectations : affecter un enseignant puis retirer', async () => {
    await page.goto(BASE + '/affectations'); await s.settle(); const sels = page.locator('#main-content select');
    for (let i = 0; i < await sels.count(); i++) { const n = await sels.nth(i).locator('option').count(); if (n > 1) { await sels.nth(i).selectOption({ index: 1 }).catch(() => {}); await s.settle(500); } }
    const choix = await sels.evaluateAll(a => a.map(x => x.selectedOptions[0]?.textContent.trim()).join(' / ')); const before = s.api.length;
    await page.getByRole('button', { name: /^Affecter/ }).click(); await s.settle(900);
    const msg = [await s.toasts(), await s.alerts()].filter(Boolean).join(' / '); await s.shot('K1-affectations');
    return [/ 20\d POST/.test(' ' + writes(s, before)) ? 'VALIDÉ' : 'ÉCHEC', `choix: ${choix} ; API: ${writes(s, before)} ; message: « ${msg} » ; ${(await s.dump()).slice(0, 200)}`]; });
  await s.ctx.close(); }

{ const s = await session(browser, 'PAR001'); const { page } = s;
  await step('F1', 'Messagerie : un parent écrit à un enseignant', async () => {
    await page.goto(BASE + '/messagerie'); await s.settle(); await page.getByRole('button', { name: /Nouvelle conversation/ }).click(); await page.waitForTimeout(900);
    const contacts = await page.locator('button').filter({ hasText: /eleve|parent|enseignant|etudiant|admin/ }).count();
    const eleves = await page.locator('button').filter({ hasText: /\beleve\b/ }).count(); const parents = await page.locator('button').filter({ hasText: /\bparent\b/ }).count();
    await page.locator('button').filter({ hasText: /enseignant/ }).first().click(); await page.waitForTimeout(700);
    const MSG = `Bonjour, l'élève Yèhossou sera absent demain (n°${STAMP}).`; const before = s.api.length;
    await page.locator('input[placeholder*="message" i], textarea[placeholder*="message" i]').first().fill(MSG); await page.keyboard.press('Enter'); await s.settle(900);
    const vu = await page.getByText(MSG).count(); await s.shot('F1-messagerie'); await page.reload(); await s.settle();
    const apres = (await page.locator('#main-content').innerText()).includes(`n°${STAMP}`);
    return [vu && / 20\d POST/.test(' ' + writes(s, before)) ? (apres ? 'VALIDÉ' : 'PARTIEL') : 'ÉCHEC', `contacts proposés au parent: ${contacts} dont ${eleves} élèves et ${parents} autres parents ; API: ${writes(s, before)} ; message affiché: ${vu ? 'oui' : 'non'} ; visible après rechargement (liste des conversations): ${apres ? 'oui' : 'non'}`]; });
  await step('J1', 'Paiements (parent) : échéancier et paiement en ligne', async () => {
    await page.goto(BASE + '/paiements'); await s.settle(); const liste = (await page.locator('#main-content').innerText()).replace(/\s+/g, ' ').slice(0, 260);
    await page.getByRole('button', { name: /Échéancier/ }).click(); await s.settle(700); const dump = (await s.dump()).slice(0, 420);
    const ech = (await page.locator('#main-content').innerText()).replace(/\s+/g, ' ').slice(-300); await s.shot('J1-echeancier-parent');
    const payer = page.getByRole('button', { name: /Payer|Régler/ }).first(); let pay = 'aucun bouton « Payer » visible';
    if (await payer.count()) { const before = s.api.length; await payer.click(); await page.waitForTimeout(3000); pay = `clic « Payer » → API: ${writes(s, before)} ; page: ${page.url().slice(0, 80)} ; message: ${[await s.toasts(), await s.alerts()].filter(Boolean).join(' / ')}`; }
    return ['OBSERVÉ', `LISTE: ${liste} ; ÉCHÉANCIER: ${dump} … ${ech} ; ${pay}`]; });
  await step('J2', 'Parent : page « Mes enfants »', async () => {
    await page.goto(BASE + '/parent/enfants'); await s.settle(); const txt = (await page.locator('#main-content').innerText()).replace(/\s+/g, ' ').slice(0, 260); await s.shot('J2-mes-enfants');
    return [/AGBODJAN|HOUNGBO|Yèhossou|Fifamè/.test(txt) ? 'VALIDÉ' : 'ÉCHEC', `contenu: « ${txt} » ; API en erreur: ${s.api.filter(a => a.s >= 400).map(a => a.s + ' ' + a.p).slice(-3).join(', ') || 'aucune'}`]; });
  await s.ctx.close(); }

{ const s = await session(browser, 'enseignant_ecole1'); const { page } = s;
  await step('I2', 'Enseignant : saisir des notes', async () => {
    await page.locator('[role=tab]').filter({ hasText: /^Notes/ }).first().click(); await page.waitForTimeout(600);
    const before = s.api.length; await page.getByRole('button', { name: /Saisir des notes/ }).click(); await s.settle(900);
    const dlg = await page.locator('[role=dialog]:visible').count(); const dump = (await s.dump(dlg ? '[role=dialog]' : '#main-content')).slice(0, 420); await s.shot('I2-saisie-notes');
    return ['OBSERVÉ', `après clic → page ${s.path()} ; dialogue: ${dlg} ; ${writes(s, before)} ; ${dump}`]; });
  await step('I3', 'Enseignant : page « Mes classes »', async () => {
    await page.goto(BASE + '/enseignant/classes'); await s.settle(); const txt = (await page.locator('#main-content').innerText()).replace(/\s+/g, ' ').slice(0, 240);
    return ['OBSERVÉ', `${txt} ; ${(await s.dump()).slice(0, 240)}`]; });
  await s.ctx.close(); }

{ const s = await session(browser, 'super-admin@ecole.bj'); const { page } = s; const NOM = `Collège Sainte-Thérèse d'Abomey ${STAMP}`;
  await step('G1', 'Écoles : envoi du formulaire vide', async () => {
    await page.goto(BASE + '/admin/ecoles'); await s.settle(); await page.getByRole('button', { name: /Ajouter une école/ }).click(); await page.waitForTimeout(600);
    const dlg = page.getByRole('dialog'); const before = s.api.length; await dlg.getByRole('button', { name: /Créer/ }).click(); await page.waitForTimeout(900);
    const msgs = (await dlg.locator('[role=alert], p.text-xs, .text-\\[var\\(--red\\)\\]').allInnerTexts()).map(t => t.trim()).filter(Boolean).slice(0, 4).join(' / ');
    return [await dlg.isVisible() ? 'VALIDÉ' : 'ÉCHEC', `API: ${writes(s, before)} ; messages: « ${msgs || 'aucun message visible'} » ; ${(await s.dump('[role=dialog]')).slice(0, 380)}`]; });
  await step('G2', 'Écoles : créer une école (nom accentué, téléphone à 10 chiffres)', async () => {
    const dlg = page.getByRole('dialog');
    await dlg.getByPlaceholder('Ex: Complexe scolaire Lumière').fill(NOM); await dlg.getByPlaceholder('contact@ecole.bj').fill(`contact${STAMP}@sainte-therese.bj`);
    await dlg.getByPlaceholder('+229 01 02 03 04').fill('0197000000'); await dlg.getByPlaceholder('Cotonou, Bénin').fill('Quartier Hountondji, Abomey'); await dlg.getByPlaceholder('Cotonou', { exact: true }).fill('Abomey');
    const before = s.api.length; await dlg.getByRole('button', { name: /Créer/ }).click(); await s.settle(1500);
    const msg = [await s.toasts(), await s.alerts()].filter(Boolean).join(' / '); const txt = (await page.locator('body').innerText()); const comptes = txt.match(/(mot de passe|identifiant)[^\n]{0,80}/i)?.[0] || '';
    await s.shot('G2-ecole-creee'); await page.keyboard.press('Escape'); await page.reload(); await s.settle(); const vu = await page.getByText(NOM).count();
    return [vu ? 'VALIDÉ' : 'ÉCHEC', `API: ${writes(s, before)} ; message: « ${msg.slice(0, 140)} » ; comptes créés affichés: ${comptes || 'non'} ; visible après rechargement: ${vu ? 'oui' : 'non'}`]; });
  await s.ctx.close(); }

{ const s = await session(browser, 'PAR001', { viewport: { width: 360, height: 740 } }); const { page } = s;
  await step('L1', 'Mobile 360 px : menu, navigation, zones tactiles (parent)', async () => {
    const menu = page.locator('.ecole-mobile-menu'); await menu.click(); await page.waitForTimeout(400);
    const liens = await page.locator('#mobile-navigation a').count(); await s.shot('L1-menu-mobile');
    await page.locator('#mobile-navigation a').filter({ hasText: /Notes/ }).first().click(); await s.settle();
    const ov = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    const petites = await page.evaluate(() => [...document.querySelectorAll('button, a[href], select, input')].filter(e => { const r = e.getBoundingClientRect(); return r.width > 0 && (r.height < 44 || r.width < 44) && r.height > 0; }).length);
    const total = await page.evaluate(() => [...document.querySelectorAll('button, a[href], select, input')].filter(e => e.getBoundingClientRect().width > 0).length);
    const police = await page.evaluate(() => Math.min(...[...document.querySelectorAll('#main-content *')].filter(e => e.children.length === 0 && e.textContent.trim()).map(e => parseFloat(getComputedStyle(e).fontSize)))); await s.shot('L1-notes-mobile');
    return [liens > 0 && s.path() === '/notes' ? (ov > 4 || petites ? 'PARTIEL' : 'VALIDÉ') : 'ÉCHEC', `menu: ${liens} liens ; arrivée ${s.path()} ; débordement horizontal ${ov}px ; zones tactiles < 44 px: ${petites}/${total} ; plus petite police: ${police}px`]; });
  await s.ctx.close(); }
await browser.close();
