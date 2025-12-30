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

// --- FONCTION D'UPLOAD DE FICHIER AVEC FETCH (plus fiable en React Native) ---
export const uploadFile = async (endpoint, fileUri, fileName, fileType, additionalData = {}) => {
  const token = await AsyncStorage.getItem('userToken');
  const apiUrl = await AsyncStorage.getItem('apiUrl');

  if (!apiUrl) {
    throw new Error("L'adresse du serveur n'est pas configurée.");
  }

  const formData = new FormData();
  formData.append('file', {
    uri: fileUri,
    name: fileName,
    type: fileType,
  });

  const url = `${apiUrl}${endpoint}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      // Ne PAS définir Content-Type - fetch le fait automatiquement pour FormData
    },
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Upload failed: ${response.status} - ${errorText}`);
  }

  return await response.json();
};

export default axiosInstance;