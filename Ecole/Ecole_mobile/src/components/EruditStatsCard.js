/**
 * ============================================================================
 * EruditStatsCard — Carte statistique Érudit v4 (React Native)
 *
 * Transposition du StatsCard.jsx web → React Native.
 *
 * Variants couleur (prop `color`) :
 *   accent | primary | green | amber | red | blue | emerald | sky | purple | neutral
 *
 * Trend :
 *   positive → vert + ▲   |   negative → rouge + ▼   |   neutral → gris + ─
 *
 * Usage :
 *   <EruditStatsCard
 *     title="Élèves inscrits"
 *     value={1248}
 *     trend={{ direction: 'positive', label: '+12%', value: 'vs mois dernier' }}
 *     color="primary"
 *     icon="users"
 *   />
 * ============================================================================
 */

import React, { useMemo } from 'react';
import { View, Text, Pressable } from 'react-native';
import { useTheme } from '../theme';

/* ─── Variants couleur ────────────────────────────────────────────────────── */

const COLOR_CONFIG = {
  accent:   { subtle: 'accentSubtle', text: 'accent' },
  primary:  { subtle: 'primarySubtle', text: 'primary' },
  green:    { subtle: 'greenSubtle', text: 'green' },
  amber:    { subtle: 'amberSubtle', text: 'amber' },
  red:      { subtle: 'redSubtle', text: 'red' },
  blue:     { subtle: 'blueSubtle', text: 'blue' },
  emerald:  { subtle: 'emeraldSubtle', text: 'emerald' },
  sky:      { subtle: 'skySubtle', text: 'sky' },
  purple:   { subtle: 'purpleSubtle', text: 'purple' },
  violet:   { subtle: 'purpleSubtle', text: 'purple' },
  neutral:  { subtle: 'surfaceSubtle', text: 'textSecondary' },
};

/* ─── Icônes de trend (Unicode) ──────────────────────────────────────────── */

function TrendIcon({ direction }) {
  const { colors } = useTheme();
  switch (direction) {
    case 'positive':
      return <Text style={{ fontSize: 12, color: colors.green, fontWeight: '700' }}>▲</Text>;
    case 'negative':
      return <Text style={{ fontSize: 12, color: colors.red, fontWeight: '700' }}>▼</Text>;
    default:
      return <Text style={{ fontSize: 12, color: colors.textTertiary, fontWeight: '700' }}>─</Text>;
  }
}

/* ─── Composant ──────────────────────────────────────────────────────────── */

export default function EruditStatsCard({
  title,
  value,
  suffix,
  trend,
  color = 'primary',
  icon: IconComponent,
  onPress,
  style,
}) {
  const { colors, shadows, radius, spacing } = useTheme();
  const cfg = COLOR_CONFIG[color] || COLOR_CONFIG.primary;

  const containerStyle = useMemo(() => ({
    position: 'relative',
    overflow: 'hidden',
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.borderLight,
    backgroundColor: colors.surfaceRaised,
    padding: spacing.lg,
    minHeight: 100,
    ...shadows.level1,
  }), [colors, shadows, radius, spacing]);

  const iconBgStyle = useMemo(() => ({
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors[cfg.subtle] || colors.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  }), [colors, cfg.subtle, spacing]);

  const inner = (
    <>
      {/* Icône */}
      {IconComponent ? (
        <View style={iconBgStyle}>
          {typeof IconComponent === 'function' ? <IconComponent size={18} color={colors[cfg.text]} /> : IconComponent}
        </View>
      ) : null}

      {/* Titre */}
      <Text
        style={{
          fontFamily: 'System',
          fontSize: 13,
          fontWeight: '500',
          color: colors.textSecondary,
          marginBottom: 4,
        }}
        numberOfLines={1}
      >
        {title}
      </Text>

      {/* Valeur */}
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
        <Text
          style={{
            fontFamily: 'Georgia',
            fontSize: 32,
            fontWeight: '700',
            color: colors.textPrimary,
            fontVariant: ['tabular-nums'],
          }}
        >
          {typeof value === 'number' ? value.toLocaleString('fr-FR') : value}
        </Text>
        {suffix ? (
          <Text style={{ fontFamily: 'System', fontSize: 15, fontWeight: '500', color: colors.textSecondary }}>
            {suffix}
          </Text>
        ) : null}
      </View>

      {/* Trend */}
      {trend ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 }}>
          {trend.direction ? <TrendIcon direction={trend.direction} /> : null}
          <Text
            style={{
              fontFamily: 'System',
              fontSize: 13,
              fontWeight: '500',
              color: trend.direction === 'positive' ? colors.green
                : trend.direction === 'negative' ? colors.red
                : colors.textSecondary,
            }}
          >
            {trend.label}
          </Text>
          {trend.value ? (
            <Text style={{ fontFamily: 'System', fontSize: 12, color: colors.textTertiary }}>
              {trend.value}
            </Text>
          ) : null}
        </View>
      ) : null}
    </>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          containerStyle,
          style,
          pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
        ]}
      >
        {inner}
      </Pressable>
    );
  }

  return <View style={[containerStyle, style]}>{inner}</View>;
}