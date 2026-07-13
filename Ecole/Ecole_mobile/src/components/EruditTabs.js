/**
 * ============================================================================
 * EruditTabs — Configuration de style pour Bottom Tab Navigator Érudit v4
 *
 * Fournit un screenOptions prêt à l'emploi pour createBottomTabNavigator,
 * avec les couleurs Érudit et le style chaud du design system.
 *
 * Usage :
 *   const Tab = createBottomTabNavigator();
 *   <Tab.Navigator screenOptions={eruditTabOptions({ role: 'directeur' })}>
 *     ...
 *   </Tab.Navigator>
 *
 * Ou avec personnalisation :
 *   <Tab.Navigator screenOptions={eruditTabOptions({
 *     role: 'enseignant',
 *     customIcons: { Overview: <OverviewIcon /> }
 *   })}>
 * ============================================================================
 */

import React from 'react';
import { View, Text, Platform } from 'react-native';
import { useTheme, useRoleTheme } from '../theme';

/* ─── Icône par défaut (Unicode simple) ────────────────────────────────────
   Chaque dashboard remplacera par des icônes SVG ou composants si désiré. */

const DEFAULT_ICONS = {
  'Aperçu': '📊',
  'Accueil': '🏠',
  'Classes': '🏫',
  'Élèves': '👥',
  'Enseignants': '👨‍🏫',
  'Notes': '📝',
  'Devoirs': '📋',
  'Bulletin': '📄',
  'Emploi': '📅',
  'Profil': '👤',
  'Paramètres': '⚙️',
  'Messages': '💬',
  'Paiements': '💰',
  'Finances': '📈',
  'Bourses': '🎓',
  'Absences': '📉',
  'Incidents': '⚠️',
  'Sanctions': '🚫',
  'Résultats': '🏆',
  'Conseils': '📊',
  'Examens': '✍️',
  'Consultations': '🏥',
  'Dossiers': '📁',
  'Vaccinations': '💉',
  'Catalogue': '📚',
  'Emprunt': '📖',
  'Réservations': '🔖',
  'Dossiers élèves': '🗂️',
  'Certificats': '📜',
  'Rendez-vous': '📆',
};

/* ─── Factory de screenOptions ──────────────────────────────────────────── */

/**
 * Retourne un objet screenOptions pour createBottomTabNavigator.
 *
 * @param {Object} opts
 * @param {string} opts.role        - Rôle pour la couleur active (ex: 'directeur')
 * @param {Object} opts.customIcons - Map routeName → composant icône
 * @param {Object} opts.labels      - Map routeName → label personnalisé
 */
export function eruditTabOptions({ role = 'admin', customIcons = {}, labels = {} } = {}) {
  // Note: useTheme et useRoleTheme doivent être appelés dans un composant.
  // On retourne une fonction qui sera appelée avec { route } par React Navigation.

  return ({ route }) => {
    // Récupération du thème au moment du rendu (via closure dans le composant Tab.Navigator)
    // On utilise une approche lazy : la config est appliquée via le composant TabIcon ci-dessous.

    const routeName = route.name;
    const label = labels[routeName] || routeName;
    const defaultIcon = DEFAULT_ICONS[label] || DEFAULT_ICONS[routeName] || '•';

    return {
      headerShown: false,
      tabBarLabel: label,
      tabBarIcon: customIcons[routeName]
        ? ({ color, size }) => {
          const IconComp = customIcons[routeName];
          return typeof IconComp === 'function' ? <IconComp color={color} size={size} /> : IconComp;
        }
        : ({ color, size }) => (
          <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: size - 4, color }}>{defaultIcon}</Text>
          </View>
        ),
    };
  };
}

/* ─── Style global de la tabBar ────────────────────────────────────────── */

/**
 * Appliquer au tabBarStyle du Tab.Navigator :
 *   <Tab.Navigator screenOptions={{ tabBarStyle: eruditTabBarStyle(theme) }}>
 */
export function useEruditTabBarStyle() {
  const { colors, shadows, isDark } = useTheme();
  return {
    backgroundColor: colors.surfaceRaised,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    height: Platform.OS === 'ios' ? 88 : 64,
    paddingBottom: Platform.OS === 'ios' ? 28 : 8,
    paddingTop: 8,
    ...shadows.level3,
  };
}

/* ─── Couleurs actives/inactives ─────────────────────────────────────────── */

export function useEruditTabColors(role = 'admin') {
  const { colors, isDark } = useTheme();
  const roleTheme = useRoleTheme(role);
  return {
    activeTintColor: roleTheme.main,
    inactiveTintColor: colors.textTertiary,
  };
}

/* ─── Composant complet de TabBar (optionnel, si besoin custom complet) ─── */

/**
 * TabIcon — Icône d'onglet avec dot actif
 * Usage interne au screenOptions.
 */
export function TabIcon({ focused, icon, color, size = 22 }) {
  const { colors } = useTheme();
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', width: size + 8, height: size + 8 }}>
      {typeof icon === 'string' ? (
        <Text style={{ fontSize: size, opacity: focused ? 1 : 0.5 }}>
          {icon}
        </Text>
      ) : (
        icon
      )}
      {focused ? (
        <View style={{
          position: 'absolute',
          bottom: 0,
          width: 4,
          height: 4,
          borderRadius: 2,
          backgroundColor: color,
        }} />
      ) : null}
    </View>
  );
}

export default { eruditTabOptions, useEruditTabBarStyle, useEruditTabColors, TabIcon };