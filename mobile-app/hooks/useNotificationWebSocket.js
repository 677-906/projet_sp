import { useEffect, useRef, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NotificationContext } from '../context/NotificationContext';
import { AuthContext } from '../context/AuthContext';

export const useNotificationWebSocket = (userId) => {
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const pingIntervalRef = useRef(null);
  const isUnmountedRef = useRef(false);

  const notificationContext = useContext(NotificationContext);
  const { userToken } = useContext(AuthContext);

  useEffect(() => {
    isUnmountedRef.current = false;

    if (!userId || !userToken) {
      console.log('⏸️ WebSocket: En attente userId et token');
      return;
    }

    let shouldReconnect = true;
    let reconnectAttempts = 0;
    const MAX_RECONNECT_ATTEMPTS = 5;

    const connectWebSocket = async () => {
      // Ne pas reconnecter si le composant est démonté
      if (isUnmountedRef.current) {
        console.log('⏹️ WebSocket: Composant démonté, pas de connexion');
        return;
      }

      try {
        // Récupérer l'URL de base de l'API
        const apiUrl = await AsyncStorage.getItem('apiBaseURL');
        if (!apiUrl) {
          console.log('❌ WebSocket: URL API non configurée');
          return;
        }

        // Convertir http://... en ws://...
        const wsUrl = apiUrl.replace('http://', 'ws://').replace('https://', 'wss://');
        const fullWsUrl = `${wsUrl}/ws/notifications/${userId}`;

        console.log(`🔌 WebSocket: Tentative de connexion (${reconnectAttempts + 1}/${MAX_RECONNECT_ATTEMPTS})`);

        const ws = new WebSocket(fullWsUrl);

        ws.onopen = () => {
          console.log('✅ WebSocket: Connecté pour notifications');
          reconnectAttempts = 0; // Reset le compteur en cas de succès

          // Envoyer un ping périodique pour garder la connexion ouverte
          if (pingIntervalRef.current) {
            clearInterval(pingIntervalRef.current);
          }

          pingIntervalRef.current = setInterval(() => {
            try {
              if (ws.readyState === WebSocket.OPEN && !isUnmountedRef.current) {
                ws.send('ping');
              }
            } catch (error) {
              console.log('⚠️ WebSocket: Erreur envoi ping', error.message);
            }
          }, 30000); // Toutes les 30 secondes
        };

        ws.onmessage = (event) => {
          try {
            if (isUnmountedRef.current) return;

            // Ignorer les pongs
            if (event.data === 'pong') return;

            const notification = JSON.parse(event.data);
            console.log('📨 WebSocket: Nouvelle notification reçue');

            // Rafraîchir la liste des notifications de manière sécurisée
            if (notificationContext?.refreshNotifications) {
              try {
                notificationContext.refreshNotifications();
              } catch (refreshError) {
                console.log('⚠️ Erreur refresh notifications:', refreshError.message);
              }
            }
          } catch (error) {
            console.log('⚠️ WebSocket: Erreur parsing notification:', error.message);
          }
        };

        ws.onerror = (error) => {
          console.log('❌ WebSocket: Erreur de connexion');
          // Ne pas logger error.message car souvent undefined sur mobile
        };

        ws.onclose = (event) => {
          console.log('🔌 WebSocket: Déconnecté');

          // Nettoyer le ping interval
          if (pingIntervalRef.current) {
            clearInterval(pingIntervalRef.current);
            pingIntervalRef.current = null;
          }

          // Reconnecter uniquement si:
          // 1. Le composant n'est pas démonté
          // 2. L'utilisateur est toujours connecté
          // 3. On n'a pas dépassé le nombre max de tentatives
          if (!isUnmountedRef.current && userToken && shouldReconnect && reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
            reconnectAttempts++;
            const delay = Math.min(5000 * reconnectAttempts, 30000); // Délai exponentiel max 30s
            console.log(`⏳ WebSocket: Reconnexion dans ${delay/1000}s...`);

            // Nettoyer l'ancien timeout
            if (reconnectTimeoutRef.current) {
              clearTimeout(reconnectTimeoutRef.current);
            }

            reconnectTimeoutRef.current = setTimeout(() => {
              if (!isUnmountedRef.current && userToken) {
                connectWebSocket();
              }
            }, delay);
          } else if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
            console.log('🛑 WebSocket: Nombre maximum de tentatives atteint');
          }
        };

        wsRef.current = ws;
      } catch (error) {
        console.log('❌ WebSocket: Erreur lors de la connexion:', error.message);
      }
    };

    connectWebSocket();

    // Cleanup
    return () => {
      console.log('🧹 WebSocket: Nettoyage...');
      isUnmountedRef.current = true;
      shouldReconnect = false;

      // Nettoyer le ping interval
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
        pingIntervalRef.current = null;
      }

      // Nettoyer le timeout de reconnexion
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }

      // Fermer la connexion WebSocket
      if (wsRef.current) {
        try {
          wsRef.current.close(1000, 'Component unmounted');
          wsRef.current = null;
        } catch (error) {
          console.log('⚠️ WebSocket: Erreur fermeture:', error.message);
        }
      }
    };
  }, [userId, userToken]);

  return wsRef.current;
};
