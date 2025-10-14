import React, { useState, useRef, useEffect, useContext } from 'react';
import {
  StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, Image,
  SafeAreaView, KeyboardAvoidingView, Platform, ActivityIndicator,
  ImageBackground, Animated, Easing
} from 'react-native';
import axios from 'axios'; // On utilise axios de base ici, car l'URL est dynamique
import { LinearGradient } from 'expo-linear-gradient';
import { AuthContext } from '../context/AuthContext';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BACKGROUND_IMAGE_URL = 'https://images.unsplash.com/photo-1554629947-334ff61d85dc?q=80&w=2532&auto=format&fit=crop';

// On reçoit maintenant 'navigation' en prop, fourni par React Navigation
export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { signIn } = useContext(AuthContext);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 1000, useNativeDriver: true }).start();
  }, [fadeAnim]);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Champs requis', 'Veuillez entrer votre email et votre mot de passe.');
      return;
    }
    setIsLoading(true);
    try {
      // On récupère l'URL configurée par l'utilisateur
      const apiUrl = await AsyncStorage.getItem('apiUrl');
      if (!apiUrl) {
        throw new Error("L'adresse du serveur n'est pas configurée.");
      }

      const formData = new URLSearchParams();
      formData.append('username', email);
      formData.append('password', password);
      
      const response = await axios.post(`${apiUrl}/token`, formData, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });
      
      signIn(response.data.access_token);
    } catch (error) {
      console.error(error);
      const errorMessage = error.message.includes("configurée")
        ? error.message
        : 'Email ou mot de passe incorrect.';
      Alert.alert('Échec de la connexion', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ImageBackground source={{ uri: BACKGROUND_IMAGE_URL }} style={styles.background} blurRadius={5}>
      <SafeAreaView style={styles.container}>
        {/* BOUTON PARAMÈTRES TOUJOURS ACCESSIBLE */}
        <TouchableOpacity 
          style={styles.settingsButton} 
          onPress={() => navigation.navigate('Settings')} // Navigue vers l'écran des paramètres
        >
          <Ionicons name="settings-outline" size={30} color="#FFFFFF" />
        </TouchableOpacity>

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardAvoidingContainer}
        >
          <Animated.View style={[styles.contentContainer, { opacity: fadeAnim }]}>
            <Image 
              source={{ uri: 'https://www.sourcedupays.com/wp-content/uploads/2023/04/logo-sdp.jpg' }} 
              style={styles.logo} resizeMode="contain" />
            <Text style={styles.title}>SOURCE DU PAYS</Text>
            <Text style={styles.subtitle}>Espace Merchandiser</Text>
            <View style={styles.formContainer}>
              <TextInput style={styles.input} placeholder="Adresse email" value={email} onChangeText={setEmail} placeholderTextColor="#FFFFFF90"/>
              <TextInput style={styles.input} placeholder="Mot de passe" value={password} onChangeText={setPassword} secureTextEntry placeholderTextColor="#FFFFFF90"/>
              <TouchableOpacity onPress={handleLogin} disabled={isLoading}>
                <LinearGradient colors={['#00BFFF', '#1E90FF']} style={styles.button}>
                  {isLoading ? <ActivityIndicator size="small" color="#ffffff" /> : <Text style={styles.buttonText}>Connexion</Text>}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ImageBackground>
  );
}

// Styles
const styles = StyleSheet.create({
  settingsButton: { position: 'absolute', top: 50, right: 20, zIndex: 1, padding: 10 },
  background: { flex: 1 },
  container: { flex: 1, backgroundColor: 'rgba(0, 30, 60, 0.6)' },
  keyboardAvoidingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  contentContainer: { width: '90%', alignItems: 'center', padding: 20, backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.3)'},
  logo: { width: 120, height: 60 },
  title: { fontSize: 26, fontWeight: 'bold', color: '#FFFFFF', marginTop: 10, letterSpacing: 1 },
  subtitle: { fontSize: 16, color: '#E0FFFF', marginBottom: 30 },
  formContainer: { width: '100%' },
  input: { backgroundColor: 'rgba(0, 0, 0, 0.2)', paddingVertical: 14, paddingHorizontal: 16, borderRadius: 10, fontSize: 16, marginBottom: 16, color: '#FFFFFF', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.5)' },
  button: { paddingVertical: 16, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginTop: 10, width: '100%' },
  buttonText: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' },
});