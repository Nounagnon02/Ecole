/**
 * ============================================================================
 * EruditSearchBar — Barre de recherche Érudit v4 (React Native)
 *
 * Remplace le Searchbar de react-native-paper.
 * Style aligné sur le Input Érudit : fond surfaceRaised, bordure chaude.
 *
 * Usage :
 *   <EruditSearchBar
 *     placeholder="Rechercher un élève..."
 *     value={query}
 *     onChangeText={setQuery}
 *   />
 * ============================================================================
 */

import React, { useMemo, useCallback } from 'react';
import { View, TextInput, Pressable, Text } from 'react-native';
import { useTheme } from '../theme';

/* ─── Icône loupe en Unicode ────────────────────────────────────────────── */

function SearchIcon({ color, size = 16 }) {
  return <Text style={{ fontSize: size, color }}>🔍</Text>;
}

function ClearIcon({ color, size = 16 }) {
  return <Text style={{ fontSize: size, color }}>✕</Text>;
}

/* ─── Composant ─────────────────────────────────────────────────────────── */

export default function EruditSearchBar({
  placeholder = 'Rechercher...',
  value = '',
  onChangeText,
  onFocus,
  onBlur,
  disabled = false,
  style,
  accessibilityLabel,
  ...props
}) {
  const { colors, radius, shadows } = useTheme();

  const [focused, setFocused] = React.useState(false);

  const handleFocus = useCallback((e) => {
    setFocused(true);
    onFocus?.(e);
  }, [onFocus]);

  const handleBlur = useCallback((e) => {
    setFocused(false);
    onBlur?.(e);
  }, [onBlur]);

  const handleClear = useCallback(() => {
    onChangeText?.('');
  }, [onChangeText]);

  const containerStyle = useMemo(() => ({
    flexDirection: 'row',
    alignItems: 'center',
    height: 40,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: focused ? colors.accent : colors.border,
    backgroundColor: colors.surfaceRaised,
    paddingHorizontal: 12,
    gap: 8,
    opacity: disabled ? 0.5 : 1,
    ...shadows.level1,
  }), [focused, colors, radius, shadows, disabled]);

  return (
    <View style={[{ marginBottom: 12 }, style]}>
      <View style={containerStyle}>
        <SearchIcon color={focused ? colors.accent : colors.textTertiary} size={16} />

        <TextInput
          style={{
            flex: 1,
            height: 40,
            fontFamily: 'System',
            fontSize: 13,
            fontWeight: '400',
            color: colors.textPrimary,
          }}
          placeholder={placeholder}
          placeholderTextColor={colors.textTertiary}
          value={value}
          onChangeText={onChangeText}
          onFocus={handleFocus}
          onBlur={handleBlur}
          editable={!disabled}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
          accessibilityLabel={accessibilityLabel || placeholder}
          {...props}
        />

        {value.length > 0 ? (
          <Pressable
            onPress={handleClear}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Effacer la recherche"
            style={{ padding: 2 }}
          >
            <ClearIcon color={colors.textTertiary} size={14} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}