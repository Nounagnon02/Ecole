/**
 * Icônes au trait et marque de l'application (proposition C).
 *
 * `Logo` reprend le tracé du web (`shared/components/ui/Brand.jsx`) : livre,
 * toit et soleil. Les icônes sont décoratives : le libellé accessible est
 * porté par le bouton ou l'onglet qui les contient.
 */
import React from 'react';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

const TRACES = {
  accueil: [['p', 'M3 11l9-8 9 8'], ['p', 'M5 10v10h14V10']],
  livre: [['p', 'M4 4h6a2 2 0 0 1 2 2v14a2 2 0 0 0-2-2H4z'], ['p', 'M20 4h-6a2 2 0 0 0-2 2v14a2 2 0 0 1 2-2h6z']],
  carte: [['r', { x: 3, y: 6, width: 18, height: 13, rx: 2 }], ['p', 'M3 10h18'], ['p', 'M7 15h3']],
  message: [['p', 'M4 5h16v11H9l-5 4z']],
  calendrier: [['r', { x: 4, y: 5, width: 16, height: 15, rx: 2 }], ['p', 'M4 10h16'], ['p', 'M8 3v4'], ['p', 'M16 3v4']],
  groupe: [['c', { cx: 9, cy: 8, r: 3 }], ['p', 'M3 20c0-3 3-5 6-5s6 2 6 5'], ['c', { cx: 17, cy: 9, r: 2.5 }], ['p', 'M16.5 15c2.6 0 4.5 2 4.5 5']],
  crayon: [['p', 'M4 20h4L19 9l-4-4L4 16z'], ['p', 'M13 7l4 4']],
  document: [['p', 'M6 3h9l4 4v14H6z'], ['p', 'M14 3v5h5'], ['p', 'M9 13h7'], ['p', 'M9 17h7']],
  suivant: [['p', 'M9 6l6 6-6 6']],
  retour: [['p', 'M15 6l-6 6 6 6']],
  bas: [['p', 'M6 9l6 6 6-6']],
  envoyer: [['p', 'M4 12l16-8-6 16-3-7z']],
};

export const NOMS_ICONES = Object.keys(TRACES);

export function Icone({ nom, taille = 24, couleur = '#17302E' }) {
  const traces = TRACES[nom];
  if (!traces) return null;
  return (
    <Svg width={taille} height={taille} viewBox="0 0 24 24" fill="none" stroke={couleur} strokeWidth={2}
      strokeLinecap="round" strokeLinejoin="round" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {traces.map(([type, v], i) => (
        type === 'p' ? <Path key={i} d={v} /> : type === 'r' ? <Rect key={i} {...v} /> : <Circle key={i} {...v} />
      ))}
    </Svg>
  );
}

/** Marque École : mêmes tracés et même soleil ocre que le web. */
export function Logo({ taille = 34, couleur = '#0F5C4A', reliure = '#F4F0E8', soleil = '#E0A526' }) {
  return (
    <Svg width={taille} height={taille} viewBox="0 0 48 48" fill="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Path d="M5 25 24 9l19 16" stroke={couleur} strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M10 30c5-2 10-1 14 2 4-3 9-4 14-2v10c-5-2-10-1-14 2-4-3-9-4-14-2V30Z" fill={couleur} />
      <Path d="M24 33v9" stroke={reliure} strokeWidth={1.5} />
      <Circle cx={24} cy={21} r={3.5} fill={soleil} />
    </Svg>
  );
}
