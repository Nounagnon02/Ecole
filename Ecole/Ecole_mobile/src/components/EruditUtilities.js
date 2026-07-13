/**
 * ============================================================================
 * EruditUtilities — Composants utilitaires partagés Érudit v4
 *
 * EruditText, EruditRow, EruditMenuItem, EruditSectionHeader
 *
 * Utilisés dans tous les dashboards pour l'affichage des listes.
 * Centralisés ici pour éviter la duplication et améliorer la maintenabilité.
 * ============================================================================
 */

import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '../theme';

/* ─── EruditText ─────────────────────────────────────────────────────────── */

function EruditTextRaw({ children, style, ...props }) {
  const { colors } = useTheme();
  return (
    <Text style={[{ fontFamily: 'System', fontSize: 13, color: colors.textSecondary }, style]} {...props}>
      {children}
    </Text>
  );
}

export const EruditText = React.memo(EruditTextRaw);

/* ─── EruditRow ──────────────────────────────────────────────────────────── */

function EruditRowRaw({ label, value }) {
  const { colors } = useTheme();
  return (
    <View style={styles.row}>
      <Text style={[styles.rowLabel, { color: colors.textTertiary }]}>{label}</Text>
      <Text style={[styles.rowValue, { color: colors.textPrimary }]} numberOfLines={1} ellipsizeMode="tail">
        {value ?? '—'}
      </Text>
    </View>
  );
}

export const EruditRow = React.memo(EruditRowRaw);

/* ─── EruditMenuItem ─────────────────────────────────────────────────────── */

function EruditMenuItemRaw({ icon, label, onPress }) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.menuItem,
        { backgroundColor: pressed ? colors.surfaceHover : 'transparent' },
      ]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <View style={[styles.menuIcon, { backgroundColor: colors.surfaceSubtle }]}>
        <Text style={styles.menuIconText}>{icon}</Text>
      </View>
      <Text style={[styles.menuLabel, { color: colors.textPrimary }]}>{label}</Text>
      <Text style={[styles.menuChevron, { color: colors.textTertiary }]}>›</Text>
    </Pressable>
  );
}

export const EruditMenuItem = React.memo(EruditMenuItemRaw);

/* ─── EruditSectionHeader ────────────────────────────────────────────────── */

function EruditSectionHeaderRaw({ title }) {
  const { colors } = useTheme();
  return (
    <Text style={[styles.sectionHeader, { color: colors.textTertiary }]}>{title}</Text>
  );
}

export const EruditSectionHeader = React.memo(EruditSectionHeaderRaw);

/* ─── Styles ─────────────────────────────────────────────────────────────── */

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  rowLabel: {
    fontFamily: 'System',
    fontSize: 12,
  },
  rowValue: {
    fontFamily: 'System',
    fontSize: 13,
    fontWeight: '500',
    flexShrink: 1,
    textAlign: 'right',
    marginLeft: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuIconText: {
    fontSize: 16,
  },
  menuLabel: {
    flex: 1,
    fontFamily: 'System',
    fontSize: 14,
    fontWeight: '500',
  },
  menuChevron: {
    fontSize: 14,
  },
  sectionHeader: {
    fontFamily: 'System',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    paddingHorizontal: 4,
    paddingTop: 8,
    paddingBottom: 4,
  },
});