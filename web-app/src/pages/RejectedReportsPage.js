import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axiosConfig';
import './ValidationPage.css';

function RejectedReportsPage() {
  const [visites, setVisites] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchVisites = async () => {
      try {
        const response = await axiosInstance.get('/chef-zone/visites/rejetees');
        setVisites(response.data);
      } catch (error) {
        console.error('Erreur chargement rapports rejetés:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchVisites();
  }, []);

  if (isLoading) return <div className="loading">Chargement...</div>;

  return (
    <div className="page-container">
      <header className="page-header">
        <h1>Rapports Rejetés</h1>
      </header>

      <main className="page-content">
        {visites.length > 0 ? (
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Merchandiser</th>
                <th>Client</th>
                <th>Motif du rejet</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {visites.map(visite => (
                <tr key={visite.id}>
                  <td>{new Date(visite.date_visite).toLocaleDateString()}</td>
                  <td>{visite.merchandiser?.user?.nom}</td>
                  <td>{visite.client?.nom_client}</td>
                  <td>{visite.commentaire_validateur || 'Non spécifié'}</td>
                  <td>
                    <button
                      onClick={() => navigate(`../visite/${visite.id}`)}
                      className="action-button view-button"
                    >
                      Voir détails
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="no-data-message">Aucun rapport rejeté pour le moment.</p>
        )}
      </main>
    </div>
  );
}

export default RejectedReportsPage;
