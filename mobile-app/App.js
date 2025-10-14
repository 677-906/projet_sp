import React, { useContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Ionicons from 'react-native-vector-icons/Ionicons';

import LoginScreen from './screens/LoginScreen';
import HomeScreen from './screens/HomeScreen';
import ClientsScreen from './screens/ClientsScreen';
import VisitFormScreen from './screens/VisitFormScreen';
import ProfileScreen from './screens/ProfileScreen';
import SettingsScreen from './screens/SettingsScreen';

import { AuthProvider, AuthContext } from './context/AuthContext';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();


// La pile d'écrans pour un utilisateur NON authentifié
function AuthStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: "Paramètres du Serveur" }} />
    </Stack.Navigator>
  );
}

// La navigation principale (onglets) pour un utilisateur authentifié
function HomeTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Accueil') iconName = focused ? 'home' : 'home-outline';
          else if (route.name === 'Clients') iconName = focused ? 'list' : 'list-outline';
          else if (route.name === 'Profil') iconName = focused ? 'person' : 'person-outline';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        headerShown: false,
      })}
    >
      <Tab.Screen name="Accueil" component={HomeScreen} />
      <Tab.Screen name="Clients" component={ClientsScreen} />
      <Tab.Screen name="Profil" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

// La pile d'écrans pour un utilisateur authentifié
// Elle contient les onglets ET les écrans qui s'affichent par-dessus
function AppStack() {
    return (
        <Stack.Navigator>
            <Stack.Screen name="MainTabs" component={HomeTabs} options={{ headerShown: false }} />
            <Stack.Screen name="VisitForm" component={VisitFormScreen} options={{ title: 'Rapport de Visite' }} />
            <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Paramètres du Serveur' }} />
        </Stack.Navigator>
    );
}


// Le composant qui choisit quelle pile afficher (Auth ou App)
function AppNavigator() {
  const { userToken } = useContext(AuthContext);

  return (
    <NavigationContainer>
      {userToken == null ? <AuthStack /> : <AppStack />}
    </NavigationContainer>
  );
}

// Le point d'entrée final de l'application
export default function App() {
  return (
    <AuthProvider>
      <AppNavigator />
    </AuthProvider>
  );
}