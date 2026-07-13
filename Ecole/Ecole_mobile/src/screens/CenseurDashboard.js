/**
 * ============================================================================
 * CenseurDashboard — Érudit v4 (React Native)
 *
 * Refonte complète du dashboard Censeur.
 * Zéro react-native-paper. 100% composants Érudit + useTheme().
 * Couleur de rôle : purple (#8A5A7A)
 *
 * Tabs : Résultats | Conseils | Examens | Profil
 * ============================================================================
 */

import { EruditText, EruditRow, EruditMenuItem } from '../components/EruditUtilities';
import React, { useState, useEffect, useCallback } from 'react';
import { View, ScrollView, RefreshControl, Dimensions } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { BarChart } from 'react-native-chart-kit';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { useTheme, useRoleTheme } from '../theme';
import { eruditTabOptions, useEruditTabBarStyle, useEruditTabColors } from '../components/EruditTabs';
import EruditCard from '../components/EruditCard';
import EruditButton from '../components/EruditButton';
import EruditBadge from '../components/EruditBadge';
import EruditStatsCard from '../components/EruditStatsCard';
import EruditFAB from '../components/EruditFAB';
import EruditDashboardHeader from '../components/EruditDashboardHeader';
import EruditSkeleton from '../components/EruditSkeleton';
import EruditEmptyState from '../components/EruditEmptyState';

const Tab = createBottomTabNavigator();
const ROLE = 'censeur';
const screenWidth = Dimensions.get('window').width;

/* ─── Barre de progression maison ────────────────────────────────────────── */

function ProgressBar({ progress = 0, color, height = 6, style }) {
  const { colors } = useTheme();
  const barColor = color || colors.accent;
  const clamped = Math.max(0, Math.min(1, progress));
  return (
    <View style={[{
      height, borderRadius: height / 2,
      backgroundColor: colors.surfaceSubtle, overflow: 'hidden',
    }, style]}>
      <View style={{
        height: '100%', width: `${clamped * 100}%`,
        borderRadius: height / 2, backgroundColor: barColor,
      }} />
    </View>
  );
}

/* ─── Hex → RGB ─────────────────────────────────────────────────────────── */

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
    : '0, 0, 0';
}

/* ═══════════════════════════════════════════════════════════════════════════
   Onglet 1 — Résultats
   ══════════════════════════════════════════════════════════════════════════ */

function ResultatsScreen() {
  const { colors, spacing } = useTheme();
  const roleTheme = useRoleTheme(ROLE);
  const [resultats, setResultats] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchResultats = useCallback(async () => {
    try {
      const response = await api.get('/censeur/resultats');
      setResultats(response.data?.resultats || []);
      setStats(response.data?.stats || {});
    } catch (error) {
      console.error('Error fetching resultats:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchResultats(); }, [fetchResultats]);
  const onRefresh = useCallback(() => { setRefreshing(true); fetchResultats(); }, [fetchResultats]);

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
          {[1, 2].map(i => <EruditSkeleton key={i} variant="rect" width="100%" height={130} borderRadius={16} />)}
        </View>
      </ScrollView>
    );
  }

  const statCards = [
    { title: 'Moyenne générale', value: stats.moyenne_generale ?? '—', color: 'purple', icon: '📊' },
    { title: 'Taux de réussite', value: stats.taux_reussite ? `${stats.taux_reussite}%` : '—', color: 'green', icon: '🏆' },
    { title: 'Excellence', value: stats.eleves_excellence ?? 0, color: 'blue', icon: '⭐' },
    { title: 'En difficulté', value: stats.eleves_difficulte ?? 0, color: 'red', icon: '⚠️' },
  ];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.surface }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
    >
      <View style={{ padding: spacing.lg, gap: spacing.lg }}>
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

        {/* Classes */}
        {resultats.length === 0 ? (
          <EruditEmptyState
            icon="📚"
            title="Aucun résultat académique"
            description="Les résultats des classes apparaîtront ici une fois saisis."
          />
        ) : (
          resultats.map(classe => (
            <EruditCard key={classe.id} variant="default">
              <EruditCard.Header>
                <EruditCard.Title>{classe.nom}</EruditCard.Title>
                <EruditBadge variant="primary" size="sm">{classe.effectif || 0} élèves</EruditBadge>
              </EruditCard.Header>
              <EruditCard.Body>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.sm }}>
                  <EruditText style={{ fontSize: 13, color: colors.textSecondary }}>Moyenne de classe</EruditText>
                  <EruditText style={{
                    fontFamily: 'Georgia', fontSize: 20, fontWeight: '600', color: roleTheme.main,
                  }}>
                    {classe.moyenne}/20
                  </EruditText>
                </View>
                <ProgressBar progress={(classe.moyenne || 0) / 20} color={roleTheme.main} height={8} />
                <View style={{ flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm }}>
                  <EruditBadge variant="success" size="sm" dot>Admis: {classe.admis || 0}</EruditBadge>
                  <EruditBadge variant="danger" size="sm" dot>Échec: {classe.echec || 0}</EruditBadge>
                </View>
              </EruditCard.Body>
            </EruditCard>
          ))
        )}
      </View>
    </ScrollView>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Onglet 2 — Conseils de classe
   ══════════════════════════════════════════════════════════════════════════ */

function ConseilsScreen() {
  const { colors, spacing } = useTheme();
  const [conseils, setConseils] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchConseils = useCallback(async () => {
    try {
      const response = await api.get('/censeur/conseils-classe');
      setConseils(response.data || []);
    } catch (error) {
      console.error('Error fetching conseils:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchConseils(); }, [fetchConseils]);
  const onRefresh = useCallback(() => { setRefreshing(true); fetchConseils(); }, [fetchConseils]);

  const statutVariant = (s) =>
    s === 'terminé' ? 'success' : s === 'programmé' ? 'primary' : 'warning';

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.surface, padding: spacing.lg, gap: spacing.md }}>
        {[1, 2, 3].map(i => <EruditSkeleton key={i} variant="rect" width="100%" height={130} borderRadius={16} />)}
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
        {conseils.length === 0 ? (
          <EruditEmptyState
            icon="📊"
            title="Aucun conseil de classe"
            description="Programmez le premier conseil de classe."
            actionLabel="Programmer un conseil"
            onAction={() => {}}
          />
        ) : (
          conseils.map(conseil => (
            <EruditCard key={conseil.id} variant="default">
              <EruditCard.Header>
                <EruditCard.Title>Conseil — {conseil.classe?.nom}</EruditCard.Title>
                <EruditBadge variant={statutVariant(conseil.statut)} size="sm" dot>
                  {conseil.statut || '—'}
                </EruditBadge>
              </EruditCard.Header>
              <EruditCard.Body>
                <EruditRow
                  label="Date"
                  value={conseil.date ? new Date(conseil.date).toLocaleDateString('fr-FR') : '—'}
                />
                <EruditRow label="Trimestre" value={conseil.trimestre || '—'} />
                <EruditRow label="Participants" value={`${conseil.participants?.length || 0}`} />
                <EruditRow label="Décisions" value={`${conseil.decisions?.length || 0}`} />
              </EruditCard.Body>
              <EruditCard.Footer>
                <EruditButton variant="outline" size="sm">Voir détails</EruditButton>
                <EruditButton variant="primary" size="sm">Modifier</EruditButton>
              </EruditCard.Footer>
            </EruditCard>
          ))
        )}
      </ScrollView>
      <EruditFAB icon="📊" color="purple" onPress={() => {}} />
    </View>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Onglet 3 — Examens
   ══════════════════════════════════════════════════════════════════════════ */

function ExamensScreen() {
  const { colors, spacing } = useTheme();
  const [examens, setExamens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchExamens = useCallback(async () => {
    try {
      const response = await api.get('/censeur/examens');
      setExamens(response.data || []);
    } catch (error) {
      console.error('Error fetching examens:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchExamens(); }, [fetchExamens]);
  const onRefresh = useCallback(() => { setRefreshing(true); fetchExamens(); }, [fetchExamens]);

  const statutVariant = (s) =>
    s === 'programmé' ? 'primary' : s === 'en_cours' ? 'warning' : 'success';

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
        {examens.length === 0 ? (
          <EruditEmptyState
            icon="✍️"
            title="Aucun examen programmé"
            description="Créez votre premier examen de la session."
            actionLabel="Créer un examen"
            onAction={() => {}}
          />
        ) : (
          examens.map(examen => (
            <EruditCard key={examen.id} variant="default">
              <EruditCard.Header>
                <EruditCard.Title>{examen.nom}</EruditCard.Title>
                <EruditBadge variant={statutVariant(examen.statut)} size="sm" dot>
                  {examen.statut || '—'}
                </EruditBadge>
              </EruditCard.Header>
              <EruditCard.Body>
                <EruditRow label="Type" value={examen.type || '—'} />
                <EruditRow
                  label="Début"
                  value={examen.date_debut ? new Date(examen.date_debut).toLocaleDateString('fr-FR') : '—'}
                />
                <EruditRow
                  label="Fin"
                  value={examen.date_fin ? new Date(examen.date_fin).toLocaleDateString('fr-FR') : '—'}
                />
                <EruditRow
                  label="Classes concernées"
                  value={examen.classes?.map(c => c.nom).join(', ') || '—'}
                />
                <EruditRow label="Matières" value={`${examen.matieres?.length || 0}`} />
              </EruditCard.Body>
              <EruditCard.Footer>
                <EruditButton variant="outline" size="sm">Planning</EruditButton>
                <EruditButton variant="primary" size="sm">Résultats</EruditButton>
              </EruditCard.Footer>
            </EruditCard>
          ))
        )}
      </ScrollView>
      <EruditFAB icon="✍️" color="purple" onPress={() => {}} />
    </View>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Onglet 4 — Profil
   ══════════════════════════════════════════════════════════════════════════ */

function ProfilScreen() {
  const { colors, spacing, isDark } = useTheme();
  const roleTheme = useRoleTheme(ROLE);
  const { user, logout } = useAuth();
  const [chartData, setChartData] = useState(null);

  useEffect(() => {
    api.get('/censeur/stats-chart')
      .then(res => setChartData(res.data))
      .catch(() => {});
  }, []);

  const chartTheme = {
    backgroundColor: isDark ? colors.surfaceRaised : colors.surface,
    backgroundGradientFrom: isDark ? colors.surfaceRaised : colors.surfaceRaised,
    backgroundGradientTo: isDark ? colors.surface : colors.surface,
    decimalPlaces: 1,
    color: (opacity = 1) => roleTheme.main.replace('#', `rgba(${hexToRgb(roleTheme.main)}, ${opacity})`),
    labelColor: (opacity = 1) => isDark
      ? `rgba(235, 231, 226, ${opacity})`
      : `rgba(31, 28, 25, ${opacity})`,
    propsForDots: { r: '4', strokeWidth: '2', stroke: roleTheme.main },
  };

  const actions = [
    { icon: '📅', label: 'Valider emplois du temps', onPress: () => {} },
    { icon: '📄', label: 'Générer rapport académique', onPress: () => {} },
    { icon: '📊', label: 'Programmer conseil de classe', onPress: () => {} },
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
            <EruditRow label="Poste" value="Censeur" />
          </EruditCard.Body>
        </EruditCard>

        {/* Graphique évolution résultats */}
        {chartData ? (
          <EruditCard variant="default">
            <EruditCard.Header>
              <EruditCard.Title>Évolution des Résultats</EruditCard.Title>
            </EruditCard.Header>
            <EruditCard.Body>
              <BarChart
                data={chartData}
                width={screenWidth - spacing.lg * 2 - spacing.md * 2}
                height={220}
                chartConfig={chartTheme}
                style={{ borderRadius: 12 }}
              />
            </EruditCard.Body>
          </EruditCard>
        ) : null}

        {/* Actions rapides */}
        <EruditCard variant="default">
          <EruditCard.Header>
            <EruditCard.Title>Actions Rapides</EruditCard.Title>
          </EruditCard.Header>
          <EruditCard.Body>
            {actions.map((item, i) => (
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
   Petits utilitaires internes
   ══════════════════════════════════════════════════════════════════════════ */




/* ═══════════════════════════════════════════════════════════════════════════
   Tab Navigator — Point d'entrée du dashboard
   ══════════════════════════════════════════════════════════════════════════ */

export default function CenseurDashboard() {
  const { user } = useAuth();
  const tabColors = useEruditTabColors(ROLE);
  const tabBarStyle = useEruditTabBarStyle();

  return (
    <Tab.Navigator
      screenOptions={{
        ...eruditTabOptions({ role: ROLE, labels: {
          Resultats: 'Résultats',
          Conseils: 'Conseils',
          Examens: 'Examens',
          Profil: 'Profil',
        }}),
        tabBarActiveTintColor: tabColors.activeTintColor,
        tabBarInactiveTintColor: tabColors.inactiveTintColor,
        tabBarStyle,
        headerShown: false,
        lazy: true,
      }}
    >
      <Tab.Screen name="Resultats" component={ResultatsScreen} />
      <Tab.Screen name="Conseils" component={ConseilsScreen} />
      <Tab.Screen name="Examens" component={ExamensScreen} />
      <Tab.Screen name="Profil" component={ProfilScreen} />
    </Tab.Navigator>
  );
}