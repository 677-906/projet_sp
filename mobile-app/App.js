import React, { useContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import LoginScreen from './screens/LoginScreen';
import HomeScreen from './screens/HomeScreen';
import ClientsScreen from './screens/ClientsScreen';
import VisitFormScreen from './screens/VisitFormScreen';
import ProfileScreen from './screens/ProfileScreen';
import SettingsScreen from './screens/SettingsScreen';
import NotificationsScreen from './screens/NotificationsScreen';

import { AuthProvider, AuthContext } from './context/AuthContext';
import { NotificationProvider, NotificationContext } from './context/NotificationContext';
import ErrorBoundary from './components/ErrorBoundary';
import ErrorDisplay from './components/ErrorDisplay';

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
  const { unreadCount } = useContext(NotificationContext);
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Accueil') iconName = focused ? 'home' : 'home-outline';
          else if (route.name === 'Clients') iconName = focused ? 'list' : 'list-outline';
          else if (route.name === 'Notifications') iconName = focused ? 'notifications' : 'notifications-outline';
          else if (route.name === 'Profil') iconName = focused ? 'person' : 'person-outline';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        headerShown: false,
        // Style de la barre de tabs - hauteur adaptée à la zone de sécurité
        tabBarStyle: {
          height: 56 + insets.bottom,
          paddingBottom: insets.bottom,
          paddingTop: 5,
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#e0e0e0',
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        tabBarActiveTintColor: '#007bff',
        tabBarInactiveTintColor: '#6c757d',
      })}
    >
      <Tab.Screen name="Accueil" component={HomeScreen} />
      <Tab.Screen name="Clients" component={ClientsScreen} />
      <Tab.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{
          tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
          tabBarBadgeStyle: { backgroundColor: '#e74c3c', color: 'white' }
        }}
      />
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
    <ErrorBoundary>
      <SafeAreaProvider>
        <AuthProvider>
          <NotificationProvider>
            <AppNavigator />
            {/* Affichage des erreurs en bas de l'écran */}
            <ErrorDisplay />
          </NotificationProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}