import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Card, Title, Text, Button, FAB, List, Searchbar } from 'react-native-paper';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

const Tab = createBottomTabNavigator();

const OverviewScreen = () => {
  const [stats, setStats] = useState({});

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await api.get('/directeur/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Title>Vue d'ensemble</Title>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.total_eleves || 0}</Text>
              <Text style={styles.statLabel}>Élèves</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.total_enseignants || 0}</Text>
              <Text style={styles.statLabel}>Enseignants</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.total_classes || 0}</Text>
              <Text style={styles.statLabel}>Classes</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.total_matieres || 0}</Text>
              <Text style={styles.statLabel}>Matières</Text>
            </View>
          </View>
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

const ClassesScreen = () => {
  const [classes, setClasses] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      const response = await api.get('/classes');
      setClasses(response.data);
    } catch (error) {
      console.error('Error fetching classes:', error);
    }
  };

  const filteredClasses = classes.filter(classe =>
    classe.nom.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <Searchbar
        placeholder="Rechercher une classe"
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchbar}
      />
      <ScrollView>
        {filteredClasses.map(classe => (
          <Card key={classe.id} style={styles.card}>
            <Card.Content>
              <Title>{classe.nom}</Title>
              <Text>Niveau: {classe.niveau}</Text>
              <Text>Effectif: {classe.eleves_count || 0} élèves</Text>
              <Text>Enseignant principal: {classe.enseignant_principal?.nom}</Text>
            </Card.Content>
          </Card>
        ))}
      </ScrollView>
      <FAB
        style={styles.fab}
        icon="plus"
        onPress={() => {/* Navigate to add class */}}
      />
    </View>
  );
};

const EnseignantsScreen = () => {
  const [enseignants, setEnseignants] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchEnseignants();
  }, []);

  const fetchEnseignants = async () => {
    try {
      const response = await api.get('/enseignants');
      setEnseignants(response.data);
    } catch (error) {
      console.error('Error fetching enseignants:', error);
    }
  };

  const filteredEnseignants = enseignants.filter(enseignant =>
    enseignant.nom.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <Searchbar
        placeholder="Rechercher un enseignant"
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchbar}
      />
      <ScrollView>
        {filteredEnseignants.map(enseignant => (
          <Card key={enseignant.id} style={styles.card}>
            <Card.Content>
              <Title>{enseignant.nom} {enseignant.prenom}</Title>
              <Text>Email: {enseignant.email}</Text>
              <Text>Téléphone: {enseignant.telephone}</Text>
              <Text>Matières: {enseignant.matieres?.map(m => m.nom).join(', ')}</Text>
            </Card.Content>
          </Card>
        ))}
      </ScrollView>
      <FAB
        style={styles.fab}
        icon="plus"
        onPress={() => {/* Navigate to add enseignant */}}
      />
    </View>
  );
};

const SettingsScreen = () => {
  const { logout } = useAuth();

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Title>Paramètres</Title>
          <List.Item
            title="Gestion des utilisateurs"
            left={props => <List.Icon {...props} icon="account-group" />}
            onPress={() => {}}
          />
          <List.Item
            title="Configuration système"
            left={props => <List.Icon {...props} icon="cog" />}
            onPress={() => {}}
          />
          <List.Item
            title="Rapports"
            left={props => <List.Icon {...props} icon="chart-line" />}
            onPress={() => {}}
          />
          <List.Item
            title="Sauvegarde"
            left={props => <List.Icon {...props} icon="backup-restore" />}
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

const DirecteurDashboard = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          switch (route.name) {
            case 'Overview': iconName = 'dashboard'; break;
            case 'Classes': iconName = 'school'; break;
            case 'Enseignants': iconName = 'people'; break;
            case 'Settings': iconName = 'settings'; break;
          }
          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#2196F3',
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tab.Screen name="Overview" component={OverviewScreen} options={{ title: 'Accueil' }} />
      <Tab.Screen name="Classes" component={ClassesScreen} options={{ title: 'Classes' }} />
      <Tab.Screen name="Enseignants" component={EnseignantsScreen} options={{ title: 'Enseignants' }} />
      <Tab.Screen name="Settings" component={SettingsScreen} options={{ title: 'Paramètres' }} />
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
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
    marginBottom: 10,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  searchbar: {
    marginBottom: 10,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#2196F3',
  },
  button: {
    marginTop: 20,
    paddingVertical: 8,
  },
});

export default DirecteurDashboard;