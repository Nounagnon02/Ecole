/**
 * ============================================================================
 * EruditFAB — Floating Action Button Érudit v4 (React Native)
 *
 * Remplace le FAB de react-native-paper.
 * Positionné en bas à droite, couleur adaptée au rôle.
 *
 * Usage :
 *   <EruditFAB icon="+" onPress={handleAdd} />
 *   <EruditFAB icon="+" color="accent" label="Ajouter" extended />
 * ============================================================================
 */

import React, { useMemo } from 'react';
import { Pressable, Text, View, StyleSheet } from 'react-native';
import { useTheme } from '../theme';

/* ─── Tailles ─────────────────────────────────────────────────────────────── */

const SIZE_CONFIG = {
  sm: { size: 40, fontSize: 18, radius: 12 },
  md: { size: 48, fontSize: 20, radius: 14 },
  lg: { size: 56, fontSize: 22, radius: 16 },
};

/* ─── Composant ──────────────────────────────────────────────────────────── */

export default function EruditFAB({
  icon = '+',
  onPress,
  color: colorKey = 'accent',
  size = 'md',
  extended = false,
  label,
  style,
  accessibilityLabel,
}) {
  const { colors, shadows } = useTheme();
  const sz = SIZE_CONFIG[size] || SIZE_CONFIG.md;

  const bgColor = colors[colorKey] || colors.accent;
  const textColor = '#FFFFFF';

  const containerStyle = useMemo(() => ({
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: sz.size,
    height: sz.size,
    paddingHorizontal: extended ? 20 : 0,
    borderRadius: sz.radius,
    backgroundColor: bgColor,
    gap: extended ? 8 : 0,
    ...shadows.level3,
  }), [sz, bgColor, shadows, extended]);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        containerStyle,
        style,
        pressed && { opacity: 0.85, transform: [{ scale: 0.95 }] },
      ]}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || label || 'Action'}
    >
      {/* Icône */}
      {typeof icon === 'string' ? (
        <Text style={{
          fontFamily: 'System',
          fontSize: sz.fontSize,
          fontWeight: '300',
          color: textColor,
          lineHeight: sz.fontSize + 4,
        }}>
          {icon}
        </Text>
      ) : (
        <View>{icon}</View>
      )}

      {/* Label (mode extended) */}
      {extended && label ? (
        <Text style={{
          fontFamily: 'System',
          fontSize: 13,
          fontWeight: '500',
          color: textColor,
        }}>
          {label}
        </Text>
      ) : null}
    </Pressable>
  );
}