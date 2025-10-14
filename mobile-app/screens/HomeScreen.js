import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ActivityIndicator, TouchableOpacity } from 'react-native';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import axiosInstance from '../api/axiosConfig';
import Ionicons from 'react-native-vector-icons/Ionicons';

// --- À CONFIGURER ---
const API_URL = 'http://192.168.43.117:8000'; 
// --------------------

export default function HomeScreen() {
  // On crée des états pour stocker les infos de l'utilisateur et gérer le chargement
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // On récupère le token et la fonction de déconnexion depuis notre contexte
  const { userToken, signOut } = useContext(AuthContext);

  useEffect(() => {
    // Cette fonction va chercher les informations de l'utilisateur connecté
    const fetchUserData = async () => {
      try {
        // On appelle la route /users/me/ qui est protégée par le token
        const response = await axios.get(`${API_URL}/users/me/`, {
          headers: {
            'Authorization': `Bearer ${userToken}`
          }
        });
        setUserData(response.data); // On stocke les données reçues
      } catch (e) {
        console.error("Erreur lors de la récupération des infos utilisateur", e);
        // Si le token est invalide (expiré...), on pourrait déconnecter l'utilisateur
        // signOut(); 
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, []); // Le tableau vide [] signifie que cet effet ne se déclenche qu'une seule fois, au montage de l'écran.

  // Affiche un indicateur de chargement
  if (isLoading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#007bff" /></View>;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.welcomeMessage}>Bienvenue,</Text>
          {/* On affiche le nom de l'utilisateur s'il a été chargé */}
          <Text style={styles.userName}>{userData ? userData.nom : 'Merchandiser'}</Text>
        </View>
        <TouchableOpacity onPress={signOut} style={styles.logoutButton}>
          <Ionicons name="log-out-outline" size={28} color="#dc3545" />
        </TouchableOpacity>
      </View>

      {/* Section pour les KPIs (à développer plus tard) */}
      <View style={styles.kpiContainer}>
        <View style={styles.kpiBox}>
          <Text style={styles.kpiValue}>8</Text>
          <Text style={styles.kpiLabel}>Visites Aujourd'hui</Text>
        </View>
        <View style={styles.kpiBox}>
          <Text style={styles.kpiValue}>1.2M</Text>
          <Text style={styles.kpiLabel}>CA du Mois</Text>
        </View>
      </View>
      
      {/* (Ici viendra la liste des activités récentes, etc.) */}

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#dee2e6',
  },
  welcomeMessage: {
    fontSize: 16,
    color: '#6c757d',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#343a40',
  },
  logoutButton: {
    padding: 8,
  },
  kpiContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
  },
  kpiBox: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    width: '45%',
    // Ombre
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.23,
    shadowRadius: 2.62,
    elevation: 4,
  },
  kpiValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#007bff',
  },
  kpiLabel: {
    fontSize: 14,
    color: '#6c757d',
    marginTop: 5,
  },
});