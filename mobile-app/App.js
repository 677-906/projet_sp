import React, { useContext, useEffect, useRef, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Ionicons from 'react-native-vector-icons/Ionicons';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Alert, Platform } from 'react-native';
import api from './api/axiosConfig'; // Assurez-vous que le chemin est correct

import LoginScreen from './screens/LoginScreen';
import HomeScreen from './screens/HomeScreen';
import ClientsScreen from './screens/ClientsScreen';
import VisitFormScreen from './screens/VisitFormScreen';
import ProfileScreen from './screens/ProfileScreen';
import SettingsScreen from './screens/SettingsScreen';

import { AuthProvider, AuthContext } from './context/AuthContext';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

async function registerForPushNotificationsAsync() {
  let token;
  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      Alert.alert('Permission refusée', 'Impossible d\'obtenir le token pour les notifications push !');
      return;
    }
    try {
      const projectId = Constants.expoConfig.extra.eas.projectId;
      token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
      console.log("Expo Push Token:", token);
    } catch (e) {
      Alert.alert('Erreur de Token', `Une erreur est survenue lors de la récupération du token : ${e}`);
    }
  } else {
    Alert.alert('Non supporté', 'Les notifications Push ne sont pas supportées sur un simulateur.');
  }

  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  return token;
}


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
  const notificationListener = useRef();
  const responseListener = useRef();

  useEffect(() => {
    if (userToken) {
      registerForPushNotificationsAsync().then(token => {
        if (token) {
          api.put('/users/me/push-token', { push_token: token })
            .catch(error => {
              console.error("Erreur lors de l'envoi du token au serveur:", error);
            });
        }
      });

      notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
        console.log("Notification reçue:", notification);
      });

      responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
        console.log("Réponse à la notification:", response);
      });

      return () => {
        Notifications.removeNotificationSubscription(notificationListener.current);
        Notifications.removeNotificationSubscription(responseListener.current);
      };
    }
  }, [userToken]);


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