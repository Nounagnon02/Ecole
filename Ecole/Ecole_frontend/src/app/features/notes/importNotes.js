/**
 * Lecture d'un tableur de notes (CSV), entièrement dans le navigateur.
 *
 * Les notes lues remplissent la grille de saisie : l'enseignant les voit, les
 * corrige au besoin, et les enregistre par le même chemin que la saisie au
 * clavier (contrôle 0–20, brouillon, envoi hors-ligne). Aucun fichier ne part
 * au serveur, et rien n'est enregistré sans son clic.
 */

const sansAccents = (texte) => String(texte ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

/** Découpe une ligne CSV en respectant les guillemets. */
function cellules(ligne, separateur) {
  const sortie = [];
  let courant = '';
  let entreGuillemets = false;
  for (let i = 0; i < ligne.length; i += 1) {
    const c = ligne[i];
    if (c === '"') {
      if (entreGuillemets && ligne[i + 1] === '"') { courant += '"'; i += 1; } else { entreGuillemets = !entreGuillemets; }
    } else if (c === separateur && !entreGuillemets) {
      sortie.push(courant.trim()); courant = '';
    } else {
      courant += c;
    }
  }
  sortie.push(courant.trim());
  return sortie;
}

/**
 * @param {string} texte    contenu du fichier
 * @param {Array<{id:number, matricule:string, nom:string, prenom:string}>} eleves  élèves de la grille
 * @param {(saisie:string) => number|null} lireNote  même règle que la grille
 * @returns {{ saisies: Record<number,string>, erreurs: Array<{ligne:number, message:string}>, lues: number }}
 */
export function lireTableurNotes(texte, eleves, lireNote) {
  const lignes = String(texte ?? '').replace(/^\uFEFF/, '').split(/\r\n|\r|\n/);
  const entete = lignes[0] ?? '';
  const separateur = (entete.match(/;/g) ?? []).length >= (entete.match(/,/g) ?? []).length ? ';' : ',';
  const colonnes = cellules(entete, separateur).map(sansAccents);
  const colMatricule = colonnes.findIndex((c) => c === 'matricule');
  const colNote = colonnes.findIndex((c) => c === 'note' || c.startsWith('note '));
  const erreurs = [];
  const saisies = {};

  if (colMatricule < 0 || colNote < 0) {
    return { saisies, lues: 0, erreurs: [{ ligne: 1, message: 'colonnes' }] };
  }

  const parMatricule = new Map(eleves.map((e) => [sansAccents(e.matricule), e]));
  const vus = new Set();
  let lues = 0;

  lignes.slice(1).forEach((brute, index) => {
    const numero = index + 2;
    if (!brute.replace(/[;,"\s]/g, '')) return;
    const valeurs = cellules(brute, separateur);
    const matricule = valeurs[colMatricule] ?? '';
    const saisie = valeurs[colNote] ?? '';
    const eleve = parMatricule.get(sansAccents(matricule));

    if (!eleve) { erreurs.push({ ligne: numero, message: 'inconnu', valeur: matricule }); return; }
    if (vus.has(eleve.id)) { erreurs.push({ ligne: numero, message: 'doublon', valeur: matricule }); return; }
    vus.add(eleve.id);
    if (saisie === '') return; // absent : la case reste vide
    if (Number.isNaN(lireNote(saisie))) { erreurs.push({ ligne: numero, message: 'note', valeur: saisie }); return; }
    saisies[eleve.id] = saisie.replace('.', ',');
    lues += 1;
  });

  return { saisies, erreurs, lues };
}

/** Modèle prérempli : une ligne par élève de la grille, colonne note vide. */
export function modeleGrille(eleves, saisies = {}) {
  const cellule = (v) => { const t = String(v ?? ''); return /[;"\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t; };
  return ['matricule;nom;prenom;note', ...eleves.map((e) => [e.matricule, e.nom, e.prenom, saisies[e.id] ?? ''].map(cellule).join(';'))].join('\r\n');
}

/** Contenu texte d'un fichier choisi ; `FileReader` pour les navigateurs sans `File.text()`. */
export function lireFichier(fichier) {
  if (typeof fichier.text === 'function') return fichier.text();
  return new Promise((resoudre, rejeter) => {
    const lecteur = new FileReader();
    lecteur.onload = () => resoudre(String(lecteur.result ?? ''));
    lecteur.onerror = () => rejeter(lecteur.error);
    lecteur.readAsText(fichier);
  });
}
