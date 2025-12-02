import React, { useState, useEffect, useContext, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  ScrollView,
  RefreshControl,
  Animated,
  Dimensions
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthContext } from '../context/AuthContext';
import axiosInstance from '../api/axiosConfig';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useNotificationWebSocket } from '../hooks/useNotificationWebSocket';

const { width } = Dimensions.get('window');

// Composant KPI Card interactif
const KPICard = ({ icon, value, label, color, onPress, subtitle }) => {
  const scaleAnim = useState(new Animated.Value(1))[0];

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View style={[styles.kpiBox, { transform: [{ scale: scaleAnim }] }]}>
        <View style={[styles.kpiIconContainer, { backgroundColor: `${color}20` }]}>
          <Ionicons name={icon} size={24} color={color} />
        </View>
        <Text style={[styles.kpiValue, { color }]}>{value}</Text>
        <Text style={styles.kpiLabel}>{label}</Text>
        {subtitle && <Text style={styles.kpiSubtitle}>{subtitle}</Text>}
      </Animated.View>
    </TouchableOpacity>
  );
};

// Composant Action Rapide
const QuickAction = ({ icon, label, color, onPress }) => (
  <TouchableOpacity style={styles.quickActionButton} onPress={onPress} activeOpacity={0.7}>
    <View style={[styles.quickActionIcon, { backgroundColor: `${color}15` }]}>
      <Ionicons name={icon} size={28} color={color} />
    </View>
    <Text style={styles.quickActionLabel}>{label}</Text>
  </TouchableOpacity>
);

// Composant Visite Récente
const RecentVisitItem = ({ visit, onPress }) => {
  const getStatusInfo = (status) => {
    switch (status) {
      case 'validé':
        return { color: '#28a745', icon: 'checkmark-circle', label: 'Validée' };
      case 'rejeté':
        return { color: '#dc3545', icon: 'close-circle', label: 'Rejetée' };
      default:
        return { color: '#ffc107', icon: 'time', label: 'En attente' };
    }
  };

  const statusInfo = getStatusInfo(visit.statut_validation);
  const visitDate = new Date(visit.date_visite);
  const formattedDate = visitDate.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short'
  });

  return (
    <TouchableOpacity style={styles.recentVisitItem} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.recentVisitLeft}>
        <View style={[styles.visitStatusDot, { backgroundColor: statusInfo.color }]} />
        <View style={styles.recentVisitInfo}>
          <Text style={styles.recentVisitClient} numberOfLines={1}>
            {visit.client?.nom_client || 'Client inconnu'}
          </Text>
          <Text style={styles.recentVisitDate}>{formattedDate}</Text>
        </View>
      </View>
      <View style={styles.recentVisitRight}>
        <View style={[styles.statusBadge, { backgroundColor: `${statusInfo.color}20` }]}>
          <Ionicons name={statusInfo.icon} size={14} color={statusInfo.color} />
          <Text style={[styles.statusBadgeText, { color: statusInfo.color }]}>
            {statusInfo.label}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color="#ccc" />
      </View>
    </TouchableOpacity>
  );
};

export default function HomeScreen() {
  const [userData, setUserData] = useState(null);
  const [stats, setStats] = useState({
    visitesToday: 0,
    visitesPending: 0,
    visitesValidated: 0,
    visitesRejected: 0,
    totalClients: 0,
    visitesThisWeek: 0
  });
  const [recentVisits, setRecentVisits] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const { userToken, signOut } = useContext(AuthContext);
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  // Connexion WebSocket pour notifications en temps réel (DÉSACTIVÉ par défaut pour stabilité)
  // Décommentez la ligne ci-dessous pour activer les notifications temps réel
  // useNotificationWebSocket(userData?.id);

  const fetchDashboardData = async () => {
    if (!userToken) {
      setIsLoading(false);
      return;
    }

    try {
      // Récupérer les données utilisateur
      const userResponse = await axiosInstance.get('/users/me/');
      setUserData(userResponse.data);

      // Récupérer les visites du merchandiser (LIMITÉ pour éviter surcharge mémoire)
      try {
        // Limiter à 50 dernières visites pour économiser la mémoire
        const visitesResponse = await axiosInstance.get('/merchandiser/mes-visites', {
          params: { limit: 50 }
        });
        const visites = Array.isArray(visitesResponse.data) ? visitesResponse.data : [];

        // Libérer la mémoire immédiatement après récupération
        visitesResponse.data = null;

        // Calculer les statistiques avec vérifications
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        weekAgo.setHours(0, 0, 0, 0);

        const visitesToday = visites.filter(v => {
          try {
            if (!v || !v.date_visite) return false;
            const visitDate = new Date(v.date_visite);
            visitDate.setHours(0, 0, 0, 0);
            return visitDate.getTime() === today.getTime();
          } catch {
            return false;
          }
        }).length;

        const visitesPending = visites.filter(v => v && v.statut_validation === 'soumis').length;
        const visitesValidated = visites.filter(v => v && v.statut_validation === 'validé').length;
        const visitesRejected = visites.filter(v => v && v.statut_validation === 'rejeté').length;

        const visitesThisWeek = visites.filter(v => {
          try {
            if (!v || !v.date_visite) return false;
            const visitDate = new Date(v.date_visite);
            return visitDate >= weekAgo;
          } catch {
            return false;
          }
        }).length;

        setStats({
          visitesToday,
          visitesPending,
          visitesValidated,
          visitesRejected,
          totalClients: 0,
          visitesThisWeek
        });

        // Récupérer les 5 dernières visites avec vérifications
        try {
          const sortedVisites = [...visites]
            .filter(v => v && v.date_visite)
            .sort((a, b) => {
              try {
                return new Date(b.date_visite) - new Date(a.date_visite);
              } catch {
                return 0;
              }
            });
          setRecentVisits(sortedVisites.slice(0, 5));
        } catch (sortError) {
          console.log('Erreur tri visites:', sortError);
          setRecentVisits([]);
        }

      } catch (visitError) {
        console.log('Erreur récupération visites:', visitError);
        // Réinitialiser avec valeurs par défaut
        setRecentVisits([]);
      }

      // Récupérer le nombre de clients
      try {
        const clientsResponse = await axiosInstance.get('/merchandiser/clients');
        setStats(prev => ({ ...prev, totalClients: clientsResponse.data?.length || 0 }));
      } catch (clientError) {
        console.log('Erreur récupération clients:', clientError);
      }

    } catch (e) {
      console.error("Erreur lors de la récupération des données", e);
      if (e.response?.status === 401) {
        Alert.alert("Session expirée", "Veuillez vous reconnecter.");
        signOut();
      } else {
        // Ne pas crasher l'app, juste logger l'erreur
        console.log("Erreur dashboard:", e.message || 'Erreur inconnue');
        // Réinitialiser avec valeurs par défaut pour éviter les crashs
        setStats({
          visitesToday: 0,
          visitesPending: 0,
          visitesValidated: 0,
          visitesRejected: 0,
          totalClients: 0,
          visitesThisWeek: 0
        });
        setRecentVisits([]);
      }
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    // Cleanup : Libérer la mémoire quand le composant est démonté
    return () => {
      setUserData(null);
      setStats({
        visitesToday: 0,
        visitesPending: 0,
        visitesValidated: 0,
        visitesRejected: 0,
        totalClients: 0,
        visitesThisWeek: 0
      });
      setRecentVisits([]);
    };
  }, [userToken]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchDashboardData();
  }, []);

  const handleNewVisit = () => {
    navigation.navigate('Clients');
  };

  const handleViewClients = () => {
    navigation.navigate('Clients');
  };

  const handleViewNotifications = () => {
    navigation.navigate('Notifications');
  };

  const handleViewProfile = () => {
    navigation.navigate('Profile');
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.loadingText}>Chargement du tableau de bord...</Text>
      </View>
    );
  }

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bonjour';
    if (hour < 18) return 'Bon après-midi';
    return 'Bonsoir';
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#007bff']}
            tintColor="#007bff"
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.greeting}>{greeting()},</Text>
            <Text style={styles.userName}>{userData ? userData.nom : 'Merchandiser'}</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity onPress={handleViewNotifications} style={styles.headerButton}>
              <Ionicons name="notifications-outline" size={24} color="#343a40" />
            </TouchableOpacity>
            <TouchableOpacity onPress={signOut} style={styles.headerButton}>
              <Ionicons name="log-out-outline" size={24} color="#dc3545" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Statistiques principales */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Mes Statistiques</Text>
          <Text style={styles.sectionSubtitle}>Tirez vers le bas pour actualiser</Text>
        </View>

        <View style={styles.kpiContainer}>
          <KPICard
            icon="today-outline"
            value={stats.visitesToday}
            label="Aujourd'hui"
            color="#007bff"
            onPress={() => {}}
            subtitle="visites"
          />
          <KPICard
            icon="time-outline"
            value={stats.visitesPending}
            label="En attente"
            color="#ffc107"
            onPress={() => {}}
            subtitle="validation"
          />
        </View>

        <View style={styles.kpiContainer}>
          <KPICard
            icon="checkmark-circle-outline"
            value={stats.visitesValidated}
            label="Validées"
            color="#28a745"
            onPress={() => {}}
            subtitle="total"
          />
          <KPICard
            icon="people-outline"
            value={stats.totalClients}
            label="Clients"
            color="#6f42c1"
            onPress={handleViewClients}
            subtitle="assignés"
          />
        </View>

        {/* Résumé de la semaine */}
        <View style={styles.weekSummary}>
          <View style={styles.weekSummaryContent}>
            <Ionicons name="calendar-outline" size={24} color="#007bff" />
            <View style={styles.weekSummaryText}>
              <Text style={styles.weekSummaryValue}>{stats.visitesThisWeek} visites</Text>
              <Text style={styles.weekSummaryLabel}>cette semaine</Text>
            </View>
          </View>
          {stats.visitesRejected > 0 && (
            <View style={styles.rejectedBadge}>
              <Ionicons name="alert-circle" size={16} color="#dc3545" />
              <Text style={styles.rejectedText}>{stats.visitesRejected} rejetée(s)</Text>
            </View>
          )}
        </View>

        {/* Actions rapides */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Actions Rapides</Text>
        </View>

        <View style={styles.quickActionsContainer}>
          <QuickAction
            icon="add-circle-outline"
            label="Nouvelle Visite"
            color="#007bff"
            onPress={handleNewVisit}
          />
          <QuickAction
            icon="business-outline"
            label="Mes Clients"
            color="#28a745"
            onPress={handleViewClients}
          />
          <QuickAction
            icon="notifications-outline"
            label="Notifications"
            color="#ffc107"
            onPress={handleViewNotifications}
          />
          <QuickAction
            icon="person-outline"
            label="Mon Profil"
            color="#6f42c1"
            onPress={handleViewProfile}
          />
        </View>

        {/* Visites récentes */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Visites Récentes</Text>
          {recentVisits.length > 0 && (
            <Text style={styles.sectionSubtitle}>{recentVisits.length} dernières</Text>
          )}
        </View>

        <View style={styles.recentVisitsContainer}>
          {recentVisits.length > 0 ? (
            recentVisits.map((visit, index) => (
              <RecentVisitItem
                key={visit.id || index}
                visit={visit}
                onPress={() => {}}
              />
            ))
          ) : (
            <View style={styles.emptyVisits}>
              <Ionicons name="document-text-outline" size={48} color="#dee2e6" />
              <Text style={styles.emptyVisitsText}>Aucune visite récente</Text>
              <TouchableOpacity style={styles.startButton} onPress={handleNewVisit}>
                <Text style={styles.startButtonText}>Commencer une visite</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Espace en bas pour éviter le chevauchement avec la barre de navigation */}
        <View style={{ height: Math.max(30, insets.bottom + 20) }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#6c757d',
  },
  header: {
    padding: 20,
    paddingBottom: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#dee2e6',
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    padding: 8,
    marginLeft: 5,
  },
  greeting: {
    fontSize: 14,
    color: '#6c757d',
  },
  userName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#343a40',
  },
  sectionHeader: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#343a40',
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#6c757d',
    marginTop: 2,
  },
  kpiContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    marginBottom: 10,
  },
  kpiBox: {
    backgroundColor: '#ffffff',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    width: (width - 50) / 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  kpiIconContainer: {
    padding: 10,
    borderRadius: 25,
    marginBottom: 8,
  },
  kpiValue: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  kpiLabel: {
    fontSize: 13,
    color: '#343a40',
    fontWeight: '600',
    marginTop: 2,
  },
  kpiSubtitle: {
    fontSize: 11,
    color: '#6c757d',
    marginTop: 2,
  },
  weekSummary: {
    backgroundColor: '#ffffff',
    marginHorizontal: 15,
    marginTop: 10,
    padding: 15,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  weekSummaryContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  weekSummaryText: {
    marginLeft: 12,
  },
  weekSummaryValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#343a40',
  },
  weekSummaryLabel: {
    fontSize: 12,
    color: '#6c757d',
  },
  rejectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8d7da',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
  },
  rejectedText: {
    fontSize: 12,
    color: '#dc3545',
    marginLeft: 5,
    fontWeight: '600',
  },
  quickActionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
  },
  quickActionButton: {
    width: (width - 50) / 2,
    backgroundColor: '#ffffff',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  quickActionIcon: {
    padding: 12,
    borderRadius: 30,
    marginBottom: 8,
  },
  quickActionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#343a40',
  },
  recentVisitsContainer: {
    backgroundColor: '#ffffff',
    marginHorizontal: 15,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  recentVisitItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  recentVisitLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  visitStatusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 12,
  },
  recentVisitInfo: {
    flex: 1,
  },
  recentVisitClient: {
    fontSize: 14,
    fontWeight: '600',
    color: '#343a40',
  },
  recentVisitDate: {
    fontSize: 12,
    color: '#6c757d',
    marginTop: 2,
  },
  recentVisitRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 4,
  },
  emptyVisits: {
    alignItems: 'center',
    padding: 30,
  },
  emptyVisitsText: {
    fontSize: 14,
    color: '#6c757d',
    marginTop: 10,
    marginBottom: 15,
  },
  startButton: {
    backgroundColor: '#007bff',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  startButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
});
