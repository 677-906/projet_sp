import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, SafeAreaView, TouchableOpacity } from 'react-native';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import axiosInstance from '../api/axiosConfig';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native'; // Il manque cet import !

// --- À CONFIGURER ---
const API_URL = 'http://10.89.65.117:8000'; 
// --------------------

// --- CORRECTION N°1 : ClientItem doit accepter 'client' et 'onPress' ---
const ClientItem = ({ client, onPress }) => (
  <TouchableOpacity style={styles.itemContainer} onPress={onPress}>
    <View style={styles.itemIcon}>
      <Ionicons name="business-outline" size={24} color="#007bff" />
    </View>
    <View style={styles.itemTextContainer}>
      <Text style={styles.itemNom}>{client.nom_client}</Text>
      <Text style={styles.itemLocalisation}>{client.localisation}</Text>
    </View>
    <Ionicons name="chevron-forward-outline" size={22} color="#cccccc" />
  </TouchableOpacity>
);


export default function ClientsScreen() {
  const [clients, setClients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { userToken } = useContext(AuthContext);
  
  // Il faut initialiser la navigation ici
  const navigation = useNavigation();

  // Cette fonction est parfaite
  const handleClientPress = (client) => {
    navigation.navigate('VisitForm', { 
      clientId: client.id, 
      clientName: client.nom_client 
    });
  };

  // Cette fonction va chercher les données sur le backend
  const fetchClients = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await axios.get(`${API_URL}/clients/`, {
        headers: {
          // On ajoute le token à la requête pour être autorisé
          'Authorization': `Bearer ${userToken}`
        }
      });
      
      setClients(response.data); // On stocke la liste des clients dans notre état

    } catch (e) {
      console.error("Erreur lors de la récupération des clients", e);
      setError("Impossible de charger la liste des clients.");
    } finally {
      setIsLoading(false);
    }
  };

  // useEffect se déclenche quand l'écran s'affiche pour la première fois
   useEffect(() => {
    fetchClients();
  }, []);

  if (isLoading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#007bff" /></View>;
  }
  
  if (error) {
    return <View style={styles.center}><Text style={styles.errorText}>{error}</Text></View>;
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* --- CORRECTION N°2 : La FlatList appelle ClientItem correctement --- */}
      <FlatList
        data={clients}
        renderItem={({ item }) => (
          <ClientItem 
            client={item} 
            onPress={() => handleClientPress(item)} 
          />
        )}
        keyExtractor={item => item.id.toString()}
        ListHeaderComponent={<Text style={styles.header}>Sélectionner un Client</Text>}
      />
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
    fontSize: 24,
    fontWeight: 'bold',
    color: '#343a40',
    padding: 20,
    paddingBottom: 10,
  },
  itemContainer: {
    backgroundColor: '#ffffff',
    padding: 15,
    marginVertical: 8,
    marginHorizontal: 16,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    // Ombre
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.20,
    shadowRadius: 1.41,
    elevation: 2,
  },
  itemIcon: {
    marginRight: 15,
    backgroundColor: '#e7f3ff',
    padding: 10,
    borderRadius: 25,
  },
  itemTextContainer: {
    flex: 1,
  },
  itemNom: {
    fontSize: 16,
    fontWeight: '600',
  },
  itemLocalisation: {
    fontSize: 14,
    color: '#6c757d',
  },
  errorText: {
    color: 'red',
    fontSize: 16,
  }
});