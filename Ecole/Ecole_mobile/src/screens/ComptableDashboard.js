import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Card, Title, Text, Button, FAB, Searchbar, Chip } from 'react-native-paper';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { LineChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

const Tab = createBottomTabNavigator();
const screenWidth = Dimensions.get('window').width;

const PaiementsScreen = () => {
  const [paiements, setPaiements] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchPaiements();
  }, []);

  const fetchPaiements = async () => {
    try {
      const response = await api.get('/comptable/paiements');
      setPaiements(response.data);
    } catch (error) {
      console.error('Error fetching paiements:', error);
    }
  };

  const filteredPaiements = paiements.filter(paiement =>
    paiement.eleve.nom.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <Searchbar
        placeholder="Rechercher un paiement"
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchbar}
      />
      <ScrollView>
        {filteredPaiements.map(paiement => (
          <Card key={paiement.id} style={styles.card}>
            <Card.Content>
              <Title>{paiement.eleve.nom} {paiement.eleve.prenom}</Title>
              <Text>Classe: {paiement.eleve.classe.nom}</Text>
              <Text>Montant: {paiement.montant} FCFA</Text>
              <Text>Type: {paiement.type_paiement}</Text>
              <Text>Date: {new Date(paiement.date_paiement).toLocaleDateString()}</Text>
              <Chip 
                style={[
                  styles.chip,
                  { backgroundColor: paiement.statut === 'payé' ? '#4CAF50' : '#f44336' }
                ]}
              >
                {paiement.statut}
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

const FinancesScreen = () => {
  const [stats, setStats] = useState({});
  const [chartData, setChartData] = useState(null);

  useEffect(() => {
    fetchFinances();
  }, []);

  const fetchFinances = async () => {
    try {
      const response = await api.get('/comptable/finances');
      setStats(response.data.stats);
      setChartData(response.data.chart);
    } catch (error) {
      console.error('Error fetching finances:', error);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Title>Résumé Financier</Title>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.total_recettes || 0}</Text>
              <Text style={styles.statLabel}>Recettes (FCFA)</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.total_depenses || 0}</Text>
              <Text style={styles.statLabel}>Dépenses (FCFA)</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.paiements_en_attente || 0}</Text>
              <Text style={styles.statLabel}>En attente</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.bourses_accordees || 0}</Text>
              <Text style={styles.statLabel}>Bourses</Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      {chartData && (
        <Card style={styles.card}>
          <Card.Content>
            <Title>Évolution des Recettes</Title>
            <LineChart
              data={chartData}
              width={screenWidth - 60}
              height={220}
              chartConfig={{
                backgroundColor: '#e26a00',
                backgroundGradientFrom: '#fb8c00',
                backgroundGradientTo: '#ffa726',
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
              }}
              bezier
              style={styles.chart}
            />
          </Card.Content>
        </Card>
      )}
    </ScrollView>
  );
};

const BoursesScreen = () => {
  const [bourses, setBourses] = useState([]);

  useEffect(() => {
    fetchBourses();
  }, []);

  const fetchBourses = async () => {
    try {
      const response = await api.get('/comptable/bourses');
      setBourses(response.data);
    } catch (error) {
      console.error('Error fetching bourses:', error);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView>
        {bourses.map(bourse => (
          <Card key={bourse.id} style={styles.card}>
            <Card.Content>
              <Title>{bourse.eleve.nom} {bourse.eleve.prenom}</Title>
              <Text>Classe: {bourse.eleve.classe.nom}</Text>
              <Text>Type de bourse: {bourse.type_bourse}</Text>
              <Text>Montant: {bourse.montant} FCFA</Text>
              <Text>Pourcentage: {bourse.pourcentage}%</Text>
              <Text>Période: {bourse.periode}</Text>
              <Chip 
                style={[
                  styles.chip,
                  { backgroundColor: bourse.statut === 'active' ? '#4CAF50' : '#FF9800' }
                ]}
              >
                {bourse.statut}
              </Chip>
            </Card.Content>
            <Card.Actions>
              <Button mode="outlined">Modifier</Button>
              <Button mode="contained">Renouveler</Button>
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
          <Text>Poste: Comptable</Text>
        </Card.Content>
      </Card>
      
      <Card style={styles.card}>
        <Card.Content>
          <Title>Rapports</Title>
          <Button mode="outlined" style={styles.reportButton}>
            Rapport mensuel
          </Button>
          <Button mode="outlined" style={styles.reportButton}>
            Rapport trimestriel
          </Button>
          <Button mode="outlined" style={styles.reportButton}>
            Rapport annuel
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

const ComptableDashboard = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          switch (route.name) {
            case 'Paiements': iconName = 'payment'; break;
            case 'Finances': iconName = 'trending-up'; break;
            case 'Bourses': iconName = 'school'; break;
            case 'Profil': iconName = 'person'; break;
          }
          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#FF5722',
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tab.Screen name="Paiements" component={PaiementsScreen} options={{ title: 'Paiements' }} />
      <Tab.Screen name="Finances" component={FinancesScreen} options={{ title: 'Finances' }} />
      <Tab.Screen name="Bourses" component={BoursesScreen} options={{ title: 'Bourses' }} />
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
    backgroundColor: '#fff3e0',
    borderRadius: 8,
    marginBottom: 10,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF5722',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
    textAlign: 'center',
  },
  chip: {
    marginTop: 10,
    alignSelf: 'flex-start',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#FF5722',
  },
  reportButton: {
    marginBottom: 10,
  },
  button: {
    marginTop: 20,
    paddingVertical: 8,
  },
});

export default ComptableDashboard;