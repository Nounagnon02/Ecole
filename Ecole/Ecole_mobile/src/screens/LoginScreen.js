import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { TextInput, Button, Card, Title, Text } from 'react-native-paper';
import { Picker } from '@react-native-picker/picker';
import { useAuth } from '../context/AuthContext';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('directeur');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    setLoading(true);
    try {
      const userData = await login({ email, password, role });
      
      const dashboardMap = {
        directeur: 'DirecteurDashboard',
        enseignant: 'EnseignantDashboard',
        eleve: 'EleveDashboard',
        parent: 'ParentDashboard',
        comptable: 'ComptableDashboard',
        surveillant: 'SurveillantDashboard',
        censeur: 'CenseurDashboard',
        infirmier: 'InfirmierDashboard',
        bibliothecaire: 'BibliothecaireDashboard',
        secretaire: 'SecretaireDashboard'
      };

      navigation.replace(dashboardMap[userData.role] || 'DirecteurDashboard');
    } catch (error) {
      Alert.alert('Erreur', 'Identifiants incorrects');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.title}>École Mobile</Title>
          
          <TextInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            mode="outlined"
            style={styles.input}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          
          <TextInput
            label="Mot de passe"
            value={password}
            onChangeText={setPassword}
            mode="outlined"
            style={styles.input}
            secureTextEntry
          />
          
          <Text style={styles.label}>Rôle</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={role}
              onValueChange={setRole}
              style={styles.picker}
            >
              <Picker.Item label="Directeur" value="directeur" />
              <Picker.Item label="Enseignant" value="enseignant" />
              <Picker.Item label="Élève" value="eleve" />
              <Picker.Item label="Parent" value="parent" />
              <Picker.Item label="Comptable" value="comptable" />
              <Picker.Item label="Surveillant" value="surveillant" />
              <Picker.Item label="Censeur" value="censeur" />
              <Picker.Item label="Infirmier" value="infirmier" />
              <Picker.Item label="Bibliothécaire" value="bibliothecaire" />
              <Picker.Item label="Secrétaire" value="secretaire" />
            </Picker>
          </View>
          
          <Button
            mode="contained"
            onPress={handleLogin}
            loading={loading}
            style={styles.button}
          >
            Se connecter
          </Button>
        </Card.Content>
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  card: {
    padding: 20,
  },
  title: {
    textAlign: 'center',
    marginBottom: 30,
    fontSize: 24,
    color: '#2196F3',
  },
  input: {
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
    color: '#666',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    marginBottom: 15,
  },
  picker: {
    height: 50,
  },
  button: {
    marginTop: 20,
    paddingVertical: 8,
  },
});

export default LoginScreen;