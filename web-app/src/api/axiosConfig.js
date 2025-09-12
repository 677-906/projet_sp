// src/api/axiosConfig.js

import axios from 'axios';

// Assurez-vous que l'adresse IP est correcte
const API_URL = 'http://127.0.0.1:8000'; 

const axiosInstance = axios.create({
  baseURL: API_URL,
});

// --- L'INTERCEPTEUR DE REQUÊTE ---
// C'est cette partie qui ajoute le token
axiosInstance.interceptors.request.use(
  (config) => {
    // 1. On récupère le token depuis le stockage local
    const token = localStorage.getItem('authToken');
    
    // 2. S'il existe, on le met dans l'en-tête (headers)
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    
    // 3. On retourne la configuration (avec ou sans token)
    return config;
  },
  (error) => {
    // Gérer une erreur de configuration de la requête
    return Promise.reject(error);
  }
);

export default axiosInstance;