import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { Card, Title, Text, Button, FAB, Chip, TextInput, Modal, Portal } from 'react-native-paper';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

const Tab = createBottomTabNavigator();

const AbsencesScreen = () => {
  const [absences, setAbsences] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    fetchAbsences();
  }, []);

  const fetchAbsences = async () => {
    try {
      const response = await api.get('/surveillant/absences');
      setAbsences(response.data);
    } catch (error) {
      console.error('Error fetching absences:', error);
    }
  };

  const marquerAbsence = async (eleveId) => {
    try {
      await api.post('/absences', {
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

  return (
    <View style={styles.container}>
      <ScrollView>
        {absences.map(absence => (
          <Card key={absence.id} style={styles.card}>
            <Card.Content>
              <Title>{absence.eleve.nom} {absence.eleve.prenom}</Title>
              <Text>Classe: {absence.eleve.classe.nom}</Text>
              <Text>Date: {new Date(absence.date).toLocaleDateString()}</Text>
              <Text>Type: {absence.type}</Text>
              <Chip 
                style={[
                  styles.chip,
                  { backgroundColor: absence.justifiee ? '#4CAF50' : '#f44336' }
                ]}
              >
                {absence.justifiee ? 'Justifiée' : 'Non justifiée'}
              </Chip>
            </Card.Content>
            <Card.Actions>
              <Button mode="outlined" onPress={() => {}}>
                Justifier
              </Button>
            </Card.Actions>
          </Card>
        ))}
      </ScrollView>
      <FAB
        style={styles.fab}
        icon="plus"
        onPress={() => setModalVisible(true)}
      />
    </View>
  );
};

const IncidentsScreen = () => {
  const [incidents, setIncidents] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [description, setDescription] = useState('');

  useEffect(() => {
    fetchIncidents();
  }, []);

  const fetchIncidents = async () => {
    try {
      const response = await api.get('/surveillant/incidents');
      setIncidents(response.data);
    } catch (error) {
      console.error('Error fetching incidents:', error);
    }
  };

  const ajouterIncident = async () => {
    try {
      await api.post('/incidents', {
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
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView>
        {incidents.map(incident => (
          <Card key={incident.id} style={styles.card}>
            <Card.Content>
              <Title>Incident #{incident.id}</Title>
              <Text>Description: {incident.description}</Text>
              <Text>Date: {new Date(incident.date).toLocaleDateString()}</Text>
              <Text>Élèves impliqués: {incident.eleves?.map(e => e.nom).join(', ')}</Text>
              <Chip 
                style={[
                  styles.chip,
                  { 
                    backgroundColor: 
                      incident.gravite === 'faible' ? '#4CAF50' :
                      incident.gravite === 'moyenne' ? '#FF9800' : '#f44336'
                  }
                ]}
              >
                {incident.gravite}
              </Chip>
            </Card.Content>
            <Card.Actions>
              <Button mode="outlined">Traiter</Button>
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
              <Title>Nouvel incident</Title>
              <TextInput
                label="Description"
                value={description}
                onChangeText={setDescription}
                mode="outlined"
                multiline
                numberOfLines={4}
                style={styles.input}
              />
              <Button mode="contained" onPress={ajouterIncident}>
                Enregistrer
              </Button>
            </Card.Content>
          </Card>
        </Modal>
      </Portal>
    </View>
  );
};

const SanctionsScreen = () => {
  const [sanctions, setSanctions] = useState([]);

  useEffect(() => {
    fetchSanctions();
  }, []);

  const fetchSanctions = async () => {
    try {
      const response = await api.get('/surveillant/sanctions');
      setSanctions(response.data);
    } catch (error) {
      console.error('Error fetching sanctions:', error);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView>
        {sanctions.map(sanction => (
          <Card key={sanction.id} style={styles.card}>
            <Card.Content>
              <Title>{sanction.eleve.nom} {sanction.eleve.prenom}</Title>
              <Text>Classe: {sanction.eleve.classe.nom}</Text>
              <Text>Type: {sanction.type_sanction}</Text>
              <Text>Motif: {sanction.motif}</Text>
              <Text>Date: {new Date(sanction.date).toLocaleDateString()}</Text>
              <Text>Durée: {sanction.duree} jours</Text>
              <Chip 
                style={[
                  styles.chip,
                  { backgroundColor: sanction.statut === 'active' ? '#f44336' : '#4CAF50' }
                ]}
              >
                {sanction.statut}
              </Chip>
            </Card.Content>
            <Card.Actions>
              <Button mode="outlined">Modifier</Button>
              <Button mode="contained">Lever</Button>
            </Card.Actions>
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

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Title>Mon Profil</Title>
          <Text>Nom: {user?.nom} {user?.prenom}</Text>
          <Text>Email: {user?.email}</Text>
          <Text>Téléphone: {user?.telephone}</Text>
          <Text>Poste: Surveillant</Text>
        </Card.Content>
      </Card>
      
      <Card style={styles.card}>
        <Card.Content>
          <Title>Planning de surveillance</Title>
          <Text>Lundi: 8h-12h - Cour principale</Text>
          <Text>Mardi: 14h-18h - Bâtiment A</Text>
          <Text>Mercredi: 8h-12h - Cantine</Text>
          <Text>Jeudi: 14h-18h - Cour principale</Text>
          <Text>Vendredi: 8h-12h - Bâtiment B</Text>
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

const SurveillantDashboard = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          switch (route.name) {
            case 'Absences': iconName = 'event-busy'; break;
            case 'Incidents': iconName = 'warning'; break;
            case 'Sanctions': iconName = 'gavel'; break;
            case 'Profil': iconName = 'person'; break;
          }
          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#795548',
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tab.Screen name="Absences" component={AbsencesScreen} options={{ title: 'Absences' }} />
      <Tab.Screen name="Incidents" component={IncidentsScreen} options={{ title: 'Incidents' }} />
      <Tab.Screen name="Sanctions" component={SanctionsScreen} options={{ title: 'Sanctions' }} />
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
  chip: {
    marginTop: 10,
    alignSelf: 'flex-start',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#795548',
  },
  modal: {
    margin: 20,
  },
  input: {
    marginBottom: 15,
  },
  button: {
    marginTop: 20,
    paddingVertical: 8,
  },
});

export default SurveillantDashboard;