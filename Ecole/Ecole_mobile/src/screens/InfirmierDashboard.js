import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { Card, Title, Text, Button, FAB, Chip, TextInput, Modal, Portal } from 'react-native-paper';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

const Tab = createBottomTabNavigator();

const ConsultationsScreen = () => {
  const [consultations, setConsultations] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [motif, setMotif] = useState('');
  const [diagnostic, setDiagnostic] = useState('');

  useEffect(() => {
    fetchConsultations();
  }, []);

  const fetchConsultations = async () => {
    try {
      const response = await api.get('/infirmier/consultations');
      setConsultations(response.data);
    } catch (error) {
      console.error('Error fetching consultations:', error);
    }
  };

  const ajouterConsultation = async () => {
    try {
      await api.post('/consultations', {
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
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView>
        {consultations.map(consultation => (
          <Card key={consultation.id} style={styles.card}>
            <Card.Content>
              <Title>{consultation.eleve.nom} {consultation.eleve.prenom}</Title>
              <Text>Classe: {consultation.eleve.classe.nom}</Text>
              <Text>Motif: {consultation.motif}</Text>
              <Text>Diagnostic: {consultation.diagnostic}</Text>
              <Text>Date: {new Date(consultation.date).toLocaleDateString()}</Text>
              <Text>Traitement: {consultation.traitement || 'Aucun'}</Text>
              <Chip 
                style={[
                  styles.chip,
                  { backgroundColor: consultation.urgence ? '#f44336' : '#4CAF50' }
                ]}
              >
                {consultation.urgence ? 'Urgent' : 'Normal'}
              </Chip>
            </Card.Content>
            <Card.Actions>
              <Button mode="outlined">Modifier</Button>
              <Button mode="contained">Traitement</Button>
            </Card.Actions>
          </Card>
        ))}
      </ScrollView>
      
      <FAB
        style={styles.fab}
        icon="plus"
        onPress={() => setModalVisible(true)}
      />

      <Portal>
        <Modal visible={modalVisible} onDismiss={() => setModalVisible(false)}>
          <Card style={styles.modal}>
            <Card.Content>
              <Title>Nouvelle consultation</Title>
              <TextInput
                label="Motif"
                value={motif}
                onChangeText={setMotif}
                mode="outlined"
                style={styles.input}
              />
              <TextInput
                label="Diagnostic"
                value={diagnostic}
                onChangeText={setDiagnostic}
                mode="outlined"
                multiline
                numberOfLines={3}
                style={styles.input}
              />
              <Button mode="contained" onPress={ajouterConsultation}>
                Enregistrer
              </Button>
            </Card.Content>
          </Card>
        </Modal>
      </Portal>
    </View>
  );
};

const DossiersScreen = () => {
  const [dossiers, setDossiers] = useState([]);

  useEffect(() => {
    fetchDossiers();
  }, []);

  const fetchDossiers = async () => {
    try {
      const response = await api.get('/infirmier/dossiers-medicaux');
      setDossiers(response.data);
    } catch (error) {
      console.error('Error fetching dossiers:', error);
    }
  };

  return (
    <ScrollView style={styles.container}>
      {dossiers.map(dossier => (
        <Card key={dossier.id} style={styles.card}>
          <Card.Content>
            <Title>{dossier.eleve.nom} {dossier.eleve.prenom}</Title>
            <Text>Classe: {dossier.eleve.classe.nom}</Text>
            <Text>Groupe sanguin: {dossier.groupe_sanguin || 'Non renseigné'}</Text>
            <Text>Allergies: {dossier.allergies || 'Aucune'}</Text>
            <Text>Maladies chroniques: {dossier.maladies_chroniques || 'Aucune'}</Text>
            <Text>Contact urgence: {dossier.contact_urgence}</Text>
            <Text>Dernière visite: {dossier.derniere_visite ? new Date(dossier.derniere_visite).toLocaleDateString() : 'Jamais'}</Text>
            
            <View style={styles.chipContainer}>
              <Chip style={[styles.chip, { backgroundColor: dossier.vaccins_a_jour ? '#4CAF50' : '#f44336' }]}>
                Vaccins: {dossier.vaccins_a_jour ? 'À jour' : 'En retard'}
              </Chip>
              <Chip style={[styles.chip, { backgroundColor: dossier.aptitude_sport ? '#4CAF50' : '#FF9800' }]}>
                Sport: {dossier.aptitude_sport ? 'Apte' : 'Restriction'}
              </Chip>
            </View>
          </Card.Content>
          <Card.Actions>
            <Button mode="outlined">Modifier</Button>
            <Button mode="contained">Historique</Button>
          </Card.Actions>
        </Card>
      ))}
    </ScrollView>
  );
};

const VaccinsScreen = () => {
  const [vaccinations, setVaccinations] = useState([]);

  useEffect(() => {
    fetchVaccinations();
  }, []);

  const fetchVaccinations = async () => {
    try {
      const response = await api.get('/infirmier/vaccinations');
      setVaccinations(response.data);
    } catch (error) {
      console.error('Error fetching vaccinations:', error);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView>
        {vaccinations.map(vaccination => (
          <Card key={vaccination.id} style={styles.card}>
            <Card.Content>
              <Title>{vaccination.eleve.nom} {vaccination.eleve.prenom}</Title>
              <Text>Classe: {vaccination.eleve.classe.nom}</Text>
              <Text>Vaccin: {vaccination.nom_vaccin}</Text>
              <Text>Date: {new Date(vaccination.date_vaccination).toLocaleDateString()}</Text>
              <Text>Lot: {vaccination.numero_lot}</Text>
              <Text>Rappel prévu: {vaccination.date_rappel ? new Date(vaccination.date_rappel).toLocaleDateString() : 'Aucun'}</Text>
              <Chip 
                style={[
                  styles.chip,
                  { backgroundColor: vaccination.effets_secondaires ? '#FF9800' : '#4CAF50' }
                ]}
              >
                {vaccination.effets_secondaires ? 'Effets signalés' : 'Aucun effet'}
              </Chip>
            </Card.Content>
          </Card>
        ))}
      </ScrollView>
      <FAB
        style={styles.fab}
        icon="plus"
        onPress={() => {}}
      />
    </View>
  );
};

const ProfilScreen = () => {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState({});

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await api.get('/infirmier/statistiques');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Title>Mon Profil</Title>
          <Text>Nom: {user?.nom} {user?.prenom}</Text>
          <Text>Email: {user?.email}</Text>
          <Text>Téléphone: {user?.telephone}</Text>
          <Text>Poste: Infirmier(ère)</Text>
        </Card.Content>
      </Card>
      
      <Card style={styles.card}>
        <Card.Content>
          <Title>Statistiques de Santé</Title>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.consultations_mois || 0}</Text>
              <Text style={styles.statLabel}>Consultations ce mois</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.urgences_mois || 0}</Text>
              <Text style={styles.statLabel}>Urgences</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.vaccinations_mois || 0}</Text>
              <Text style={styles.statLabel}>Vaccinations</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.eleves_suivis || 0}</Text>
              <Text style={styles.statLabel}>Élèves suivis</Text>
            </View>
          </View>
        </Card.Content>
      </Card>
      
      <Card style={styles.card}>
        <Card.Content>
          <Title>Actions Rapides</Title>
          <Button mode="outlined" style={styles.actionButton}>
            Rapport mensuel
          </Button>
          <Button mode="outlined" style={styles.actionButton}>
            Campagne vaccination
          </Button>
          <Button mode="outlined" style={styles.actionButton}>
            Alertes médicales
          </Button>
        </Card.Content>
      </Card>
      
      <Button
        mode="contained"
        onPress={logout}
        style={[styles.button, { backgroundColor: '#f44336' }]}
        icon="logout"
      >
        Déconnexion
      </Button>
    </ScrollView>
  );
};

const InfirmierDashboard = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          switch (route.name) {
            case 'Consultations': iconName = 'local-hospital'; break;
            case 'Dossiers': iconName = 'folder-special'; break;
            case 'Vaccins': iconName = 'healing'; break;
            case 'Profil': iconName = 'person'; break;
          }
          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#E91E63',
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tab.Screen name="Consultations" component={ConsultationsScreen} options={{ title: 'Consultations' }} />
      <Tab.Screen name="Dossiers" component={DossiersScreen} options={{ title: 'Dossiers' }} />
      <Tab.Screen name="Vaccins" component={VaccinsScreen} options={{ title: 'Vaccins' }} />
      <Tab.Screen name="Profil" component={ProfilScreen} options={{ title: 'Profil' }} />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 10,
  },
  card: {
    marginBottom: 10,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
  },
  chip: {
    marginRight: 5,
    marginBottom: 5,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 15,
  },
  statItem: {
    width: '48%',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#fce4ec',
    borderRadius: 8,
    marginBottom: 10,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#E91E63',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#E91E63',
  },
  modal: {
    margin: 20,
  },
  input: {
    marginBottom: 15,
  },
  actionButton: {
    marginBottom: 10,
  },
  button: {
    marginTop: 20,
    paddingVertical: 8,
  },
});

export default InfirmierDashboard;