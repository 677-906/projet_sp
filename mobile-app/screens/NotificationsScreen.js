// screens/NotificationsScreen.js

import React, { useState, useEffect, useCallback, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import api from '../api/axiosConfig';
import { NotificationContext } from '../context/NotificationContext';

export default function NotificationsScreen({ navigation }) {
  const [notifications, setNotifications] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const { refreshUnreadCount } = useContext(NotificationContext);
  const insets = useSafeAreaInsets();

  // Charger les notifications
  const loadNotifications = async () => {
    try {
      const response = await api.get('/notifications/', { params: { limit: 50 } });
      setNotifications(response.data);
    } catch (error) {
      console.error('Erreur lors du chargement des notifications:', error);
      Alert.alert('Erreur', 'Impossible de charger les notifications');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Charger au montage
  useEffect(() => {
    loadNotifications();
  }, []);

  // Rafraîchir le compteur quand l'écran reçoit le focus
  useFocusEffect(
    useCallback(() => {
      refreshUnreadCount();
    }, [refreshUnreadCount])
  );

  // Rafraîchir
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadNotifications();
  }, []);

  // Marquer une notification comme lue
  const markAsRead = async (notificationId) => {
    try {
      await api.put(`/notifications/${notificationId}/read`);
      // Mettre à jour l'état local
      setNotifications(notifications.map(notif =>
        notif.id === notificationId ? { ...notif, is_read: true } : notif
      ));
      // Rafraîchir le compteur
      refreshUnreadCount();
    } catch (error) {
      console.error('Erreur lors du marquage:', error);
    }
  };

  // Gérer le clic sur une notification
  const handleNotificationPress = (item) => {
    // Marquer comme lue si non lue
    if (!item.is_read) {
      markAsRead(item.id);
    }

    // Si c'est une visite rejetée, naviguer vers le formulaire pour correction
    if (item.type === 'visite_rejetee' && item.visite_id) {
      navigation.navigate('VisitForm', { visitId: item.visite_id });
    }
  };

  // Marquer toutes comme lues
  const markAllAsRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications(notifications.map(notif => ({ ...notif, is_read: true })));
      // Rafraîchir le compteur
      refreshUnreadCount();
      Alert.alert('Succès', 'Toutes les notifications ont été marquées comme lues');
    } catch (error) {
      console.error('Erreur:', error);
      Alert.alert('Erreur', 'Impossible de marquer les notifications comme lues');
    }
  };

  // Formater la date
  const formatDate = (dateString) => {
    // S'assurer que la date est interprétée comme UTC si pas de timezone
    let date;
    if (dateString && !dateString.includes('Z') && !dateString.includes('+')) {
      date = new Date(dateString + 'Z');
    } else {
      date = new Date(dateString);
    }

    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 0) return "À l'instant"; // Si date future (décalage)
    if (diffMins < 1) return "À l'instant";
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays < 7) return `Il y a ${diffDays}j`;
    return date.toLocaleDateString('fr-FR');
  };

  // Obtenir l'emoji selon le type
  const getNotificationEmoji = (type) => {
    switch (type) {
      case 'visite_soumise': return '📋';
      case 'visite_validee': return '✅';
      case 'visite_rejetee': return '❌';
      default: return '🔔';
    }
  };

  // Obtenir la couleur selon le type
  const getNotificationColor = (type) => {
    switch (type) {
      case 'visite_validee': return '#27ae60';
      case 'visite_rejetee': return '#e74c3c';
      default: return '#3498db';
    }
  };

  // Rendu d'une notification
  const renderNotification = ({ item }) => (
    <TouchableOpacity
      style={[styles.notifCard, !item.is_read && styles.notifUnread]}
      onPress={() => handleNotificationPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.notifIconContainer}>
        <Text style={styles.notifIcon}>{getNotificationEmoji(item.type)}</Text>
      </View>
      <View style={styles.notifContent}>
        <View style={styles.notifHeader}>
          <Text style={styles.notifTitle}>{item.titre}</Text>
          {!item.is_read && <View style={styles.unreadDot} />}
        </View>
        <Text style={styles.notifMessage}>{item.message}</Text>
        <Text style={styles.notifTime}>{formatDate(item.created_at)}</Text>
        {item.type === 'visite_rejetee' && (
          <Text style={styles.actionHint}>Appuyez pour corriger la visite</Text>
        )}
      </View>
    </TouchableOpacity>
  );

  // Compteur de notifications non lues
  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notifications</Text>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={markAllAsRead} style={styles.markAllButton}>
            <Text style={styles.markAllText}>Tout marquer comme lu</Text>
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={styles.centered}>
          <Text>Chargement...</Text>
        </View>
      ) : notifications.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>🔔</Text>
          <Text style={styles.emptySubtext}>Aucune notification</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderNotification}
          keyExtractor={(item) => item.id.toString()}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={[styles.listContent, { paddingBottom: Math.max(30, insets.bottom + 20) }]}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  markAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#3498db',
  },
  markAllText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
  },
  notifCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  notifUnread: {
    backgroundColor: '#e3f2fd',
    borderLeftWidth: 4,
    borderLeftColor: '#3498db',
  },
  notifIconContainer: {
    marginRight: 12,
    justifyContent: 'flex-start',
  },
  notifIcon: {
    fontSize: 32,
  },
  notifContent: {
    flex: 1,
  },
  notifHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  notifTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3498db',
    marginLeft: 8,
  },
  notifMessage: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 8,
  },
  notifTime: {
    fontSize: 12,
    color: '#999',
  },
  actionHint: {
    fontSize: 12,
    color: '#3498db',
    fontWeight: '600',
    marginTop: 8,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptySubtext: {
    fontSize: 16,
    color: '#999',
  },
});
