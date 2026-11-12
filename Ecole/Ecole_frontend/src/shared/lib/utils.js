import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatNumber(value, decimals = 0) {
  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

export function formatCurrency(value) {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XOF',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDate(date, options = {}) {
  if (date === null || date === undefined) return '';
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    ...options,
  }).format(new Date(date));
}

export function formatTime(date) {
  return new Intl.DateTimeFormat('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

export function formatRelativeTime(date) {
  const now = new Date();
  const target = new Date(date);
  const diffMs = target - now;
  const absDiffMs = Math.abs(diffMs);
  const seconds = Math.floor(absDiffMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  const prefix = diffMs < 0 ? 'il y a ' : 'dans ';
  if (seconds < 60) return prefix + seconds + 's';
  if (minutes < 60) return prefix + minutes + 'min';
  if (hours < 24) return prefix + hours + 'h';
  if (days < 30) return prefix + days + 'j';
  return formatDate(date);
}

export function getInitials(name) {
  if (!name) return '';
  const parts = name.trim().split(/\s+/);
  return parts
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function truncate(str, length = 100) {
  if (!str || str.length <= length) return str;
  return str.slice(0, length).trimEnd() + '…';
}

export function stringToColor(str) {
  if (!str) return '#6B7280';
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  // Teintes foncées : les initiales sont écrites en blanc, et les teintes
  // claires d'origine (#10B981, #F59E0B…) ne passaient pas le contraste.
  const colors = [
    '#1D4ED8', '#047857', '#B45309', '#B91C1C', '#6D28D9',
    '#BE185D', '#0F766E', '#C2410C', '#4338CA', '#4D7C0F',
  ];
  return colors[Math.abs(hash) % colors.length];
}

/**
 * Texte affichable d'une valeur que l'API renvoie tantôt en chaîne, tantôt en
 * objet lié (`classe: { id, nom_classe }`, `enseignant: { nom, prenom }`…).
 * React refuse de rendre un objet : la page entière disparaissait.
 */
export function libelle(valeur) {
  if (valeur === null || valeur === undefined) return '';
  if (typeof valeur !== 'object') return String(valeur);
  if (Array.isArray(valeur)) return valeur.map(libelle).filter(Boolean).join(', ');
  const nomPersonne = [valeur.prenom, valeur.nom ?? valeur.name].filter(Boolean).join(' ');
  return String(
    valeur.nom_classe ?? valeur.libelle ?? valeur.intitule ?? valeur.titre
      ?? (nomPersonne || undefined) ?? valeur.code ?? ''
  );
}
