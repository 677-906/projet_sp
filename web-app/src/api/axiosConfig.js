// src/api/axiosConfig.js

import axios from 'axios';

// L'URL de l'API est maintenant lue depuis les variables d'environnement
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

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