import apiClient from '@/shared/lib/api-client';

/** Proposer un fichier au téléchargement sous un nom lisible. */
export function telechargerBlob(nom, blob) {
  const url = URL.createObjectURL(blob);
  const lien = document.createElement('a');
  lien.href = url;
  lien.download = nom;
  document.body.appendChild(lien);
  lien.click();
  lien.remove();
  URL.revokeObjectURL(url);
}

/**
 * CSV lisible par un tableur réglé en français : séparateur « ; », BOM UTF-8,
 * cellules entre guillemets quand il le faut.
 */
export function telechargerCsv(nom, lignes) {
  const cellule = (v) => { const t = String(v ?? ''); return /[;"\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t; };
  telechargerBlob(nom, new Blob(['﻿' + lignes.map((l) => l.map(cellule).join(';')).join('\r\n')], { type: 'text/csv;charset=utf-8' }));
}

/** Le reçu d'une échéance, téléchargé sous `recu-<référence>.html` (BUG-029). */
export async function telechargerRecu(id, reference) {
  const { data } = await apiClient.get(`/comptable/paiements/${id}/recu`, { responseType: 'blob' });
  telechargerBlob(`recu-${String(reference ?? id).replace(/[^\w-]+/g, '_')}.html`, new Blob([data], { type: 'text/html' }));
}

export const aujourdhuiIso = () => new Date().toISOString().slice(0, 10);
