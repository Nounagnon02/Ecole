/**
 * ============================================================================
 * SecretaireDashboard — Érudit v4 (React Native)
 *
 * Refonte complète du dashboard Secrétaire.
 * Zéro react-native-paper. 100% composants Érudit + useTheme().
 * Couleur de rôle : bronze (#8A7A5A)
 *
 * Tabs : Dossiers | RDV | Certificats | Profil
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
const ROLE = 'secretaire';

/* ═══════════════════════════════════════════════════════════════════════════
   Onglet 1 — Dossiers élèves
   ══════════════════════════════════════════════════════════════════════════ */

function DossiersScreen() {
  const { colors, spacing } = useTheme();
  const [dossiers, setDossiers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDossiers = useCallback(async () => {
    try {
      const response = await api.get('/secretaire/dossiers-eleves');
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

  const filtered = dossiers.filter(d =>
    (d.eleve?.nom || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (d.eleve?.prenom || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.surface, padding: spacing.lg, gap: spacing.md }}>
        <EruditSearchBar placeholder="Rechercher un dossier..." value="" onChangeText={() => {}} />
        {[1, 2, 3].map(i => <EruditSkeleton key={i} variant="rect" width="100%" height={160} borderRadius={16} />)}
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <View style={{ padding: spacing.lg, paddingBottom: 0 }}>
        <EruditSearchBar
          placeholder="Rechercher un dossier..."
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
            icon="📁"
            title="Aucun dossier trouvé"
            description={searchQuery ? 'Essayez un autre nom.' : 'Aucun dossier élève disponible.'}
            actionLabel="Créer un dossier"
            onAction={() => {}}
          />
        ) : (
          filtered.map(dossier => (
            <EruditCard key={dossier.id} variant="default">
              <EruditCard.Header>
                <EruditCard.Title>{dossier.eleve?.nom} {dossier.eleve?.prenom}</EruditCard.Title>
                <EruditBadge
                  variant={dossier.dossier_complet ? 'success' : 'warning'}
                  size="sm"
                  dot
                >
                  {dossier.dossier_complet ? 'Complet' : 'Incomplet'}
                </EruditBadge>
              </EruditCard.Header>
              <EruditCard.Body>
                <EruditRow label="Matricule" value={dossier.eleve?.matricule || '—'} />
                <EruditRow label="Classe" value={dossier.eleve?.classe?.nom || '—'} />
                <EruditRow
                  label="Date naissance"
                  value={dossier.eleve?.date_naissance ? new Date(dossier.eleve.date_naissance).toLocaleDateString('fr-FR') : '—'}
                />
                <EruditRow label="Père" value={dossier.nom_pere || '—'} />
                <EruditRow label="Mère" value={dossier.nom_mere || '—'} />
                <EruditRow label="Téléphone" value={dossier.telephone_parent || '—'} />
              </EruditCard.Body>
              <EruditCard.Footer>
                <EruditButton variant="outline" size="sm">Modifier</EruditButton>
                <EruditButton variant="primary" size="sm">Documents</EruditButton>
              </EruditCard.Footer>
            </EruditCard>
          ))
        )}
      </ScrollView>
      <EruditFAB icon="📁" color="secretaire" onPress={() => {}} />
    </View>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Onglet 2 — Rendez-vous
   ══════════════════════════════════════════════════════════════════════════ */

function RendezVousScreen() {
  const { colors, spacing } = useTheme();
  const [rdvs, setRdvs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [motif, setMotif] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchRdvs = useCallback(async () => {
    try {
      const response = await api.get('/secretaire/rendez-vous');
      setRdvs(response.data || []);
    } catch (error) {
      console.error('Error fetching rdvs:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchRdvs(); }, [fetchRdvs]);
  const onRefresh = useCallback(() => { setRefreshing(true); fetchRdvs(); }, [fetchRdvs]);

  const programmerRdv = async () => {
    if (!motif.trim()) return;
    setSaving(true);
    try {
      await api.post('/secretaire/rendez-vous', {
        motif,
        date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        statut: 'programmé',
      });
      setModalVisible(false);
      setMotif('');
      fetchRdvs();
      Alert.alert('Succès', 'Rendez-vous programmé');
    } catch (error) {
      Alert.alert('Erreur', 'Erreur lors de la programmation');
    } finally {
      setSaving(false);
    }
  };

  const statutVariant = (s) =>
    s === 'confirmé' ? 'success' : s === 'annulé' ? 'danger' : 'warning';

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
        {rdvs.length === 0 ? (
          <EruditEmptyState
            icon="📆"
            title="Aucun rendez-vous"
            description="Programmez le premier rendez-vous."
            actionLabel="Programmer un RDV"
            onAction={() => setModalVisible(true)}
          />
        ) : (
          rdvs.map(rdv => (
            <EruditCard key={rdv.id} variant="default">
              <EruditCard.Header>
                <EruditCard.Title>{rdv.motif || 'Sans motif'}</EruditCard.Title>
                <EruditBadge variant={statutVariant(rdv.statut)} size="sm" dot>
                  {rdv.statut || '—'}
                </EruditBadge>
              </EruditCard.Header>
              <EruditCard.Body>
                <EruditRow label="Demandeur" value={`${rdv.parent?.nom || ''} ${rdv.parent?.prenom || ''}`} />
                <EruditRow label="Concernant" value={`${rdv.eleve?.nom || ''} ${rdv.eleve?.prenom || ''}`} />
                <EruditRow
                  label="Date"
                  value={rdv.date ? new Date(rdv.date).toLocaleDateString('fr-FR') : '—'}
                />
                <EruditRow label="Heure" value={rdv.heure || '—'} />
                <EruditRow label="Avec" value={rdv.enseignant?.nom || 'Direction'} />
              </EruditCard.Body>
              <EruditCard.Footer>
                <EruditButton variant="outline" size="sm">Modifier</EruditButton>
                <EruditButton variant="primary" size="sm">Confirmer</EruditButton>
              </EruditCard.Footer>
            </EruditCard>
          ))
        )}
      </ScrollView>

      <EruditFAB icon="📆" color="secretaire" onPress={() => setModalVisible(true)} />

      <EruditModal visible={modalVisible} onDismiss={() => setModalVisible(false)}>
        <EruditModal.Header>
          <EruditModal.Title>Nouveau rendez-vous</EruditModal.Title>
        </EruditModal.Header>
        <EruditModal.Body>
          <EruditInput
            label="Motif"
            value={motif}
            onChangeText={setMotif}
            placeholder="Raison du rendez-vous"
          />
        </EruditModal.Body>
        <EruditModal.Footer>
          <EruditButton variant="ghost" onPress={() => setModalVisible(false)}>Annuler</EruditButton>
          <EruditButton variant="primary" onPress={programmerRdv} loading={saving}>Programmer</EruditButton>
        </EruditModal.Footer>
      </EruditModal>
    </View>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Onglet 3 — Certificats
   ══════════════════════════════════════════════════════════════════════════ */

function CertificatsScreen() {
  const { colors, spacing } = useTheme();
  const [certificats, setCertificats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchCertificats = useCallback(async () => {
    try {
      const response = await api.get('/secretaire/certificats');
      setCertificats(response.data || []);
    } catch (error) {
      console.error('Error fetching certificats:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchCertificats(); }, [fetchCertificats]);
  const onRefresh = useCallback(() => { setRefreshing(true); fetchCertificats(); }, [fetchCertificats]);

  const genererCertificat = async (type, eleveId) => {
    try {
      await api.post('/secretaire/certificats', {
        type_certificat: type,
        eleve_id: eleveId,
        date_emission: new Date().toISOString(),
      });
      fetchCertificats();
      Alert.alert('Succès', 'Certificat généré');
    } catch (error) {
      Alert.alert('Erreur', 'Erreur lors de la génération');
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
        {certificats.length === 0 ? (
          <EruditEmptyState
            icon="📜"
            title="Aucun certificat"
            description="Générez le premier certificat scolaire."
            actionLabel="Générer un certificat"
            onAction={() => {}}
          />
        ) : (
          certificats.map(certificat => (
            <EruditCard key={certificat.id} variant="default">
              <EruditCard.Header>
                <EruditCard.Title>{certificat.type_certificat || 'Certificat'}</EruditCard.Title>
                <EruditBadge
                  variant={certificat.delivre ? 'success' : 'warning'}
                  size="sm"
                  dot
                >
                  {certificat.delivre ? 'Délivré' : 'En attente'}
                </EruditBadge>
              </EruditCard.Header>
              <EruditCard.Body>
                <EruditRow label="Élève" value={`${certificat.eleve?.nom || ''} ${certificat.eleve?.prenom || ''}`} />
                <EruditRow label="Classe" value={certificat.eleve?.classe?.nom || '—'} />
                <EruditRow
                  label="Date émission"
                  value={certificat.date_emission ? new Date(certificat.date_emission).toLocaleDateString('fr-FR') : '—'}
                />
                <EruditRow label="Numéro" value={certificat.numero_certificat || '—'} />
              </EruditCard.Body>
              <EruditCard.Footer>
                <EruditButton variant="outline" size="sm">Imprimer</EruditButton>
                <EruditButton variant="primary" size="sm">Délivrer</EruditButton>
              </EruditCard.Footer>
            </EruditCard>
          ))
        )}
      </ScrollView>
      <EruditFAB icon="📜" color="secretaire" onPress={() => {}} />
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
    api.get('/secretaire/statistiques')
      .then(res => setStats(res.data || {}))
      .catch(() => {});
  }, []);

  const statCards = [
    { title: 'RDV aujourd\'hui', value: stats.rdv_jour ?? 0, color: 'secretaire', icon: '📆' },
    { title: 'Certificats en att.', value: stats.certificats_attente ?? 0, color: 'amber', icon: '📜' },
    { title: 'Dossiers incomplets', value: stats.dossiers_incomplets ?? 0, color: 'red', icon: '📁' },
    { title: 'Visiteurs', value: stats.visiteurs_jour ?? 0, color: 'blue', icon: '👥' },
  ];

  const actions = [
    { icon: '📨', label: 'Courrier du jour', onPress: () => {} },
    { icon: '👥', label: 'Registre des visiteurs', onPress: () => {} },
    { icon: '📞', label: 'Appels téléphoniques', onPress: () => {} },
    { icon: '📦', label: 'Archivage', onPress: () => {} },
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
            <EruditRow label="Poste" value="Secrétaire" />
          </EruditCard.Body>
        </EruditCard>

        {/* Activités du jour */}
        <EruditCard variant="default">
          <EruditCard.Header>
            <EruditCard.Title>Activités du jour</EruditCard.Title>
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

export default function SecretaireDashboard() {
  const { user } = useAuth();
  const tabColors = useEruditTabColors(ROLE);
  const tabBarStyle = useEruditTabBarStyle();

  return (
    <Tab.Navigator
      screenOptions={{
        ...eruditTabOptions({ role: ROLE, labels: {
          Dossiers: 'Dossiers',
          RendezVous: 'RDV',
          Certificats: 'Certificats',
          Profil: 'Profil',
        }}),
        tabBarActiveTintColor: tabColors.activeTintColor,
        tabBarInactiveTintColor: tabColors.inactiveTintColor,
        tabBarStyle,
        headerShown: false,
        lazy: true,
      }}
    >
      <Tab.Screen name="Dossiers" component={DossiersScreen} />
      <Tab.Screen name="RendezVous" component={RendezVousScreen} />
      <Tab.Screen name="Certificats" component={CertificatsScreen} />
      <Tab.Screen name="Profil" component={ProfilScreen} />
    </Tab.Navigator>
  );
}