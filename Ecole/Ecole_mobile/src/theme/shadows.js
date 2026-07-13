/**
 * ============================================================================
 * OMBRES — Érudit v4 (React Native)
 *
 * Les ombres du design Érudit sont chaudes — basées sur #1F1C19 en light,
 * #000000 en dark — avec des opacités très faibles pour un rendu "papier".
 *
 * React Native ne supporte pas box-shadow CSS. On utilise :
 *   iOS     → shadowColor + shadowOffset + shadowOpacity + shadowRadius
 *   Android → elevation (ombre globale, moins fine)
 *
 * Chaque niveau d'ombre est exporté comme un objet prêt à être spread
 * dans un style : <View style={[styles.card, shadows.level1]} />
 * ============================================================================
 */

import { Platform } from 'react-native';

const isAndroid = Platform.OS === 'android';
const isIOS = Platform.OS === 'ios';

/* ─── Factory ────────────────────────────────────────────────────────────────
   Génère une ombre iOS + Android à partir des paramètres.
   Pour iOS on applique shadowColor + shadowOffset + shadowOpacity + shadowRadius.
   Pour Android on applique elevation (moins nuancé mais seule option native).
   ─────────────────────────────────────────────────────────────────────────── */

function createShadow(opacity, radius, elevation, color = '#1F1C19') {
  return {
    ...(isIOS && {
      shadowColor: color,
      shadowOffset: { width: 0, height: Math.round(radius * 0.5) },
      shadowOpacity: opacity,
      shadowRadius: radius,
    }),
    ...(isAndroid && {
      elevation,
    }),
  };
}

/* ─── Niveaux d'ombre — Light Mode ──────────────────────────────────────── */

export const lightShadows = {
  /** Niveau 0 — pas d'ombre */
  level0: createShadow(0, 0, 0, '#1F1C19'),

  /** Niveau 1 — carte subtile, badge */
  level1: createShadow(0.04, 2, 1, '#1F1C19'),

  /** Niveau 2 — bouton hover */
  level2: createShadow(0.05, 4, 2, '#1F1C19'),

  /** Niveau 3 — carte par défaut, modale */
  level3: createShadow(0.06, 8, 4, '#1F1C19'),

  /** Niveau 4 — carte elevated, dropdown */
  level4: createShadow(0.07, 16, 8, '#1F1C19'),

  /** Niveau 5 — modale élevée, popover */
  level5: createShadow(0.09, 24, 16, '#1F1C19'),

  /** Niveau 6 — overlay maximal */
  level6: createShadow(0.12, 40, 24, '#1F1C19'),
};

/* ─── Niveaux d'ombre — Dark Mode ──────────────────────────────────────── */

export const darkShadows = {
  level0: createShadow(0, 0, 0, '#000000'),

  /** En dark mode, les ombres sont plus marquées pour la lisibilité */
  level1: createShadow(0.24, 2, 2, '#000000'),
  level2: createShadow(0.28, 4, 4, '#000000'),
  level3: createShadow(0.32, 8, 6, '#000000'),
  level4: createShadow(0.36, 16, 10, '#000000'),
  level5: createShadow(0.40, 24, 18, '#000000'),
  level6: createShadow(0.44, 40, 26, '#000000'),
};

export default { lightShadows, darkShadows };