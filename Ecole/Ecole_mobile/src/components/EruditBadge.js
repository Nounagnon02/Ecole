/**
 * ============================================================================
 * EruditBadge — Badge Érudit v4 (React Native)
 *
 * Transposition du Badge.jsx web → React Native.
 *
 * Variants couleur :
 *   default | primary | success | warning | danger | info | accent
 *   | emerald | sky | purple | violet
 *
 * Sizes : sm / md / lg
 * Option : dot (affiche un point coloré devant le texte)
 *
 * Usage :
 *   <EruditBadge variant="success">Payé</EruditBadge>
 *   <EruditBadge variant="danger" size="sm" dot>En retard</EruditBadge>
 * ============================================================================
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../theme';

/* ─── Configuration des variants ─────────────────────────────────────────── */

const COLOR_MAP = {
  default:   'surfaceSubtle',
  primary:   'primarySubtle',
  success:   'greenSubtle',
  warning:   'amberSubtle',
  danger:    'redSubtle',
  info:      'blueSubtle',
  accent:    'accentSubtle',
  emerald:   'emeraldSubtle',
  sky:       'skySubtle',
  purple:    'purpleSubtle',
  violet:    'purpleSubtle',
};

const TEXT_COLOR_MAP = {
  default:   'textSecondary',
  primary:   'primary',
  success:   'green',
  warning:   'amber',
  danger:    'red',
  info:      'blue',
  accent:    'accent',
  emerald:   'emerald',
  sky:       'sky',
  purple:    'purple',
  violet:    'purple',
};

/* ─── Dot colors ─────────────────────────────────────────────────────────── */

const DOT_COLORS = {
  default:   '#787066',
  primary:   '#1A3A3C',
  success:   '#5A7A63',
  warning:   '#C4943A',
  danger:    '#BA4A4A',
  info:      '#4A6A8A',
  accent:    '#B8562E',
  emerald:   '#4F8A6B',
  sky:       '#5B86A6',
  purple:    '#845E8E',
  violet:    '#845E8E',
};

/* ─── Tailles ─────────────────────────────────────────────────────────────── */

const SIZE_CONFIG = {
  sm: { py: 2, px: 6, fontSize: 10, gap: 4, dotSize: 4 },
  md: { py: 4, px: 10, fontSize: 11, gap: 6, dotSize: 6 },
  lg: { py: 6, px: 12, fontSize: 13, gap: 6, dotSize: 6 },
};

/* ─── Composant ──────────────────────────────────────────────────────────── */

export default function EruditBadge({
  variant = 'default',
  size = 'md',
  dot = false,
  children,
  style,
}) {
  const { colors } = useTheme();
  const bgKey = COLOR_MAP[variant] || COLOR_MAP.default;
  const textKey = TEXT_COLOR_MAP[variant] || TEXT_COLOR_MAP.default;
  const dotColor = DOT_COLORS[variant] || DOT_COLORS.default;
  const sz = SIZE_CONFIG[size] || SIZE_CONFIG.md;

  const containerStyle = useMemo(() => ({
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingVertical: sz.py,
    paddingHorizontal: sz.px,
    gap: sz.gap,
    borderRadius: 999,
    backgroundColor: colors[bgKey] || '#EDE8E0',
  }), [colors, bgKey, sz]);

  return (
    <View style={[containerStyle, style]}>
      {dot ? (
        <View style={{
          width: sz.dotSize,
          height: sz.dotSize,
          borderRadius: sz.dotSize / 2,
          backgroundColor: dotColor,
        }} />
      ) : null}
      <Text
        style={{
          fontFamily: 'System',
          fontSize: sz.fontSize,
          fontWeight: '500',
          color: colors[textKey] || colors.textSecondary,
        }}
        numberOfLines={1}
      >
        {children}
      </Text>
    </View>
  );
}