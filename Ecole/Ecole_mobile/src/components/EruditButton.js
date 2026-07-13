/**
 * ============================================================================
 * EruditButton — Bouton Érudit v4 (React Native)
 *
 * Transposition du Button.jsx web → React Native.
 * Variants : primary / secondary / ghost / outline / danger
 * Sizes    : sm / md / lg
 *
 * Usage :
 *   <EruditButton variant="primary" size="md" onPress={handler}>
 *     Enregistrer
 *   </EruditButton>
 *   <EruditButton variant="ghost" size="sm" icon={<Icon />} />
 * ============================================================================
 */

import React, { useMemo } from 'react';
import { Pressable, Text, View, StyleSheet, ActivityIndicator } from 'react-native';
import { useTheme } from '../theme';

/* ─── Configurations par variant ─────────────────────────────────────────── */

function useButtonConfig(variant = 'primary', size = 'md') {
  const { colors, shadows, radius } = useTheme();

  return useMemo(() => {
    /* Taille → dimensions */
    const sizeConfig = {
      sm: { height: 32, px: 12, fontSize: 11, gap: 6, radius: radius.lg },
      md: { height: 40, px: 16, fontSize: 13, gap: 8, radius: radius.lg },
      lg: { height: 48, px: 24, fontSize: 15, gap: 10, radius: radius.xl },
    };

    const s = sizeConfig[size] || sizeConfig.md;

    /* Couleurs par variant */
    const variants = {
      primary: {
        bg: colors.accent,
        bgHover: colors.accentHover,
        bgActive: colors.accentActive,
        text: '#FFFFFF',
        shadow: shadows.level1,
        shadowHover: shadows.level2,
      },
      secondary: {
        bg: colors.primary,
        bgHover: colors.primaryHover,
        bgActive: colors.primaryActive,
        text: '#FFFFFF',
        shadow: shadows.level1,
        shadowHover: shadows.level2,
      },
      ghost: {
        bg: 'transparent',
        bgHover: colors.surfaceHover,
        bgActive: colors.surfaceSubtle,
        text: colors.textSecondary,
        shadow: shadows.level0,
        shadowHover: shadows.level0,
      },
      outline: {
        bg: 'transparent',
        bgHover: colors.surfaceHover,
        bgActive: colors.surfaceSubtle,
        text: colors.textPrimary,
        shadow: shadows.level0,
        shadowHover: shadows.level0,
        border: colors.border,
        borderHover: colors.borderHeavy,
      },
      danger: {
        bg: colors.red,
        bgHover: colors.redHover,
        bgActive: '#A63E3E',
        text: '#FFFFFF',
        shadow: shadows.level1,
        shadowHover: shadows.level2,
      },
    };

    return { size: s, colors: variants[variant] || variants.primary, variant };
  }, [variant, size, colors, shadows, radius]);
}

/* ─── Composant ──────────────────────────────────────────────────────────── */

export default function EruditButton({
  variant = 'primary',
  size = 'md',
  onPress,
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  children,
  style,
  fullWidth = false,
  accessibilityLabel,
  ...props
}) {
  const config = useButtonConfig(variant, size);
  const { s, colors: vc } = config;
  const { colors: themeColors } = useTheme();

  const baseStyle = useMemo(() => ({
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: s.height,
    paddingHorizontal: s.px,
    gap: s.gap,
    borderRadius: s.radius,
    borderWidth: vc.border ? 1 : 0,
    borderColor: vc.border || 'transparent',
    backgroundColor: vc.bg,
    opacity: disabled ? 0.5 : 1,
    ...(fullWidth && { alignSelf: 'stretch' }),
  }), [s, vc, disabled, fullWidth]);

  const inner = (
    <>
      {loading ? (
        <ActivityIndicator size="small" color={vc.text} />
      ) : (
        <>
          {icon && iconPosition === 'left' ? <View>{icon}</View> : null}
          {children ? (
            <Text
              style={{
                fontFamily: 'System',
                fontSize: s.fontSize,
                fontWeight: '500',
                color: vc.text,
              }}
              numberOfLines={1}
            >
              {children}
            </Text>
          ) : icon ? (
            <View>{icon}</View>
          ) : null}
          {icon && iconPosition === 'right' ? <View>{icon}</View> : null}
        </>
      )}
    </>
  );

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || (typeof children === 'string' ? children : 'Bouton')}
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      style={({ pressed }) => [
        baseStyle,
        style,
        pressed && !disabled && {
          backgroundColor: vc.bgActive || vc.bgHover,
          borderColor: vc.borderHover || vc.border,
          transform: [{ scale: 0.98 }],
          ...(vc.shadowHover || {}),
        },
      ]}
      {...props}
    >
      {inner}
    </Pressable>
  );
}