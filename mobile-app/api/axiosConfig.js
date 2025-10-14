import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const axiosInstance = axios.create(); // On ne met PAS de baseURL ici

// --- INTERCEPTEUR DE REQUÊTE DYNAMIQUE ---
axiosInstance.interceptors.request.use(
  async (config) => {
    // 1. On récupère l'URL et le token AVANT CHAQUE APPEL
    const token = await AsyncStorage.getItem('userToken');
    const apiUrl = await AsyncStorage.getItem('apiUrl');

    if (!apiUrl) {
      // Si aucune URL n'est configurée, on annule la requête
      return Promise.reject(new Error("L'adresse du serveur n'est pas configurée."));
    }

    // 2. On configure dynamiquement l'URL et le token
    config.baseURL = apiUrl;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default axiosInstance;