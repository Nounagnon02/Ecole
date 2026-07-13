/**
 * ============================================================================
 * SurveillantDashboard — Érudit v4 (React Native)
 *
 * Refonte complète du dashboard Surveillant.
 * Zéro react-native-paper. 100% composants Érudit + useTheme().
 * Couleur de rôle : red (#BA4A4A)
 *
 * Tabs : Absences | Incidents | Sanctions | Profil
 * ============================================================================
 */

import React, { useState, useEffect, useCallback } from 'react';
import { View, ScrollView, RefreshControl, Alert } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { EruditText, EruditRow, EruditMenuItem } from '../components/EruditUtilities';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { useTheme, useRoleTheme } from '../theme';
import { eruditTabOptions, useEruditTabBarStyle, useEruditTabColors } from '../components/EruditTabs';
import EruditCard from '../components/EruditCard';
import EruditButton from '../components/EruditButton';
import EruditBadge from '../components/EruditBadge';
import EruditInput from '../components/EruditInput';
import EruditModal from '../components/EruditModal';
import EruditFAB from '../components/EruditFAB';
import EruditDashboardHeader from '../components/EruditDashboardHeader';
import EruditSkeleton from '../components/EruditSkeleton';
import EruditEmptyState from '../components/EruditEmptyState';

const Tab = createBottomTabNavigator();
const ROLE = 'surveillant';

/* ═══════════════════════════════════════════════════════════════════════════
   Onglet 1 — Absences
   ══════════════════════════════════════════════════════════════════════════ */

function AbsencesScreen() {
  const { colors, spacing } = useTheme();
  const [absences, setAbsences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAbsences = useCallback(async () => {
    try {
      const response = await api.get('/surveillant/absences');
      setAbsences(response.data || []);
    } catch (error) {
      console.error('Error fetching absences:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchAbsences(); }, [fetchAbsences]);
  const onRefresh = useCallback(() => { setRefreshing(true); fetchAbsences(); }, [fetchAbsences]);

  const marquerAbsence = async (eleveId) => {
    try {
      await api.post('/surveillant/absences', {
        eleve_id: eleveId,
        date: new Date().toISOString().split('T')[0],
        type: 'absence',
      });
      fetchAbsences();
      Alert.alert('Succès', 'Absence enregistrée');
    } catch (error) {
      Alert.alert('Erreur', 'Erreur lors de l\'enregistrement');
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.surface, padding: spacing.lg, gap: spacing.md }}>
        {[1, 2, 3].map(i => <EruditSkeleton key={i} variant="rect" width="100%" height={120} borderRadius={16} />)}
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
        {absences.length === 0 ? (
          <EruditEmptyState
            icon="📉"
            title="Aucune absence"
            description="Aucune absence enregistrée pour le moment."
            actionLabel="Marquer une absence"
            onAction={() => {}}
          />
        ) : (
          absences.map(absence => (
            <EruditCard key={absence.id} variant="default">
              <EruditCard.Header>
                <EruditCard.Title>{absence.eleve?.nom} {absence.eleve?.prenom}</EruditCard.Title>
                <EruditBadge
                  variant={absence.justifiee ? 'success' : 'danger'}
                  size="sm"
                  dot
                >
                  {absence.justifiee ? 'Justifiée' : 'Non justifiée'}
                </EruditBadge>
              </EruditCard.Header>
              <EruditCard.Body>
                <EruditRow label="Classe" value={absence.eleve?.classe?.nom || '—'} />
                <EruditRow
                  label="Date"
                  value={absence.date ? new Date(absence.date).toLocaleDateString('fr-FR') : '—'}
                />
                <EruditRow label="Type" value={absence.type || '—'} />
              </EruditCard.Body>
              <EruditCard.Footer>
                <EruditButton variant="outline" size="sm" onPress={() => {}}>Justifier</EruditButton>
              </EruditCard.Footer>
            </EruditCard>
          ))
        )}
      </ScrollView>
      <EruditFAB icon="📉" color="red" onPress={() => {}} />
    </View>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Onglet 2 — Incidents
   ══════════════════════════════════════════════════════════════════════════ */

function IncidentsScreen() {
  const { colors, spacing } = useTheme();
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchIncidents = useCallback(async () => {
    try {
      const response = await api.get('/surveillant/incidents');
      setIncidents(response.data || []);
    } catch (error) {
      console.error('Error fetching incidents:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchIncidents(); }, [fetchIncidents]);
  const onRefresh = useCallback(() => { setRefreshing(true); fetchIncidents(); }, [fetchIncidents]);

  const ajouterIncident = async () => {
    if (!description.trim()) return;
    setSaving(true);
    try {
      await api.post('/surveillant/incidents', {
        description,
        date: new Date().toISOString(),
        gravite: 'moyenne',
      });
      setModalVisible(false);
      setDescription('');
      fetchIncidents();
      Alert.alert('Succès', 'Incident enregistré');
    } catch (error) {
      Alert.alert('Erreur', 'Erreur lors de l\'enregistrement');
    } finally {
      setSaving(false);
    }
  };

  const graviteVariant = (g) =>
    g === 'faible' ? 'success' : g === 'moyenne' ? 'warning' : 'danger';

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
        {incidents.length === 0 ? (
          <EruditEmptyState
            icon="⚠️"
            title="Aucun incident"
            description="Tous les élèves sont sages aujourd'hui."
            actionLabel="Nouvel incident"
            onAction={() => setModalVisible(true)}
          />
        ) : (
          incidents.map(incident => (
            <EruditCard key={incident.id} variant="default">
              <EruditCard.Header>
                <EruditCard.Title>Incident #{incident.id}</EruditCard.Title>
                <EruditBadge variant={graviteVariant(incident.gravite)} size="sm" dot>
                  {incident.gravite || '—'}
                </EruditBadge>
              </EruditCard.Header>
              <EruditCard.Body>
                <EruditText style={{ fontSize: 13, color: colors.textSecondary, marginBottom: spacing.sm }}>
                  {incident.description || 'Aucune description'}
                </EruditText>
                <EruditRow
                  label="Date"
                  value={incident.date ? new Date(incident.date).toLocaleDateString('fr-FR') : '—'}
                />
                <EruditRow
                  label="Élèves impliqués"
                  value={incident.eleves?.map(e => e.nom).join(', ') || '—'}
                />
              </EruditCard.Body>
              <EruditCard.Footer>
                <EruditButton variant="outline" size="sm">Traiter</EruditButton>
              </EruditCard.Footer>
            </EruditCard>
          ))
        )}
      </ScrollView>

      <EruditFAB icon="⚠️" color="red" onPress={() => setModalVisible(true)} />

      {/* Modal nouvel incident */}
      <EruditModal visible={modalVisible} onDismiss={() => setModalVisible(false)}>
        <EruditModal.Header>
          <EruditModal.Title>Nouvel incident</EruditModal.Title>
        </EruditModal.Header>
        <EruditModal.Body>
          <EruditInput
            label="Description"
            value={description}
            onChangeText={setDescription}
            placeholder="Décrivez l'incident..."
            multiline
            numberOfLines={4}
          />
        </EruditModal.Body>
        <EruditModal.Footer>
          <EruditButton variant="ghost" onPress={() => setModalVisible(false)}>Annuler</EruditButton>
          <EruditButton variant="primary" onPress={ajouterIncident} loading={saving}>Enregistrer</EruditButton>
        </EruditModal.Footer>
      </EruditModal>
    </View>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Onglet 3 — Sanctions
   ══════════════════════════════════════════════════════════════════════════ */

function SanctionsScreen() {
  const { colors, spacing } = useTheme();
  const [sanctions, setSanctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchSanctions = useCallback(async () => {
    try {
      const response = await api.get('/surveillant/sanctions');
      setSanctions(response.data || []);
    } catch (error) {
      console.error('Error fetching sanctions:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchSanctions(); }, [fetchSanctions]);
  const onRefresh = useCallback(() => { setRefreshing(true); fetchSanctions(); }, [fetchSanctions]);

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
        {sanctions.length === 0 ? (
          <EruditEmptyState
            icon="⚖️"
            title="Aucune sanction"
            description="Aucune sanction en cours."
            actionLabel="Nouvelle sanction"
            onAction={() => {}}
          />
        ) : (
          sanctions.map(sanction => (
            <EruditCard key={sanction.id} variant="default">
              <EruditCard.Header>
                <EruditCard.Title>{sanction.eleve?.nom} {sanction.eleve?.prenom}</EruditCard.Title>
                <EruditBadge
                  variant={sanction.statut === 'active' ? 'danger' : 'success'}
                  size="sm"
                  dot
                >
                  {sanction.statut || 'Inconnue'}
                </EruditBadge>
              </EruditCard.Header>
              <EruditCard.Body>
                <EruditRow label="Classe" value={sanction.eleve?.classe?.nom || '—'} />
                <EruditRow label="Type" value={sanction.type_sanction || '—'} />
                <EruditRow label="Motif" value={sanction.motif || '—'} />
                <EruditRow
                  label="Date"
                  value={sanction.date ? new Date(sanction.date).toLocaleDateString('fr-FR') : '—'}
                />
                <EruditRow label="Durée" value={`${sanction.duree || 0} jours`} />
              </EruditCard.Body>
              <EruditCard.Footer>
                <EruditButton variant="outline" size="sm">Modifier</EruditButton>
                <EruditButton variant="primary" size="sm">Lever</EruditButton>
              </EruditCard.Footer>
            </EruditCard>
          ))
        )}
      </ScrollView>
      <EruditFAB icon="⚖️" color="red" onPress={() => {}} />
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
    { jour: 'Lundi', creneau: '8h-12h', lieu: 'Cour principale' },
    { jour: 'Mardi', creneau: '14h-18h', lieu: 'Bâtiment A' },
    { jour: 'Mercredi', creneau: '8h-12h', lieu: 'Cantine' },
    { jour: 'Jeudi', creneau: '14h-18h', lieu: 'Cour principale' },
    { jour: 'Vendredi', creneau: '8h-12h', lieu: 'Bâtiment B' },
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
            <EruditRow label="Poste" value="Surveillant" />
          </EruditCard.Body>
        </EruditCard>

        {/* Planning de surveillance */}
        <EruditCard variant="default">
          <EruditCard.Header>
            <EruditCard.Title>Planning de surveillance</EruditCard.Title>
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
                  width: 8, height: 8, borderRadius: 4, backgroundColor: colors.red,
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

export default function SurveillantDashboard() {
  const { user } = useAuth();
  const tabColors = useEruditTabColors(ROLE);
  const tabBarStyle = useEruditTabBarStyle();

  return (
    <Tab.Navigator
      screenOptions={{
        ...eruditTabOptions({ role: ROLE, labels: {
          Absences: 'Absences',
          Incidents: 'Incidents',
          Sanctions: 'Sanctions',
          Profil: 'Profil',
        }}),
        tabBarActiveTintColor: tabColors.activeTintColor,
        tabBarInactiveTintColor: tabColors.inactiveTintColor,
        tabBarStyle,
        headerShown: false,
        lazy: true,
      }}
    >
      <Tab.Screen name="Absences" component={AbsencesScreen} />
      <Tab.Screen name="Incidents" component={IncidentsScreen} />
      <Tab.Screen name="Sanctions" component={SanctionsScreen} />
      <Tab.Screen name="Profil" component={ProfilScreen} />
    </Tab.Navigator>
  );
}