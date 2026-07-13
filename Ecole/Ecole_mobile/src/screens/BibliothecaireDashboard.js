/**
 * ============================================================================
 * BibliothecaireDashboard — Érudit v4 (React Native)
 *
 * Refonte complète du dashboard Bibliothécaire.
 * Zéro react-native-paper. 100% composants Érudit + useTheme().
 * Couleur de rôle : olivine (#7A8A5A)
 *
 * Tabs : Catalogue | Emprunts | Réservations | Profil
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
const ROLE = 'bibliothecaire';

/* ═══════════════════════════════════════════════════════════════════════════
   Onglet 1 — Catalogue
   ══════════════════════════════════════════════════════════════════════════ */

function CatalogueScreen() {
  const { colors, spacing } = useTheme();
  const [livres, setLivres] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [titre, setTitre] = useState('');
  const [auteur, setAuteur] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchLivres = useCallback(async () => {
    try {
      const response = await api.get('/bibliothecaire/livres');
      setLivres(response.data || []);
    } catch (error) {
      console.error('Error fetching livres:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchLivres(); }, [fetchLivres]);
  const onRefresh = useCallback(() => { setRefreshing(true); fetchLivres(); }, [fetchLivres]);

  const filtered = livres.filter(l =>
    (l.titre || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (l.auteur || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const ajouterLivre = async () => {
    if (!titre.trim() || !auteur.trim()) return;
    setSaving(true);
    try {
      await api.post('/bibliothecaire/livres', {
        titre, auteur,
        isbn: Math.random().toString().substr(2, 13),
        disponible: true,
      });
      setModalVisible(false);
      setTitre('');
      setAuteur('');
      fetchLivres();
      Alert.alert('Succès', 'Livre ajouté au catalogue');
    } catch (error) {
      Alert.alert('Erreur', 'Erreur lors de l\'ajout du livre');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.surface, padding: spacing.lg, gap: spacing.md }}>
        <EruditSearchBar placeholder="Rechercher un livre..." value="" onChangeText={() => {}} />
        {[1, 2, 3].map(i => <EruditSkeleton key={i} variant="rect" width="100%" height={130} borderRadius={16} />)}
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <View style={{ padding: spacing.lg, paddingBottom: 0 }}>
        <EruditSearchBar
          placeholder="Rechercher un livre..."
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
            icon="📚"
            title="Aucun livre trouvé"
            description={searchQuery ? 'Essayez un autre titre ou auteur.' : 'Ajoutez votre premier livre au catalogue.'}
            actionLabel="Ajouter un livre"
            onAction={() => setModalVisible(true)}
          />
        ) : (
          filtered.map(livre => (
            <EruditCard key={livre.id} variant="default">
              <EruditCard.Header>
                <EruditCard.Title>{livre.titre}</EruditCard.Title>
                <EruditBadge
                  variant={livre.disponible ? 'success' : 'danger'}
                  size="sm"
                  dot
                >
                  {livre.disponible ? 'Disponible' : 'Emprunté'}
                </EruditBadge>
              </EruditCard.Header>
              <EruditCard.Body>
                <EruditRow label="Auteur" value={livre.auteur || '—'} />
                <EruditRow label="ISBN" value={livre.isbn || '—'} />
                <EruditRow label="Catégorie" value={livre.categorie || '—'} />
                <EruditRow label="Année" value={`${livre.annee_publication || '—'}`} />
                <EruditRow label="Exemplaires" value={`${livre.nombre_exemplaires || 0}`} />
              </EruditCard.Body>
              <EruditCard.Footer>
                <EruditButton variant="outline" size="sm">Modifier</EruditButton>
                <EruditButton variant="primary" size="sm">Emprunter</EruditButton>
              </EruditCard.Footer>
            </EruditCard>
          ))
        )}
      </ScrollView>

      <EruditFAB icon="📚" color="bibliothecaire" onPress={() => setModalVisible(true)} />

      <EruditModal visible={modalVisible} onDismiss={() => setModalVisible(false)}>
        <EruditModal.Header>
          <EruditModal.Title>Nouveau livre</EruditModal.Title>
        </EruditModal.Header>
        <EruditModal.Body>
          <EruditInput label="Titre" value={titre} onChangeText={setTitre} placeholder="Titre du livre" />
          <View style={{ height: spacing.md }} />
          <EruditInput label="Auteur" value={auteur} onChangeText={setAuteur} placeholder="Nom de l'auteur" />
        </EruditModal.Body>
        <EruditModal.Footer>
          <EruditButton variant="ghost" onPress={() => setModalVisible(false)}>Annuler</EruditButton>
          <EruditButton variant="primary" onPress={ajouterLivre} loading={saving}>Ajouter</EruditButton>
        </EruditModal.Footer>
      </EruditModal>
    </View>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Onglet 2 — Emprunts
   ══════════════════════════════════════════════════════════════════════════ */

function EmpruntsScreen() {
  const { colors, spacing } = useTheme();
  const [emprunts, setEmprunts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchEmprunts = useCallback(async () => {
    try {
      const response = await api.get('/bibliothecaire/emprunts');
      setEmprunts(response.data || []);
    } catch (error) {
      console.error('Error fetching emprunts:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchEmprunts(); }, [fetchEmprunts]);
  const onRefresh = useCallback(() => { setRefreshing(true); fetchEmprunts(); }, [fetchEmprunts]);

  const retournerLivre = async (empruntId) => {
    try {
      await api.put(`/bibliothecaire/emprunts/${empruntId}/retour`);
      fetchEmprunts();
      Alert.alert('Succès', 'Livre retourné');
    } catch (error) {
      Alert.alert('Erreur', 'Erreur lors du retour');
    }
  };

  const getEmpruntVariant = (emprunt) => {
    if (emprunt.date_retour_effective) return 'success';
    const estEnRetard = new Date(emprunt.date_retour_prevue) < new Date();
    return estEnRetard ? 'danger' : 'warning';
  };

  const getEmpruntLabel = (emprunt) => {
    if (emprunt.date_retour_effective)
      return `Retourné le ${new Date(emprunt.date_retour_effective).toLocaleDateString('fr-FR')}`;
    const estEnRetard = new Date(emprunt.date_retour_prevue) < new Date();
    return estEnRetard ? 'En retard' : 'En cours';
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
        {emprunts.length === 0 ? (
          <EruditEmptyState
            icon="📖"
            title="Aucun emprunt"
            description="La liste des emprunts est vide pour le moment."
          />
        ) : (
          emprunts.map(emprunt => (
            <EruditCard key={emprunt.id} variant="default">
              <EruditCard.Header>
                <EruditCard.Title>{emprunt.livre?.titre || 'Sans titre'}</EruditCard.Title>
                <EruditBadge variant={getEmpruntVariant(emprunt)} size="sm" dot>
                  {getEmpruntLabel(emprunt)}
                </EruditBadge>
              </EruditCard.Header>
              <EruditCard.Body>
                <EruditRow label="Emprunté par" value={`${emprunt.eleve?.nom || ''} ${emprunt.eleve?.prenom || ''}`} />
                <EruditRow label="Classe" value={emprunt.eleve?.classe?.nom || '—'} />
                <EruditRow
                  label="Date emprunt"
                  value={emprunt.date_emprunt ? new Date(emprunt.date_emprunt).toLocaleDateString('fr-FR') : '—'}
                />
                <EruditRow
                  label="Retour prévu"
                  value={emprunt.date_retour_prevue ? new Date(emprunt.date_retour_prevue).toLocaleDateString('fr-FR') : '—'}
                />
              </EruditCard.Body>
              {!emprunt.date_retour_effective ? (
                <EruditCard.Footer>
                  <EruditButton variant="outline" size="sm">Prolonger</EruditButton>
                  <EruditButton variant="primary" size="sm" onPress={() => retournerLivre(emprunt.id)}>
                    Retourner
                  </EruditButton>
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
   Onglet 3 — Réservations
   ══════════════════════════════════════════════════════════════════════════ */

function ReservationsScreen() {
  const { colors, spacing } = useTheme();
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchReservations = useCallback(async () => {
    try {
      const response = await api.get('/bibliothecaire/reservations');
      setReservations(response.data || []);
    } catch (error) {
      console.error('Error fetching reservations:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchReservations(); }, [fetchReservations]);
  const onRefresh = useCallback(() => { setRefreshing(true); fetchReservations(); }, [fetchReservations]);

  const confirmerReservation = async (reservationId) => {
    try {
      await api.put(`/bibliothecaire/reservations/${reservationId}/confirmer`);
      fetchReservations();
      Alert.alert('Succès', 'Réservation confirmée');
    } catch (error) {
      Alert.alert('Erreur', 'Erreur lors de la confirmation');
    }
  };

  const statutVariant = (s) =>
    s === 'confirmée' ? 'success' : s === 'expirée' ? 'danger' : 'warning';

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
        {reservations.length === 0 ? (
          <EruditEmptyState
            icon="🔖"
            title="Aucune réservation"
            description="Les réservations des élèves apparaîtront ici."
          />
        ) : (
          reservations.map(reservation => (
            <EruditCard key={reservation.id} variant="default">
              <EruditCard.Header>
                <EruditCard.Title>{reservation.livre?.titre || 'Sans titre'}</EruditCard.Title>
                <EruditBadge variant={statutVariant(reservation.statut)} size="sm" dot>
                  {reservation.statut || '—'}
                </EruditBadge>
              </EruditCard.Header>
              <EruditCard.Body>
                <EruditRow label="Réservé par" value={`${reservation.eleve?.nom || ''} ${reservation.eleve?.prenom || ''}`} />
                <EruditRow label="Classe" value={reservation.eleve?.classe?.nom || '—'} />
                <EruditRow
                  label="Date réservation"
                  value={reservation.date_reservation ? new Date(reservation.date_reservation).toLocaleDateString('fr-FR') : '—'}
                />
                <EruditRow
                  label="Date limite"
                  value={reservation.date_limite ? new Date(reservation.date_limite).toLocaleDateString('fr-FR') : '—'}
                />
              </EruditCard.Body>
              {reservation.statut === 'en_attente' ? (
                <EruditCard.Footer>
                  <EruditButton variant="outline" size="sm">Annuler</EruditButton>
                  <EruditButton variant="primary" size="sm" onPress={() => confirmerReservation(reservation.id)}>
                    Confirmer
                  </EruditButton>
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
   Onglet 4 — Profil
   ══════════════════════════════════════════════════════════════════════════ */

function ProfilScreen() {
  const { colors, spacing } = useTheme();
  const { user, logout } = useAuth();
  const [stats, setStats] = useState({});

  useEffect(() => {
    api.get('/bibliothecaire/statistiques')
      .then(res => setStats(res.data || {}))
      .catch(() => {});
  }, []);

  const statCards = [
    { title: 'Livres au catalogue', value: stats.total_livres ?? 0, color: 'bibliothecaire', icon: '📚' },
    { title: 'Emprunts actifs', value: stats.emprunts_actifs ?? 0, color: 'blue', icon: '📖' },
    { title: 'Réservations', value: stats.reservations_attente ?? 0, color: 'amber', icon: '🔖' },
    { title: 'Retards', value: stats.retards ?? 0, color: 'red', icon: '⏰' },
  ];

  const actions = [
    { icon: '📊', label: 'Rapport mensuel', onPress: () => {} },
    { icon: '📋', label: 'Inventaire', onPress: () => {} },
    { icon: '🔔', label: 'Relances retards', onPress: () => {} },
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
            <EruditRow label="Poste" value="Bibliothécaire" />
          </EruditCard.Body>
        </EruditCard>

        {/* Statistiques */}
        <EruditCard variant="default">
          <EruditCard.Header>
            <EruditCard.Title>Statistiques</EruditCard.Title>
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

        {/* Actions */}
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

export default function BibliothecaireDashboard() {
  const { user } = useAuth();
  const tabColors = useEruditTabColors(ROLE);
  const tabBarStyle = useEruditTabBarStyle();

  return (
    <Tab.Navigator
      screenOptions={{
        ...eruditTabOptions({ role: ROLE, labels: {
          Catalogue: 'Catalogue',
          Emprunts: 'Emprunts',
          Reservations: 'Réservations',
          Profil: 'Profil',
        }}),
        tabBarActiveTintColor: tabColors.activeTintColor,
        tabBarInactiveTintColor: tabColors.inactiveTintColor,
        tabBarStyle,
        headerShown: false,
        lazy: true,
      }}
    >
      <Tab.Screen name="Catalogue" component={CatalogueScreen} />
      <Tab.Screen name="Emprunts" component={EmpruntsScreen} />
      <Tab.Screen name="Reservations" component={ReservationsScreen} />
      <Tab.Screen name="Profil" component={ProfilScreen} />
    </Tab.Navigator>
  );
}