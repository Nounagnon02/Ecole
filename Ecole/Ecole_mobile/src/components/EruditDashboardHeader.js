/**
 * ============================================================================
 * EruditDashboardHeader — Header commun pour tous les dashboards Érudit v4
 *
 * Transposition du Header.jsx web → mobile, adapté pour les dashboards.
 *
 * Affiche :
 *   - Salutation + nom utilisateur ("Bonjour, Jean")
 *   - Date du jour formatée en français
 *   - Boutons d'action (notifications, thème)
 *   - Avatar utilisateur
 *
 * Usage :
 *   <EruditDashboardHeader
 *     user={user}
 *     role="directeur"
 *     onNotificationsPress={...}
 *   />
 * ============================================================================
 */

import React, { useMemo } from 'react';
import { View, Text, Pressable } from 'react-native';
import { useTheme, useRoleTheme } from '../theme';
import EruditAvatar from './EruditAvatar';
import EruditBadge from './EruditBadge';

/* ─── Formatage de la date en français ───────────────────────────────────── */

const DAYS = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
const MONTHS = [
  'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
];

function formatDateFrench() {
  const now = new Date();
  const dayName = DAYS[now.getDay()];
  const day = now.getDate();
  const month = MONTHS[now.getMonth()];
  const year = now.getFullYear();
  return `${dayName} ${day} ${month} ${year}`;
}

/* ─── Salutation selon l'heure ──────────────────────────────────────────── */

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Bonjour';
  if (h < 18) return 'Bon après-midi';
  return 'Bonsoir';
}

/* ─── Icônes Unicode pour les actions ────────────────────────────────────── */

function BellIcon({ color, hasNotifications }) {
  return <Text style={{ fontSize: 18, color }}>{hasNotifications ? '🔔' : '🔕'}</Text>;
}

function ThemeIcon({ isDark }) {
  return <Text style={{ fontSize: 18 }}>{isDark ? '☀️' : '🌙'}</Text>;
}

/* ─── Composant ──────────────────────────────────────────────────────────── */

export default function EruditDashboardHeader({
  user,
  role = 'admin',
  notificationCount = 0,
  onNotificationsPress,
  onProfilePress,
  style,
}) {
  const { colors, isDark, toggleTheme, spacing } = useTheme();
  const roleTheme = useRoleTheme(role);

  const dateStr = useMemo(() => formatDateFrench(), []);
  const greeting = useMemo(() => getGreeting(), []);

  const userName = user?.prenom || user?.nom || 'Utilisateur';
  const userFullName = user ? `${user.prenom || ''} ${user.nom || ''}`.trim() : 'Utilisateur';

  return (
    <View style={[{
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.lg,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      gap: spacing.md,
    }, style]}>
      {/* Ligne 1 : Avatar + Salutation + Actions */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        {/* Profil */}
        <Pressable
          onPress={onProfilePress}
          style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, flex: 1 }}
        >
          <EruditAvatar name={userFullName} size="md" />
          <View style={{ flex: 1 }}>
            <Text style={{
              fontFamily: 'System',
              fontSize: 13,
              fontWeight: '500',
              color: colors.textSecondary,
            }}>
              {greeting}, {userName}
            </Text>
            <Text style={{
              fontFamily: 'Georgia',
              fontSize: 17,
              fontWeight: '600',
              color: colors.textPrimary,
            }}>
              Tableau de bord
            </Text>
          </View>
        </Pressable>

        {/* Actions */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          {/* Notifications */}
          <Pressable
            onPress={onNotificationsPress}
            accessibilityRole="button"
            accessibilityLabel={`Notifications${notificationCount > 0 ? `, ${notificationCount} non lues` : ''}`}
            style={({ pressed }) => ({
              width: 36,
              height: 36,
              borderRadius: 10,
              backgroundColor: pressed ? colors.surfaceHover : 'transparent',
              alignItems: 'center',
              justifyContent: 'center',
            })}
          >
            <BellIcon color={colors.textSecondary} hasNotifications={notificationCount > 0} />
            {notificationCount > 0 ? (
              <View style={{
                position: 'absolute',
                top: 2, right: 2,
                minWidth: 16, height: 16,
                borderRadius: 8,
                backgroundColor: colors.accent,
                alignItems: 'center',
                justifyContent: 'center',
                paddingHorizontal: 4,
              }}>
                <Text style={{ fontSize: 9, fontWeight: '700', color: '#FFFFFF' }}>
                  {notificationCount > 99 ? '99+' : notificationCount}
                </Text>
              </View>
            ) : null}
          </Pressable>

          {/* Thème dark/light */}
          <Pressable
            onPress={toggleTheme}
            accessibilityRole="button"
            accessibilityLabel={isDark ? 'Passer en mode clair' : 'Passer en mode sombre'}
            style={({ pressed }) => ({
              width: 36,
              height: 36,
              borderRadius: 10,
              backgroundColor: pressed ? colors.surfaceHover : 'transparent',
              alignItems: 'center',
              justifyContent: 'center',
            })}
          >
            <ThemeIcon isDark={isDark} />
          </Pressable>
        </View>
      </View>

      {/* Ligne 2 : Date + Badge rôle */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <Text style={{
          fontFamily: 'System',
          fontSize: 12,
          fontWeight: '400',
          color: colors.textTertiary,
        }}>
          {dateStr}
        </Text>
        <EruditBadge variant="accent" size="sm" dot>
          {role}
        </EruditBadge>
      </View>
    </View>
  );
}