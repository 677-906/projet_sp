import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ActivityIndicator, View } from 'react-native';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [userToken, setUserToken] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [isLoading, setIsLoading] = useState(true); // Pour le chargement initial

  // Au démarrage, on vérifie si un token est déjà stocké
  useEffect(() => {
    const bootstrapAsync = async () => {
      let token, role;
      try {
        token = await AsyncStorage.getItem('userToken');
        role = await AsyncStorage.getItem('userRole');
      } catch (e) {
        console.error("Erreur lors de la récupération du token", e);
      }
      setUserToken(token);
      setUserRole(role);
      setIsLoading(false);
    };
    bootstrapAsync();
  }, []);

  const authContextValue = {
    signIn: async (token, role) => {
      try {
        await AsyncStorage.setItem('userToken', token);
        await AsyncStorage.setItem('userRole', role);
        setUserToken(token);
        setUserRole(role);
      } catch (e) {
        console.error("Erreur lors de la sauvegarde du token", e);
      }
    },
    signOut: async () => {
      try {
        await AsyncStorage.removeItem('userToken');
        await AsyncStorage.removeItem('userRole');
        setUserToken(null);
        setUserRole(null);
      } catch (e) {
        console.error("Erreur lors de la suppression du token", e);
      }
    },
    userToken,
    userRole,
  };

  // On affiche un écran de chargement tant qu'on ne sait pas si l'utilisateur est connecté
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
};