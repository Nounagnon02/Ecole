/**
 * ============================================================================
 * EleveDashboard — Érudit v4 (React Native)
 *
 * Refonte complète du dashboard Élève.
 * Zéro react-native-paper. 100% composants Érudit + useTheme().
 * Couleur de rôle : blue (#5A7AAD)
 *
 * Tabs : Bulletin | Devoirs | Emploi | Profil
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
import EruditDashboardHeader from '../components/EruditDashboardHeader';
import EruditSkeleton from '../components/EruditSkeleton';
import EruditEmptyState from '../components/EruditEmptyState';

const Tab = createBottomTabNavigator();
const ROLE = 'eleve';

/* ─── Barre de progression maison (remplace react-native-paper ProgressBar) ── */

function ProgressBar({ progress = 0, color, height = 6, style }) {
  const { colors } = useTheme();
  const barColor = color || colors.accent;
  const clamped = Math.max(0, Math.min(1, progress));
  return (
    <View style={[{
      height,
      borderRadius: height / 2,
      backgroundColor: colors.surfaceSubtle,
      overflow: 'hidden',
    }, style]}>
      <View style={{
        height: '100%',
        width: `${clamped * 100}%`,
        borderRadius: height / 2,
        backgroundColor: barColor,
      }} />
    </View>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Onglet 1 — Bulletin
   ══════════════════════════════════════════════════════════════════════════ */

function BulletinScreen() {
  const { colors, spacing } = useTheme();
  const roleTheme = useRoleTheme(ROLE);
  const [bulletin, setBulletin] = useState(null);
  const [periode, setPeriode] = useState('1er_trimestre');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const periodes = [
    { key: '1er_trimestre', label: '1er Trimestre' },
    { key: '2eme_trimestre', label: '2ème Trimestre' },
    { key: '3eme_trimestre', label: '3ème Trimestre' },
  ];

  const fetchBulletin = useCallback(async () => {
    try {
      const response = await api.get(`/eleves/me/bulletin/${periode}`);
      setBulletin(response.data);
    } catch (error) {
      console.error('Error fetching bulletin:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [periode]);

  useEffect(() => { setLoading(true); fetchBulletin(); }, [fetchBulletin]);
  const onRefresh = useCallback(() => { setRefreshing(true); fetchBulletin(); }, [fetchBulletin]);

  /* Skeleton */
  if (loading && !bulletin) {
    return (
      <ScrollView style={{ flex: 1, backgroundColor: colors.surface }}>
        <View style={{ padding: spacing.lg, gap: spacing.md }}>
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            {[1, 2, 3].map(i => <EruditSkeleton key={i} variant="rect" width={100} height={32} borderRadius={8} />)}
          </View>
          <EruditSkeleton variant="rect" width="100%" height={140} borderRadius={16} />
          {[1, 2, 3].map(i => <EruditSkeleton key={i} variant="rect" width="100%" height={110} borderRadius={16} />)}
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.surface }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
    >
      <View style={{ padding: spacing.lg, gap: spacing.md }}>
        {/* Sélecteur période */}
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          {periodes.map(p => (
            <EruditButton
              key={p.key}
              variant={periode === p.key ? 'primary' : 'ghost'}
              size="sm"
              onPress={() => setPeriode(p.key)}
            >
              {p.label}
            </EruditButton>
          ))}
        </View>

        {!bulletin ? (
          <EruditEmptyState
            icon="📄"
            title="Bulletin indisponible"
            description="Les données du bulletin ne sont pas encore disponibles pour cette période."
          />
        ) : (
          <>
            {/* Résumé général */}
            <EruditCard variant="default">
              <EruditCard.Header>
                <EruditCard.Title>Bulletin — {periode.replace('_', ' ')}</EruditCard.Title>
              </EruditCard.Header>
              <EruditCard.Body>
                <View style={{ gap: spacing.sm }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <EruditText style={{ fontSize: 13, color: colors.textSecondary }}>Moyenne générale</EruditText>
                    <EruditText style={{
                      fontFamily: 'Georgia', fontSize: 24, fontWeight: '600',
                      color: roleTheme.main,
                    }}>
                      {bulletin.moyenne_generale ?? '—'}/20
                    </EruditText>
                  </View>
                  <ProgressBar progress={(bulletin.moyenne_generale || 0) / 20} color={roleTheme.main} height={8} />
                  <View style={{ flexDirection: 'row', gap: spacing.lg }}>
                    <EruditRow label="Rang" value={bulletin.rang ? `${bulletin.rang.position}/${bulletin.rang.total_eleves}` : '—'} />
                    <EruditRow label="Appréciation" value={bulletin.appreciation || '—'} />
                  </View>
                </View>
              </EruditCard.Body>
            </EruditCard>

            {/* Moyennes par matière */}
            {bulletin.moyennes_par_matiere?.map((matiere, i) => (
              <EruditCard key={matiere.matiere || i} variant="default">
                <EruditCard.Header>
                  <EruditCard.Title>{matiere.matiere}</EruditCard.Title>
                  <EruditBadge
                    variant={matiere.moyenne >= 10 ? 'success' : 'danger'}
                    size="sm"
                  >
                    {matiere.moyenne}/20
                  </EruditBadge>
                </EruditCard.Header>
                <EruditCard.Body>
                  <ProgressBar
                    progress={matiere.moyenne / 20}
                    color={matiere.moyenne >= 10 ? colors.green : colors.red}
                  />
                  <View style={{ flexDirection: 'row', gap: spacing.lg, marginTop: spacing.sm }}>
                    <EruditRow label="Coefficient" value={`${matiere.coefficient ?? 1}`} />
                    {matiere.rang ? (
                      <EruditRow label="Rang" value={`${matiere.rang.position}/${matiere.rang.total_eleves}`} />
                    ) : null}
                  </View>
                </EruditCard.Body>
              </EruditCard>
            ))}
          </>
        )}
      </View>
    </ScrollView>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Onglet 2 — Devoirs
   ══════════════════════════════════════════════════════════════════════════ */

function DevoirsScreen() {
  const { colors, spacing } = useTheme();
  const [devoirs, setDevoirs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDevoirs = useCallback(async () => {
    try {
      const response = await api.get('/devoirs/eleve');
      setDevoirs(response.data || []);
    } catch (error) {
      console.error('Error fetching devoirs:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchDevoirs(); }, [fetchDevoirs]);
  const onRefresh = useCallback(() => { setRefreshing(true); fetchDevoirs(); }, [fetchDevoirs]);

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
        {devoirs.length === 0 ? (
          <EruditEmptyState
            icon="📋"
            title="Aucun devoir"
            description="Aucun devoir à faire pour le moment. Profitez-en !"
          />
        ) : (
          devoirs.map(devoir => (
            <EruditCard key={devoir.id} variant="default">
              <EruditCard.Header>
                <EruditCard.Title>{devoir.titre}</EruditCard.Title>
                <EruditBadge
                  variant={devoir.rendu ? 'success' : 'danger'}
                  size="sm"
                >
                  {devoir.rendu ? 'Rendu' : 'À rendre'}
                </EruditBadge>
              </EruditCard.Header>
              <EruditCard.Body>
                <EruditRow label="Matière" value={devoir.matiere || '—'} />
                <EruditText style={{ fontSize: 13, color: colors.textSecondary, marginTop: spacing.xs }}>
                  {devoir.description || 'Aucune description'}
                </EruditText>
                {devoir.date_limite ? (
                  <EruditRow label="Date limite" value={new Date(devoir.date_limite).toLocaleDateString('fr-FR')} />
                ) : null}
              </EruditCard.Body>
              {!devoir.rendu ? (
                <EruditCard.Footer>
                  <EruditButton variant="outline" size="sm">Rendre le devoir</EruditButton>
                </EruditCard.Footer>
              ) : null}
            </EruditCard>
          ))
        )}
      </ScrollView>
    </View>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Onglet 3 — Emploi du temps
   ══════════════════════════════════════════════════════════════════════════ */

function EmploiScreen() {
  const { colors, spacing } = useTheme();
  const roleTheme = useRoleTheme(ROLE);
  const [emploi, setEmploi] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchEmploi = useCallback(async () => {
    try {
      const response = await api.get('/eleves/me/emploi-du-temps');
      setEmploi(response.data || []);
    } catch (error) {
      console.error('Error fetching emploi:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchEmploi(); }, [fetchEmploi]);
  const onRefresh = useCallback(() => { setRefreshing(true); fetchEmploi(); }, [fetchEmploi]);

  const jours = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi'];

  if (loading) {
    return (
      <ScrollView style={{ flex: 1, backgroundColor: colors.surface }}>
        <View style={{ padding: spacing.lg, gap: spacing.md }}>
          {jours.map((j, i) => (
            <View key={i} style={{ gap: spacing.sm }}>
              <EruditSkeleton variant="text" width="30%" height={17} />
              {[1, 2].map(k => <EruditSkeleton key={k} variant="rect" width="100%" height={56} borderRadius={12} />)}
            </View>
          ))}
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.surface }}
      contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing['3xl'] }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
    >
      {jours.map(jour => {
        const coursDuJour = emploi.filter(c => c.jour === jour.toLowerCase());
        if (coursDuJour.length === 0) return null;

        return (
          <View key={jour} style={{ gap: spacing.sm }}>
            <EruditText style={{
              fontFamily: 'Georgia', fontSize: 15, fontWeight: '600',
              color: colors.textPrimary, marginBottom: spacing.xs,
            }}>
              {jour}
            </EruditText>
            {coursDuJour.map(cours => (
              <View
                key={cours.id}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: spacing.md,
                  backgroundColor: colors.surfaceRaised,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: colors.borderLight,
                  padding: spacing.md,
                  borderLeftWidth: 3,
                  borderLeftColor: roleTheme.main,
                }}
              >
                {/* Créneau horaire */}
                <View style={{
                  width: 52,
                  alignItems: 'center',
                  backgroundColor: roleTheme.subtle,
                  borderRadius: 8,
                  paddingVertical: spacing.xs,
                }}>
                  <EruditText style={{ fontSize: 11, fontWeight: '600', color: roleTheme.main }}>
                    {cours.heure_debut || '—'}
                  </EruditText>
                  <EruditText style={{ fontSize: 10, color: colors.textTertiary }}>
                    {cours.heure_fin || '—'}
                  </EruditText>
                </View>

                {/* Infos cours */}
                <View style={{ flex: 1 }}>
                  <EruditText style={{ fontSize: 14, fontWeight: '600', color: colors.textPrimary }}>
                    {cours.matiere}
                  </EruditText>
                  <EruditText style={{ fontSize: 12, color: colors.textSecondary }}>
                    Prof: {cours.enseignant || '—'}
                  </EruditText>
                  <EruditText style={{ fontSize: 11, color: colors.textTertiary }}>
                    Salle: {cours.salle || '—'}
                  </EruditText>
                </View>
              </View>
            ))}
          </View>
        );
      })}

      {emploi.length === 0 ? (
        <EruditEmptyState
          icon="📅"
          title="Emploi du temps vide"
          description="Votre emploi du temps n'est pas encore disponible."
        />
      ) : null}
    </ScrollView>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Onglet 4 — Profil
   ══════════════════════════════════════════════════════════════════════════ */

function ProfilScreen() {
  const { colors, spacing } = useTheme();
  const { user, logout } = useAuth();

  const menuItems = [
    { icon: '💬', label: 'Messages', onPress: () => {} },
    { icon: '📉', label: 'Absences', onPress: () => {} },
    { icon: '⚠️', label: 'Sanctions', onPress: () => {} },
    { icon: '⚙️', label: 'Paramètres', onPress: () => {} },
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
            <EruditRow label="Classe" value={user?.classe?.nom || '—'} />
            <EruditRow label="Matricule" value={user?.matricule || '—'} />
            <EruditRow label="Date de naissance" value={user?.date_naissance || '—'} />
          </EruditCard.Body>
        </EruditCard>

        {/* Actions */}
        <EruditCard variant="default">
          <EruditCard.Header>
            <EruditCard.Title>Actions</EruditCard.Title>
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
   Petits utilitaires internes
   ══════════════════════════════════════════════════════════════════════════ */




/* ═══════════════════════════════════════════════════════════════════════════
   Tab Navigator — Point d'entrée du dashboard
   ══════════════════════════════════════════════════════════════════════════ */

export default function EleveDashboard() {
  const { user } = useAuth();
  const tabColors = useEruditTabColors(ROLE);
  const tabBarStyle = useEruditTabBarStyle();

  return (
    <Tab.Navigator
      screenOptions={{
        ...eruditTabOptions({ role: ROLE, labels: {
          Bulletin: 'Bulletin',
          Devoirs: 'Devoirs',
          Emploi: 'Emploi',
          Profil: 'Profil',
        }}),
        tabBarActiveTintColor: tabColors.activeTintColor,
        tabBarInactiveTintColor: tabColors.inactiveTintColor,
        tabBarStyle,
        headerShown: false,
        lazy: true,
      }}
    >
      <Tab.Screen name="Bulletin" component={BulletinScreen} />
      <Tab.Screen name="Devoirs" component={DevoirsScreen} />
      <Tab.Screen name="Emploi" component={EmploiScreen} />
      <Tab.Screen name="Profil" component={ProfilScreen} />
    </Tab.Navigator>
  );
}