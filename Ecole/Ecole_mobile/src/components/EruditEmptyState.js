/**
 * ============================================================================
 * EruditEmptyState — État vide Érudit v4 (React Native)
 *
 * Affiche une illustration minimaliste + message quand une liste est vide.
 * Cohérent avec le EmptyState.jsx web.
 *
 * Usage :
 *   <EruditEmptyState
 *     icon="📚"
 *     title="Aucun livre trouvé"
 *     description="Le catalogue est vide pour le moment."
 *     actionLabel="Ajouter un livre"
 *     onAction={() => setModalVisible(true)}
 *   />
 * ============================================================================
 */

import React from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '../theme';
import EruditButton from './EruditButton';

/* ─── Composant ──────────────────────────────────────────────────────────── */

export default function EruditEmptyState({
  icon = '📭',
  title = 'Aucune donnée',
  description,
  actionLabel,
  onAction,
  style,
}) {
  const { colors, spacing, shadows, radius } = useTheme();

  return (
    <View style={[{
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: spacing['3xl'],
      paddingHorizontal: spacing.xl,
      borderRadius: radius.xl,
      backgroundColor: colors.surfaceRaised,
      borderWidth: 1,
      borderColor: colors.borderLight,
      gap: spacing.md,
      ...shadows.level1,
    }, style]}>
      {/* Icône décorative */}
      <View style={{
        width: 64,
        height: 64,
        borderRadius: 16,
        backgroundColor: colors.surfaceSubtle,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.sm,
      }}>
        <Text style={{ fontSize: 28 }}>{icon}</Text>
      </View>

      {/* Titre */}
      <Text style={{
        fontFamily: 'Georgia',
        fontSize: 17,
        fontWeight: '600',
        color: colors.textPrimary,
        textAlign: 'center',
      }}>
        {title}
      </Text>

      {/* Description */}
      {description ? (
        <Text style={{
          fontFamily: 'System',
          fontSize: 13,
          fontWeight: '400',
          color: colors.textSecondary,
          textAlign: 'center',
          maxWidth: 280,
          lineHeight: 13 * 1.5,
        }}>
          {description}
        </Text>
      ) : null}

      {/* Bouton d'action */}
      {actionLabel && onAction ? (
        <EruditButton
          variant="primary"
          size="md"
          onPress={onAction}
          style={{ marginTop: spacing.sm }}
        >
          {actionLabel}
        </EruditButton>
      ) : null}
    </View>
  );
}