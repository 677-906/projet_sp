import React, { useState, useEffect } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import axiosInstance from '../api/axiosConfig';
import './AdminDashboardPage.css';

// Enregistrement des composants Chart.js
ChartJS.register(ArcElement, Tooltip, Legend);

function AdminDashboardPage() {
  // On a maintenant deux états bien séparés
  const [stats, setStats] = useState(null);
  const [activities, setActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        // On ne fait que 2 appels API : un pour les stats, un pour les activités
        const [statsRes, activitiesRes] = await Promise.all([
          axiosInstance.get('/admin/dashboard-stats'),
          axiosInstance.get('/admin/activity-logs?limit=5')
        ]);
        
        // On met à jour l'état des stats
        setStats(statsRes.data);
        // On met à jour l'état des activités
        setActivities(activitiesRes.data);

      } catch (error) {
        console.error("Erreur chargement données admin:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAdminData();
  }, []);

  // Préparation des données pour le graphique circulaire
  const rolesChartData = {
    labels: stats ? Object.keys(stats.rolesDistribution) : [],
    datasets: [{
      data: stats ? Object.values(stats.rolesDistribution) : [],
      backgroundColor: [
        'rgba(75, 192, 192, 0.7)',
        'rgba(54, 162, 235, 0.7)',
        'rgba(255, 206, 86, 0.7)',
      ],
      borderColor: '#ffffff',
      borderWidth: 2,
    }],
  };
  
  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
    },
  };

  if (isLoading) return <div className="loading">Chargement du tableau de bord...</div>;

  return (
    <div className="admin-dashboard">
      <h1>Tableau de Bord Administrateur</h1>
      
      <div className="admin-kpi-grid">
        <div className="admin-kpi-card">
          <span className="kpi-icon">👥</span>
          <div className="kpi-text">
            {/* On lit les données directement depuis l'objet 'stats' */}
            <span className="kpi-value">{stats?.totalUsers ?? 0}</span>
            <span className="kpi-label">Utilisateurs Totaux</span>
          </div>
        </div>
        <div className="admin-kpi-card">
          <span className="kpi-icon">📈</span>
          <div className="kpi-text">
            <span className="kpi-value">{stats?.totalVisits ?? 0}</span>
            <span className="kpi-label">Visites Enregistrées</span>
          </div>
        </div>
        <div className="admin-kpi-card">
          <span className="kpi-icon">📦</span>
          <div className="kpi-text">
            <span className="kpi-value">{stats?.totalProducts ?? 0}</span>
            <span className="kpi-label">Produits au Catalogue</span>
          </div>
        </div>
      </div>

      <div className="admin-widgets">
        <div className="widget">
          <h3>Répartition des Rôles</h3>
          <div className="chart-container">
            {stats && stats.rolesDistribution ? 
              <Doughnut data={rolesChartData} options={chartOptions} /> : 
              <p>Chargement des données du graphique...</p>
            }
          </div>
        </div>
        <div className="widget">
          <h3>Activité Récente du Système</h3>
          {/* On utilise l'état 'activities' ici */}
          {activities.length > 0 ? (
            <ul className="activity-list">
              {activities.map(log => (
                <li key={log.id}>
                  <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                  <strong>{log.user?.nom || 'Système'}</strong> {log.action}
                </li>
              ))}
            </ul>
          ) : <p>Aucune activité récente.</p>}
        </div>
      </div>
    </div>
  );
}
export default AdminDashboardPage;