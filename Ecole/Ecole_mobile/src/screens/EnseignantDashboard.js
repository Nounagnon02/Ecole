/**
 * ============================================================================
 * EnseignantDashboard — Érudit v4 (React Native)
 *
 * Refonte complète du dashboard Enseignant.
 * Zéro react-native-paper. 100% composants Érudit + useTheme().
 * Couleur de rôle : green (#5A7A63)
 *
 * Tabs : Classes | Notes | Devoirs | Profil
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
import EruditInput from '../components/EruditInput';
import EruditBadge from '../components/EruditBadge';
import EruditModal from '../components/EruditModal';
import EruditFAB from '../components/EruditFAB';
import EruditDashboardHeader from '../components/EruditDashboardHeader';
import EruditSkeleton from '../components/EruditSkeleton';
import EruditEmptyState from '../components/EruditEmptyState';

const Tab = createBottomTabNavigator();
const ROLE = 'enseignant';

/* ═══════════════════════════════════════════════════════════════════════════
   Onglet 1 — Classes
   ══════════════════════════════════════════════════════════════════════════ */

function ClassesScreen() {
  const { colors, spacing } = useTheme();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchClasses = useCallback(async () => {
    try {
      const response = await api.get('/enseignant/classes');
      setClasses(response.data?.data || []);
    } catch (error) {
      console.error('Error fetching classes:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchClasses(); }, [fetchClasses]);
  const onRefresh = useCallback(() => { setRefreshing(true); fetchClasses(); }, [fetchClasses]);

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
        {classes.length === 0 ? (
          <EruditEmptyState
            icon="🏫"
            title="Aucune classe assignée"
            description="Vos classes apparaîtront ici une fois assignées par l'administration."
          />
        ) : (
          classes.map(classe => (
            <EruditCard key={classe.id} variant="default">
              <EruditCard.Header>
                <EruditCard.Title>{classe.nom}</EruditCard.Title>
                <EruditBadge variant="green" size="sm">{classe.eleves_count || 0} élèves</EruditBadge>
              </EruditCard.Header>
              <EruditCard.Body>
                <EruditRow label="Matière" value={classe.matiere || 'Non spécifiée'} />
                <EruditRow label="Niveau" value={classe.niveau || '—'} />
              </EruditCard.Body>
              <EruditCard.Footer>
                <EruditButton variant="outline" size="sm">Voir les élèves</EruditButton>
              </EruditCard.Footer>
            </EruditCard>
          ))
        )}
      </ScrollView>
    </View>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Onglet 2 — Notes
   ══════════════════════════════════════════════════════════════════════════ */

function NotesScreen() {
  const { colors, spacing } = useTheme();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedEleve, setSelectedEleve] = useState(null);
  const [noteValue, setNoteValue] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchNotes = useCallback(async () => {
    try {
      const response = await api.get('/enseignant/notes');
      setNotes(response.data?.data || []);
    } catch (error) {
      console.error('Error fetching notes:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchNotes(); }, [fetchNotes]);
  const onRefresh = useCallback(() => { setRefreshing(true); fetchNotes(); }, [fetchNotes]);

  const ajouterNote = async () => {
    if (!noteValue.trim()) return;
    setSaving(true);
    try {
      await api.post('/notes/store', {
        eleve_id: selectedEleve.id,
        note: parseFloat(noteValue),
        type_evaluation: 'Devoir',
      });
      setModalVisible(false);
      setNoteValue('');
      fetchNotes();
      Alert.alert('Succès', 'Note ajoutée avec succès');
    } catch (error) {
      Alert.alert('Erreur', 'Erreur lors de l\'ajout de la note');
    } finally {
      setSaving(false);
    }
  };

  const ouvrirModalNote = (eleve) => {
    setSelectedEleve(eleve);
    setNoteValue('');
    setModalVisible(true);
  };

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
        {notes.length === 0 ? (
          <EruditEmptyState
            icon="📝"
            title="Aucune note saisie"
            description="Ajoutez votre première note pour commencer le suivi des élèves."
            actionLabel="Ajouter une note"
            onAction={() => setModalVisible(true)}
          />
        ) : (
          notes.map(note => (
            <EruditCard key={note.id} variant="default">
              <EruditCard.Header>
                <EruditCard.Title>{note.eleve?.nom} {note.eleve?.prenom}</EruditCard.Title>
                <EruditBadge
                  variant={note.note >= (note.note_sur || 20) / 2 ? 'success' : 'danger'}
                  size="sm"
                >
                  {note.note}/{note.note_sur || 20}
                </EruditBadge>
              </EruditCard.Header>
              <EruditCard.Body>
                <EruditRow label="Classe" value={note.eleve?.classe?.nom || '—'} />
                <EruditRow label="Type" value={note.type_evaluation || '—'} />
                <EruditRow label="Date" value={note.created_at ? new Date(note.created_at).toLocaleDateString('fr-FR') : '—'} />
              </EruditCard.Body>
              <EruditCard.Footer>
                <EruditButton variant="ghost" size="sm" onPress={() => ouvrirModalNote(note.eleve)}>
                  Nouvelle note pour cet élève
                </EruditButton>
              </EruditCard.Footer>
            </EruditCard>
          ))
        )}
      </ScrollView>

      <EruditFAB
        icon="✏️"
        color="green"
        onPress={() => setModalVisible(true)}
      />

      {/* Modal ajout de note */}
      <EruditModal visible={modalVisible} onDismiss={() => setModalVisible(false)}>
        <EruditModal.Header>
          <EruditModal.Title>Ajouter une note</EruditModal.Title>
        </EruditModal.Header>
        <EruditModal.Body>
          {selectedEleve ? (
            <View>
              <EruditText style={{ fontSize: 13, color: colors.textSecondary, marginBottom: spacing.sm }}>
                Élève : {selectedEleve.nom} {selectedEleve.prenom}
              </EruditText>
            </View>
          ) : null}
          <EruditInput
            label="Note"
            value={noteValue}
            onChangeText={setNoteValue}
            keyboardType="numeric"
            placeholder="Ex: 15,5"
          />
        </EruditModal.Body>
        <EruditModal.Footer>
          <EruditButton variant="ghost" onPress={() => setModalVisible(false)}>Annuler</EruditButton>
          <EruditButton variant="primary" onPress={ajouterNote} loading={saving}>Ajouter</EruditButton>
        </EruditModal.Footer>
      </EruditModal>
    </View>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Onglet 3 — Devoirs
   ══════════════════════════════════════════════════════════════════════════ */

function DevoirsScreen() {
  const { colors, spacing } = useTheme();
  const [devoirs, setDevoirs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [titre, setTitre] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchDevoirs = useCallback(async () => {
    try {
      const response = await api.get('/devoirs/enseignant');
      setDevoirs(response.data?.data || []);
    } catch (error) {
      console.error('Error fetching devoirs:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchDevoirs(); }, [fetchDevoirs]);
  const onRefresh = useCallback(() => { setRefreshing(true); fetchDevoirs(); }, [fetchDevoirs]);

  const ajouterDevoir = async () => {
    if (!titre.trim()) return;
    setSaving(true);
    try {
      await api.post('/devoirs', {
        titre,
        description,
        date_limite: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      });
      setModalVisible(false);
      setTitre('');
      setDescription('');
      fetchDevoirs();
      Alert.alert('Succès', 'Devoir ajouté avec succès');
    } catch (error) {
      Alert.alert('Erreur', 'Erreur lors de l\'ajout du devoir');
    } finally {
      setSaving(false);
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
        {devoirs.length === 0 ? (
          <EruditEmptyState
            icon="📋"
            title="Aucun devoir créé"
            description="Créez votre premier devoir pour vos classes."
            actionLabel="Nouveau devoir"
            onAction={() => setModalVisible(true)}
          />
        ) : (
          devoirs.map(devoir => (
            <EruditCard key={devoir.id} variant="default">
              <EruditCard.Header>
                <EruditCard.Title>{devoir.titre}</EruditCard.Title>
                {devoir.date_limite ? (
                  <EruditBadge
                    variant={new Date(devoir.date_limite) < new Date() ? 'danger' : 'primary'}
                    size="sm"
                  >
                    {new Date(devoir.date_limite).toLocaleDateString('fr-FR')}
                  </EruditBadge>
                ) : null}
              </EruditCard.Header>
              <EruditCard.Body>
                <EruditText style={{ fontSize: 13, color: colors.textSecondary, marginBottom: spacing.sm }}>
                  {devoir.description || 'Aucune description'}
                </EruditText>
                <EruditRow label="Classe" value={devoir.classe?.nom || '—'} />
              </EruditCard.Body>
            </EruditCard>
          ))
        )}
      </ScrollView>

      <EruditFAB
        icon="📋"
        color="green"
        onPress={() => setModalVisible(true)}
      />

      {/* Modal nouveau devoir */}
      <EruditModal visible={modalVisible} onDismiss={() => setModalVisible(false)}>
        <EruditModal.Header>
          <EruditModal.Title>Nouveau devoir</EruditModal.Title>
        </EruditModal.Header>
        <EruditModal.Body>
          <EruditInput
            label="Titre"
            value={titre}
            onChangeText={setTitre}
            placeholder="Ex: Dissertation sur la poésie"
          />
          <View style={{ height: spacing.md }} />
          <EruditInput
            label="Description"
            value={description}
            onChangeText={setDescription}
            placeholder="Instructions pour les élèves…"
            multiline
            numberOfLines={4}
          />
        </EruditModal.Body>
        <EruditModal.Footer>
          <EruditButton variant="ghost" onPress={() => setModalVisible(false)}>Annuler</EruditButton>
          <EruditButton variant="primary" onPress={ajouterDevoir} loading={saving}>Ajouter</EruditButton>
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

  const menuItems = [
    { icon: '📅', label: 'Emploi du temps', onPress: () => {} },
    { icon: '💬', label: 'Messages', onPress: () => {} },
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
            <EruditRow
              label="Matières enseignées"
              value={user?.matieres?.map(m => m.nom).join(', ') || 'Aucune'}
            />
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

export default function EnseignantDashboard() {
  const { user } = useAuth();
  const tabColors = useEruditTabColors(ROLE);
  const tabBarStyle = useEruditTabBarStyle();

  return (
    <Tab.Navigator
      screenOptions={{
        ...eruditTabOptions({ role: ROLE, labels: {
          Classes: 'Classes',
          Notes: 'Notes',
          Devoirs: 'Devoirs',
          Profil: 'Profil',
        }}),
        tabBarActiveTintColor: tabColors.activeTintColor,
        tabBarInactiveTintColor: tabColors.inactiveTintColor,
        tabBarStyle,
        headerShown: false,
        lazy: true,
      }}
    >
      <Tab.Screen name="Classes" component={ClassesScreen} />
      <Tab.Screen name="Notes" component={NotesScreen} />
      <Tab.Screen name="Devoirs" component={DevoirsScreen} />
      <Tab.Screen name="Profil" component={ProfilScreen} />
    </Tab.Navigator>
  );
}