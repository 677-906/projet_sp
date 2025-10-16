import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, SafeAreaView, TouchableOpacity } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import axiosInstance from '../api/axiosConfig';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import RNPickerSelect from 'react-native-picker-select';

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
  const [superviseurs, setSuperviseurs] = useState([]);
  const [selectedSuperviseur, setSelectedSuperviseur] = useState(null);
  const [commerciaux, setCommerciaux] = useState([]);
  const [selectedCommercial, setSelectedCommercial] = useState(null);
  const [clients, setClients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const navigation = useNavigation();

  const handleClientPress = (client) => {
    navigation.navigate('VisitForm', { 
      clientId: client.id, 
      clientName: client.nom_client 
    });
  };

  useEffect(() => {
    const fetchSuperviseurs = async () => {
      try {
        const response = await axiosInstance.get('/superviseurs/');
        const superviseurItems = response.data.map(s => ({
          label: s.user.nom,
          value: s.id,
        }));
        setSuperviseurs(superviseurItems);
      } catch (e) {
        setError("Impossible de charger les superviseurs.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchSuperviseurs();
  }, []);

  const handleSuperviseurChange = async (value) => {
    setSelectedSuperviseur(value);
    setSelectedCommercial(null);
    setClients([]);
    if (value) {
      setIsLoading(true);
      try {
        const response = await axiosInstance.get(`/superviseur/${value}/commerciaux`);
        setCommerciaux(response.data.map(name => ({ label: name, value: name })));
      } catch (e) {
        setError("Impossible de charger les commerciaux pour ce superviseur.");
        setCommerciaux([]);
      } finally {
        setIsLoading(false);
      }
    } else {
      setCommerciaux([]);
    }
  };

  const handleCommercialChange = async (value) => {
    setSelectedCommercial(value);
    setClients([]);
    if (value) {
      setIsLoading(true);
      try {
        const response = await axiosInstance.get(`/commercial/${value}/clients`);
        setClients(response.data);
      } catch (e) {
        setError("Impossible de charger les clients pour ce commercial.");
        setClients([]);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const renderContent = () => {
    if (isLoading && !superviseurs.length) {
      return <View style={styles.center}><ActivityIndicator size="large" color="#007bff" /></View>;
    }
  
    if (error) {
      return <View style={styles.center}><Text style={styles.errorText}>{error}</Text></View>;
    }

    return (
      <>
        <FlatList
          data={clients}
          renderItem={({ item }) => (
            <ClientItem
              client={item}
              onPress={() => handleClientPress(item)}
            />
          )}
          keyExtractor={item => item.id.toString()}
          ListEmptyComponent={!isLoading && selectedCommercial ? <Text style={styles.placeholderText}>Aucun client trouvé pour ce commercial.</Text> : null}
        />
        {isLoading && <ActivityIndicator style={styles.listLoading} size="small" color="#007bff" />}
      </>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.pickerContainer}>
        <RNPickerSelect
          onValueChange={handleSuperviseurChange}
          items={superviseurs}
          placeholder={{ label: "Sélectionner un Chef de Zone...", value: null }}
          style={pickerSelectStyles}
          value={selectedSuperviseur}
        />
        {selectedSuperviseur && (
          <RNPickerSelect
            onValueChange={handleCommercialChange}
            items={commerciaux}
            placeholder={{ label: "Sélectionner un Commercial...", value: null }}
            style={pickerSelectStyles}
            value={selectedCommercial}
            disabled={!selectedSuperviseur}
          />
        )}
      </View>
      {renderContent()}
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
  errorText: {
    color: 'red',
    fontSize: 16,
    textAlign: 'center',
    margin: 20,
  },
  pickerContainer: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 10,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#dee2e6',
  },
  placeholderText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#6c757d',
  },
  listLoading: {
    marginVertical: 20,
  }
});

const pickerSelectStyles = StyleSheet.create({
  inputIOS: {
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: 'gray',
    borderRadius: 4,
    color: 'black',
    paddingRight: 30,
    marginBottom: 10,
  },
  inputAndroid: {
    fontSize: 16,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 0.5,
    borderColor: 'purple',
    borderRadius: 8,
    color: 'black',
    paddingRight: 30,
    marginBottom: 10,
  },
});