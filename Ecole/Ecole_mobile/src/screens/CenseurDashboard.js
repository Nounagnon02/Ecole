import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Card, Title, Text, Button, FAB, Chip, ProgressBar } from 'react-native-paper';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { BarChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

const Tab = createBottomTabNavigator();
const screenWidth = Dimensions.get('window').width;

const ResultatsScreen = () => {
  const [resultats, setResultats] = useState([]);
  const [stats, setStats] = useState({});

  useEffect(() => {
    fetchResultats();
  }, []);

  const fetchResultats = async () => {
    try {
      const response = await api.get('/censeur/resultats');
      setResultats(response.data.resultats);
      setStats(response.data.stats);
    } catch (error) {
      console.error('Error fetching resultats:', error);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Title>Statistiques Académiques</Title>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.moyenne_generale || 0}</Text>
              <Text style={styles.statLabel}>Moyenne Générale</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.taux_reussite || 0}%</Text>
              <Text style={styles.statLabel}>Taux de Réussite</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.eleves_excellence || 0}</Text>
              <Text style={styles.statLabel}>Excellence</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.eleves_difficulte || 0}</Text>
              <Text style={styles.statLabel}>En Difficulté</Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      {resultats.map(classe => (
        <Card key={classe.id} style={styles.card}>
          <Card.Content>
            <Title>{classe.nom}</Title>
            <Text>Effectif: {classe.effectif} élèves</Text>
            <Text>Moyenne de classe: {classe.moyenne}/20</Text>
            <ProgressBar 
              progress={classe.moyenne / 20} 
              color="#3F51B5" 
              style={styles.progressBar}
            />
            <View style={styles.chipContainer}>
              <Chip style={[styles.chip, { backgroundColor: '#4CAF50' }]}>
                Admis: {classe.admis}
              </Chip>
              <Chip style={[styles.chip, { backgroundColor: '#f44336' }]}>
                Échec: {classe.echec}
              </Chip>
            </View>
          </Card.Content>
        </Card>
      ))}
    </ScrollView>
  );
};

const ConseilsScreen = () => {
  const [conseils, setConseils] = useState([]);

  useEffect(() => {
    fetchConseils();
  }, []);

  const fetchConseils = async () => {
    try {
      const response = await api.get('/censeur/conseils-classe');
      setConseils(response.data);
    } catch (error) {
      console.error('Error fetching conseils:', error);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView>
        {conseils.map(conseil => (
          <Card key={conseil.id} style={styles.card}>
            <Card.Content>
              <Title>Conseil de classe - {conseil.classe.nom}</Title>
              <Text>Date: {new Date(conseil.date).toLocaleDateString()}</Text>
              <Text>Trimestre: {conseil.trimestre}</Text>
              <Text>Participants: {conseil.participants?.length || 0}</Text>
              <Text>Décisions prises: {conseil.decisions?.length || 0}</Text>
              <Chip 
                style={[
                  styles.chip,
                  { backgroundColor: conseil.statut === 'terminé' ? '#4CAF50' : '#FF9800' }
                ]}
              >
                {conseil.statut}
              </Chip>
            </Card.Content>
            <Card.Actions>
              <Button mode="outlined">Voir détails</Button>
              <Button mode="contained">Modifier</Button>
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

const ExamensScreen = () => {
  const [examens, setExamens] = useState([]);

  useEffect(() => {
    fetchExamens();
  }, []);

  const fetchExamens = async () => {
    try {
      const response = await api.get('/censeur/examens');
      setExamens(response.data);
    } catch (error) {
      console.error('Error fetching examens:', error);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView>
        {examens.map(examen => (
          <Card key={examen.id} style={styles.card}>
            <Card.Content>
              <Title>{examen.nom}</Title>
              <Text>Type: {examen.type}</Text>
              <Text>Date début: {new Date(examen.date_debut).toLocaleDateString()}</Text>
              <Text>Date fin: {new Date(examen.date_fin).toLocaleDateString()}</Text>
              <Text>Classes concernées: {examen.classes?.map(c => c.nom).join(', ')}</Text>
              <Text>Matières: {examen.matieres?.length || 0}</Text>
              <Chip 
                style={[
                  styles.chip,
                  { 
                    backgroundColor: 
                      examen.statut === 'programmé' ? '#2196F3' :
                      examen.statut === 'en_cours' ? '#FF9800' : '#4CAF50'
                  }
                ]}
              >
                {examen.statut}
              </Chip>
            </Card.Content>
            <Card.Actions>
              <Button mode="outlined">Planning</Button>
              <Button mode="contained">Résultats</Button>
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
  const [chartData, setChartData] = useState(null);

  useEffect(() => {
    fetchChartData();
  }, []);

  const fetchChartData = async () => {
    try {
      const response = await api.get('/censeur/stats-chart');
      setChartData(response.data);
    } catch (error) {
      console.error('Error fetching chart data:', error);
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
          <Text>Poste: Censeur</Text>
        </Card.Content>
      </Card>

      {chartData && (
        <Card style={styles.card}>
          <Card.Content>
            <Title>Évolution des Résultats</Title>
            <BarChart
              data={chartData}
              width={screenWidth - 60}
              height={220}
              chartConfig={{
                backgroundColor: '#3F51B5',
                backgroundGradientFrom: '#3F51B5',
                backgroundGradientTo: '#5C6BC0',
                decimalPlaces: 1,
                color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
              }}
              style={styles.chart}
            />
          </Card.Content>
        </Card>
      )}
      
      <Card style={styles.card}>
        <Card.Content>
          <Title>Actions Rapides</Title>
          <Button mode="outlined" style={styles.actionButton}>
            Valider emplois du temps
          </Button>
          <Button mode="outlined" style={styles.actionButton}>
            Générer rapport académique
          </Button>
          <Button mode="outlined" style={styles.actionButton}>
            Programmer conseil de classe
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

const CenseurDashboard = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          switch (route.name) {
            case 'Resultats': iconName = 'trending-up'; break;
            case 'Conseils': iconName = 'group'; break;
            case 'Examens': iconName = 'quiz'; break;
            case 'Profil': iconName = 'person'; break;
          }
          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#3F51B5',
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tab.Screen name="Resultats" component={ResultatsScreen} options={{ title: 'Résultats' }} />
      <Tab.Screen name="Conseils" component={ConseilsScreen} options={{ title: 'Conseils' }} />
      <Tab.Screen name="Examens" component={ExamensScreen} options={{ title: 'Examens' }} />
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
    backgroundColor: '#e8eaf6',
    borderRadius: 8,
    marginBottom: 10,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#3F51B5',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
    textAlign: 'center',
  },
  progressBar: {
    marginTop: 10,
    height: 8,
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
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#3F51B5',
  },
  actionButton: {
    marginBottom: 10,
  },
  button: {
    marginTop: 20,
    paddingVertical: 8,
  },
});

export default CenseurDashboard;