import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Alert, TextInput } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthContext } from '../context/AuthContext';
import axiosInstance from '../api/axiosConfig';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

// Zone Item Component
const ZoneItem = ({ zone, onPress }) => (
  <TouchableOpacity style={styles.zoneContainer} onPress={onPress}>
    <View style={styles.zoneIcon}>
      <Ionicons name="location-outline" size={28} color="#28a745" />
    </View>
    <View style={styles.zoneTextContainer}>
      <Text style={styles.zoneText}>{zone}</Text>
    </View>
    <Ionicons name="chevron-forward-outline" size={24} color="#cccccc" />
  </TouchableOpacity>
);

// Client Item Component
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
  const [zones, setZones] = useState([]);
  const [selectedZone, setSelectedZone] = useState(null);
  const [clients, setClients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const { userToken, userRole, signOut } = useContext(AuthContext);
  const insets = useSafeAreaInsets();

  // Filtrer les clients en fonction de la recherche
  const filteredClients = clients.filter(client => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase().trim();
    return (
      client.nom_client?.toLowerCase().includes(query) ||
      client.localisation?.toLowerCase().includes(query) ||
      client.lieu_dit?.toLowerCase().includes(query)
    );
  });

  const navigation = useNavigation();

  const handleClientPress = (client) => {
    navigation.navigate('VisitForm', {
      clientId: client.id,
      clientName: client.nom_client,
      zone: client.zone || selectedZone
    });
  };

  // Récupérer les zones
  const fetchZones = async () => {
    if (!userToken) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await axiosInstance.get('/zones/');
      setZones(response.data);

    } catch (e) {
      console.error("Erreur lors de la récupération des zones", e);

      if (e.response?.status === 401) {
        Alert.alert("Session expirée", "Veuillez vous reconnecter.");
        signOut();
      } else if (e.message.includes("serveur n'est pas configurée")) {
        setError("Veuillez configurer l'adresse du serveur dans Paramètres.");
      } else {
        setError("Impossible de charger la liste des zones.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Récupérer les clients par zone
  const fetchClientsByZone = async (zone) => {
    if (!userToken || !zone) {
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await axiosInstance.get(`/clients/?zone=${encodeURIComponent(zone)}`);
      setClients(response.data);

    } catch (e) {
      console.error("Erreur lors de la récupération des clients", e);

      if (e.response?.status === 401) {
        Alert.alert("Session expirée", "Veuillez vous reconnecter.");
        signOut();
      } else {
        setError("Impossible de charger la liste des clients.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Récupérer les clients du merchandiser (sans sélection de zone)
  const fetchMerchandiserClients = async () => {
    if (!userToken) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await axiosInstance.get('/merchandiser/clients');
      setClients(response.data);
      // Pour un merchandiser, on considère qu'il a déjà "sélectionné" sa zone
      setSelectedZone('Ma Zone');

    } catch (e) {
      console.error("Erreur lors de la récupération des clients du merchandiser", e);

      if (e.response?.status === 401) {
        Alert.alert("Session expirée", "Veuillez vous reconnecter.");
        signOut();
      } else if (e.message.includes("serveur n'est pas configurée")) {
        setError("Veuillez configurer l'adresse du serveur dans Paramètres.");
      } else {
        setError("Impossible de charger la liste de vos clients.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleZonePress = (zone) => {
    setSelectedZone(zone);
    setSearchQuery(''); // Réinitialiser la recherche lors du changement de zone
    fetchClientsByZone(zone);
  };

  useEffect(() => {
    // Si l'utilisateur est un merchandiser, charger directement ses clients
    if (userRole === 'Merchandiser') {
      fetchMerchandiserClients();
    } else {
      // Sinon, charger la liste des zones (comportement par défaut)
      fetchZones();
    }
  }, [userToken, userRole]);

  if (isLoading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#007bff" /></View>;
  }

  if (error) {
    return <View style={styles.center}><Text style={styles.errorText}>{error}</Text></View>;
  }

  // Si aucune zone n'est sélectionnée, afficher la liste des zones
  if (!selectedZone) {
    return (
      <SafeAreaView style={styles.container}>
        <FlatList
          data={zones}
          renderItem={({ item }) => (
            <ZoneItem
              zone={item.zone}
              onPress={() => handleZonePress(item.zone)}
            />
          )}
          keyExtractor={(item, index) => index.toString()}
          ListHeaderComponent={<Text style={styles.header}>Sélectionner une Zone</Text>}
          contentContainerStyle={{ paddingBottom: Math.max(30, insets.bottom + 20) }}
        />
      </SafeAreaView>
    );
  }

  // Si une zone est sélectionnée, afficher les clients de cette zone
  return (
    <SafeAreaView style={styles.container}>
      {/* Afficher le bouton "Changer de zone" seulement si l'utilisateur n'est pas merchandiser */}
      {userRole !== 'Merchandiser' && (
        <View style={styles.backButtonContainer}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              setSelectedZone(null);
              setClients([]);
            }}
          >
            <Ionicons name="arrow-back-outline" size={24} color="#007bff" />
            <Text style={styles.backButtonText}>Changer de zone</Text>
          </TouchableOpacity>
        </View>
      )}
      <FlatList
        data={filteredClients}
        renderItem={({ item }) => (
          <ClientItem
            client={item}
            onPress={() => handleClientPress(item)}
          />
        )}
        keyExtractor={item => item.id.toString()}
        ListHeaderComponent={
          <View>
            {userRole === 'Merchandiser' ? (
              <>
                <Text style={styles.header}>Mes Clients</Text>
                <Text style={styles.subHeader}>Sélectionner un client à visiter</Text>
              </>
            ) : (
              <>
                <Text style={styles.header}>Zone: {selectedZone}</Text>
                <Text style={styles.subHeader}>Sélectionner un Client</Text>
              </>
            )}
            {/* Barre de recherche */}
            <View style={styles.searchContainer}>
              <Ionicons name="search-outline" size={20} color="#6c757d" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Rechercher un client..."
                placeholderTextColor="#adb5bd"
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
                  <Ionicons name="close-circle" size={20} color="#6c757d" />
                </TouchableOpacity>
              )}
            </View>
            {searchQuery.length > 0 && (
              <Text style={styles.searchResultText}>
                {filteredClients.length} client{filteredClients.length !== 1 ? 's' : ''} trouvé{filteredClients.length !== 1 ? 's' : ''}
              </Text>
            )}
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="folder-open-outline" size={64} color="#cccccc" />
            <Text style={styles.emptyText}>
              {searchQuery.length > 0
                ? `Aucun client ne correspond à "${searchQuery}"`
                : userRole === 'Merchandiser'
                  ? 'Aucun client assigné. Contactez votre Chef de Zone.'
                  : 'Aucun client dans cette zone'}
            </Text>
          </View>
        }
        contentContainerStyle={{ paddingBottom: Math.max(30, insets.bottom + 20) }}
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
  subHeader: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6c757d',
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  backButtonContainer: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#dee2e6',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
  },
  backButtonText: {
    fontSize: 16,
    color: '#007bff',
    marginLeft: 10,
    fontWeight: '600',
  },
  zoneContainer: {
    backgroundColor: '#ffffff',
    padding: 20,
    marginVertical: 8,
    marginHorizontal: 16,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 3,
  },
  zoneIcon: {
    marginRight: 15,
    backgroundColor: '#d4edda',
    padding: 12,
    borderRadius: 30,
  },
  zoneTextContainer: {
    flex: 1,
  },
  zoneText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#155724',
  },
  itemContainer: {
    backgroundColor: '#ffffff',
    padding: 15,
    marginVertical: 8,
    marginHorizontal: 16,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
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
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginTop: 50,
  },
  emptyText: {
    fontSize: 16,
    color: '#6c757d',
    marginTop: 15,
    fontStyle: 'italic',
  },
  errorText: {
    color: 'red',
    fontSize: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#dee2e6',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: 16,
    color: '#343a40',
  },
  clearButton: {
    padding: 4,
  },
  searchResultText: {
    fontSize: 13,
    color: '#6c757d',
    paddingHorizontal: 20,
    paddingBottom: 5,
    fontStyle: 'italic',
  }
});