import React, { useContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Ionicons from 'react-native-vector-icons/Ionicons';

import LoginScreen from './screens/LoginScreen';
import HomeScreen from './screens/HomeScreen';
import ClientsScreen from './screens/ClientsScreen';
import VisitFormScreen from './screens/VisitFormScreen'; // On importe le nouvel écran
import { AuthProvider, AuthContext } from './context/AuthContext';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// C'est notre navigation par onglets, elle ne change pas
function MainAppTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName = route.name === 'Accueil' ? (focused ? 'home' : 'home-outline') : (focused ? 'list' : 'list-outline');
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Accueil" component={HomeScreen} />
      <Tab.Screen name="Clients" component={ClientsScreen} />
    </Tab.Navigator>
  );
}

// C'est notre nouvelle structure globale
function AppNavigator() {
  const { userToken } = useContext(AuthContext);

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {userToken == null ? (
          // Si pas de token, seule la page de Connexion est accessible
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        ) : (
          // Si connecté, on accède à la navigation principale
          <>
            <Stack.Screen name="Main" component={MainAppTabs} options={{ headerShown: false }} />
            <Stack.Screen 
              name="VisitForm" 
              component={VisitFormScreen} 
              options={{ title: 'Rapport de Visite' }} // Le titre en haut de l'écran
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppNavigator />
    </AuthProvider>
  );
}