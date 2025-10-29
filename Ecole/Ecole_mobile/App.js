import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { Provider as PaperProvider } from 'react-native-paper';
import { AuthProvider } from './src/context/AuthContext';
import LoginScreen from './src/screens/LoginScreen';
import DirecteurDashboard from './src/screens/DirecteurDashboard';
import EnseignantDashboard from './src/screens/EnseignantDashboard';
import EleveDashboard from './src/screens/EleveDashboard';
import ParentDashboard from './src/screens/ParentDashboard';
import ComptableDashboard from './src/screens/ComptableDashboard';
import SurveillantDashboard from './src/screens/SurveillantDashboard';
import CenseurDashboard from './src/screens/CenseurDashboard';
import InfirmierDashboard from './src/screens/InfirmierDashboard';
import BibliothecaireDashboard from './src/screens/BibliothecaireDashboard';
import SecretaireDashboard from './src/screens/SecretaireDashboard';

const Stack = createStackNavigator();

export default function App() {
  return (
    <PaperProvider>
      <AuthProvider>
        <NavigationContainer>
          <Stack.Navigator initialRouteName="Login" screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="DirecteurDashboard" component={DirecteurDashboard} />
            <Stack.Screen name="EnseignantDashboard" component={EnseignantDashboard} />
            <Stack.Screen name="EleveDashboard" component={EleveDashboard} />
            <Stack.Screen name="ParentDashboard" component={ParentDashboard} />
            <Stack.Screen name="ComptableDashboard" component={ComptableDashboard} />
            <Stack.Screen name="SurveillantDashboard" component={SurveillantDashboard} />
            <Stack.Screen name="CenseurDashboard" component={CenseurDashboard} />
            <Stack.Screen name="InfirmierDashboard" component={InfirmierDashboard} />
            <Stack.Screen name="BibliothecaireDashboard" component={BibliothecaireDashboard} />
            <Stack.Screen name="SecretaireDashboard" component={SecretaireDashboard} />
          </Stack.Navigator>
        </NavigationContainer>
      </AuthProvider>
    </PaperProvider>
  );
}