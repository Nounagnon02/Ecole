import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { Card, Title, Text, Button, List, Chip } from 'react-native-paper';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialIcons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

const Tab = createBottomTabNavigator();

const EnfantsScreen = () => {
  const [enfants, setEnfants] = useState([]);

  useEffect(() => {
    fetchEnfants();
  }, []);

  const fetchEnfants = async () => {
    try {
      const response = await api.get('/parent/enfants');
      setEnfants(response.data);
    } catch (error) {
      console.error('Error fetching enfants:', error);
    }
  };

  return (
    <ScrollView style={styles.container}>
      {enfants.map(enfant => (
        <Card key={enfant.id} style={styles.card}>
          <Card.Content>
            <Title>{enfant.nom} {enfant.prenom}</Title>
            <Text>Classe: {enfant.classe.nom}</Text>
            <Text>Matricule: {enfant.matricule}</Text>
            <View style={styles.chipContainer}>
              <Chip icon="school" style={styles.chip}>
                Moyenne: {enfant.moyenne_generale || 'N/A'}/20
              </Chip>
              <Chip icon="event-busy" style={styles.chip}>
                Absences: {enfant.absences_count || 0}
              </Chip>
            </View>
          </Card.Content>
          <Card.Actions>
            <Button mode="outlined" onPress={() => {}}>
              Voir détails
            </Button>
          </Card.Actions>
        </Card>
      ))}
    </ScrollView>
  );
};

const BulletinsScreen = () => {
  const [bulletins, setBulletins] = useState([]);
  const [selectedEnfant, setSelectedEnfant] = useState(null);

  useEffect(() => {
    fetchBulletins();
  }, []);

  const fetchBulletins = async () => {
    try {
      const response = await api.get('/parent/bulletins');
      setBulletins(response.data);
    } catch (error) {
      console.error('Error fetching bulletins:', error);
    }
  };

  const telechargerBulletin = async (enfantId, periode) => {
    try {
      const response = await api.get(`/parent/bulletin/${enfantId}/${periode}`);
      const bulletin = response.data;
      
      const htmlContent = generateBulletinHTML(bulletin);
      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri);
      } else {
        Alert.alert('Succès', 'Bulletin généré avec succès');
      }
    } catch (error) {
      Alert.alert('Erreur', 'Erreur lors du téléchargement du bulletin');
    }
  };

  const generateBulletinHTML = (bulletin) => {
    return `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .student-info { margin-bottom: 20px; }
            .grades-table { width: 100%; border-collapse: collapse; }
            .grades-table th, .grades-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            .grades-table th { background-color: #f2f2f2; }
            .summary { margin-top: 20px; text-align: center; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>BULLETIN SCOLAIRE</h1>
            <h2>${bulletin.periode}</h2>
          </div>
          
          <div class="student-info">
            <p><strong>Nom:</strong> ${bulletin.eleve.nom} ${bulletin.eleve.prenom}</p>
            <p><strong>Classe:</strong> ${bulletin.eleve.classe.nom}</p>
            <p><strong>Matricule:</strong> ${bulletin.eleve.matricule}</p>
          </div>
          
          <table class="grades-table">
            <thead>
              <tr>
                <th>Matière</th>
                <th>Moyenne</th>
                <th>Coefficient</th>
                <th>Rang</th>
              </tr>
            </thead>
            <tbody>
              ${bulletin.moyennes_par_matiere?.map(matiere => `
                <tr>
                  <td>${matiere.matiere}</td>
                  <td>${matiere.moyenne}/20</td>
                  <td>${matiere.coefficient}</td>
                  <td>${matiere.rang?.position}/${matiere.rang?.total_eleves}</td>
                </tr>
              `).join('') || ''}
            </tbody>
          </table>
          
          <div class="summary">
            <h3>Moyenne Générale: ${bulletin.moyenne_generale}/20</h3>
            <h3>Rang: ${bulletin.rang?.position}/${bulletin.rang?.total_eleves}</h3>
          </div>
        </body>
      </html>
    `;
  };

  return (
    <ScrollView style={styles.container}>
      {bulletins.map(bulletin => (
        <Card key={`${bulletin.enfant_id}-${bulletin.periode}`} style={styles.card}>
          <Card.Content>
            <Title>{bulletin.enfant_nom} - {bulletin.periode}</Title>
            <Text>Moyenne générale: {bulletin.moyenne_generale}/20</Text>
            <Text>Rang: {bulletin.rang?.position}/{bulletin.rang?.total_eleves}</Text>
          </Card.Content>
          <Card.Actions>
            <Button 
              mode="contained" 
              onPress={() => telechargerBulletin(bulletin.enfant_id, bulletin.periode)}
              icon="download"
            >
              Télécharger
            </Button>
          </Card.Actions>
        </Card>
      ))}
    </ScrollView>
  );
};

const CommunicationScreen = () => {
  const [messages, setMessages] = useState([]);
  const [rdvs, setRdvs] = useState([]);

  useEffect(() => {
    fetchMessages();
    fetchRdvs();
  }, []);

  const fetchMessages = async () => {
    try {
      const response = await api.get('/parent/messages');
      setMessages(response.data);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const fetchRdvs = async () => {
    try {
      const response = await api.get('/parent/rendez-vous');
      setRdvs(response.data);
    } catch (error) {
      console.error('Error fetching rdvs:', error);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Title>Messages récents</Title>
          {messages.map(message => (
            <List.Item
              key={message.id}
              title={message.sujet}
              description={`De: ${message.expediteur} - ${new Date(message.created_at).toLocaleDateString()}`}
              left={props => <List.Icon {...props} icon="message" />}
              onPress={() => {}}
            />
          ))}
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Title>Rendez-vous</Title>
          {rdvs.map(rdv => (
            <List.Item
              key={rdv.id}
              title={rdv.motif}
              description={`${new Date(rdv.date).toLocaleDateString()} à ${rdv.heure} - ${rdv.enseignant}`}
              left={props => <List.Icon {...props} icon="event" />}
              right={props => (
                <Chip 
                  {...props} 
                  style={{ backgroundColor: rdv.statut === 'confirmé' ? '#4CAF50' : '#FF9800' }}
                >
                  {rdv.statut}
                </Chip>
              )}
            />
          ))}
        </Card.Content>
        <Card.Actions>
          <Button mode="outlined" icon="plus">
            Demander un RDV
          </Button>
        </Card.Actions>
      </Card>
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
          <Text>Email: {user?.email}</Text>
          <Text>Téléphone: {user?.telephone}</Text>
          <Text>Adresse: {user?.adresse}</Text>
        </Card.Content>
      </Card>
      
      <Card style={styles.card}>
        <Card.Content>
          <Title>Actions</Title>
          <List.Item
            title="Paiements"
            left={props => <List.Icon {...props} icon="payment" />}
            onPress={() => {}}
          />
          <List.Item
            title="Historique"
            left={props => <List.Icon {...props} icon="history" />}
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

const ParentDashboard = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          switch (route.name) {
            case 'Enfants': iconName = 'child-care'; break;
            case 'Bulletins': iconName = 'assessment'; break;
            case 'Communication': iconName = 'chat'; break;
            case 'Profil': iconName = 'person'; break;
          }
          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#9C27B0',
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tab.Screen name="Enfants" component={EnfantsScreen} options={{ title: 'Mes Enfants' }} />
      <Tab.Screen name="Bulletins" component={BulletinsScreen} options={{ title: 'Bulletins' }} />
      <Tab.Screen name="Communication" component={CommunicationScreen} options={{ title: 'Messages' }} />
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
  button: {
    marginTop: 20,
    paddingVertical: 8,
  },
});

export default ParentDashboard;