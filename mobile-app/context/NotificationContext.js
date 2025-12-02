// context/NotificationContext.js

import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../api/axiosConfig';
import { AuthContext } from './AuthContext';

export const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const { userToken } = useContext(AuthContext);

  // Fonction pour charger le compteur
  const loadUnreadCount = async () => {
    if (!userToken) {
      setUnreadCount(0);
      return;
    }

    try {
      const response = await api.get('/notifications/unread-count');
      setUnreadCount(response.data);
    } catch (error) {
      console.error('Erreur lors du chargement du compteur:', error);
    }
  };

  // Charger le compteur au montage et quand le token change
  useEffect(() => {
    loadUnreadCount();

    // Rafraîchir toutes les 30 secondes si connecté
    if (userToken) {
      const interval = setInterval(loadUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, [userToken]);

  // Fonction pour réinitialiser le compteur (appelée depuis NotificationsScreen)
  const refreshUnreadCount = () => {
    loadUnreadCount();
  };

  return (
    <NotificationContext.Provider value={{ unreadCount, refreshUnreadCount }}>
      {children}
    </NotificationContext.Provider>
  );
};
