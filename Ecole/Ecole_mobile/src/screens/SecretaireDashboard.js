import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { Card, Title, Text, Button, FAB, List, Searchbar, Chip, TextInput, Modal, Portal } from 'react-native-paper';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

const Tab = createBottomTabNavigator();

const DossiersScreen = () => {
  const [dossiers, setDossiers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchDossiers();
  }, []);

  const fetchDossiers = async () => {
    try {
      const response = await api.get('/secretaire/dossiers-eleves');
      setDossiers(response.data);
    } catch (error) {
      console.error('Error fetching dossiers:', error);
    }
  };

  const filteredDossiers = dossiers.filter(dossier =>
    dossier.eleve.nom.toLowerCase().includes(searchQuery.toLowerCase()) ||
    dossier.eleve.prenom.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <Searchbar
        placeholder="Rechercher un dossier"
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchbar}
      />
      <ScrollView>
        {filteredDossiers.map(dossier => (
          <Card key={dossier.id} style={styles.card}>
            <Card.Content>
              <Title>{dossier.eleve.nom} {dossier.eleve.prenom}</Title>
              <Text>Matricule: {dossier.eleve.matricule}</Text>
              <Text>Classe: {dossier.eleve.classe.nom}</Text>
              <Text>Date naissance: {new Date(dossier.eleve.date_naissance).toLocaleDateString()}</Text>
              <Text>Père: {dossier.nom_pere}</Text>
              <Text>Mère: {dossier.nom_mere}</Text>
              <Text>Téléphone: {dossier.telephone_parent}</Text>
              <Chip 
                style={[
                  styles.chip,
                  { backgroundColor: dossier.dossier_complet ? '#4CAF50' : '#FF9800' }
                ]}
              >
                {dossier.dossier_complet ? 'Complet' : 'Incomplet'}
              </Chip>
            </Card.Content>
            <Card.Actions>
              <Button mode="outlined">Modifier</Button>
              <Button mode="contained">Documents</Button>
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

const RendezVousScreen = () => {
  const [rdvs, setRdvs] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [motif, setMotif] = useState('');

  useEffect(() => {
    fetchRdvs();
  }, []);

  const fetchRdvs = async () => {
    try {
      const response = await api.get('/secretaire/rendez-vous');
      setRdvs(response.data);
    } catch (error) {
      console.error('Error fetching rdvs:', error);
    }
  };

  const programmerRdv = async () => {
    try {
      await api.post('/rendez-vous', {
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
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView>
        {rdvs.map(rdv => (
          <Card key={rdv.id} style={styles.card}>
            <Card.Content>
              <Title>{rdv.motif}</Title>
              <Text>Demandeur: {rdv.parent?.nom} {rdv.parent?.prenom}</Text>
              <Text>Concernant: {rdv.eleve?.nom} {rdv.eleve?.prenom}</Text>
              <Text>Date: {new Date(rdv.date).toLocaleDateString()}</Text>
              <Text>Heure: {rdv.heure}</Text>
              <Text>Avec: {rdv.enseignant?.nom || 'Direction'}</Text>
              <Chip 
                style={[
                  styles.chip,
                  { 
                    backgroundColor: 
                      rdv.statut === 'confirmé' ? '#4CAF50' :
                      rdv.statut === 'annulé' ? '#f44336' : '#FF9800'
                  }
                ]}
              >
                {rdv.statut}
              </Chip>
            </Card.Content>
            <Card.Actions>
              <Button mode="outlined">Modifier</Button>
              <Button mode="contained">Confirmer</Button>
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
              <Title>Nouveau rendez-vous</Title>
              <TextInput
                label="Motif"
                value={motif}
                onChangeText={setMotif}
                mode="outlined"
                style={styles.input}
              />
              <Button mode="contained" onPress={programmerRdv}>
                Programmer
              </Button>
            </Card.Content>
          </Card>
        </Modal>
      </Portal>
    </View>
  );
};

const CertificatsScreen = () => {
  const [certificats, setCertificats] = useState([]);

  useEffect(() => {
    fetchCertificats();
  }, []);

  const fetchCertificats = async () => {
    try {
      const response = await api.get('/secretaire/certificats');
      setCertificats(response.data);
    } catch (error) {
      console.error('Error fetching certificats:', error);
    }
  };

  const genererCertificat = async (type, eleveId) => {
    try {
      await api.post('/certificats', {
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

  return (
    <View style={styles.container}>
      <ScrollView>
        {certificats.map(certificat => (
          <Card key={certificat.id} style={styles.card}>
            <Card.Content>
              <Title>{certificat.type_certificat}</Title>
              <Text>Élève: {certificat.eleve.nom} {certificat.eleve.prenom}</Text>
              <Text>Classe: {certificat.eleve.classe.nom}</Text>
              <Text>Date émission: {new Date(certificat.date_emission).toLocaleDateString()}</Text>
              <Text>Numéro: {certificat.numero_certificat}</Text>
              <Chip 
                style={[
                  styles.chip,
                  { backgroundColor: certificat.delivre ? '#4CAF50' : '#FF9800' }
                ]}
              >
                {certificat.delivre ? 'Délivré' : 'En attente'}
              </Chip>
            </Card.Content>
            <Card.Actions>
              <Button mode="outlined">Imprimer</Button>
              <Button mode="contained">Délivrer</Button>
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
  const [stats, setStats] = useState({});

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await api.get('/secretaire/statistiques');
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
          <Text>Poste: Secrétaire</Text>
        </Card.Content>
      </Card>
      
      <Card style={styles.card}>
        <Card.Content>
          <Title>Activités du jour</Title>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.rdv_jour || 0}</Text>
              <Text style={styles.statLabel}>RDV aujourd'hui</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.certificats_attente || 0}</Text>
              <Text style={styles.statLabel}>Certificats en attente</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.dossiers_incomplets || 0}</Text>
              <Text style={styles.statLabel}>Dossiers incomplets</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.visiteurs_jour || 0}</Text>
              <Text style={styles.statLabel}>Visiteurs</Text>
            </View>
          </View>
        </Card.Content>
      </Card>
      
      <Card style={styles.card}>
        <Card.Content>
          <Title>Actions Rapides</Title>
          <List.Item
            title="Courrier du jour"
            left={props => <List.Icon {...props} icon="mail" />}
            onPress={() => {}}
          />
          <List.Item
            title="Registre des visiteurs"
            left={props => <List.Icon {...props} icon="people" />}
            onPress={() => {}}
          />
          <List.Item
            title="Appels téléphoniques"
            left={props => <List.Icon {...props} icon="phone" />}
            onPress={() => {}}
          />
          <List.Item
            title="Archivage"
            left={props => <List.Icon {...props} icon="archive" />}
            onPress={() => {}}
          />
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

const SecretaireDashboard = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          switch (route.name) {
            case 'Dossiers': iconName = 'folder'; break;
            case 'RendezVous': iconName = 'event'; break;
            case 'Certificats': iconName = 'description'; break;
            case 'Profil': iconName = 'person'; break;
          }
          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#009688',
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tab.Screen name="Dossiers" component={DossiersScreen} options={{ title: 'Dossiers' }} />
      <Tab.Screen name="RendezVous" component={RendezVousScreen} options={{ title: 'RDV' }} />
      <Tab.Screen name="Certificats" component={CertificatsScreen} options={{ title: 'Certificats' }} />
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
  searchbar: {
    marginBottom: 10,
  },
  chip: {
    marginTop: 10,
    alignSelf: 'flex-start',
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
    backgroundColor: '#e0f2f1',
    borderRadius: 8,
    marginBottom: 10,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#009688',
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
    backgroundColor: '#009688',
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

export default SecretaireDashboard;