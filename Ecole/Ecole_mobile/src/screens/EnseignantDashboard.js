import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { Card, Title, Text, Button, FAB, List, TextInput, Modal, Portal } from 'react-native-paper';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

const Tab = createBottomTabNavigator();

const ClassesScreen = () => {
  const [classes, setClasses] = useState([]);

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      const response = await api.get('/enseignant/classes');
      setClasses(response.data);
    } catch (error) {
      console.error('Error fetching classes:', error);
    }
  };

  return (
    <ScrollView style={styles.container}>
      {classes.map(classe => (
        <Card key={classe.id} style={styles.card}>
          <Card.Content>
            <Title>{classe.nom}</Title>
            <Text>Effectif: {classe.eleves_count} élèves</Text>
            <Text>Matière: {classe.matiere}</Text>
            <Button mode="outlined" onPress={() => {}}>
              Voir les élèves
            </Button>
          </Card.Content>
        </Card>
      ))}
    </ScrollView>
  );
};

const NotesScreen = () => {
  const [notes, setNotes] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedEleve, setSelectedEleve] = useState(null);
  const [noteValue, setNoteValue] = useState('');

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    try {
      const response = await api.get('/enseignant/notes');
      setNotes(response.data);
    } catch (error) {
      console.error('Error fetching notes:', error);
    }
  };

  const ajouterNote = async () => {
    try {
      await api.post('/notes', {
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
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView>
        {notes.map(note => (
          <Card key={note.id} style={styles.card}>
            <Card.Content>
              <Title>{note.eleve.nom} {note.eleve.prenom}</Title>
              <Text>Classe: {note.eleve.classe.nom}</Text>
              <Text>Note: {note.note}/{note.note_sur}</Text>
              <Text>Type: {note.type_evaluation}</Text>
              <Text>Date: {new Date(note.created_at).toLocaleDateString()}</Text>
            </Card.Content>
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
              <Title>Ajouter une note</Title>
              <TextInput
                label="Note"
                value={noteValue}
                onChangeText={setNoteValue}
                mode="outlined"
                keyboardType="numeric"
                style={styles.input}
              />
              <Button mode="contained" onPress={ajouterNote}>
                Ajouter
              </Button>
            </Card.Content>
          </Card>
        </Modal>
      </Portal>
    </View>
  );
};

const DevoirsScreen = () => {
  const [devoirs, setDevoirs] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [titre, setTitre] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    fetchDevoirs();
  }, []);

  const fetchDevoirs = async () => {
    try {
      const response = await api.get('/enseignant/devoirs');
      setDevoirs(response.data);
    } catch (error) {
      console.error('Error fetching devoirs:', error);
    }
  };

  const ajouterDevoir = async () => {
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
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView>
        {devoirs.map(devoir => (
          <Card key={devoir.id} style={styles.card}>
            <Card.Content>
              <Title>{devoir.titre}</Title>
              <Text>{devoir.description}</Text>
              <Text>Classe: {devoir.classe.nom}</Text>
              <Text>Date limite: {new Date(devoir.date_limite).toLocaleDateString()}</Text>
            </Card.Content>
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
              <Title>Nouveau devoir</Title>
              <TextInput
                label="Titre"
                value={titre}
                onChangeText={setTitre}
                mode="outlined"
                style={styles.input}
              />
              <TextInput
                label="Description"
                value={description}
                onChangeText={setDescription}
                mode="outlined"
                multiline
                numberOfLines={4}
                style={styles.input}
              />
              <Button mode="contained" onPress={ajouterDevoir}>
                Ajouter
              </Button>
            </Card.Content>
          </Card>
        </Modal>
      </Portal>
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
          <Text>Matières enseignées: {user?.matieres?.map(m => m.nom).join(', ')}</Text>
        </Card.Content>
      </Card>
      
      <Card style={styles.card}>
        <Card.Content>
          <Title>Actions</Title>
          <List.Item
            title="Emploi du temps"
            left={props => <List.Icon {...props} icon="calendar" />}
            onPress={() => {}}
          />
          <List.Item
            title="Messages"
            left={props => <List.Icon {...props} icon="message" />}
            onPress={() => {}}
          />
          <List.Item
            title="Paramètres"
            left={props => <List.Icon {...props} icon="cog" />}
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

const EnseignantDashboard = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          switch (route.name) {
            case 'Classes': iconName = 'school'; break;
            case 'Notes': iconName = 'grade'; break;
            case 'Devoirs': iconName = 'assignment'; break;
            case 'Profil': iconName = 'person'; break;
          }
          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#4CAF50',
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tab.Screen name="Classes" component={ClassesScreen} options={{ title: 'Mes Classes' }} />
      <Tab.Screen name="Notes" component={NotesScreen} options={{ title: 'Notes' }} />
      <Tab.Screen name="Devoirs" component={DevoirsScreen} options={{ title: 'Devoirs' }} />
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
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#4CAF50',
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

export default EnseignantDashboard;