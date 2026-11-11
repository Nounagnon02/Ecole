// Parcours A : authentification, annonces, paramètres, langue, thème, recherche, hors-ligne.
import { BASE, launch, session, signIn, record, save } from './wf-lib.mjs';

const browser = await launch(0);
const step = async (id, titre, fn) => { try { const [st, d] = await fn(); record(id, titre, st, d); } catch (e) { record(id, titre, 'ERREUR', String(e.message).split('\n')[0]); } save('parcours-a'); };
const STAMP = String(Date.now()).slice(-5);

// ───────────── A. Authentification ─────────────
{
  const s = await session(browser, null, { login: false }); const { page } = s;
  await step('A1', 'Formulaire de connexion vide', async () => {
    await page.goto(BASE + '/connexion'); await page.click('button[type="submit"]'); await page.waitForTimeout(500);
    const txt = await page.locator('.ecole-auth-card').innerText();
    const sent = s.api.filter(a => a.p.endsWith('/auth/login')).length;
    return [/Veuillez entrer/.test(txt) && sent === 0 ? 'VALIDÉ' : 'ÉCHEC', `messages: ${(txt.match(/Veuillez[^\n]*/g) || []).join(' / ')} ; appels API: ${sent}`];
  });
  await step('A2', 'Mauvais mot de passe', async () => {
    const p = await signIn(s, 'enseignant_ecole1', 'mauvais-mot-de-passe');
    const msg = await s.alerts(); await s.shot('A2-mauvais-mot-de-passe');
    return [p === '/connexion' && msg ? 'VALIDÉ' : 'ÉCHEC', `reste sur ${p} ; message: « ${msg} »`];
  });
  await step('A3', 'Identifiant inconnu : le message ne révèle pas si le compte existe', async () => {
    const m1 = await s.alerts();
    await signIn(s, 'compte_inexistant_zz', 'password'); const m2 = await s.alerts();
    return [m1 === m2 ? 'VALIDÉ' : 'À VÉRIFIER', `compte existant: « ${m1} » ; compte inconnu: « ${m2} »`];
  });
  await step('A4', 'Route protégée sans session', async () => {
    await page.goto(BASE + '/directeur/dashboard'); await page.waitForURL('**/connexion', { timeout: 6000 }).catch(() => {});
    return [s.path() === '/connexion' ? 'VALIDÉ' : 'ÉCHEC', `arrivée ${s.path()}`];
  });
  await step('A5', 'Mot de passe oublié', async () => {
    await page.goto(BASE + '/forgot-password'); await s.settle();
    const before = s.api.length;
    const input = page.locator('input').first(); await input.fill('enseignantecole1@gmail.cj');
    await page.locator('button[type="submit"]').click(); await s.settle(800);
    const calls = s.api.slice(before).map(a => `${a.s} ${a.m} ${a.p}`).join(', ');
    const txt = (await page.locator('main, body').first().innerText()).replace(/\s+/g, ' ').slice(0, 220); await s.shot('A5-mot-de-passe-oublie');
    return [/ 200 | 20\d /.test(' ' + calls) || /^20/.test(calls) ? 'VALIDÉ' : 'ÉCHEC', `API: ${calls || 'aucun appel'} ; écran: ${txt}`];
  });
  await step('A6', 'Connexion valide puis déconnexion', async () => {
    const p = await signIn(s, 'enseignant_ecole1'); if (p !== '/enseignant/dashboard') return ['ÉCHEC', `connexion → ${p}`];
    await page.locator('.ecole-header summary').last().click();
    await page.getByRole('button', { name: /Déconnexion/ }).click(); await page.waitForURL('**/connexion', { timeout: 6000 }).catch(() => {});
    const out = s.path(); await page.goBack().catch(() => {}); await page.waitForTimeout(1200);
    return [out === '/connexion' && s.path() === '/connexion' ? 'VALIDÉ' : 'ÉCHEC', `après déconnexion: ${out} ; après « Précédent »: ${s.path()}`];
  });
  await step('A7', 'Expiration de session en cours d’utilisation', async () => {
    await signIn(s, 'enseignant_ecole1'); await s.ctx.clearCookies();
    await page.locator('.ecole-navigation a').nth(1).click(); await page.waitForTimeout(2500);
    const txt = (await page.locator('body').innerText()).replace(/\s+/g, ' ').slice(0, 160);
    return [s.path() === '/connexion' ? 'VALIDÉ' : 'ÉCHEC', `arrivée ${s.path()} ; écran: ${txt}`];
  });
  await s.ctx.close();
}

// ───────────── B. Annonces (directeur → parent, élève) ─────────────
const TITRE = `Réunion des parents d'élèves n°${STAMP}`;
{
  const s = await session(browser, 'directeur_ecole1'); const { page } = s;
  await step('B1', 'Publication vide refusée', async () => {
    await page.goto(BASE + '/communications'); await s.settle();
    await page.getByRole('button', { name: /Nouvelle publication/ }).first().click(); await page.waitForTimeout(400);
    const before = s.api.length; await page.getByRole('button', { name: /^Publier/ }).click(); await s.settle(600);
    const calls = s.api.slice(before).filter(a => a.m === 'POST').map(a => `${a.s} ${a.p}`).join(', ');
    const msg = [await s.alerts(), await s.toasts()].filter(Boolean).join(' / '); await s.shot('B1-publication-vide');
    return [msg ? 'VALIDÉ' : 'ÉCHEC', `API: ${calls || 'aucun appel'} ; message affiché: « ${msg || 'AUCUN'} » ; ${await s.dump()}`];
  });
  await step('B2', 'Publier une annonce (accents, apostrophe)', async () => {
    await page.locator('#main-content input[type="text"], #main-content input:not([type])').first().fill(TITRE);
    await page.locator('#main-content textarea').first().fill("Chers parents, la réunion aura lieu samedi à 9 h à l'école. Présence souhaitée — merci d'être à l'heure.");
    const before = s.api.length; await page.getByRole('button', { name: /^Publier/ }).dblclick(); await s.settle(900);
    const posts = s.api.slice(before).filter(a => a.m === 'POST' && a.p.endsWith('/communications'));
    const visible = await page.getByText(TITRE).count(); await s.shot('B2-annonce-publiee');
    return [posts.some(p => p.s < 300) && visible > 0 ? (posts.length > 1 || visible > 1 ? 'PARTIEL' : 'VALIDÉ') : 'ÉCHEC', `POST: ${posts.map(p => p.s).join(',')} (double-clic → ${posts.length} envoi(s)) ; occurrences à l'écran: ${visible} ; message: ${await s.toasts()}`];
  });
  await step('B3', 'L’annonce persiste après rechargement', async () => {
    await page.reload(); await s.settle(); const n = await page.getByText(TITRE).count();
    return [n >= 1 ? 'VALIDÉ' : 'ÉCHEC', `occurrences après rechargement: ${n}`];
  });
  await s.ctx.close();
  for (const [id, compte] of [['B4', 'PAR001'], ['B5', 'EL001']]) {
    const t = await session(browser, compte);
    await step(id, `L’annonce est visible par ${compte}`, async () => {
      await t.page.goto(BASE + '/communications'); await t.settle(); const n = await t.page.getByText(TITRE).count(); await t.shot(`${id}-annonce-${compte}`);
      const peutPublier = await t.page.getByRole('button', { name: /Nouvelle publication/ }).count();
      return [n >= 1 ? 'VALIDÉ' : 'ÉCHEC', `occurrences: ${n} ; bouton « Nouvelle publication » proposé à ce rôle: ${peutPublier ? 'OUI' : 'non'}`];
    });
    await t.ctx.close();
  }
}

// ───────────── C. Paramètres, langue, thème, recherche ─────────────
{
  const s = await session(browser, 'enseignant_ecole1'); const { page } = s;
  await step('C1', 'Modifier son téléphone (numéro béninois à 10 chiffres)', async () => {
    await page.goto(BASE + '/parametres'); await s.settle();
    const champs = await s.dump();
    const tel = page.locator('#main-content input[type="tel"], #main-content input[name*="tel" i], #main-content input[id*="tel" i], #main-content input[placeholder*="229"]').first();
    if (!(await tel.count())) return ['BLOQUÉ', 'champ téléphone introuvable ; ' + champs];
    await tel.fill('0197123456'); const before = s.api.length;
    await page.getByRole('button', { name: /Enregistrer|Sauvegarder|Mettre à jour/ }).first().click(); await s.settle(800);
    const calls = s.api.slice(before).filter(a => a.m !== 'GET').map(a => `${a.s} ${a.m} ${a.p}`).join(', '); const msg = [await s.toasts(), await s.alerts()].filter(Boolean).join(' / ');
    await page.reload(); await s.settle(); const val = await tel.inputValue().catch(() => '?'); await s.shot('C1-parametres');
    return [val === '0197123456' ? 'VALIDÉ' : 'ÉCHEC', `API: ${calls || 'aucun appel'} ; message: « ${msg} » ; valeur après rechargement: « ${val} »`];
  });
  await step('C2', 'Changer de langue : anglais puis arabe', async () => {
    const sel = page.locator('.ecole-header-language select'); if (!(await sel.count())) return ['BLOQUÉ', 'sélecteur de langue introuvable'];
    const opts = await sel.locator('option').evaluateAll(o => o.map(x => x.value));
    await sel.selectOption('en'); await page.waitForTimeout(600);
    const navEn = (await page.locator('.ecole-navigation a').allInnerTexts()).join(' | '); const h1En = await page.locator('h1').first().innerText();
    await sel.selectOption('ar'); await page.waitForTimeout(600);
    const dir = await page.evaluate(() => document.documentElement.dir || getComputedStyle(document.documentElement).direction); const lang = await page.evaluate(() => document.documentElement.lang);
    const ov = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth); await s.shot('C2-arabe');
    const reste = await page.evaluate(() => (document.querySelector('#main-content')?.innerText.match(/[A-Za-zÀ-ÿ]{4,}/g) || []).slice(0, 8).join(', '));
    await page.reload(); await s.settle(); const langApres = await page.evaluate(() => document.documentElement.lang);
    await sel.selectOption('fr'); await page.waitForTimeout(400);
    return [dir === 'rtl' && langApres === 'ar' ? (reste ? 'PARTIEL' : 'VALIDÉ') : 'ÉCHEC', `langues: ${opts.join(',')} ; menu en anglais: ${navEn.slice(0, 110)} ; h1: ${h1En} ; arabe: dir=${dir}, lang=${lang}, débordement ${ov}px, conservé après rechargement: ${langApres} ; textes latins restants: ${reste || 'aucun'}`];
  });
  await step('C3', 'Thème sombre conservé après rechargement', async () => {
    await page.locator('.ecole-header-actions > button').nth(1).click(); await page.waitForTimeout(400);
    const dark1 = await page.evaluate(() => document.documentElement.classList.contains('dark')); await s.shot('C3-theme-sombre');
    await page.reload(); await s.settle(); const dark2 = await page.evaluate(() => document.documentElement.classList.contains('dark'));
    if (dark2) { await page.locator('.ecole-header-actions > button').nth(1).click(); await page.waitForTimeout(300); }
    return [dark1 && dark2 ? 'VALIDÉ' : 'ÉCHEC', `sombre après clic: ${dark1} ; après rechargement: ${dark2}`];
  });
  await step('C4', 'Recherche globale (Ctrl+K)', async () => {
    await page.keyboard.press('Control+k'); await page.waitForTimeout(500);
    const dlg = page.locator('[role=dialog]:visible, [cmdk-root]:visible').first(); if (!(await dlg.isVisible().catch(() => false))) return ['ÉCHEC', 'la palette ne s’ouvre pas'];
    await page.keyboard.type('notes', { delay: 40 }); await page.waitForTimeout(500);
    const items = (await dlg.innerText()).replace(/\s+/g, ' ').slice(0, 200); await s.shot('C4-recherche');
    await page.keyboard.press('Enter'); await page.waitForTimeout(900); const p = s.path(); await page.keyboard.press('Escape');
    return [p === '/notes' ? 'VALIDÉ' : 'PARTIEL', `résultats: ${items} ; Entrée → ${p}`];
  });
  await step('C5', 'Bouton « Rechercher » de l’en-tête et notifications', async () => {
    await page.locator('.ecole-header-actions > button').first().click(); await page.waitForTimeout(400);
    const open = await page.locator('[role=dialog]:visible, [cmdk-root]:visible').first().isVisible().catch(() => false); await page.keyboard.press('Escape');
    await page.locator('.ecole-header details summary').first().click(); await page.waitForTimeout(300);
    const notif = (await page.locator('.ecole-popover:visible').first().innerText().catch(() => '')).replace(/\s+/g, ' ').slice(0, 120); await page.keyboard.press('Escape');
    return [open && notif ? 'VALIDÉ' : 'ÉCHEC', `palette ouverte: ${open} ; notifications: « ${notif} »`];
  });
  await s.ctx.close();
}

// ───────────── D. Hors-ligne ─────────────
{
  const s = await session(browser, 'directeur_ecole1'); const { page } = s; const HL = `Annonce hors-ligne n°${STAMP}`;
  await step('D1', 'Coupure réseau : bandeau et page déjà ouverte', async () => {
    await page.goto(BASE + '/communications'); await s.settle();
    await s.ctx.setOffline(true); await page.waitForTimeout(900);
    const bandeau = (await page.locator('.ecole-network').innerText().catch(() => '')).trim(); await s.shot('D1-hors-ligne');
    return [bandeau ? 'VALIDÉ' : 'ÉCHEC', `bandeau: « ${bandeau} »`];
  });
  await step('D2', 'Publier pendant la coupure, puis retour du réseau', async () => {
    await page.getByRole('button', { name: /Nouvelle publication/ }).first().click(); await page.waitForTimeout(300);
    await page.locator('#main-content input[type="text"], #main-content input:not([type])').first().fill(HL);
    await page.locator('#main-content textarea').first().fill('Saisie pendant une coupure de réseau.');
    await page.getByRole('button', { name: /^Publier/ }).click(); await page.waitForTimeout(1500);
    const msgOff = [await s.toasts(), await s.alerts()].filter(Boolean).join(' / ') || 'AUCUN MESSAGE';
    const saisieConservee = await page.locator('#main-content textarea').first().inputValue().catch(() => '(formulaire fermé)'); await s.shot('D2-publication-hors-ligne');
    await s.ctx.setOffline(false); await page.waitForTimeout(4000);
    await page.reload(); await s.settle(); const n = await page.getByText(HL).count();
    return [n >= 1 ? 'VALIDÉ' : 'ÉCHEC', `pendant la coupure: « ${msgOff} » ; saisie conservée à l’écran: ${saisieConservee ? 'oui' : 'non'} ; annonce présente après retour du réseau: ${n >= 1 ? 'oui' : 'NON (saisie perdue)'}`];
  });
  await step('D3', 'Naviguer vers une autre page pendant la coupure', async () => {
    await s.ctx.setOffline(true); await page.locator('.ecole-navigation a').nth(1).click(); await page.waitForTimeout(2500);
    const txt = (await page.locator('#main-content').innerText().catch(() => '')).replace(/\s+/g, ' ').slice(0, 220); await s.shot('D3-navigation-hors-ligne');
    await s.ctx.setOffline(false);
    return ['OBSERVÉ', `page ${s.path()} ; contenu: ${txt}`];
  });
  await s.ctx.close();
}
await browser.close();
