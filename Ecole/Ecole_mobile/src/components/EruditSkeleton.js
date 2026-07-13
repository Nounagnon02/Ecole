/**
 * ============================================================================
 * EruditSkeleton — États de chargement Érudit v4 (React Native)
 *
 * Transposition du Skeleton.jsx web → React Native.
 * Animations pulse sur les formes placeholder.
 *
 * Variants de forme :
 *   - 'text'     → ligne de texte (hauteur paramétrable)
 *   - 'circle'   → cercle (avatar, icône)
 *   - 'card'     → carte complète (mime un StatsCard)
 *   - 'rect'     → rectangle générique
 *
 * Usage :
 *   <EruditSkeleton variant="text" width={200} />
 *   <EruditSkeleton variant="circle" size={40} />
 *   <EruditSkeleton variant="card" />
 *   <EruditSkeleton variant="rect" width="100%" height={120} />
 * ============================================================================
 */

import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { useTheme } from '../theme';

/* ─── Composant pulse ────────────────────────────────────────────────────── */

function PulseView({ style, children }) {
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.4, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return <Animated.View style={[style, { opacity }]}>{children}</Animated.View>;
}

/* ─── Formes ──────────────────────────────────────────────────────────────── */

function TextSkeleton({ width = '60%', height = 14, lines = 1, style }) {
  const { colors } = useTheme();
  const gaps = Array.from({ length: lines }, (_, i) => (
    <PulseView
      key={i}
      style={{
        width: i === lines - 1 ? (typeof width === 'string' ? '40%' : width * 0.6) : width,
        height,
        borderRadius: height / 2,
        backgroundColor: colors.surfaceSubtle || colors.borderLight,
        marginBottom: i < lines - 1 ? 8 : 0,
      }}
    />
  ));

  return <View style={style}>{gaps}</View>;
}

function CircleSkeleton({ size = 40, style }) {
  const { colors } = useTheme();
  return (
    <PulseView style={[{
      width: size,
      height: size,
      borderRadius: size / 2,
      backgroundColor: colors.surfaceSubtle || colors.borderLight,
    }, style]} />
  );
}

function RectSkeleton({ width = '100%', height = 80, borderRadius = 12, style }) {
  const { colors } = useTheme();
  return (
    <PulseView style={[{
      width,
      height,
      borderRadius,
      backgroundColor: colors.surfaceSubtle || colors.borderLight,
    }, style]} />
  );
}

function CardSkeleton({ style }) {
  const { colors, radius, spacing, shadows } = useTheme();
  return (
    <View style={[{
      borderRadius: radius.xl,
      borderWidth: 1,
      borderColor: colors.borderLight,
      backgroundColor: colors.surfaceRaised,
      padding: spacing.lg,
      gap: spacing.md,
      ...shadows.level1,
    }, style]}>
      {/* Icon placeholder */}
      <RectSkeleton width={36} height={36} borderRadius={10} />
      {/* Title line */}
      <TextSkeleton width="50%" height={13} />
      {/* Value line */}
      <TextSkeleton width="70%" height={32} />
      {/* Trend line */}
      <TextSkeleton width="35%" height={13} />
    </View>
  );
}

/* ─── Composant principal ────────────────────────────────────────────────── */

export default function EruditSkeleton({ variant = 'text', ...props }) {
  switch (variant) {
    case 'text':
      return <TextSkeleton {...props} />;
    case 'circle':
      return <CircleSkeleton {...props} />;
    case 'card':
      return <CardSkeleton {...props} />;
    case 'rect':
      return <RectSkeleton {...props} />;
    default:
      return <RectSkeleton {...props} />;
  }
}