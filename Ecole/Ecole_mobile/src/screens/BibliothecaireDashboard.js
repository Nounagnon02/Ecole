import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { Card, Title, Text, Button, FAB, Searchbar, Chip, TextInput, Modal, Portal } from 'react-native-paper';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

const Tab = createBottomTabNavigator();

const CatalogueScreen = () => {
  const [livres, setLivres] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [titre, setTitre] = useState('');
  const [auteur, setAuteur] = useState('');

  useEffect(() => {
    fetchLivres();
  }, []);

  const fetchLivres = async () => {
    try {
      const response = await api.get('/bibliothecaire/livres');
      setLivres(response.data);
    } catch (error) {
      console.error('Error fetching livres:', error);
    }
  };

  const ajouterLivre = async () => {
    try {
      await api.post('/livres', {
        titre,
        auteur,
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
    }
  };

  const filteredLivres = livres.filter(livre =>
    livre.titre.toLowerCase().includes(searchQuery.toLowerCase()) ||
    livre.auteur.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <Searchbar
        placeholder="Rechercher un livre"
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchbar}
      />
      <ScrollView>
        {filteredLivres.map(livre => (
          <Card key={livre.id} style={styles.card}>
            <Card.Content>
              <Title>{livre.titre}</Title>
              <Text>Auteur: {livre.auteur}</Text>
              <Text>ISBN: {livre.isbn}</Text>
              <Text>Catégorie: {livre.categorie}</Text>
              <Text>Année: {livre.annee_publication}</Text>
              <Text>Exemplaires: {livre.nombre_exemplaires}</Text>
              <Chip 
                style={[
                  styles.chip,
                  { backgroundColor: livre.disponible ? '#4CAF50' : '#f44336' }
                ]}
              >
                {livre.disponible ? 'Disponible' : 'Emprunté'}
              </Chip>
            </Card.Content>
            <Card.Actions>
              <Button mode="outlined">Modifier</Button>
              <Button mode="contained">Emprunter</Button>
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
              <Title>Nouveau livre</Title>
              <TextInput
                label="Titre"
                value={titre}
                onChangeText={setTitre}
                mode="outlined"
                style={styles.input}
              />
              <TextInput
                label="Auteur"
                value={auteur}
                onChangeText={setAuteur}
                mode="outlined"
                style={styles.input}
              />
              <Button mode="contained" onPress={ajouterLivre}>
                Ajouter
              </Button>
            </Card.Content>
          </Card>
        </Modal>
      </Portal>
    </View>
  );
};

const EmpruntsScreen = () => {
  const [emprunts, setEmprunts] = useState([]);

  useEffect(() => {
    fetchEmprunts();
  }, []);

  const fetchEmprunts = async () => {
    try {
      const response = await api.get('/bibliothecaire/emprunts');
      setEmprunts(response.data);
    } catch (error) {
      console.error('Error fetching emprunts:', error);
    }
  };

  const retournerLivre = async (empruntId) => {
    try {
      await api.put(`/emprunts/${empruntId}/retour`);
      fetchEmprunts();
      Alert.alert('Succès', 'Livre retourné');
    } catch (error) {
      Alert.alert('Erreur', 'Erreur lors du retour');
    }
  };

  return (
    <ScrollView style={styles.container}>
      {emprunts.map(emprunt => (
        <Card key={emprunt.id} style={styles.card}>
          <Card.Content>
            <Title>{emprunt.livre.titre}</Title>
            <Text>Emprunté par: {emprunt.eleve.nom} {emprunt.eleve.prenom}</Text>
            <Text>Classe: {emprunt.eleve.classe.nom}</Text>
            <Text>Date emprunt: {new Date(emprunt.date_emprunt).toLocaleDateString()}</Text>
            <Text>Date retour prévue: {new Date(emprunt.date_retour_prevue).toLocaleDateString()}</Text>
            
            {emprunt.date_retour_effective ? (
              <Chip style={[styles.chip, { backgroundColor: '#4CAF50' }]}>
                Retourné le {new Date(emprunt.date_retour_effective).toLocaleDateString()}
              </Chip>
            ) : (
              <Chip 
                style={[
                  styles.chip,
                  { 
                    backgroundColor: new Date(emprunt.date_retour_prevue) < new Date() ? '#f44336' : '#FF9800'
                  }
                ]}
              >
                {new Date(emprunt.date_retour_prevue) < new Date() ? 'En retard' : 'En cours'}
              </Chip>
            )}
          </Card.Content>
          {!emprunt.date_retour_effective && (
            <Card.Actions>
              <Button mode="outlined">Prolonger</Button>
              <Button mode="contained" onPress={() => retournerLivre(emprunt.id)}>
                Retourner
              </Button>
            </Card.Actions>
          )}
        </Card>
      ))}
    </ScrollView>
  );
};

const ReservationsScreen = () => {
  const [reservations, setReservations] = useState([]);

  useEffect(() => {
    fetchReservations();
  }, []);

  const fetchReservations = async () => {
    try {
      const response = await api.get('/bibliothecaire/reservations');
      setReservations(response.data);
    } catch (error) {
      console.error('Error fetching reservations:', error);
    }
  };

  const confirmerReservation = async (reservationId) => {
    try {
      await api.put(`/reservations/${reservationId}/confirmer`);
      fetchReservations();
      Alert.alert('Succès', 'Réservation confirmée');
    } catch (error) {
      Alert.alert('Erreur', 'Erreur lors de la confirmation');
    }
  };

  return (
    <ScrollView style={styles.container}>
      {reservations.map(reservation => (
        <Card key={reservation.id} style={styles.card}>
          <Card.Content>
            <Title>{reservation.livre.titre}</Title>
            <Text>Réservé par: {reservation.eleve.nom} {reservation.eleve.prenom}</Text>
            <Text>Classe: {reservation.eleve.classe.nom}</Text>
            <Text>Date réservation: {new Date(reservation.date_reservation).toLocaleDateString()}</Text>
            <Text>Date limite: {new Date(reservation.date_limite).toLocaleDateString()}</Text>
            <Chip 
              style={[
                styles.chip,
                { 
                  backgroundColor: 
                    reservation.statut === 'confirmée' ? '#4CAF50' :
                    reservation.statut === 'expirée' ? '#f44336' : '#FF9800'
                }
              ]}
            >
              {reservation.statut}
            </Chip>
          </Card.Content>
          {reservation.statut === 'en_attente' && (
            <Card.Actions>
              <Button mode="outlined">Annuler</Button>
              <Button mode="contained" onPress={() => confirmerReservation(reservation.id)}>
                Confirmer
              </Button>
            </Card.Actions>
          )}
        </Card>
      ))}
    </ScrollView>
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
      const response = await api.get('/bibliothecaire/statistiques');
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
          <Text>Poste: Bibliothécaire</Text>
        </Card.Content>
      </Card>
      
      <Card style={styles.card}>
        <Card.Content>
          <Title>Statistiques de la Bibliothèque</Title>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.total_livres || 0}</Text>
              <Text style={styles.statLabel}>Livres au catalogue</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.emprunts_actifs || 0}</Text>
              <Text style={styles.statLabel}>Emprunts actifs</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.reservations_attente || 0}</Text>
              <Text style={styles.statLabel}>Réservations</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.retards || 0}</Text>
              <Text style={styles.statLabel}>Retards</Text>
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
            Inventaire
          </Button>
          <Button mode="outlined" style={styles.actionButton}>
            Relances retards
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

const BibliothecaireDashboard = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          switch (route.name) {
            case 'Catalogue': iconName = 'library-books'; break;
            case 'Emprunts': iconName = 'book'; break;
            case 'Reservations': iconName = 'bookmark'; break;
            case 'Profil': iconName = 'person'; break;
          }
          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#607D8B',
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tab.Screen name="Catalogue" component={CatalogueScreen} options={{ title: 'Catalogue' }} />
      <Tab.Screen name="Emprunts" component={EmpruntsScreen} options={{ title: 'Emprunts' }} />
      <Tab.Screen name="Reservations" component={ReservationsScreen} options={{ title: 'Réservations' }} />
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
    backgroundColor: '#eceff1',
    borderRadius: 8,
    marginBottom: 10,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#607D8B',
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
    backgroundColor: '#607D8B',
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

export default BibliothecaireDashboard;