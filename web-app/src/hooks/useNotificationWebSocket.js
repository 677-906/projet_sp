import { useEffect, useRef } from 'react';

export const useNotificationWebSocket = (userId, onNotification) => {
  const wsRef = useRef(null);

  useEffect(() => {
    if (!userId) {
      return;
    }

    const connectWebSocket = () => {
      try {
        // URL WebSocket (adapter selon votre configuration)
        const wsUrl = `ws://127.0.0.1:8000/ws/notifications/${userId}`;

        console.log(`🔌 Connexion WebSocket: ${wsUrl}`);

        const ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          console.log('✅ WebSocket connecté pour notifications');
          // Envoyer un ping périodique pour garder la connexion ouverte
          const pingInterval = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
              ws.send('ping');
            }
          }, 30000); // Toutes les 30 secondes

          ws.pingInterval = pingInterval;
        };

        ws.onmessage = (event) => {
          try {
            if (event.data === 'pong') return; // Ignorer les pongs

            const notification = JSON.parse(event.data);
            console.log('📨 Nouvelle notification reçue:', notification);

            // Callback pour gérer la notification
            if (onNotification) {
              onNotification(notification);
            }
          } catch (error) {
            console.log('Erreur parsing notification:', error);
          }
        };

        ws.onerror = (error) => {
          console.log('❌ Erreur WebSocket:', error);
        };

        ws.onclose = () => {
          console.log('🔌 WebSocket déconnecté');
          if (ws.pingInterval) {
            clearInterval(ws.pingInterval);
          }

          // Reconnecter après 5 secondes
          setTimeout(() => {
            connectWebSocket();
          }, 5000);
        };

        wsRef.current = ws;
      } catch (error) {
        console.log('Erreur connexion WebSocket:', error);
      }
    };

    connectWebSocket();

    // Cleanup
    return () => {
      if (wsRef.current) {
        if (wsRef.current.pingInterval) {
          clearInterval(wsRef.current.pingInterval);
        }
        wsRef.current.close();
      }
    };
  }, [userId]);

  return wsRef.current;
};
