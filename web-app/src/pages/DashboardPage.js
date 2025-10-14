import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axiosConfig';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2'; // On importe les types de graphiques
import './DashboardPage.css';

// On doit "enregistrer" les composants de Chart.js qu'on va utiliser
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

function DashboardPage({ onLogout }) {
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await axiosInstance.get('/superviseur/dashboard-stats');
        setStats(response.data);
      } catch (error) { console.error(error); }
      finally { setIsLoading(false); }
    };
    fetchDashboardData();
  }, []);

  // Préparation des données pour le graphique circulaire
  const pieChartData = {
    labels: stats ? Object.keys(stats.statutsData) : [],
    datasets: [{
      data: stats ? Object.values(stats.statutsData) : [],
      backgroundColor: ['#ffc107', '#28a745', '#dc3545'], // Jaune, Vert, Rouge
      borderColor: ['#ffffff'],
      borderWidth: 2,
    }],
  };

  // Préparation des données pour le graphique en barres
  const barChartData = {
    labels: stats ? Object.keys(stats.performanceEquipe) : [],
    datasets: [{
      label: 'Nombre de Visites',
      data: stats ? Object.values(stats.performanceEquipe) : [],
      backgroundColor: 'rgba(0, 123, 255, 0.6)',
      borderColor: 'rgba(0, 123, 255, 1)',
      borderWidth: 1,
    }],
  };
  const barChartOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
      title: { display: true, text: 'Performance par Merchandiser' },
    },
  };

  if (isLoading) return <div className="loading">Chargement du tableau de bord...</div>;

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>Tableau de Bord Superviseur</h1>
      </header>
      
      <main className="dashboard-content">
        <div className="kpi-grid">
          <div className="kpi-card-alert" onClick={() => navigate('/validations')}>
            <h2>{stats?.visitesEnAttente ?? 0}</h2>
            <p>Rapports en attente</p>
            <span className="kpi-card-action">Traiter les rapports</span>
          </div>
          {/* ... autres cartes KPI ... */}
        </div>
        
        <div className="dashboard-widgets">
          <div className="widget chart-widget">
            <h3>Statut des Visites</h3>
            {stats && Object.keys(stats.statutsData).length > 0 ? (
              <Doughnut data={pieChartData} />
            ) : <p>Pas de données de statut à afficher.</p>}
          </div>
          <div className="widget chart-widget">
            <h3>Activité de l'Équipe</h3>
            {stats && Object.keys(stats.performanceEquipe).length > 0 ? (
              <Bar options={barChartOptions} data={barChartData} />
            ) : <p>Pas de données de performance à afficher.</p>}
          </div>
        </div>
      </main>
    </div>
  );
}

export default DashboardPage;