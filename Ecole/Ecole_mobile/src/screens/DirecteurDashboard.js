/**
 * ============================================================================
 * DirecteurDashboard — Érudit v4 (React Native)
 *
 * Refonte complète du dashboard Directeur.
 * Zéro react-native-paper. 100% composants Érudit + useTheme().
 * Couleur de rôle : primary (#1A3A3C)
 *
 * Tabs : Aperçu | Classes | Enseignants | Paramètres
 * ============================================================================
 */

import { EruditText, EruditRow, EruditMenuItem } from '../components/EruditUtilities';
import React, { useState, useEffect, useCallback } from 'react';
import { View, ScrollView, RefreshControl, Alert } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { useTheme, useRoleTheme } from '../theme';
import { eruditTabOptions, useEruditTabBarStyle, useEruditTabColors } from '../components/EruditTabs';
import EruditCard from '../components/EruditCard';
import EruditButton from '../components/EruditButton';
import EruditBadge from '../components/EruditBadge';
import EruditStatsCard from '../components/EruditStatsCard';
import EruditSearchBar from '../components/EruditSearchBar';
import EruditFAB from '../components/EruditFAB';
import EruditDashboardHeader from '../components/EruditDashboardHeader';
import EruditSkeleton from '../components/EruditSkeleton';
import EruditEmptyState from '../components/EruditEmptyState';

const Tab = createBottomTabNavigator();
const ROLE = 'directeur';

/* ═══════════════════════════════════════════════════════════════════════════
   Onglet 1 — Aperçu (Overview)
   ══════════════════════════════════════════════════════════════════════════ */

function OverviewScreen() {
  const { colors, spacing, shadows, radius } = useTheme();
  const roleTheme = useRoleTheme(ROLE);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = useCallback(async () => {
    try {
      const response = await api.get('/directeur/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchStats();
  }, [fetchStats]);

  /* Skeleton */
  if (loading && !stats) {
    return (
      <ScrollView style={{ flex: 1, backgroundColor: colors.surface }}>
        <EruditDashboardHeader user={null} role={ROLE} />
        <View style={{ padding: spacing.lg, gap: spacing.md }}>
          <EruditSkeleton variant="text" width="40%" height={13} />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md }}>
            {[1, 2, 3, 4].map(i => (
              <View key={i} style={{ width: '46%', flexGrow: 1 }}>
                <EruditSkeleton variant="card" />
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    );
  }

  const statCards = [
    { title: 'Élèves inscrits', value: stats?.total_eleves ?? 0, color: 'primary', icon: '👥' },
    { title: 'Enseignants', value: stats?.total_enseignants ?? 0, color: 'green', icon: '👨‍🏫' },
    { title: 'Classes', value: stats?.total_classes ?? 0, color: 'blue', icon: '🏫' },
    { title: 'Matières', value: stats?.total_matieres ?? 0, color: 'amber', icon: '📚' },
  ];

  if (stats?.total_paiements !== undefined) {
    statCards.push({ title: 'Paiements (FCFA)', value: stats.total_paiements, color: 'emerald', icon: '💰' });
  }
  if (stats?.taux_reussite !== undefined) {
    statCards.push({ title: 'Taux de réussite', value: `${stats.taux_reussite}%`, color: 'sky', icon: '🏆' });
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.surface }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
    >
      <EruditDashboardHeader user={null} role={ROLE} />

      <View style={{ padding: spacing.lg, gap: spacing.lg }}>
        {/* Grille de stats */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md }}>
          {statCards.map((card, i) => (
            <View key={i} style={{ width: '46%', flexGrow: 1, minWidth: 150 }}>
              <EruditStatsCard
                title={card.title}
                value={card.value}
                color={card.color}
                icon={() => (
                  <View style={{
                    width: 36, height: 36, borderRadius: 10,
                    backgroundColor: colors[`${card.color}Subtle`] || colors.surfaceSubtle,
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                    <EruditText style={{ fontSize: 18 }}>{card.icon}</EruditText>
                  </View>
                )}
              />
            </View>
          ))}
        </View>

        {/* Activités récentes */}
        <EruditCard variant="default">
          <EruditCard.Header>
            <EruditCard.Title>Activités récentes</EruditCard.Title>
          </EruditCard.Header>
          <EruditCard.Body>
            {stats?.activites_recentes?.length > 0 ? (
              stats.activites_recentes.slice(0, 5).map((act, i) => (
                <View key={i} style={{
                  flexDirection: 'row', alignItems: 'center', gap: spacing.md,
                  paddingVertical: spacing.sm,
                  borderBottomWidth: i < Math.min(stats.activites_recentes.length, 5) - 1 ? 1 : 0,
                  borderBottomColor: colors.border,
                }}>
                  <View style={{
                    width: 8, height: 8, borderRadius: 4,
                    backgroundColor: act.type === 'alerte' ? colors.red : act.type === 'info' ? colors.blue : colors.green,
                  }} />
                  <EruditText style={{ flex: 1, fontSize: 13, color: colors.textPrimary }}>{act.message}</EruditText>
                  <EruditText style={{ fontSize: 11, color: colors.textTertiary }}>{act.date}</EruditText>
                </View>
              ))
            ) : (
              <EruditText style={{ fontSize: 13, color: colors.textSecondary, textAlign: 'center', paddingVertical: spacing.lg }}>
                Aucune activité récente
              </EruditText>
            )}
          </EruditCard.Body>
        </EruditCard>
      </View>
    </ScrollView>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Onglet 2 — Classes
   ══════════════════════════════════════════════════════════════════════════ */

function ClassesScreen() {
  const { colors, spacing } = useTheme();
  const [classes, setClasses] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchClasses = useCallback(async () => {
    try {
      const response = await api.get('/classes');
      setClasses(response.data || []);
    } catch (error) {
      console.error('Error fetching classes:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchClasses(); }, [fetchClasses]);

  const onRefresh = useCallback(() => { setRefreshing(true); fetchClasses(); }, [fetchClasses]);

  const filtered = classes.filter(c =>
    (c.nom || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.niveau || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.surface, padding: spacing.lg, gap: spacing.md }}>
        <EruditSearchBar placeholder="Rechercher une classe..." value="" onChangeText={() => {}} />
        {[1, 2, 3].map(i => <EruditSkeleton key={i} variant="rect" width="100%" height={100} borderRadius={16} />)}
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <View style={{ padding: spacing.lg, paddingBottom: 0 }}>
        <EruditSearchBar placeholder="Rechercher une classe..." value={searchQuery} onChangeText={setSearchQuery} />
      </View>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: spacing.lg, gap: spacing.md, paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
      >
        {filtered.length === 0 ? (
          <EruditEmptyState
            icon="🏫"
            title="Aucune classe trouvée"
            description={searchQuery ? 'Essayez un autre terme de recherche.' : 'Ajoutez votre première classe.'}
            actionLabel="Ajouter une classe"
            onAction={() => Alert.alert('Action', 'Ajouter une classe — à implémenter')}
          />
        ) : (
          filtered.map(classe => (
            <EruditCard key={classe.id} variant="default">
              <EruditCard.Header>
                <EruditCard.Title>{classe.nom}</EruditCard.Title>
                <EruditBadge variant="primary" size="sm">{classe.niveau}</EruditBadge>
              </EruditCard.Header>
              <EruditCard.Body>
                <EruditRow label="Effectif" value={`${classe.eleves_count || 0} élèves`} />
                <EruditRow label="Enseignant principal" value={classe.enseignant_principal?.nom || 'Non assigné'} />
              </EruditCard.Body>
              <EruditCard.Footer>
                <EruditButton variant="outline" size="sm">Voir les élèves</EruditButton>
              </EruditCard.Footer>
            </EruditCard>
          ))
        )}
      </ScrollView>
      <EruditFAB icon="+" color="primary" onPress={() => Alert.alert('Action', 'Ajouter une classe — à implémenter')} />
    </View>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Onglet 3 — Enseignants
   ══════════════════════════════════════════════════════════════════════════ */

function EnseignantsScreen() {
  const { colors, spacing } = useTheme();
  const [enseignants, setEnseignants] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchEnseignants = useCallback(async () => {
    try {
      const response = await api.get('/enseignants');
      setEnseignants(response.data || []);
    } catch (error) {
      console.error('Error fetching enseignants:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchEnseignants(); }, [fetchEnseignants]);

  const onRefresh = useCallback(() => { setRefreshing(true); fetchEnseignants(); }, [fetchEnseignants]);

  const filtered = enseignants.filter(e =>
    (e.nom || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (e.prenom || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (e.email || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.surface, padding: spacing.lg, gap: spacing.md }}>
        <EruditSearchBar placeholder="Rechercher un enseignant..." value="" onChangeText={() => {}} />
        {[1, 2, 3].map(i => <EruditSkeleton key={i} variant="rect" width="100%" height={110} borderRadius={16} />)}
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <View style={{ padding: spacing.lg, paddingBottom: 0 }}>
        <EruditSearchBar placeholder="Rechercher un enseignant..." value={searchQuery} onChangeText={setSearchQuery} />
      </View>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: spacing.lg, gap: spacing.md, paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
      >
        {filtered.length === 0 ? (
          <EruditEmptyState
            icon="👨‍🏫"
            title="Aucun enseignant trouvé"
            description={searchQuery ? 'Essayez un autre nom.' : 'Ajoutez votre premier enseignant.'}
            actionLabel="Ajouter un enseignant"
            onAction={() => Alert.alert('Action', 'Ajouter un enseignant — à implémenter')}
          />
        ) : (
          filtered.map(enseignant => (
            <EruditCard key={enseignant.id} variant="default">
              <EruditCard.Header>
                <EruditCard.Title>{enseignant.nom} {enseignant.prenom}</EruditCard.Title>
              </EruditCard.Header>
              <EruditCard.Body>
                <EruditRow label="Email" value={enseignant.email} />
                <EruditRow label="Téléphone" value={enseignant.telephone || 'Non renseigné'} />
                <EruditRow
                  label="Matières"
                  value={enseignant.matieres?.map(m => m.nom).join(', ') || 'Aucune'}
                />
              </EruditCard.Body>
            </EruditCard>
          ))
        )}
      </ScrollView>
      <EruditFAB icon="+" color="primary" onPress={() => Alert.alert('Action', 'Ajouter un enseignant — à implémenter')} />
    </View>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Onglet 4 — Paramètres
   ══════════════════════════════════════════════════════════════════════════ */

function SettingsScreen() {
  const { colors, spacing } = useTheme();
  const { user, logout } = useAuth();

  const menuItems = [
    { icon: '👥', label: 'Gestion des utilisateurs', onPress: () => {} },
    { icon: '⚙️', label: 'Configuration système', onPress: () => {} },
    { icon: '📊', label: 'Rapports', onPress: () => {} },
    { icon: '💾', label: 'Sauvegarde', onPress: () => {} },
    { icon: '🔒', label: 'Sécurité', onPress: () => {} },
  ];

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.surface }}>
      <EruditDashboardHeader user={user} role={ROLE} />

      <View style={{ padding: spacing.lg, gap: spacing.md }}>
        {/* Menu paramètres */}
        <EruditCard variant="default">
          <EruditCard.Header>
            <EruditCard.Title>Paramètres</EruditCard.Title>
          </EruditCard.Header>
          <EruditCard.Body>
            {menuItems.map((item, i) => (
              <EruditMenuItem key={i} {...item} />
            ))}
          </EruditCard.Body>
        </EruditCard>

        {/* Déconnexion */}
        <EruditButton variant="danger" size="lg" onPress={logout} fullWidth icon="🚪">
          Déconnexion
        </EruditButton>
      </View>
    </ScrollView>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Tab Navigator — Point d'entrée du dashboard
   ══════════════════════════════════════════════════════════════════════════ */

export default function DirecteurDashboard() {
  const { user } = useAuth();
  const tabColors = useEruditTabColors(ROLE);
  const tabBarStyle = useEruditTabBarStyle();

  return (
    <Tab.Navigator
      screenOptions={{
        ...eruditTabOptions({ role: ROLE, labels: {
          Overview: 'Aperçu',
          Classes: 'Classes',
          Enseignants: 'Enseignants',
          Settings: 'Paramètres',
        }}),
        tabBarActiveTintColor: tabColors.activeTintColor,
        tabBarInactiveTintColor: tabColors.inactiveTintColor,
        tabBarStyle,
        headerShown: false,
        lazy: true,
      }}
    >
      <Tab.Screen name="Overview" component={OverviewScreen} />
      <Tab.Screen name="Classes" component={ClassesScreen} />
      <Tab.Screen name="Enseignants" component={EnseignantsScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}