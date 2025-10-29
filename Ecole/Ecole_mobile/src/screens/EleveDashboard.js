import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Card, Title, Text, Button, List, ProgressBar } from 'react-native-paper';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

const Tab = createBottomTabNavigator();

const BulletinScreen = () => {
  const [bulletin, setBulletin] = useState(null);
  const [periode, setPeriode] = useState('1er_trimestre');

  useEffect(() => {
    fetchBulletin();
  }, [periode]);

  const fetchBulletin = async () => {
    try {
      const response = await api.get(`/eleve/bulletin/${periode}`);
      setBulletin(response.data);
    } catch (error) {
      console.error('Error fetching bulletin:', error);
    }
  };

  if (!bulletin) return <Text>Chargement...</Text>;

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Title>Bulletin - {periode.replace('_', ' ')}</Title>
          <Text>Moyenne générale: {bulletin.moyenne_generale}/20</Text>
          <Text>Rang: {bulletin.rang?.position}/{bulletin.rang?.total_eleves}</Text>
          <ProgressBar 
            progress={bulletin.moyenne_generale / 20} 
            color="#4CAF50" 
            style={styles.progressBar}
          />
        </Card.Content>
      </Card>

      {bulletin.moyennes_par_matiere?.map(matiere => (
        <Card key={matiere.matiere} style={styles.card}>
          <Card.Content>
            <Title>{matiere.matiere}</Title>
            <Text>Moyenne: {matiere.moyenne}/20</Text>
            <Text>Coefficient: {matiere.coefficient}</Text>
            <Text>Rang: {matiere.rang?.position}/{matiere.rang?.total_eleves}</Text>
            <ProgressBar 
              progress={matiere.moyenne / 20} 
              color="#2196F3" 
              style={styles.progressBar}
            />
          </Card.Content>
        </Card>
      ))}
    </ScrollView>
  );
};

const DevoirsScreen = () => {
  const [devoirs, setDevoirs] = useState([]);

  useEffect(() => {
    fetchDevoirs();
  }, []);

  const fetchDevoirs = async () => {
    try {
      const response = await api.get('/eleve/devoirs');
      setDevoirs(response.data);
    } catch (error) {
      console.error('Error fetching devoirs:', error);
    }
  };

  return (
    <ScrollView style={styles.container}>
      {devoirs.map(devoir => (
        <Card key={devoir.id} style={styles.card}>
          <Card.Content>
            <Title>{devoir.titre}</Title>
            <Text>Matière: {devoir.matiere}</Text>
            <Text>Description: {devoir.description}</Text>
            <Text>Date limite: {new Date(devoir.date_limite).toLocaleDateString()}</Text>
            <Text style={[
              styles.status,
              { color: devoir.rendu ? '#4CAF50' : '#f44336' }
            ]}>
              {devoir.rendu ? 'Rendu' : 'À rendre'}
            </Text>
          </Card.Content>
          {!devoir.rendu && (
            <Card.Actions>
              <Button mode="outlined">Rendre le devoir</Button>
            </Card.Actions>
          )}
        </Card>
      ))}
    </ScrollView>
  );
};

const EmploiScreen = () => {
  const [emploi, setEmploi] = useState([]);

  useEffect(() => {
    fetchEmploi();
  }, []);

  const fetchEmploi = async () => {
    try {
      const response = await api.get('/eleve/emploi-du-temps');
      setEmploi(response.data);
    } catch (error) {
      console.error('Error fetching emploi:', error);
    }
  };

  const jours = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi'];

  return (
    <ScrollView style={styles.container}>
      {jours.map(jour => (
        <Card key={jour} style={styles.card}>
          <Card.Content>
            <Title>{jour}</Title>
            {emploi
              .filter(cours => cours.jour === jour.toLowerCase())
              .map(cours => (
                <View key={cours.id} style={styles.coursItem}>
                  <Text style={styles.coursTime}>{cours.heure_debut} - {cours.heure_fin}</Text>
                  <Text style={styles.coursMatiere}>{cours.matiere}</Text>
                  <Text style={styles.coursProf}>Prof: {cours.enseignant}</Text>
                  <Text style={styles.coursSalle}>Salle: {cours.salle}</Text>
                </View>
              ))}
          </Card.Content>
        </Card>
      ))}
    </ScrollView>
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
          <Text>Classe: {user?.classe?.nom}</Text>
          <Text>Matricule: {user?.matricule}</Text>
          <Text>Date de naissance: {user?.date_naissance}</Text>
        </Card.Content>
      </Card>
      
      <Card style={styles.card}>
        <Card.Content>
          <Title>Actions</Title>
          <List.Item
            title="Messages"
            left={props => <List.Icon {...props} icon="message" />}
            onPress={() => {}}
          />
          <List.Item
            title="Absences"
            left={props => <List.Icon {...props} icon="event-busy" />}
            onPress={() => {}}
          />
          <List.Item
            title="Sanctions"
            left={props => <List.Icon {...props} icon="warning" />}
            onPress={() => {}}
          />
          <List.Item
            title="Paramètres"
            left={props => <List.Icon {...props} icon="settings" />}
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

const EleveDashboard = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          switch (route.name) {
            case 'Bulletin': iconName = 'assessment'; break;
            case 'Devoirs': iconName = 'assignment'; break;
            case 'Emploi': iconName = 'schedule'; break;
            case 'Profil': iconName = 'person'; break;
          }
          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#FF9800',
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tab.Screen name="Bulletin" component={BulletinScreen} options={{ title: 'Bulletin' }} />
      <Tab.Screen name="Devoirs" component={DevoirsScreen} options={{ title: 'Devoirs' }} />
      <Tab.Screen name="Emploi" component={EmploiScreen} options={{ title: 'Emploi du temps' }} />
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
  progressBar: {
    marginTop: 10,
    height: 8,
  },
  status: {
    fontWeight: 'bold',
    marginTop: 5,
  },
  coursItem: {
    backgroundColor: '#f0f0f0',
    padding: 10,
    marginVertical: 5,
    borderRadius: 5,
  },
  coursTime: {
    fontWeight: 'bold',
    color: '#2196F3',
  },
  coursMatiere: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 2,
  },
  coursProf: {
    color: '#666',
    marginTop: 2,
  },
  coursSalle: {
    color: '#666',
    marginTop: 2,
  },
  button: {
    marginTop: 20,
    paddingVertical: 8,
  },
});

export default EleveDashboard;