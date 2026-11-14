/**
 * TitreDocument — le titre de l'onglet suit le titre de la page.
 *
 * Toutes les pages s'appelaient « École — Gestion Scolaire » (audit
 * BUG-026) : ni l'historique, ni la liste des onglets, ni un lecteur d'écran
 * ne disaient où l'on était. Plutôt qu'une table de titres à tenir à jour
 * pour chaque route, le titre de l'onglet reprend le `h1` affiché — chaque
 * page en a un, et il est déjà traduit. Les pages chargées à la demande
 * l'affichent après coup : un observateur suit le document.
 */

import { useEffect } from 'react';

export const TITRE_PAR_DEFAUT = 'École — Gestion scolaire';

function titreDeLaPage() {
  const h1 = document.querySelector('#main-content h1, main h1') ?? document.querySelector('h1');
  const texte = h1?.textContent?.replace(/\s+/g, ' ').trim();
  return texte ? `${texte} · École` : TITRE_PAR_DEFAUT;
}

export default function TitreDocument() {
  useEffect(() => {
    let prevu = null;
    const mettreAJour = () => {
      prevu = null;
      const titre = titreDeLaPage();
      if (document.title !== titre) document.title = titre;
    };
    // Regroupe les mutations d'un même rendu en une seule lecture.
    const planifier = () => { if (prevu === null) prevu = setTimeout(mettreAJour, 0); };

    mettreAJour();
    const observateur = new MutationObserver(planifier);
    observateur.observe(document.body, { childList: true, subtree: true, characterData: true });
    return () => {
      observateur.disconnect();
      if (prevu !== null) clearTimeout(prevu);
    };
  }, []);

  return null;
}
