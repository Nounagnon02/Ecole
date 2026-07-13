/**
 * ============================================================================
 * AdminDashboard — Érudit v4 (React Native)
 *
 * Nouveau dashboard Administrateur général.
 * Zéro react-native-paper. 100% composants Érudit + useTheme().
 * Couleur de rôle : teal profond (#1A3A3C)
 *
 * Tabs : Aperçu | Utilisateurs | Configuration | Profil
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
import EruditModal from '../components/EruditModal';
import EruditFAB from '../components/EruditFAB';
import EruditDashboardHeader from '../components/EruditDashboardHeader';
import EruditSkeleton from '../components/EruditSkeleton';
import EruditEmptyState from '../components/EruditEmptyState';

const Tab = createBottomTabNavigator();
const ROLE = 'admin';

/* ═══════════════════════════════════════════════════════════════════════════
   Onglet 1 — Aperçu
   ══════════════════════════════════════════════════════════════════════════ */

function ApercuScreen() {
  const { colors, spacing } = useTheme();
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = useCallback(async () => {
    try {
      const response = await api.get('/dashboard/admin');
      setStats(response.data?.data || {});
    } catch (error) {
      console.error('Error fetching admin stats:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);
  const onRefresh = useCallback(() => { setRefreshing(true); fetchStats(); }, [fetchStats]);

  const statCards = [
    { title: 'Écoles', value: stats.ecoles ?? 0, color: 'primary', icon: '🏫' },
    { title: 'Utilisateurs', value: stats.utilisateurs ?? 0, color: 'blue', icon: '👤' },
    { title: 'Plans actifs', value: stats.plans_actifs ?? 0, color: 'green', icon: '📊' },
    { title: 'Modules actifs', value: stats.modules_actifs ?? 0, color: 'purple', icon: '⚙️' },
    { title: 'Revenus', value: stats.revenus ? `${Number(stats.revenus).toLocaleString('fr-FR')} CFA` : '0 CFA', color: 'amber', icon: '💰' },
    { title: 'Nouveautés', value: stats.nouveautes_semaine ?? 0, color: 'emerald', icon: '✨' },
  ];

  const activites = stats.activites_recentes || [];

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
        {[1, 2].map(i => <EruditSkeleton key={i} variant="rect" width="100%" height={80} borderRadius={16} />)}
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
        {/* Grille de stats */}
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
              activites.slice(0, 6).map((act, i) => (
                <View
                  key={act.id || i}
                  style={{
                    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
                    paddingVertical: spacing.sm,
                    borderBottomWidth: i < Math.min(activites.length, 6) - 1 ? 1 : 0,
                    borderBottomColor: colors.border,
                  }}
                >
                  <View style={{
                    width: 32, height: 32, borderRadius: 8,
                    backgroundColor: colors.primarySubtle,
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                    <EruditText style={{ fontSize: 14 }}>
                      {act.type === 'inscription' ? '📝' : act.type === 'paiement' ? '💰' : '⚡'}
                    </EruditText>
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
   Onglet 2 — Utilisateurs
   ══════════════════════════════════════════════════════════════════════════ */

function UtilisateursScreen() {
  const { colors, spacing } = useTheme();
  const [utilisateurs, setUtilisateurs] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchUtilisateurs = useCallback(async () => {
    try {
      const response = await api.get('/admin/utilisateurs');
      setUtilisateurs(response.data?.data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchUtilisateurs(); }, [fetchUtilisateurs]);
  const onRefresh = useCallback(() => { setRefreshing(true); fetchUtilisateurs(); }, [fetchUtilisateurs]);

  const filtered = utilisateurs.filter(u =>
    u.nom?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.prenom?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const roleBadge = (role) => {
    const map = {
      admin: { variant: 'danger', label: 'Admin' },
      directeur: { variant: 'primary', label: 'Dir.' },
      enseignant: { variant: 'green', label: 'Ens.' },
      eleve: { variant: 'blue', label: 'Élève' },
      parent: { variant: 'accent', label: 'Parent' },
      comptable: { variant: 'amber', label: 'Cpta' },
      surveillant: { variant: 'red', label: 'Surv.' },
      censeur: { variant: 'purple', label: 'Cens.' },
      infirmier: { variant: 'emerald', label: 'Inf.' },
      bibliothecaire: { variant: 'green', label: 'Bibl.' },
      secretaire: { variant: 'amber', label: 'Secr.' },
    };
    return map[role] || { variant: 'primary', label: role || '?' };
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.surface, padding: spacing.lg, gap: spacing.md }}>
        <EruditSkeleton variant="rect" width="100%" height={48} borderRadius={12} />
        {[1, 2, 3].map(i => <EruditSkeleton key={i} variant="rect" width="100%" height={100} borderRadius={16} />)}
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <View style={{ padding: spacing.lg, paddingBottom: 0 }}>
        <EruditSearchBar
          placeholder="Rechercher un utilisateur..."
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
            icon="👤"
            title="Aucun utilisateur"
            description={searchQuery ? 'Essayez un autre terme.' : 'Aucun utilisateur enregistré.'}
            actionLabel="Ajouter un utilisateur"
            onAction={() => {}}
          />
        ) : (
          filtered.map(userItem => {
            const badge = roleBadge(userItem.role);
            return (
              <EruditCard key={userItem.id} variant="default">
                <EruditCard.Header>
                  <EruditCard.Title>{userItem.nom} {userItem.prenom}</EruditCard.Title>
                  <EruditBadge variant={badge.variant} size="sm" dot>{badge.label}</EruditBadge>
                </EruditCard.Header>
                <EruditCard.Body>
                  <EruditRow label="Email" value={userItem.email || '—'} />
                  <EruditRow label="Téléphone" value={userItem.telephone || '—'} />
                  <EruditRow label="École" value={userItem.ecole?.nom || '—'} />
                  <EruditRow label="Statut" value={userItem.actif ? 'Actif' : 'Inactif'} />
                </EruditCard.Body>
                <EruditCard.Footer>
                  <EruditButton variant="outline" size="sm">Modifier</EruditButton>
                  <EruditButton
                    variant={userItem.actif ? 'danger' : 'primary'}
                    size="sm"
                    onPress={() => {}}
                  >
                    {userItem.actif ? 'Désactiver' : 'Activer'}
                  </EruditButton>
                </EruditCard.Footer>
              </EruditCard>
            );
          })
        )}
      </ScrollView>
      <EruditFAB icon="👤" color="admin" onPress={() => {}} />
    </View>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Onglet 3 — Configuration
   ══════════════════════════════════════════════════════════════════════════ */

function ConfigurationScreen() {
  const { colors, spacing } = useTheme();

  const configSections = [
    {
      title: 'Plans d\'abonnement',
      icon: '📊',
      items: [
        { label: 'Plans actifs', value: '3 plans' },
        { label: 'Gratuit', value: 'Fonctionnalités limitées' },
        { label: 'Premium', value: 'Tout accès' },
      ],
      onEdit: () => {},
    },
    {
      title: 'Modules',
      icon: '⚙️',
      items: [
        { label: 'Modules installés', value: '12' },
        { label: 'Gestion scolarité', value: 'Actif' },
        { label: 'Paiements en ligne', value: 'Actif' },
      ],
      onEdit: () => {},
    },
    {
      title: 'White Label',
      icon: '🎨',
      items: [
        { label: 'Personnalisation', value: 'Logo, couleurs' },
        { label: 'Nom d\'établissement', value: 'Configurable' },
        { label: 'Domaine', value: 'Personnalisable' },
      ],
      onEdit: () => {},
    },
    {
      title: 'Facturation',
      icon: '💰',
      items: [
        { label: 'Moyens de paiement', value: 'Mobile Money, CB' },
        { label: 'Devise', value: 'FCFA' },
        { label: 'TVA', value: '18%' },
      ],
      onEdit: () => {},
    },
  ];

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.surface }}>
      <View style={{ padding: spacing.lg, gap: spacing.md, paddingBottom: 100 }}>
        {configSections.map((section, i) => (
          <EruditCard key={i} variant="default">
            <EruditCard.Header>
              <View style={{
                width: 36, height: 36, borderRadius: 10,
                backgroundColor: colors.primarySubtle,
                alignItems: 'center', justifyContent: 'center',
                marginRight: spacing.sm,
              }}>
                <EruditText style={{ fontSize: 18 }}>{section.icon}</EruditText>
              </View>
              <EruditCard.Title>{section.title}</EruditCard.Title>
            </EruditCard.Header>
            <EruditCard.Body>
              {section.items.map((item, j) => (
                <EruditRow key={j} label={item.label} value={item.value} />
              ))}
            </EruditCard.Body>
            <EruditCard.Footer>
              <EruditButton variant="outline" size="sm" onPress={section.onEdit}>
                Configurer
              </EruditButton>
            </EruditCard.Footer>
          </EruditCard>
        ))}
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

  const infoEcole = [
    { label: 'Rôle', value: 'Super Administrateur' },
    { label: 'Email', value: user?.email || '—' },
    { label: 'Téléphone', value: user?.telephone || '—' },
    { label: 'Établissements', value: 'Multi-écoles' },
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
            {infoEcole.map((item, i) => (
              <EruditRow key={i} label={item.label} value={item.value} />
            ))}
          </EruditCard.Body>
        </EruditCard>

        {/* Accès rapide */}
        <EruditCard variant="default">
          <EruditCard.Header>
            <EruditCard.Title>Accès Rapide</EruditCard.Title>
          </EruditCard.Header>
          <EruditCard.Body>
            <EruditMenuItem
              icon="📊"
              label="Rapport global"
              onPress={() => {}}
            />
            <EruditMenuItem
              icon="🛡️"
              label="Logs de sécurité"
              onPress={() => {}}
            />
            <EruditMenuItem
              icon="📧"
              label="Notifications système"
              onPress={() => {}}
            />
            <EruditMenuItem
              icon="🌐"
              label="Maintenance"
              onPress={() => {}}
            />
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

export default function AdminDashboard() {
  const { user } = useAuth();
  const tabColors = useEruditTabColors(ROLE);
  const tabBarStyle = useEruditTabBarStyle();

  return (
    <Tab.Navigator
      screenOptions={{
        ...eruditTabOptions({ role: ROLE, labels: {
          Apercu: 'Aperçu',
          Utilisateurs: 'Utilisateurs',
          Configuration: 'Configuration',
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
      <Tab.Screen name="Utilisateurs" component={UtilisateursScreen} />
      <Tab.Screen name="Configuration" component={ConfigurationScreen} />
      <Tab.Screen name="Profil" component={ProfilScreen} />
    </Tab.Navigator>
  );
}