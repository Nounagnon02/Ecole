/**
 * ============================================================================
 * ComptableDashboard — Érudit v4 (React Native)
 *
 * Refonte complète du dashboard Comptable.
 * Zéro react-native-paper. 100% composants Érudit + useTheme().
 * Couleur de rôle : amber (#C4943A)
 *
 * Tabs : Paiements | Finances | Bourses | Profil
 * ============================================================================
 */

import { EruditText, EruditRow, EruditMenuItem } from '../components/EruditUtilities';
import React, { useState, useEffect, useCallback } from 'react';
import { View, ScrollView, RefreshControl, Dimensions } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { LineChart } from 'react-native-chart-kit';
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
const ROLE = 'comptable';
const screenWidth = Dimensions.get('window').width;

/* ═══════════════════════════════════════════════════════════════════════════
   Onglet 1 — Paiements
   ══════════════════════════════════════════════════════════════════════════ */

function PaiementsScreen() {
  const { colors, spacing } = useTheme();
  const roleTheme = useRoleTheme(ROLE);
  const [paiements, setPaiements] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPaiements = useCallback(async () => {
    try {
      const response = await api.get('/comptable/paiements');
      setPaiements(response.data || []);
    } catch (error) {
      console.error('Error fetching paiements:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchPaiements(); }, [fetchPaiements]);
  const onRefresh = useCallback(() => { setRefreshing(true); fetchPaiements(); }, [fetchPaiements]);

  const filtered = paiements.filter(p =>
    (p.eleve?.nom || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.eleve?.prenom || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.surface, padding: spacing.lg, gap: spacing.md }}>
        <EruditSearchBar placeholder="Rechercher un paiement..." value="" onChangeText={() => {}} />
        {[1, 2, 3].map(i => <EruditSkeleton key={i} variant="rect" width="100%" height={120} borderRadius={16} />)}
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <View style={{ padding: spacing.lg, paddingBottom: 0 }}>
        <EruditSearchBar
          placeholder="Rechercher un paiement..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: spacing.lg, gap: spacing.md, paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
      >
        {filtered.length === 0 ? (
          <EruditEmptyState
            icon="💰"
            title="Aucun paiement trouvé"
            description={searchQuery ? 'Essayez un autre terme de recherche.' : 'Enregistrez votre premier paiement.'}
            actionLabel="Enregistrer un paiement"
            onAction={() => {}}
          />
        ) : (
          filtered.map(paiement => (
            <EruditCard key={paiement.id} variant="default">
              <EruditCard.Header>
                <EruditCard.Title>{paiement.eleve?.nom} {paiement.eleve?.prenom}</EruditCard.Title>
                <EruditBadge
                  variant={paiement.statut === 'payé' ? 'success' : 'danger'}
                  size="sm"
                  dot
                >
                  {paiement.statut || 'Inconnu'}
                </EruditBadge>
              </EruditCard.Header>
              <EruditCard.Body>
                <EruditRow label="Classe" value={paiement.eleve?.classe?.nom || '—'} />
                <EruditRow
                  label="Montant"
                  value={`${(paiement.montant || 0).toLocaleString('fr-FR')} FCFA`}
                />
                <EruditRow label="Type" value={paiement.type_paiement || '—'} />
                <EruditRow
                  label="Date"
                  value={paiement.date_paiement ? new Date(paiement.date_paiement).toLocaleDateString('fr-FR') : '—'}
                />
              </EruditCard.Body>
            </EruditCard>
          ))
        )}
      </ScrollView>
      <EruditFAB icon="💰" color="amber" onPress={() => {}} />
    </View>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Onglet 2 — Finances
   ══════════════════════════════════════════════════════════════════════════ */

function FinancesScreen() {
  const { colors, spacing, isDark } = useTheme();
  const roleTheme = useRoleTheme(ROLE);
  const [stats, setStats] = useState({});
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchFinances = useCallback(async () => {
    try {
      const response = await api.get('/comptable/finances');
      setStats(response.data?.stats || {});
      setChartData(response.data?.chart || null);
    } catch (error) {
      console.error('Error fetching finances:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchFinances(); }, [fetchFinances]);
  const onRefresh = useCallback(() => { setRefreshing(true); fetchFinances(); }, [fetchFinances]);

  if (loading) {
    return (
      <ScrollView style={{ flex: 1, backgroundColor: colors.surface }}>
        <View style={{ padding: spacing.lg, gap: spacing.md }}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md }}>
            {[1, 2, 3, 4].map(i => (
              <View key={i} style={{ width: '46%', flexGrow: 1 }}>
                <EruditSkeleton variant="card" />
              </View>
            ))}
          </View>
          <EruditSkeleton variant="rect" width="100%" height={220} borderRadius={16} />
        </View>
      </ScrollView>
    );
  }

  /* Thème du graphique */
  const chartTheme = {
    backgroundColor: isDark ? colors.surfaceRaised : colors.surface,
    backgroundGradientFrom: isDark ? colors.surfaceRaised : colors.surfaceRaised,
    backgroundGradientTo: isDark ? colors.surface : colors.surface,
    decimalPlaces: 0,
    color: (opacity = 1) => roleTheme.main.replace('#', `rgba(${hexToRgb(roleTheme.main)}, ${opacity})`),
    labelColor: (opacity = 1) => isDark
      ? `rgba(235, 231, 226, ${opacity})`
      : `rgba(31, 28, 25, ${opacity})`,
    propsForDots: { r: '4', strokeWidth: '2', stroke: roleTheme.main },
  };

  const statCards = [
    { title: 'Recettes', value: `${(stats.total_recettes || 0).toLocaleString('fr-FR')} FCFA`, color: 'green', icon: '📈' },
    { title: 'Dépenses', value: `${(stats.total_depenses || 0).toLocaleString('fr-FR')} FCFA`, color: 'red', icon: '📉' },
    { title: 'En attente', value: stats.paiements_en_attente || 0, color: 'amber', icon: '⏳' },
    { title: 'Bourses', value: stats.bourses_accordees || 0, color: 'blue', icon: '🎓' },
  ];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.surface }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
    >
      <View style={{ padding: spacing.lg, gap: spacing.md }}>
        {/* Grille stats */}
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

        {/* Graphique */}
        {chartData ? (
          <EruditCard variant="default">
            <EruditCard.Header>
              <EruditCard.Title>Évolution des Recettes</EruditCard.Title>
            </EruditCard.Header>
            <EruditCard.Body>
              <LineChart
                data={chartData}
                width={screenWidth - spacing.lg * 2 - spacing.md * 2}
                height={220}
                chartConfig={chartTheme}
                bezier
                style={{ borderRadius: 12 }}
              />
            </EruditCard.Body>
          </EruditCard>
        ) : null}
      </View>
    </ScrollView>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Onglet 3 — Bourses
   ══════════════════════════════════════════════════════════════════════════ */

function BoursesScreen() {
  const { colors, spacing } = useTheme();
  const [bourses, setBourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchBourses = useCallback(async () => {
    try {
      const response = await api.get('/comptable/bourses');
      setBourses(response.data || []);
    } catch (error) {
      console.error('Error fetching bourses:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchBourses(); }, [fetchBourses]);
  const onRefresh = useCallback(() => { setRefreshing(true); fetchBourses(); }, [fetchBourses]);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.surface, padding: spacing.lg, gap: spacing.md }}>
        {[1, 2, 3].map(i => <EruditSkeleton key={i} variant="rect" width="100%" height={140} borderRadius={16} />)}
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: spacing.lg, gap: spacing.md, paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
      >
        {bourses.length === 0 ? (
          <EruditEmptyState
            icon="🎓"
            title="Aucune bourse"
            description="Attribuez votre première bourse à un élève."
            actionLabel="Nouvelle bourse"
            onAction={() => {}}
          />
        ) : (
          bourses.map(bourse => (
            <EruditCard key={bourse.id} variant="default">
              <EruditCard.Header>
                <EruditCard.Title>{bourse.eleve?.nom} {bourse.eleve?.prenom}</EruditCard.Title>
                <EruditBadge
                  variant={bourse.statut === 'active' ? 'success' : 'warning'}
                  size="sm"
                  dot
                >
                  {bourse.statut || 'Inconnu'}
                </EruditBadge>
              </EruditCard.Header>
              <EruditCard.Body>
                <EruditRow label="Classe" value={bourse.eleve?.classe?.nom || '—'} />
                <EruditRow label="Type" value={bourse.type_bourse || '—'} />
                <EruditRow label="Montant" value={`${(bourse.montant || 0).toLocaleString('fr-FR')} FCFA`} />
                <EruditRow label="Pourcentage" value={`${bourse.pourcentage || 0}%`} />
                <EruditRow label="Période" value={bourse.periode || '—'} />
              </EruditCard.Body>
              <EruditCard.Footer>
                <EruditButton variant="outline" size="sm">Modifier</EruditButton>
                <EruditButton variant="primary" size="sm">Renouveler</EruditButton>
              </EruditCard.Footer>
            </EruditCard>
          ))
        )}
      </ScrollView>
      <EruditFAB icon="🎓" color="amber" onPress={() => {}} />
    </View>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Onglet 4 — Profil
   ══════════════════════════════════════════════════════════════════════════ */

function ProfilScreen() {
  const { colors, spacing } = useTheme();
  const { user, logout } = useAuth();

  const rapportItems = [
    { icon: '📅', label: 'Rapport mensuel', onPress: () => {} },
    { icon: '📊', label: 'Rapport trimestriel', onPress: () => {} },
    { icon: '📈', label: 'Rapport annuel', onPress: () => {} },
  ];

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.surface }}>
      <EruditDashboardHeader user={user} role={ROLE} />

      <View style={{ padding: spacing.lg, gap: spacing.md }}>
        {/* Profil */}
        <EruditCard variant="default">
          <EruditCard.Header>
            <EruditCard.Title>Mon Profil</EruditCard.Title>
          </EruditCard.Header>
          <EruditCard.Body>
            <EruditRow label="Nom" value={`${user?.nom || ''} ${user?.prenom || ''}`.trim()} />
            <EruditRow label="Email" value={user?.email || '—'} />
            <EruditRow label="Téléphone" value={user?.telephone || '—'} />
            <EruditRow label="Poste" value="Comptable" />
          </EruditCard.Body>
        </EruditCard>

        {/* Rapports */}
        <EruditCard variant="default">
          <EruditCard.Header>
            <EruditCard.Title>Rapports</EruditCard.Title>
          </EruditCard.Header>
          <EruditCard.Body>
            {rapportItems.map((item, i) => (
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
   Utilitaires
   ══════════════════════════════════════════════════════════════════════════ */




/** Convertit une couleur hex (#B8562E) en RGB (184, 86, 46) */
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
    : '0, 0, 0';
}

/* ═══════════════════════════════════════════════════════════════════════════
   Tab Navigator — Point d'entrée du dashboard
   ══════════════════════════════════════════════════════════════════════════ */

export default function ComptableDashboard() {
  const { user } = useAuth();
  const tabColors = useEruditTabColors(ROLE);
  const tabBarStyle = useEruditTabBarStyle();

  return (
    <Tab.Navigator
      screenOptions={{
        ...eruditTabOptions({ role: ROLE, labels: {
          Paiements: 'Paiements',
          Finances: 'Finances',
          Bourses: 'Bourses',
          Profil: 'Profil',
        }}),
        tabBarActiveTintColor: tabColors.activeTintColor,
        tabBarInactiveTintColor: tabColors.inactiveTintColor,
        tabBarStyle,
        headerShown: false,
        lazy: true,
      }}
    >
      <Tab.Screen name="Paiements" component={PaiementsScreen} />
      <Tab.Screen name="Finances" component={FinancesScreen} />
      <Tab.Screen name="Bourses" component={BoursesScreen} />
      <Tab.Screen name="Profil" component={ProfilScreen} />
    </Tab.Navigator>
  );
}