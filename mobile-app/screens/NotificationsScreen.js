import React, { useState, useEffect, useContext } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { getNotifications, markNotificationAsRead } from '../api/api';
import { AuthContext } from '../context/AuthContext';

const NotificationsScreen = () => {
  const [notifications, setNotifications] = useState([]);
  const { user } = useContext(AuthContext);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const data = await getNotifications(user.token);
        setNotifications(data);
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    };

    fetchNotifications();
  }, [user]);

  const handleNotificationPress = async (notificationId) => {
    try {
      await markNotificationAsRead(user.token, notificationId);
      setNotifications(notifications.filter(n => n.id !== notificationId));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity onPress={() => handleNotificationPress(item.id)}>
      <View style={styles.notificationItem}>
        <Text style={styles.notificationTitle}>
          Rapport {item.statut_validation === 'valide' ? 'validé' : 'rejeté'}
        </Text>
        <Text>
          Le rapport pour le client {item.client.nom_client} a été {item.statut_validation}.
        </Text>
        {item.rejection_reason && (
          <Text style={styles.rejectionReason}>
            Motif du rejet: {item.rejection_reason}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={notifications}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        ListEmptyComponent={<Text>Aucune nouvelle notification</Text>}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  notificationItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  notificationTitle: {
    fontWeight: 'bold',
  },
  rejectionReason: {
    marginTop: 8,
    color: 'red',
  },
});

export default NotificationsScreen;