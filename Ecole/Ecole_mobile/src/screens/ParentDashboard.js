/**
 * ============================================================================
 * ParentDashboard — Érudit v4 (React Native)
 *
 * Refonte complète du dashboard Parent.
 * Zéro react-native-paper. 100% composants Érudit + useTheme().
 * Couleur de rôle : accent/cinabre (#B8562E)
 *
 * Tabs : Enfants | Bulletins | Communication | Profil
 * ============================================================================
 */

import { EruditText, EruditRow, EruditMenuItem } from '../components/EruditUtilities';
import React, { useState, useEffect, useCallback } from 'react';
import { View, ScrollView, RefreshControl, Alert } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
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
const ROLE = 'parent';

/* ─── Générateur HTML Bulletin (conservé de l'original) ──────────────────── */

function generateBulletinHTML(bulletin) {
  return `
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Georgia, serif; margin: 40px; color: #1F1C19; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #B8562E; padding-bottom: 20px; }
          .header h1 { font-size: 22px; color: #1A3A3C; }
          .student-info { margin-bottom: 24px; background: #F6F3EE; padding: 16px; border-radius: 8px; }
          .grades-table { width: 100%; border-collapse: collapse; }
          .grades-table th, .grades-table td { border: 1px solid #E5DFD4; padding: 10px 12px; text-align: left; }
          .grades-table th { background-color: #F6F3EE; font-weight: 600; color: #1A3A3C; }
          .summary { margin-top: 24px; text-align: center; background: #F6F3EE; padding: 16px; border-radius: 8px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>BULLETIN SCOLAIRE</h1>
          <h2>${bulletin.periode}</h2>
        </div>
        <div class="student-info">
          <p><strong>Nom:</strong> ${bulletin.eleve.nom} ${bulletin.eleve.prenom}</p>
          <p><strong>Classe:</strong> ${bulletin.eleve.classe.nom}</p>
          <p><strong>Matricule:</strong> ${bulletin.eleve.matricule}</p>
        </div>
        <table class="grades-table">
          <thead>
            <tr>
              <th>Matière</th>
              <th>Moyenne</th>
              <th>Coefficient</th>
              <th>Rang</th>
            </tr>
          </thead>
          <tbody>
            ${bulletin.moyennes_par_matiere?.map(matiere => `
              <tr>
                <td>${matiere.matiere}</td>
                <td>${matiere.moyenne}/20</td>
                <td>${matiere.coefficient}</td>
                <td>${matiere.rang?.position}/${matiere.rang?.total_eleves}</td>
              </tr>
            `).join('') || ''}
          </tbody>
        </table>
        <div class="summary">
          <h3>Moyenne Générale: ${bulletin.moyenne_generale}/20</h3>
          <h3>Rang: ${bulletin.rang?.position}/${bulletin.rang?.total_eleves}</h3>
        </div>
      </body>
    </html>
  `;
}

/* ═══════════════════════════════════════════════════════════════════════════
   Onglet 1 — Mes Enfants
   ══════════════════════════════════════════════════════════════════════════ */

function EnfantsScreen() {
  const { colors, spacing } = useTheme();
  const roleTheme = useRoleTheme(ROLE);
  const [enfants, setEnfants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchEnfants = useCallback(async () => {
    try {
      const response = await api.get('/parent/enfants');
      setEnfants(response.data?.data || []);
    } catch (error) {
      console.error('Error fetching enfants:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchEnfants(); }, [fetchEnfants]);
  const onRefresh = useCallback(() => { setRefreshing(true); fetchEnfants(); }, [fetchEnfants]);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.surface, padding: spacing.lg, gap: spacing.md }}>
        {[1, 2].map(i => <EruditSkeleton key={i} variant="rect" width="100%" height={150} borderRadius={16} />)}
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
        {enfants.length === 0 ? (
          <EruditEmptyState
            icon="👨‍👩‍👧‍👦"
            title="Aucun enfant inscrit"
            description="Vos enfants apparaîtront ici une fois inscrits dans l'établissement."
          />
        ) : (
          enfants.map(enfant => (
            <EruditCard key={enfant.id} variant="default">
              <EruditCard.Header>
                <EruditCard.Title>{enfant.nom} {enfant.prenom}</EruditCard.Title>
              </EruditCard.Header>
              <EruditCard.Body>
                <EruditRow label="Classe" value={enfant.classe?.nom || '—'} />
                <EruditRow label="Matricule" value={enfant.matricule || '—'} />

                {/* Badges indicateurs */}
                <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm }}>
                  <EruditBadge
                    variant={enfant.moyenne_generale >= 10 ? 'success' : 'danger'}
                    size="sm"
                    dot
                  >
                    Moy: {enfant.moyenne_generale || 'N/A'}/20
                  </EruditBadge>
                  <EruditBadge
                    variant={enfant.absences_count > 3 ? 'danger' : 'primary'}
                    size="sm"
                    dot
                  >
                    Abs: {enfant.absences_count || 0}
                  </EruditBadge>
                </View>
              </EruditCard.Body>
              <EruditCard.Footer>
                <EruditButton variant="outline" size="sm">Voir détails</EruditButton>
              </EruditCard.Footer>
            </EruditCard>
          ))
        )}
      </ScrollView>
    </View>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Onglet 2 — Bulletins
   ══════════════════════════════════════════════════════════════════════════ */

function BulletinsScreen() {
  const { colors, spacing } = useTheme();
  const roleTheme = useRoleTheme(ROLE);
  const [bulletins, setBulletins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchBulletins = useCallback(async () => {
    try {
      const response = await api.get('/parent/bulletins');
      setBulletins(response.data?.data || []);
    } catch (error) {
      console.error('Error fetching bulletins:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchBulletins(); }, [fetchBulletins]);
  const onRefresh = useCallback(() => { setRefreshing(true); fetchBulletins(); }, [fetchBulletins]);

  const telechargerBulletin = async (enfantId, periode) => {
    try {
      const response = await api.get(`/parent/bulletin/${enfantId}/${periode}`);
      const bulletin = response.data?.data || response.data;
      const htmlContent = generateBulletinHTML(bulletin);
      const { uri } = await Print.printToFileAsync({ html: htmlContent });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri);
      } else {
        Alert.alert('Succès', 'Bulletin généré avec succès');
      }
    } catch (error) {
      Alert.alert('Erreur', 'Erreur lors du téléchargement du bulletin');
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
        {bulletins.length === 0 ? (
          <EruditEmptyState
            icon="📄"
            title="Aucun bulletin disponible"
            description="Les bulletins de vos enfants apparaîtront ici dès qu'ils seront publiés."
          />
        ) : (
          bulletins.map((bulletin, i) => (
            <EruditCard key={`${bulletin.enfant_id}-${bulletin.periode}-${i}`} variant="default">
              <EruditCard.Header>
                <EruditCard.Title>{bulletin.enfant_nom}</EruditCard.Title>
                <EruditBadge variant="accent" size="sm">{bulletin.periode}</EruditBadge>
              </EruditCard.Header>
              <EruditCard.Body>
                <View style={{ flexDirection: 'row', gap: spacing.lg }}>
                  <View style={{ flex: 1 }}>
                    <EruditText style={{ fontSize: 11, color: colors.textTertiary }}>Moyenne générale</EruditText>
                    <EruditText style={{
                      fontFamily: 'Georgia', fontSize: 20, fontWeight: '600',
                      color: roleTheme.main,
                    }}>
                      {bulletin.moyenne_generale}/20
                    </EruditText>
                  </View>
                  <View style={{ flex: 1 }}>
                    <EruditText style={{ fontSize: 11, color: colors.textTertiary }}>Rang</EruditText>
                    <EruditText style={{
                      fontFamily: 'Georgia', fontSize: 20, fontWeight: '600',
                      color: colors.textPrimary,
                    }}>
                      {bulletin.rang?.position || '—'}/{bulletin.rang?.total_eleves || '—'}
                    </EruditText>
                  </View>
                </View>
              </EruditCard.Body>
              <EruditCard.Footer>
                <EruditButton
                  variant="primary"
                  size="sm"
                  icon="📥"
                  onPress={() => telechargerBulletin(bulletin.enfant_id, bulletin.periode)}
                >
                  Télécharger
                </EruditButton>
              </EruditCard.Footer>
            </EruditCard>
          ))
        )}
      </ScrollView>
    </View>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Onglet 3 — Communication
   ══════════════════════════════════════════════════════════════════════════ */

function CommunicationScreen() {
  const { colors, spacing } = useTheme();
  const [messages, setMessages] = useState([]);
  const [rdvs, setRdvs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAll = useCallback(async () => {
    try {
      const [msgRes, rdvRes] = await Promise.all([
        api.get('/parent/messages').catch(() => ({ data: [] })),
        api.get('/parent/rendez-vous').catch(() => ({ data: [] })),
      ]);
      setMessages(msgRes.data || []);
      setRdvs(rdvRes.data || []);
    } catch (error) {
      console.error('Error fetching communication:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);
  const onRefresh = useCallback(() => { setRefreshing(true); fetchAll(); }, [fetchAll]);

  if (loading) {
    return (
      <ScrollView style={{ flex: 1, backgroundColor: colors.surface }}>
        <View style={{ padding: spacing.lg, gap: spacing.md }}>
          <EruditSkeleton variant="text" width="35%" height={17} />
          {[1, 2].map(i => <EruditSkeleton key={i} variant="rect" width="100%" height={56} borderRadius={12} />)}
          <EruditSkeleton variant="text" width="30%" height={17} style={{ marginTop: spacing.md }} />
          {[1, 2].map(i => <EruditSkeleton key={`rdv-${i}`} variant="rect" width="100%" height={56} borderRadius={12} />)}
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.surface }}
      contentContainerStyle={{ padding: spacing.lg, gap: spacing.md, paddingBottom: 100 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
    >
      {/* Messages récents */}
      <View style={{ gap: spacing.sm }}>
        <EruditText style={{ fontFamily: 'Georgia', fontSize: 15, fontWeight: '600', color: colors.textPrimary }}>
          Messages récents
        </EruditText>
        {messages.length === 0 ? (
          <EruditEmptyState
            icon="💬"
            title="Aucun message"
            description="Vous n'avez pas encore reçu de messages."
          />
        ) : (
          messages.map(msg => (
            <EruditCard key={msg.id} variant="default" onPress={() => {}}>
              <EruditCard.Header>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                  <View style={{
                    width: 8, height: 8, borderRadius: 4,
                    backgroundColor: msg.lu ? colors.borderHeavy : colors.accent,
                  }} />
                  <View style={{ flex: 1 }}>
                    <EruditText style={{ fontSize: 14, fontWeight: '500', color: colors.textPrimary }}>
                      {msg.sujet || 'Sans objet'}
                    </EruditText>
                    <EruditText style={{ fontSize: 11, color: colors.textTertiary }}>
                      De: {msg.expediteur || '—'} — {msg.created_at ? new Date(msg.created_at).toLocaleDateString('fr-FR') : '—'}
                    </EruditText>
                  </View>
                </View>
              </EruditCard.Header>
            </EruditCard>
          ))
        )}
      </View>

      {/* Rendez-vous */}
      <View style={{ gap: spacing.sm }}>
        <EruditText style={{ fontFamily: 'Georgia', fontSize: 15, fontWeight: '600', color: colors.textPrimary }}>
          Rendez-vous
        </EruditText>
        {rdvs.length === 0 ? (
          <EruditEmptyState
            icon="📆"
            title="Aucun rendez-vous"
            description="Planifiez un rendez-vous avec un enseignant."
            actionLabel="Demander un RDV"
            onAction={() => {}}
          />
        ) : (
          rdvs.map(rdv => (
            <EruditCard key={rdv.id} variant="default">
              <EruditCard.Header>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, flex: 1 }}>
                  <View style={{
                    width: 36, height: 36, borderRadius: 10,
                    backgroundColor: colors.surfaceSubtle,
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                    <EruditText style={{ fontSize: 16 }}>📆</EruditText>
                  </View>
                  <View style={{ flex: 1 }}>
                    <EruditText style={{ fontSize: 14, fontWeight: '500', color: colors.textPrimary }}>
                      {rdv.motif || 'Sans motif'}
                    </EruditText>
                    <EruditText style={{ fontSize: 11, color: colors.textTertiary }}>
                      {rdv.date ? `${new Date(rdv.date).toLocaleDateString('fr-FR')} à ${rdv.heure}` : 'Date à confirmer'} — {rdv.enseignant || '—'}
                    </EruditText>
                  </View>
                  <EruditBadge
                    variant={rdv.statut === 'confirmé' ? 'success' : rdv.statut === 'annulé' ? 'danger' : 'warning'}
                    size="sm"
                    dot
                  >
                    {rdv.statut || 'En attente'}
                  </EruditBadge>
                </View>
              </EruditCard.Header>
            </EruditCard>
          ))
        )}
        <EruditButton variant="outline" size="md" icon="📆" style={{ alignSelf: 'flex-start' }}>
          Demander un RDV
        </EruditButton>
      </View>
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
    { icon: '💰', label: 'Paiements', onPress: () => {} },
    { icon: '📜', label: 'Historique', onPress: () => {} },
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
            <EruditRow label="Email" value={user?.email || '—'} />
            <EruditRow label="Téléphone" value={user?.telephone || '—'} />
            <EruditRow label="Adresse" value={user?.adresse || '—'} />
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

export default function ParentDashboard() {
  const { user } = useAuth();
  const tabColors = useEruditTabColors(ROLE);
  const tabBarStyle = useEruditTabBarStyle();

  return (
    <Tab.Navigator
      screenOptions={{
        ...eruditTabOptions({ role: ROLE, labels: {
          Enfants: 'Enfants',
          Bulletins: 'Bulletins',
          Communication: 'Messages',
          Profil: 'Profil',
        }}),
        tabBarActiveTintColor: tabColors.activeTintColor,
        tabBarInactiveTintColor: tabColors.inactiveTintColor,
        tabBarStyle,
        headerShown: false,
        lazy: true,
      }}
    >
      <Tab.Screen name="Enfants" component={EnfantsScreen} />
      <Tab.Screen name="Bulletins" component={BulletinsScreen} />
      <Tab.Screen name="Communication" component={CommunicationScreen} />
      <Tab.Screen name="Profil" component={ProfilScreen} />
    </Tab.Navigator>
  );
}