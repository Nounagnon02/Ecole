/**
 * ============================================================================
 * InfirmierDashboard — Érudit v4 (React Native)
 *
 * Refonte complète du dashboard Infirmier.
 * Zéro react-native-paper. 100% composants Érudit + useTheme().
 * Couleur de rôle : teal (#5A8A8A)
 *
 * Tabs : Consultations | Dossiers | Vaccins | Profil
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
import EruditInput from '../components/EruditInput';
import EruditModal from '../components/EruditModal';
import EruditFAB from '../components/EruditFAB';
import EruditDashboardHeader from '../components/EruditDashboardHeader';
import EruditSkeleton from '../components/EruditSkeleton';
import EruditEmptyState from '../components/EruditEmptyState';

const Tab = createBottomTabNavigator();
const ROLE = 'infirmier';

/* ═══════════════════════════════════════════════════════════════════════════
   Onglet 1 — Consultations
   ══════════════════════════════════════════════════════════════════════════ */

function ConsultationsScreen() {
  const { colors, spacing } = useTheme();
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [motif, setMotif] = useState('');
  const [diagnostic, setDiagnostic] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchConsultations = useCallback(async () => {
    try {
      const response = await api.get('/infirmier/consultations');
      setConsultations(response.data || []);
    } catch (error) {
      console.error('Error fetching consultations:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchConsultations(); }, [fetchConsultations]);
  const onRefresh = useCallback(() => { setRefreshing(true); fetchConsultations(); }, [fetchConsultations]);

  const ajouterConsultation = async () => {
    if (!motif.trim()) return;
    setSaving(true);
    try {
      await api.post('/infirmier/consultations', {
        motif,
        diagnostic,
        date: new Date().toISOString(),
      });
      setModalVisible(false);
      setMotif('');
      setDiagnostic('');
      fetchConsultations();
      Alert.alert('Succès', 'Consultation enregistrée');
    } catch (error) {
      Alert.alert('Erreur', 'Erreur lors de l\'enregistrement');
    } finally {
      setSaving(false);
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
        {consultations.length === 0 ? (
          <EruditEmptyState
            icon="🏥"
            title="Aucune consultation"
            description="Enregistrez la première consultation de la journée."
            actionLabel="Nouvelle consultation"
            onAction={() => setModalVisible(true)}
          />
        ) : (
          consultations.map(consultation => (
            <EruditCard key={consultation.id} variant="default">
              <EruditCard.Header>
                <EruditCard.Title>{consultation.eleve?.nom} {consultation.eleve?.prenom}</EruditCard.Title>
                <EruditBadge
                  variant={consultation.urgence ? 'danger' : 'success'}
                  size="sm"
                  dot
                >
                  {consultation.urgence ? 'Urgent' : 'Normal'}
                </EruditBadge>
              </EruditCard.Header>
              <EruditCard.Body>
                <EruditRow label="Classe" value={consultation.eleve?.classe?.nom || '—'} />
                <EruditRow label="Motif" value={consultation.motif || '—'} />
                <EruditRow label="Diagnostic" value={consultation.diagnostic || '—'} />
                <EruditRow label="Traitement" value={consultation.traitement || 'Aucun'} />
                <EruditRow
                  label="Date"
                  value={consultation.date ? new Date(consultation.date).toLocaleDateString('fr-FR') : '—'}
                />
              </EruditCard.Body>
              <EruditCard.Footer>
                <EruditButton variant="outline" size="sm">Modifier</EruditButton>
                <EruditButton variant="primary" size="sm">Traitement</EruditButton>
              </EruditCard.Footer>
            </EruditCard>
          ))
        )}
      </ScrollView>

      <EruditFAB icon="🏥" color="teal" onPress={() => setModalVisible(true)} />

      {/* Modal nouvelle consultation */}
      <EruditModal visible={modalVisible} onDismiss={() => setModalVisible(false)}>
        <EruditModal.Header>
          <EruditModal.Title>Nouvelle consultation</EruditModal.Title>
        </EruditModal.Header>
        <EruditModal.Body>
          <EruditInput
            label="Motif"
            value={motif}
            onChangeText={setMotif}
            placeholder="Ex: Maux de tête"
          />
          <View style={{ height: spacing.md }} />
          <EruditInput
            label="Diagnostic"
            value={diagnostic}
            onChangeText={setDiagnostic}
            placeholder="Observations…"
            multiline
            numberOfLines={3}
          />
        </EruditModal.Body>
        <EruditModal.Footer>
          <EruditButton variant="ghost" onPress={() => setModalVisible(false)}>Annuler</EruditButton>
          <EruditButton variant="primary" onPress={ajouterConsultation} loading={saving}>Enregistrer</EruditButton>
        </EruditModal.Footer>
      </EruditModal>
    </View>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Onglet 2 — Dossiers médicaux
   ══════════════════════════════════════════════════════════════════════════ */

function DossiersScreen() {
  const { colors, spacing } = useTheme();
  const [dossiers, setDossiers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDossiers = useCallback(async () => {
    try {
      const response = await api.get('/infirmier/dossiers-medicaux');
      setDossiers(response.data || []);
    } catch (error) {
      console.error('Error fetching dossiers:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchDossiers(); }, [fetchDossiers]);
  const onRefresh = useCallback(() => { setRefreshing(true); fetchDossiers(); }, [fetchDossiers]);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.surface, padding: spacing.lg, gap: spacing.md }}>
        {[1, 2, 3].map(i => <EruditSkeleton key={i} variant="rect" width="100%" height={160} borderRadius={16} />)}
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
        {dossiers.length === 0 ? (
          <EruditEmptyState
            icon="📁"
            title="Aucun dossier médical"
            description="Les dossiers médicaux des élèves apparaîtront ici."
          />
        ) : (
          dossiers.map(dossier => (
            <EruditCard key={dossier.id} variant="default">
              <EruditCard.Header>
                <EruditCard.Title>{dossier.eleve?.nom} {dossier.eleve?.prenom}</EruditCard.Title>
                <EruditBadge
                  variant={dossier.vaccins_a_jour ? 'success' : 'danger'}
                  size="sm"
                  dot
                >
                  Vaccins: {dossier.vaccins_a_jour ? 'À jour' : 'En retard'}
                </EruditBadge>
              </EruditCard.Header>
              <EruditCard.Body>
                <EruditRow label="Classe" value={dossier.eleve?.classe?.nom || '—'} />
                <EruditRow label="Groupe sanguin" value={dossier.groupe_sanguin || 'Non renseigné'} />
                <EruditRow label="Allergies" value={dossier.allergies || 'Aucune'} />
                <EruditRow label="Maladies chroniques" value={dossier.maladies_chroniques || 'Aucune'} />
                <EruditRow label="Contact urgence" value={dossier.contact_urgence || '—'} />
                <EruditRow
                  label="Dernière visite"
                  value={dossier.derniere_visite ? new Date(dossier.derniere_visite).toLocaleDateString('fr-FR') : 'Jamais'}
                />
                <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm }}>
                  <EruditBadge
                    variant={dossier.aptitude_sport ? 'success' : 'warning'}
                    size="sm"
                    dot
                  >
                    Sport: {dossier.aptitude_sport ? 'Apte' : 'Restriction'}
                  </EruditBadge>
                </View>
              </EruditCard.Body>
              <EruditCard.Footer>
                <EruditButton variant="outline" size="sm">Modifier</EruditButton>
                <EruditButton variant="primary" size="sm">Historique</EruditButton>
              </EruditCard.Footer>
            </EruditCard>
          ))
        )}
      </ScrollView>
    </View>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Onglet 3 — Vaccins
   ══════════════════════════════════════════════════════════════════════════ */

function VaccinsScreen() {
  const { colors, spacing } = useTheme();
  const [vaccinations, setVaccinations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchVaccinations = useCallback(async () => {
    try {
      const response = await api.get('/infirmier/vaccinations');
      setVaccinations(response.data || []);
    } catch (error) {
      console.error('Error fetching vaccinations:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchVaccinations(); }, [fetchVaccinations]);
  const onRefresh = useCallback(() => { setRefreshing(true); fetchVaccinations(); }, [fetchVaccinations]);

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
        {vaccinations.length === 0 ? (
          <EruditEmptyState
            icon="💉"
            title="Aucune vaccination"
            description="Aucune vaccination enregistrée pour le moment."
            actionLabel="Enregistrer une vaccination"
            onAction={() => {}}
          />
        ) : (
          vaccinations.map(vaccination => (
            <EruditCard key={vaccination.id} variant="default">
              <EruditCard.Header>
                <EruditCard.Title>{vaccination.eleve?.nom} {vaccination.eleve?.prenom}</EruditCard.Title>
                <EruditBadge
                  variant={vaccination.effets_secondaires ? 'warning' : 'success'}
                  size="sm"
                  dot
                >
                  {vaccination.effets_secondaires ? 'Effets signalés' : 'Aucun effet'}
                </EruditBadge>
              </EruditCard.Header>
              <EruditCard.Body>
                <EruditRow label="Classe" value={vaccination.eleve?.classe?.nom || '—'} />
                <EruditRow label="Vaccin" value={vaccination.nom_vaccin || '—'} />
                <EruditRow
                  label="Date"
                  value={vaccination.date_vaccination ? new Date(vaccination.date_vaccination).toLocaleDateString('fr-FR') : '—'}
                />
                <EruditRow label="Lot" value={vaccination.numero_lot || '—'} />
                <EruditRow
                  label="Rappel"
                  value={vaccination.date_rappel ? new Date(vaccination.date_rappel).toLocaleDateString('fr-FR') : 'Aucun'}
                />
              </EruditCard.Body>
            </EruditCard>
          ))
        )}
      </ScrollView>
      <EruditFAB icon="💉" color="teal" onPress={() => {}} />
    </View>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Onglet 4 — Profil
   ══════════════════════════════════════════════════════════════════════════ */

function ProfilScreen() {
  const { colors, spacing } = useTheme();
  const { user, logout } = useAuth();
  const [stats, setStats] = useState({});

  useEffect(() => {
    api.get('/infirmier/statistiques')
      .then(res => setStats(res.data || {}))
      .catch(() => {});
  }, []);

  const statCards = [
    { title: 'Consultations / mois', value: stats.consultations_mois ?? 0, color: 'primary', icon: '🏥' },
    { title: 'Urgences', value: stats.urgences_mois ?? 0, color: 'red', icon: '🚑' },
    { title: 'Vaccinations', value: stats.vaccinations_mois ?? 0, color: 'teal', icon: '💉' },
    { title: 'Élèves suivis', value: stats.eleves_suivis ?? 0, color: 'blue', icon: '👥' },
  ];

  const actions = [
    { icon: '📊', label: 'Rapport mensuel', onPress: () => {} },
    { icon: '💉', label: 'Campagne vaccination', onPress: () => {} },
    { icon: '🔔', label: 'Alertes médicales', onPress: () => {} },
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
            <EruditRow label="Poste" value="Infirmier(ère)" />
          </EruditCard.Body>
        </EruditCard>

        {/* Statistiques */}
        <EruditCard variant="default">
          <EruditCard.Header>
            <EruditCard.Title>Statistiques de Santé</EruditCard.Title>
          </EruditCard.Header>
          <EruditCard.Body>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md }}>
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
          </EruditCard.Body>
        </EruditCard>

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

export default function InfirmierDashboard() {
  const { user } = useAuth();
  const tabColors = useEruditTabColors(ROLE);
  const tabBarStyle = useEruditTabBarStyle();

  return (
    <Tab.Navigator
      screenOptions={{
        ...eruditTabOptions({ role: ROLE, labels: {
          Consultations: 'Consultations',
          Dossiers: 'Dossiers',
          Vaccins: 'Vaccins',
          Profil: 'Profil',
        }}),
        tabBarActiveTintColor: tabColors.activeTintColor,
        tabBarInactiveTintColor: tabColors.inactiveTintColor,
        tabBarStyle,
        headerShown: false,
        lazy: true,
      }}
    >
      <Tab.Screen name="Consultations" component={ConsultationsScreen} />
      <Tab.Screen name="Dossiers" component={DossiersScreen} />
      <Tab.Screen name="Vaccins" component={VaccinsScreen} />
      <Tab.Screen name="Profil" component={ProfilScreen} />
    </Tab.Navigator>
  );
}