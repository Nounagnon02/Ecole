// Génère, à partir des mesures du robot (preuves/mesures/crawl-*.json) :
//   - audit/01-inventaire-fonctionnel.md  (pages, navigation, éléments par rôle)
//   - audit/03-resultats-tests.md         (résultat de chaque clic, page par page)
//   - preuves/mesures/synthese.json       (indicateurs chiffrés)
// Usage : node audit/preuves/outils/generer-rapports.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const MES = path.join(ROOT, 'preuves/mesures');
const runs = fs.readdirSync(MES).filter(f => f.startsWith('crawl-')).map(f => JSON.parse(fs.readFileSync(path.join(MES, f), 'utf8')))
  .sort((a, b) => a.compte.localeCompare(b.compte));

const esc = s => String(s ?? '').replace(/\|/g, '\\|').replace(/\n/g, ' ');
const verdict = c => {
  if (c.effet === 'désactivé') return 'non exécuté (désactivé)';
  if (c.effet === 'AUCUN EFFET VISIBLE') return 'SANS EFFET';
  if (/clic impossible/.test(c.effet)) return 'non exécuté (clic impossible)';
  if (/api [^+]*\b[45]\d\d /.test(c.effet)) return 'ÉCHEC API';
  return 'réagit';
};

const S = { comptes: runs.length, comptesTermines: runs.filter(r => r.termine).length, connexionsOk: runs.filter(r => r.login?.ok).length,
  routes: 0, pagesAutorisees: 0, pagesRefusees: 0, pagesRedirigees: 0, pagesAvecErreurApi: 0, boutonsVus: 0, clics: 0, liens: 0, champs: 0, onglets: 0,
  parVerdict: {}, dialogues: 0, formulairesEnvoiVide: 0 };
const pagesUniques = new Map(); const boutonsUniques = new Map(); const liensUniques = new Set();

let inv = '# 01 — Inventaire fonctionnel\n\n> Généré par `preuves/outils/generer-rapports.mjs` à partir des mesures relevées dans Google Chrome. Ne pas modifier à la main.\n\n';
let res = '# 03 — Résultats des tests interactifs\n\n> Généré par `preuves/outils/generer-rapports.mjs`. Chaque ligne est un clic réellement effectué dans Google Chrome par le robot.\n>\n> **Lecture des verdicts.** « réagit » : le clic a produit un effet observable (appel API réussi, dialogue, navigation, changement d\'affichage) — cela ne prouve pas que l\'objectif métier est atteint, voir les parcours de bout en bout. « SANS EFFET » : aucun effet observable. « ÉCHEC API » : l\'API a répondu 4xx/5xx. « non exécuté » : bouton désactivé ou clic impossible.\n\n';

for (const r of runs) {
  // Pendant le parcours à trois navigateurs, la machine était saturée : certaines pages sont restées sur
  // l'indicateur de chargement (ni titre, ni bouton, ni champ). Elles ne sont PAS des accès autorisés ;
  // la matrice d'accès fiable est dans preuves/mesures/matrice-acces.json.
  for (const p of r.pages) if (p.acces === 'autorisé' && !p.nbH1 && !p.boutons && !p.champs && !(p.liens || []).length) p.acces = 'chargement non abouti';
  S.chargementsNonAboutis = (S.chargementsNonAboutis || 0) + r.pages.filter(p => p.acces === 'chargement non abouti').length;
  const ok = r.pages.filter(p => p.acces === 'autorisé');
  S.routes += r.pages.length; S.pagesAutorisees += ok.length;
  S.pagesRefusees += r.pages.filter(p => p.acces === 'refusé').length;
  S.pagesRedirigees += r.pages.filter(p => !['autorisé', 'refusé', 'chargement non abouti'].includes(p.acces)).length;
  inv += `## ${r.compte}${r.termine ? '' : ' (parcours incomplet)'}\n\n`;
  inv += `- Connexion : ${r.login?.ok ? 'réussie' : 'ÉCHEC'} → \`${r.login?.arrivee}\` en ${r.login?.ms} ms${r.login?.deuxFacteurs ? ` · 2FA : ${r.login.deuxFacteurs}` : ''}${r.login?.erreur ? ` · message : ${esc(r.login.erreur)}` : ''}\n`;
  inv += `- Liens du menu (${r.nav.length}) : ${r.nav.map(n => `${esc(n.texte)} \`${n.href}\``).join(' · ') || 'aucun'}\n`;
  const navSet = new Set(r.nav.map(n => n.href));
  const orphelines = ok.filter(p => !navSet.has(p.route) && !/\/dashboard$/.test(p.route)).map(p => p.route);
  if (orphelines.length) inv += `- Pages autorisées sans lien dans le menu : ${orphelines.map(o => `\`${o}\``).join(', ')}\n`;
  inv += `- Routes : ${ok.length} autorisées, ${r.pages.filter(p => p.acces === 'refusé').length} refusées, ${r.pages.filter(p => !['autorisé', 'refusé', 'chargement non abouti'].includes(p.acces)).length} redirigées, ${r.pages.filter(p => p.acces === 'chargement non abouti').length} chargements non aboutis (machine saturée)\n\n`;
  inv += '| Page | Titre | Boutons | Onglets | Liens | Champs | Lignes de tableau | Erreurs API au chargement | Débord. 390 px |\n|---|---|---|---|---|---|---|---|---|\n';
  res += `## ${r.compte}\n\n`;
  for (const p of ok) {
    const nb = (p.vues || []).reduce((n, v) => n + (v.boutonsVus || 0), 0) || p.boutons;
    S.boutonsVus += nb; S.liens += p.liens.length; S.champs += p.champs; S.onglets += p.onglets;
    if (p.apiErreurs?.length) S.pagesAvecErreurApi++;
    pagesUniques.set(p.route, (pagesUniques.get(p.route) || 0) + 1);
    p.liens.forEach(l => liensUniques.add(l));
    inv += `| \`${p.route}\` | ${esc(p.h1) || '_(aucun h1)_'} | ${nb} | ${p.onglets} | ${p.liens.length} | ${p.champs} | ${p.lignes} | ${esc((p.apiErreurs || []).join(' ; ')) || '—'} | ${p.debord390 > 4 ? '+' + p.debord390 + ' px' : '—'} |\n`;
    const clics = (p.vues || []).flatMap(v => v.clics.map(c => ({ ...c, onglet: v.onglet })));
    if (!clics.length) continue;
    res += `### \`${p.route}\` — ${esc(p.h1)}\n\n| Vue | Bouton | Effet observé | Verdict |\n|---|---|---|---|\n`;
    for (const c of clics) {
      const v = verdict(c); S.clics++; S.parVerdict[v] = (S.parVerdict[v] || 0) + 1;
      if (c.dialogue) { S.dialogues++; if (c.dialogue.envoiVide) S.formulairesEnvoiVide++; }
      const key = `${p.route} | ${c.onglet} | ${c.bouton}`;
      const prev = boutonsUniques.get(key); if (!prev || prev === 'réagit') boutonsUniques.set(key, v);
      let effet = c.effet;
      if (c.dialogue) effet += ` — dialogue « ${c.dialogue.titre} », ${c.dialogue.champs} champ(s)` + (c.dialogue.envoiVide ? ` ; envoi vide : ${c.dialogue.envoiVide.invalides} champ(s) signalé(s), ${c.dialogue.envoiVide.messages.join(' / ') || 'aucun message'}${c.dialogue.envoiVide.api.length ? ', API ' + c.dialogue.envoiVide.api.join(', ') : ''}` : '');
      if (c.toast) effet += ` — message : ${c.toast.join(' / ')}`;
      if (c.clicForce) effet += ' (clic déclenché par script : bouton masqué par un autre élément)';
      res += `| ${esc(c.onglet)} | ${esc(c.bouton)} | ${esc(effet)} | ${v} |\n`;
    }
    res += '\n';
  }
  inv += '\n';
}

S.pagesUniques = pagesUniques.size; S.boutonsUniques = boutonsUniques.size; S.liensUniques = liensUniques.size;
S.boutonsUniquesParVerdict = {};
for (const v of boutonsUniques.values()) S.boutonsUniquesParVerdict[v] = (S.boutonsUniquesParVerdict[v] || 0) + 1;
S.boutonsNonCliques = S.boutonsVus - S.clics;

inv = inv.replace('\n\n', `\n\n## Vue d'ensemble\n\n- Comptes parcourus : ${S.comptes} (${S.comptesTermines} complets), connexions réussies : ${S.connexionsOk}\n- Pages distinctes atteintes : ${S.pagesUniques} ; visites de pages autorisées (page × rôle) : ${S.pagesAutorisees}\n- Tentatives d'accès refusées : ${S.pagesRefusees} ; redirigées : ${S.pagesRedirigees}\n- Boutons vus (page × rôle × vue) : ${S.boutonsVus} ; boutons distincts cliqués : ${S.boutonsUniques}\n- Liens internes distincts dans le contenu : ${S.liensUniques} ; champs de formulaire visibles : ${S.champs} ; onglets : ${S.onglets}\n\n`);
// ── Parcours métier de bout en bout (wf-a à wf-e) ──
const ORDRE = { 'ÉCHEC': 0, 'ERREUR': 1, 'PARTIEL': 2, 'BLOQUÉ': 3, 'OBSERVÉ': 4, 'VALIDÉ': 5 };
const parcours = new Map();
for (const f of fs.readdirSync(MES).filter(f => f.startsWith('parcours-')).sort()) for (const x of JSON.parse(fs.readFileSync(path.join(MES, f), 'utf8'))) {
  const prev = parcours.get(x.id); // un cas rejoué après correction du script remplace l'essai en ERREUR
  if (!prev || prev.statut === 'ERREUR' || x.statut !== 'ERREUR') parcours.set(x.id, { ...x, fichier: f });
}
S.parcours = { total: parcours.size, parStatut: {} };
let pr = '# Parcours métier de bout en bout\n\n> Scénarios joués à la main dans Google Chrome visible (scripts `wf-a` à `wf-e`). Un cas en « ERREUR » est un cas que le script de test n\'a pas su mener à bien : il compte comme **non exécuté**, pas comme un défaut du produit.\n\n| ID | Parcours | Verdict | Constat |\n|---|---|---|---|\n';
for (const x of [...parcours.values()].sort((a, b) => a.id.localeCompare(b.id, 'fr', { numeric: true }))) { S.parcours.parStatut[x.statut] = (S.parcours.parStatut[x.statut] || 0) + 1; pr += `| ${x.id} | ${esc(x.titre)} | **${x.statut}** | ${esc(x.detail)} |\n`; }
res = res + '\n' + pr;

// ── Matrice d'accès fiable (version de production) ──
try {
  const M = JSON.parse(fs.readFileSync(path.join(MES, 'matrice-acces.json'), 'utf8'));
  const routes = [...new Set(Object.values(M).flatMap(m => Object.keys(m).filter(k => !k.includes('#'))))];
  const court = c => c.replace('_ecole1', '').replace('@ecole.bj', '').replace(/^(prof|perso)_.*/, '$1').replace('_universite', '').replace('_faculte1', '').replace('uac2024001', 'etudiant');
  S.matrice = { comptes: Object.keys(M).length, routes: routes.length, autorisees: 0, autoriseesRefusApi: 0, refusees: 0, autres: 0 };
  let mx = '\n## Matrice d\'accès (version de production, un navigateur par groupe)\n\n✔ = page ouverte · ⚠ = page ouverte mais l\'API refuse ou échoue · vide = accès refusé (redirigé vers « Accès non autorisé »).\n\n| Route | ' + Object.keys(M).map(court).join(' | ') + ' |\n|---|' + Object.keys(M).map(() => ':-:').join('|') + '|\n';
  for (const r of routes) { mx += `| \`${r}\` |`; for (const c of Object.keys(M)) { const v = M[c][r] || ''; if (v === 'autorisé') { S.matrice.autorisees++; mx += ' ✔ |'; } else if (v.startsWith('autorisé')) { S.matrice.autorisees++; S.matrice.autoriseesRefusApi++; mx += ' ⚠ |'; } else if (v === 'refusé') { S.matrice.refusees++; mx += '  |'; } else { S.matrice.autres++; mx += ' ? |'; } } mx += '\n'; }
  inv += mx;
} catch {}
fs.writeFileSync(path.join(ROOT, '01-inventaire-fonctionnel.md'), inv);
fs.writeFileSync(path.join(ROOT, '03-resultats-tests.md'), res);
fs.writeFileSync(path.join(MES, 'synthese.json'), JSON.stringify(S, null, 1));
console.log(JSON.stringify(S, null, 1));
