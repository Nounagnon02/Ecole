/**
 * ============================================================================
 * UniversiteDashboard — Érudit v4 (React Native)
 *
 * Nouveau dashboard Universite.
 * Zéro react-native-paper. 100% composants Érudit + useTheme().
 * Couleur de rôle : teal profond (#1A3A3C)
 *
 * Tabs : Aperçu | Facultés | Candidatures | Profil
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
import EruditInput from '../components/EruditInput';
import EruditModal from '../components/EruditModal';
import EruditFAB from '../components/EruditFAB';
import EruditDashboardHeader from '../components/EruditDashboardHeader';
import EruditSkeleton from '../components/EruditSkeleton';
import EruditEmptyState from '../components/EruditEmptyState';

const Tab = createBottomTabNavigator();
const ROLE = 'universite';

/* ═══════════════════════════════════════════════════════════════════════════
   Onglet 1 — Aperçu
   ══════════════════════════════════════════════════════════════════════════ */

function ApercuScreen() {
  const { colors, spacing } = useTheme();
  const [stats, setStats] = useState({});
  const [activites, setActivites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [statsRes, activitesRes] = await Promise.all([
        api.get('/dashboard/universite').catch(() => ({ data: {} })),
        api.get('/dashboard/universite').catch(() => ({ data: { activites_recentes: [] } })),
      ]);
      // Note: activites extraites du dashboard — pas d'endpoint /universite/activites dédié
      setStats(statsRes.data || {});
      setActivites(activitesRes.data?.activites_recentes || []);
    } catch (error) {
      console.error('Error fetching universite data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  const onRefresh = useCallback(() => { setRefreshing(true); fetchData(); }, [fetchData]);

  const statCards = [
    { title: 'Facultés', value: stats.facultes ?? 0, color: 'primary', icon: '🏛️' },
    { title: 'Étudiants', value: stats.etudiants ?? 0, color: 'blue', icon: '🎓' },
    { title: 'Enseignants', value: stats.enseignants ?? 0, color: 'green', icon: '👨‍🏫' },
    { title: 'Candidatures', value: stats.candidatures ?? 0, color: 'amber', icon: '📋' },
    { title: 'Filières', value: stats.filieres ?? 0, color: 'purple', icon: '📚' },
    { title: 'Taux réussite', value: `${stats.taux_reussite ?? 0}%`, color: 'emerald', icon: '🏆' },
  ];

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.surface, padding: spacing.lg, gap: spacing.md }}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          {[1, 2, 3, 4].map(i => (
            <View key={i} style={{ width: '46%', flexGrow: 1, minWidth: 120 }}>
              <EruditSkeleton variant="rect" width="100%" height={100} borderRadius={16} />
            </View>
          ))}
        </View>
        {[1, 2].map(i => <EruditSkeleton key={i} variant="rect" width="100%" height={100} borderRadius={16} />)}
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
        {/* Grille de statistiques */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          {statCards.map((card, i) => (
            <View key={i} style={{ width: '46%', flexGrow: 1, minWidth: 120 }}>
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
            <EruditCard.Title>Activités Récentes</EruditCard.Title>
          </EruditCard.Header>
          <EruditCard.Body>
            {activites.length === 0 ? (
              <EruditText style={{ textAlign: 'center', paddingVertical: spacing.md }}>
                Aucune activité récente
              </EruditText>
            ) : (
              activites.slice(0, 5).map((act, i) => (
                <View
                  key={act.id || i}
                  style={{
                    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
                    paddingVertical: spacing.sm,
                    borderBottomWidth: i < Math.min(activites.length, 5) - 1 ? 1 : 0,
                    borderBottomColor: colors.border,
                  }}
                >
                  <View style={{
                    width: 32, height: 32, borderRadius: 8,
                    backgroundColor: colors.primarySubtle,
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                    <EruditText style={{ fontSize: 14 }}>{act.type === 'inscription' ? '📝' : '⚡'}</EruditText>
                  </View>
                  <View style={{ flex: 1 }}>
                    <EruditText style={{ fontSize: 13, color: colors.textPrimary, fontWeight: '500' }}>
                      {act.description || 'Action'}
                    </EruditText>
                    <EruditText style={{ fontSize: 11, color: colors.textTertiary }}>
                      {act.date ? new Date(act.date).toLocaleDateString('fr-FR') : ''}
                    </EruditText>
                  </View>
                </View>
              ))
            )}
          </EruditCard.Body>
        </EruditCard>
      </ScrollView>
    </View>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Onglet 2 — Facultés
   ══════════════════════════════════════════════════════════════════════════ */

function FacultesScreen() {
  const { colors, spacing } = useTheme();
  const [facultes, setFacultes] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchFacultes = useCallback(async () => {
    try {
      const response = await api.get('/universite/facultes');
      setFacultes(response.data || []);
    } catch (error) {
      console.error('Error fetching facultes:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchFacultes(); }, [fetchFacultes]);
  const onRefresh = useCallback(() => { setRefreshing(true); fetchFacultes(); }, [fetchFacultes]);

  const filtered = facultes.filter(f =>
    f.nom?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.surface, padding: spacing.lg, gap: spacing.md }}>
        <EruditSkeleton variant="rect" width="100%" height={48} borderRadius={12} />
        {[1, 2, 3].map(i => <EruditSkeleton key={i} variant="rect" width="100%" height={160} borderRadius={16} />)}
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <View style={{ padding: spacing.lg, paddingBottom: 0 }}>
        <EruditSearchBar
          placeholder="Rechercher une faculté..."
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
            icon="🏛️"
            title="Aucune faculté"
            description={searchQuery ? 'Essayez un autre nom.' : 'Ajoutez la première faculté.'}
            actionLabel="Ajouter une faculté"
            onAction={() => {}}
          />
        ) : (
          filtered.map(faculte => (
            <EruditCard key={faculte.id} variant="default">
              <EruditCard.Header>
                <EruditCard.Title>{faculte.nom}</EruditCard.Title>
                <EruditBadge variant="primary" size="sm" dot>
                  {faculte.statut || 'Actif'}
                </EruditBadge>
              </EruditCard.Header>
              <EruditCard.Body>
                <EruditRow label="Doyen" value={faculte.doyen?.nom ? `${faculte.doyen.nom} ${faculte.doyen.prenom}` : '—'} />
                <EruditRow label="Départements" value={String(faculte.nb_departements ?? 0)} />
                <EruditRow label="Étudiants" value={String(faculte.nb_etudiants ?? 0)} />
                <EruditRow label="Filières" value={String(faculte.nb_filieres ?? 0)} />
              </EruditCard.Body>
              <EruditCard.Footer>
                <EruditButton variant="outline" size="sm">Détails</EruditButton>
                <EruditButton variant="primary" size="sm">Départements</EruditButton>
              </EruditCard.Footer>
            </EruditCard>
          ))
        )}
      </ScrollView>
      <EruditFAB icon="🏛️" color="universite" onPress={() => {}} />
    </View>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Onglet 3 — Candidatures
   ══════════════════════════════════════════════════════════════════════════ */

function CandidaturesScreen() {
  const { colors, spacing } = useTheme();
  const [candidatures, setCandidatures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [candidatNom, setCandidatNom] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchCandidatures = useCallback(async () => {
    try {
      const response = await api.get('/universite/candidatures');
      setCandidatures(response.data || []);
    } catch (error) {
      console.error('Error fetching candidatures:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchCandidatures(); }, [fetchCandidatures]);
  const onRefresh = useCallback(() => { setRefreshing(true); fetchCandidatures(); }, [fetchCandidatures]);

  const ajouterCandidature = async () => {
    if (!candidatNom.trim()) return;
    setSaving(true);
    try {
      await api.post('/universite/candidatures', {
        nom: candidatNom,
        statut: 'nouvelle',
        date_soumission: new Date().toISOString(),
      });
      setModalVisible(false);
      setCandidatNom('');
      fetchCandidatures();
      Alert.alert('Succès', 'Candidature enregistrée');
    } catch (error) {
      Alert.alert('Erreur', 'Erreur lors de l\'enregistrement');
    } finally {
      setSaving(false);
    }
  };

  const statutVariant = (s) => {
    switch (s) {
      case 'acceptée': return 'success';
      case 'rejetée': return 'danger';
      case 'en_attente': return 'warning';
      default: return 'primary';
    }
  };

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
        {candidatures.length === 0 ? (
          <EruditEmptyState
            icon="📋"
            title="Aucune candidature"
            description="Enregistrez la première candidature."
            actionLabel="Nouvelle candidature"
            onAction={() => setModalVisible(true)}
          />
        ) : (
          candidatures.map(candidature => (
            <EruditCard key={candidature.id} variant="default">
              <EruditCard.Header>
                <EruditCard.Title>{candidature.nom || 'Candidat'}</EruditCard.Title>
                <EruditBadge variant={statutVariant(candidature.statut)} size="sm" dot>
                  {candidature.statut || '—'}
                </EruditBadge>
              </EruditCard.Header>
              <EruditCard.Body>
                <EruditRow label="Filière" value={candidature.filiere?.nom || '—'} />
                <EruditRow label="Niveau" value={candidature.niveau || '—'} />
                <EruditRow
                  label="Date"
                  value={candidature.date_soumission ? new Date(candidature.date_soumission).toLocaleDateString('fr-FR') : '—'}
                />
                <EruditRow label="Moyenne" value={candidature.moyenne ? `${candidature.moyenne}/20` : '—'} />
              </EruditCard.Body>
              <EruditCard.Footer>
                <EruditButton variant="outline" size="sm">Détails</EruditButton>
                <EruditButton variant="primary" size="sm">Traiter</EruditButton>
              </EruditCard.Footer>
            </EruditCard>
          ))
        )}
      </ScrollView>

      <EruditFAB icon="📋" color="universite" onPress={() => setModalVisible(true)} />

      <EruditModal visible={modalVisible} onDismiss={() => setModalVisible(false)}>
        <EruditModal.Header>
          <EruditModal.Title>Nouvelle candidature</EruditModal.Title>
        </EruditModal.Header>
        <EruditModal.Body>
          <EruditInput
            label="Nom du candidat"
            value={candidatNom}
            onChangeText={setCandidatNom}
            placeholder="Prénom et nom"
          />
        </EruditModal.Body>
        <EruditModal.Footer>
          <EruditButton variant="ghost" onPress={() => setModalVisible(false)}>Annuler</EruditButton>
          <EruditButton variant="primary" onPress={ajouterCandidature} loading={saving}>Enregistrer</EruditButton>
        </EruditModal.Footer>
      </EruditModal>
    </View>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Onglet 4 — Profil
   ══════════════════════════════════════════════════════════════════════════ */

function ProfilScreen() {
  const { colors, spacing } = useTheme();
  const { user, logout } = useAuth();

  const planning = [
    { jour: 'Lundi', creneau: '8h-12h', lieu: 'Bureau rectorat' },
    { jour: 'Mardi', creneau: '9h-13h', lieu: 'Conseil facultaire' },
    { jour: 'Mercredi', creneau: '8h-12h', lieu: 'Permanence' },
    { jour: 'Jeudi', creneau: '14h-18h', lieu: 'Réunion pédagogique' },
    { jour: 'Vendredi', creneau: '8h-12h', lieu: 'Audience publique' },
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
            <EruditRow label="Poste" value="Administrateur Université" />
          </EruditCard.Body>
        </EruditCard>

        {/* Planning */}
        <EruditCard variant="default">
          <EruditCard.Header>
            <EruditCard.Title>Planning Hebdomadaire</EruditCard.Title>
          </EruditCard.Header>
          <EruditCard.Body>
            {planning.map((p, i) => (
              <View
                key={i}
                style={{
                  flexDirection: 'row', alignItems: 'center', gap: spacing.md,
                  paddingVertical: spacing.sm,
                  borderBottomWidth: i < planning.length - 1 ? 1 : 0,
                  borderBottomColor: colors.border,
                }}
              >
                <View style={{
                  width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary,
                }} />
                <EruditText style={{ flex: 1, fontSize: 13, color: colors.textPrimary }}>
                  {p.jour} — {p.creneau}
                </EruditText>
                <EruditText style={{ fontSize: 12, color: colors.textSecondary }}>{p.lieu}</EruditText>
              </View>
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

export default function UniversiteDashboard() {
  const { user } = useAuth();
  const tabColors = useEruditTabColors(ROLE);
  const tabBarStyle = useEruditTabBarStyle();

  return (
    <Tab.Navigator
      screenOptions={{
        ...eruditTabOptions({ role: ROLE, labels: {
          Apercu: 'Aperçu',
          Facultes: 'Facultés',
          Candidatures: 'Candidatures',
          Profil: 'Profil',
        }}),
        tabBarActiveTintColor: tabColors.activeTintColor,
        tabBarInactiveTintColor: tabColors.inactiveTintColor,
        tabBarStyle,
        headerShown: false,
        lazy: true,
      }}
    >
      <Tab.Screen name="Apercu" component={ApercuScreen} />
      <Tab.Screen name="Facultes" component={FacultesScreen} />
      <Tab.Screen name="Candidatures" component={CandidaturesScreen} />
      <Tab.Screen name="Profil" component={ProfilScreen} />
    </Tab.Navigator>
  );
}