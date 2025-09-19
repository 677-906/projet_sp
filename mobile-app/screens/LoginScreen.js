import React, { useState, useRef, useEffect, useContext } from 'react';
import {
  StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, Image,
  SafeAreaView, KeyboardAvoidingView, Platform, ActivityIndicator,
  ImageBackground, Animated, Easing
} from 'react-native';
import axios from 'axios';
import axiosInstance from '../api/axiosConfig';
import { LinearGradient } from 'expo-linear-gradient';
import { AuthContext } from '../context/AuthContext'; // On importe le contexte

// --- À CONFIGURER ---
const API_URL = 'http://10.105.50.117:8000';
const BACKGROUND_IMAGE_URL = 'https://images.unsplash.com/photo-1554629947-334ff61d85dc?q=80&w=2532&auto=format&fit=crop';
// --------------------

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // On récupère la fonction signIn depuis notre Contexte d'Authentification
  const { signIn } = useContext(AuthContext);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1, duration: 1000, easing: Easing.ease, useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Champs requis', 'Veuillez entrer votre email et votre mot de passe.');
      return;
    }
    setIsLoading(true);
    try {
      const formData = new URLSearchParams();
      formData.append('username', email);
      formData.append('password', password);
      const response = await axios.post(`${API_URL}/token`, formData, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });
      const accessToken = response.data.access_token;
      
      // On appelle la fonction du contexte pour mettre à jour l'état global
      signIn(accessToken);

    } catch (error) {
      console.error(error.response || error);
      Alert.alert('Échec de la connexion', 'L\'email ou le mot de passe est incorrect.');
    } finally {
      setIsLoading(false);
    }
  };

  // Le JSX est le même que la version "vivante"
  return (
    <ImageBackground source={{ uri: BACKGROUND_IMAGE_URL }} style={styles.background} blurRadius={5}>
      <SafeAreaView style={styles.container}>
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

// Le style "vivant"
const styles = StyleSheet.create({
  background: { flex: 1 },
  container: { flex: 1, backgroundColor: 'rgba(0, 30, 60, 0.6)' },
  keyboardAvoidingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  contentContainer: {
    width: '90%', alignItems: 'center', padding: 20, backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  logo: { width: 120, height: 60 },
  title: { fontSize: 26, fontWeight: 'bold', color: '#FFFFFF', marginTop: 10, letterSpacing: 1 },
  subtitle: { fontSize: 16, color: '#E0FFFF', marginBottom: 30 },
  formContainer: { width: '100%' },
  input: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)', paddingVertical: 14, paddingHorizontal: 16,
    borderRadius: 10, fontSize: 16, marginBottom: 16, color: '#FFFFFF',
    borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  button: {
    paddingVertical: 16, borderRadius: 10, alignItems: 'center',
    justifyContent: 'center', marginTop: 10, width: '100%',
  },
  buttonText: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' },
});