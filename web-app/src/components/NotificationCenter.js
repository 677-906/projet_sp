// src/components/NotificationCenter.js

import React, { useState, useEffect, useRef } from 'react';
import api from '../api/axiosConfig';
import { useNotificationWebSocket } from '../hooks/useNotificationWebSocket';
import './NotificationCenter.css';

function NotificationCenter() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState(null);
  const dropdownRef = useRef(null);

  // Handler pour les nouvelles notifications WebSocket
  const handleNewNotification = (notification) => {
    console.log('📬 Nouvelle notification temps réel:', notification);
    // Recharger les notifications
    loadNotifications();
  };

  // Connexion WebSocket pour notifications temps réel
  useNotificationWebSocket(userId, handleNewNotification);

  // Charger les notifications et le compteur
  const loadNotifications = async () => {
    try {
      setLoading(true);
      const [notifResponse, countResponse] = await Promise.all([
        api.get('/notifications/', { params: { limit: 10 } }),
        api.get('/notifications/unread-count')
      ]);
      setNotifications(notifResponse.data);
      setUnreadCount(countResponse.data);
    } catch (error) {
      console.error('Erreur lors du chargement des notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  // Charger l'ID utilisateur au montage
  useEffect(() => {
    const fetchUserId = async () => {
      try {
        const response = await api.get('/users/me/');
        setUserId(response.data.id);
      } catch (error) {
        console.error('Erreur récupération user ID:', error);
      }
    };
    fetchUserId();
  }, []);

  // Charger les notifications au montage du composant
  useEffect(() => {
    loadNotifications();

    // Plus besoin de rafraîchir toutes les 30 secondes, WebSocket s'en charge
    // const interval = setInterval(loadNotifications, 30000);
    // return () => clearInterval(interval);
  }, []);

  // Fermer le dropdown si on clique en dehors
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Marquer une notification comme lue
  const markAsRead = async (notificationId) => {
    try {
      await api.put(`/notifications/${notificationId}/read`);

      // Mettre à jour l'état local
      setNotifications(notifications.map(notif =>
        notif.id === notificationId ? { ...notif, is_read: true } : notif
      ));
      setUnreadCount(Math.max(0, unreadCount - 1));
    } catch (error) {
      console.error('Erreur lors du marquage de la notification:', error);
    }
  };

  // Marquer toutes comme lues
  const markAllAsRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications(notifications.map(notif => ({ ...notif, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Erreur lors du marquage de toutes les notifications:', error);
    }
  };

  // Formater la date de la notification
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "À l'instant";
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays < 7) return `Il y a ${diffDays}j`;
    return date.toLocaleDateString('fr-FR');
  };

  // Obtenir l'icône selon le type de notification
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'visite_soumise':
        return '📋';
      case 'visite_validee':
        return '✅';
      case 'visite_rejetee':
        return '❌';
      default:
        return '🔔';
    }
  };

  return (
    <div className="notification-center" ref={dropdownRef}>
      <button
        className="notification-bell"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notifications"
      >
        🔔
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
        )}
      </button>

      {isOpen && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <h4>Notifications</h4>
            {unreadCount > 0 && (
              <button
                className="mark-all-read"
                onClick={markAllAsRead}
              >
                Tout marquer comme lu
              </button>
            )}
          </div>

          <div className="notification-list">
            {loading ? (
              <div className="notification-loading">Chargement...</div>
            ) : notifications.length === 0 ? (
              <div className="notification-empty">Aucune notification</div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`notification-item ${!notif.is_read ? 'unread' : ''}`}
                  onClick={() => !notif.is_read && markAsRead(notif.id)}
                >
                  <div className="notification-icon">
                    {getNotificationIcon(notif.type)}
                  </div>
                  <div className="notification-content">
                    <div className="notification-title">{notif.titre}</div>
                    <div className="notification-message">{notif.message}</div>
                    <div className="notification-time">{formatDate(notif.created_at)}</div>
                  </div>
                  {!notif.is_read && <div className="unread-dot"></div>}
                </div>
              ))
            )}
          </div>

          {notifications.length > 0 && (
            <div className="notification-footer">
              <button onClick={() => setIsOpen(false)}>Fermer</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default NotificationCenter;
