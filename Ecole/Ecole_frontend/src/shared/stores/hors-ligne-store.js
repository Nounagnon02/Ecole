/**
 * Date des données affichées hors connexion.
 *
 * Le client HTTP signale la date de chaque réponse qu'il sert depuis le cache ;
 * le bandeau réseau affiche la plus ancienne (« dernières données connues du
 * … »). Au retour du réseau, les pages se rechargent : la date est oubliée.
 */

import { create } from 'zustand';

const useHorsLigneStore = create((set, get) => ({
  donneesDu: null,

  signaler: (updatedAt) => {
    if (!updatedAt) return;
    const actuelle = get().donneesDu;
    if (!actuelle || Date.parse(updatedAt) < Date.parse(actuelle)) set({ donneesDu: updatedAt });
  },

  effacer: () => set({ donneesDu: null }),
}));

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => useHorsLigneStore.getState().effacer());
}

export default useHorsLigneStore;
