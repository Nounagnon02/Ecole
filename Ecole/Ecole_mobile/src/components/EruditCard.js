/**
 * ============================================================================
 * EruditCard — Carte Érudit v4 (React Native)
 *
 * Transposition du Card.jsx web → React Native.
 * Variants : default / elevated / outline / flat
 * Sous-composants : .Header, .Body, .Footer, .Title, .Description
 *
 * Usage :
 *   <EruditCard variant="elevated">
 *     <EruditCard.Header>
 *       <EruditCard.Title>Titre</EruditCard.Title>
 *     </EruditCard.Header>
 *     <EruditCard.Body>...</EruditCard.Body>
 *     <EruditCard.Footer>...</EruditCard.Footer>
 *   </EruditCard>
 * ============================================================================
 */

import React, { useMemo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '../theme';
import { headingStyles, bodyStyles } from '../theme/typography';

/* ─── Variant styles ──────────────────────────────────────────────────────── */

function useCardStyle(variant = 'default') {
  const { colors, shadows, radius } = useTheme();

  return useMemo(() => {
    const base = { borderRadius: radius.xl, overflow: 'hidden' };

    switch (variant) {
      case 'elevated':
        return { ...base, backgroundColor: colors.surfaceRaised, borderWidth: 1, borderColor: colors.borderLight, ...shadows.level3 };
      case 'outline':
        return { ...base, backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.border };
      case 'flat':
        return { ...base, backgroundColor: colors.surfaceSubtle, borderWidth: 0 };
      default: // 'default'
        return { ...base, backgroundColor: colors.surfaceRaised, borderWidth: 1, borderColor: colors.border, ...shadows.level1 };
    }
  }, [variant, colors, shadows, radius]);
}

/* ─── Composant principal ────────────────────────────────────────────────── */

export default function EruditCard({ variant = 'default', onPress, children, style, ...props }) {
  const cardStyle = useCardStyle(variant);
  const merged = useMemo(() => [cardStyle, style], [cardStyle, style]);

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [merged, pressed && { opacity: 0.93, transform: [{ scale: 0.99 }] }]}
        {...props}
      >
        {children}
      </Pressable>
    );
  }

  return <View style={merged} {...props}>{children}</View>;
}

/* ─── Card.Header ────────────────────────────────────────────────────────── */

function CardHeader({ children, style }) {
  const { spacing } = useTheme();
  const s = useMemo(() => ({
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.lg, paddingTop: spacing.lg, gap: spacing.md,
  }), [spacing]);

  return <View style={[s, style]}>{children}</View>;
}

/* ─── Card.Body ──────────────────────────────────────────────────────────── */

function CardBody({ children, style }) {
  const { spacing } = useTheme();
  const s = useMemo(() => ({
    flex: 1, paddingHorizontal: spacing.lg, paddingVertical: spacing.lg,
  }), [spacing]);

  return <View style={[s, style]}>{children}</View>;
}

/* ─── Card.Footer ────────────────────────────────────────────────────────── */

function CardFooter({ children, style }) {
  const { spacing } = useTheme();
  const s = useMemo(() => ({
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.lg, paddingBottom: spacing.lg, paddingTop: 0, gap: spacing.md,
  }), [spacing]);

  return <View style={[s, style]}>{children}</View>;
}

/* ─── Card.Title ─────────────────────────────────────────────────────────── */

function CardTitle({ children, style, numberOfLines = 2 }) {
  const { colors } = useTheme();
  return (
    <Text
      style={[{ fontFamily: headingStyles.h6.fontFamily, fontSize: 17, fontWeight: '600', color: colors.textPrimary, lineHeight: 17 * 1.15, flexShrink: 1 }, style]}
      numberOfLines={numberOfLines}
    >
      {children}
    </Text>
  );
}

/* ─── Card.Description ───────────────────────────────────────────────────── */

function CardDescription({ children, style }) {
  const { colors } = useTheme();
  return (
    <Text style={[{ fontFamily: 'System', fontSize: 13, fontWeight: '400', color: colors.textSecondary, marginTop: 2 }, style]}>
      {children}
    </Text>
  );
}

/* ─── Attachement des sous-composants ────────────────────────────────────── */

EruditCard.Header = CardHeader;
EruditCard.Body = CardBody;
EruditCard.Footer = CardFooter;
EruditCard.Title = CardTitle;
EruditCard.Description = CardDescription;