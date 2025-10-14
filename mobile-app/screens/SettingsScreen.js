import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SettingsScreen({ navigation }) {
  const [apiUrl, setApiUrl] = useState('');

  // Au chargement, on essaie de lire l'URL déjà sauvegardée
  useEffect(() => {
    const loadApiUrl = async () => {
      const storedUrl = await AsyncStorage.getItem('apiUrl');
      if (storedUrl) {
        setApiUrl(storedUrl);
      }
    };
    loadApiUrl();
  }, []);

  const handleSave = async () => {
    if (!apiUrl.startsWith('http')) {
      Alert.alert("Erreur", "L'URL doit commencer par http:// ou https://");
      return;
    }
    try {
      await AsyncStorage.setItem('apiUrl', apiUrl);
      Alert.alert("Succès", "L'adresse du serveur a été sauvegardée. Veuillez redémarrer l'application pour appliquer les changements.");
      // On pourrait forcer un rechargement ici, mais un redémarrage est plus simple.
      navigation.goBack();
    } catch (e) {
      Alert.alert("Erreur", "Impossible de sauvegarder l'adresse.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Adresse du Serveur Backend</Text>
      <TextInput
        style={styles.input}
        placeholder="http://192.168.x.x:8000"
        value={apiUrl}
        onChangeText={setApiUrl}
        autoCapitalize="none"
        keyboardType="url"
      />
      <Button title="Sauvegarder l'Adresse" onPress={handleSave} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  label: { fontSize: 16, fontWeight: 'bold', marginBottom: 10 },
  input: { height: 50, borderWidth: 1, borderColor: '#ccc', borderRadius: 8, paddingHorizontal: 10, marginBottom: 20 },
});