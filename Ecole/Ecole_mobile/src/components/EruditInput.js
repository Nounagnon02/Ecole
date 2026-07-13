/**
 * ============================================================================
 * EruditInput — Champ texte Érudit v4 (React Native)
 *
 * Transposition du Input.jsx web → React Native.
 * Variants : default / error
 * Sizes    : sm / md / lg
 * Icônes   : left / right (et toggle password)
 *
 * Usage :
 *   <EruditInput placeholder="Email" iconLeft={<Mail size={16} />} />
 *   <EruditInput type="password" placeholder="Mot de passe" />
 *   <EruditInput variant="error" errorMessage="Champ requis" />
 * ============================================================================
 */

import React, { useState, useMemo, useCallback } from 'react';
import { View, TextInput, Text, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '../theme';

/* ─── Icône œil (toggle password) ──────────────────────────────────────────
   Évite la dépendance à lucide-react-native ; utilise des caractères Unicode */

function EyeIcon({ visible, onPress, color }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={visible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
      hitSlop={8}
      style={{ padding: 4 }}
    >
      <Text style={{ fontSize: 16, color }}>{visible ? '👁' : '👁‍🗨'}</Text>
    </Pressable>
  );
}

/* ─── Configurations ──────────────────────────────────────────────────────── */

function useInputConfig(size = 'md', variant = 'default') {
  const { colors, radius } = useTheme();

  return useMemo(() => {
    const sizeConfig = {
      sm: { height: 32, px: 12, fontSize: 11, iconPad: 36 },
      md: { height: 40, px: 16, fontSize: 13, iconPad: 44 },
      lg: { height: 48, px: 20, fontSize: 15, iconPad: 52 },
    };

    const s = sizeConfig[size] || sizeConfig.md;

    const borderColor = variant === 'error' ? colors.red : colors.border;
    const focusBorderColor = variant === 'error' ? colors.red : colors.accent;
    const bg = colors.surfaceRaised;

    return { size: s, borderColor, focusBorderColor, bg, variant };
  }, [size, variant, colors, radius]);
}

/* ─── Composant ──────────────────────────────────────────────────────────── */

export default function EruditInput({
  variant = 'default',
  size = 'md',
  label,
  placeholder,
  value,
  onChangeText,
  iconLeft,
  iconRight,
  type = 'text',
  disabled = false,
  readOnly = false,
  errorMessage,
  onFocus,
  onBlur,
  style,
  accessibilityLabel,
  ...props
}) {
  const config = useInputConfig(size, variant);
  const { s } = config;
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);

  const isPassword = type === 'password';

  const handleFocus = useCallback((e) => {
    setFocused(true);
    onFocus?.(e);
  }, [onFocus]);

  const handleBlur = useCallback((e) => {
    setFocused(false);
    onBlur?.(e);
  }, [onBlur]);

  const togglePassword = useCallback(() => {
    setPasswordVisible((v) => !v);
  }, []);

  const borderClr = useMemo(() => {
    if (variant === 'error') return colors.red;
    if (focused) return colors.accent;
    return colors.border;
  }, [variant, focused, colors]);

  const containerStyle = useMemo(() => ({
    flexDirection: 'row',
    alignItems: 'center',
    height: s.height,
    borderRadius: s.fontSize >= 13 ? 12 : 10,
    borderWidth: 1,
    borderColor: borderClr,
    backgroundColor: config.bg,
    opacity: disabled ? 0.5 : readOnly ? 0.8 : 1,
  }), [s, borderClr, config.bg, disabled, readOnly]);

  return (
    <View style={[{ marginBottom: errorMessage ? 4 : 12 }, style]}>
      {/* Label */}
      {label ? (
        <Text style={{
          fontFamily: 'System',
          fontSize: 13,
          fontWeight: '500',
          color: variant === 'error' ? colors.red : colors.textSecondary,
          marginBottom: 6,
        }}>
          {label}
        </Text>
      ) : null}

      {/* Input container */}
      <View style={containerStyle}>
        {/* Icône gauche */}
        {iconLeft ? (
          <View style={{ paddingLeft: s.fontSize >= 13 ? 12 : 10 }}>
            {iconLeft}
          </View>
        ) : null}

        {/* Champ texte */}
        <TextInput
          style={{
            flex: 1,
            height: s.height,
            paddingHorizontal: iconLeft ? 6 : s.fontSize >= 13 ? 12 : 10,
            fontFamily: 'System',
            fontSize: s.fontSize,
            fontWeight: '400',
            color: colors.textPrimary,
          }}
          placeholder={placeholder}
          placeholderTextColor={colors.textTertiary}
          value={value}
          onChangeText={onChangeText}
          onFocus={handleFocus}
          onBlur={handleBlur}
          editable={!disabled && !readOnly}
          secureTextEntry={isPassword && !passwordVisible}
          autoCapitalize="none"
          autoCorrect={false}
          accessibilityLabel={accessibilityLabel || label || placeholder}
          {...props}
        />

        {/* Password toggle ou icône droite */}
        {isPassword ? (
          <View style={{ paddingRight: 10 }}>
            <EyeIcon visible={passwordVisible} onPress={togglePassword} color={colors.textTertiary} />
          </View>
        ) : iconRight ? (
          <View style={{ paddingRight: s.fontSize >= 13 ? 12 : 10 }}>
            {iconRight}
          </View>
        ) : null}
      </View>

      {/* Message d'erreur */}
      {errorMessage ? (
        <Text style={{
          fontFamily: 'System',
          fontSize: 11,
          fontWeight: '500',
          color: colors.red,
          marginTop: 4,
        }} accessibilityRole="alert">
          {errorMessage}
        </Text>
      ) : null}
    </View>
  );
}