/**
 * ============================================================================
 * EruditAvatar — Avatar Érudit v4 (React Native)
 *
 * Transposition du Avatar.jsx web → React Native.
 *
 * Props :
 *   src      → URL de la photo (optionnel)
 *   name     → Nom complet pour générer les initiales
 *   size     → 'sm' | 'md' | 'lg' (32, 40, 48 px)
 *   color    → Couleur d'accent pour les initiales (défaut : accent)
 *
 * Usage :
 *   <EruditAvatar name="Jean Dupont" size="md" />
 *   <EruditAvatar src="https://..." name="Jean Dupont" size="lg" />
 * ============================================================================
 */

import React, { useMemo } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { useTheme } from '../theme';

/* ─── Tailles ─────────────────────────────────────────────────────────────── */

const SIZE_MAP = {
  sm: { size: 32, fontSize: 11, radius: 8 },
  md: { size: 40, fontSize: 13, radius: 10 },
  lg: { size: 48, fontSize: 15, radius: 12 },
};

/* ─── Extraction des initiales ────────────────────────────────────────────── */

function getInitials(name) {
  if (!name || typeof name !== 'string') return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

/* ─── Couleurs pastel pour fallback quand pas de photo ───────────────────── */

const PASTEL_POOL = [
  { bg: '#F5E6DE', text: '#B8562E' },  // accent
  { bg: '#E8EDEA', text: '#1A3A3C' },  // primary
  { bg: '#EAF0EA', text: '#5A7A63' },  // green
  { bg: '#E8EEF2', text: '#4A6A8A' },  // blue
  { bg: '#EFE8F1', text: '#845E8E' },  // purple
  { bg: '#F5F0E0', text: '#C4943A' },  // amber
  { bg: '#E8F0EC', text: '#4F8A6B' },  // emerald
  { bg: '#E9EEF2', text: '#5B86A6' },  // sky
];

function pickPastel(name) {
  if (!name) return PASTEL_POOL[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return PASTEL_POOL[Math.abs(hash) % PASTEL_POOL.length];
}

/* ─── Composant ──────────────────────────────────────────────────────────── */

export default function EruditAvatar({
  src,
  name = '',
  size = 'md',
  style,
  onPress,
}) {
  const { colors } = useTheme();
  const sz = SIZE_MAP[size] || SIZE_MAP.md;
  const initials = getInitials(name);
  const pastel = pickPastel(name);

  const containerStyle = useMemo(() => ({
    width: sz.size,
    height: sz.size,
    borderRadius: sz.radius,
    backgroundColor: src ? colors.surfaceSubtle : pastel.bg,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  }), [sz, src, colors, pastel]);

  const textStyle = useMemo(() => ({
    fontFamily: 'System',
    fontSize: sz.fontSize,
    fontWeight: '600',
    color: pastel.text,
  }), [sz, pastel]);

  const inner = src ? (
    <Image
      source={{ uri: src }}
      style={{ width: sz.size, height: sz.size, borderRadius: sz.radius }}
      accessibilityLabel={`Photo de ${name}`}
    />
  ) : (
    <Text style={textStyle} accessibilityLabel={`Initiales de ${name}`}>
      {initials}
    </Text>
  );

  if (onPress) {
    const { Pressable } = require('react-native');
    return (
      <Pressable onPress={onPress} style={[containerStyle, style]}>
        {inner}
      </Pressable>
    );
  }

  return <View style={[containerStyle, style]}>{inner}</View>;
}