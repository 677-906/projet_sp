import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Assurez-vous que cette IP est correcte !
const API_URL = 'http://192.168.78.36:8000'; 

const axiosInstance = axios.create({
  baseURL: API_URL,
});

// Intercepteur pour ajouter le token à chaque requête
axiosInstance.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('userToken');
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