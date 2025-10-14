import React, { useContext } from 'react';
import { View, Text, Button, StyleSheet, SafeAreaView } from 'react-native';
import { AuthContext } from '../context/AuthContext';

export default function ProfileScreen({ navigation }) {
  const { signOut, userToken } = useContext(AuthContext); // On récupère signOut
  // On pourrait aussi récupérer les infos de l'utilisateur ici

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Mon Profil</Text>
      {/* Affichez ici des infos sur l'utilisateur si vous le souhaitez */}
      
      <View style={styles.menu}>
        <Button 
          title="Paramètres du Serveur" 
          onPress={() => navigation.navigate('Settings')} // Navigue vers la nouvelle page
        />
        <View style={{ marginTop: 20 }}>
          <Button 
            title="Se Déconnecter" 
            onPress={signOut} // Appelle la fonction de déconnexion du contexte
            color="#dc3545"
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    padding: 20,
  },
  menu: {
    marginTop: 30,
    paddingHorizontal: 20,
  }
});