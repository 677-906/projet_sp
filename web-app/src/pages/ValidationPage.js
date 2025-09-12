import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axiosConfig';
import './ValidationPage.css'; // On importe le fichier de style

function ValidationPage() {
  const [visites, setVisites] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchVisites = async () => {
      try {
        const response = await axiosInstance.get('/superviseur/visites/en-attente');
        setVisites(response.data);
      } catch (error) {
        console.error(error);
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
        <h1>Rapports en Attente de Validation</h1>
        <button onClick={() => navigate('/dashboard')} className="back-button">Retour au Tableau de Bord</button>
      </header>
      
      <main className="page-content">
        {visites.length > 0 ? (
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Merchandiser ID</th>
                <th>Client ID</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {visites.map(visite => (
                <tr key={visite.id}>
                  <td>{new Date(visite.date_visite).toLocaleDateString()}</td>
                  <td>{visite.merchandiser_id}</td>
                  <td>{visite.client_id}</td>
                  <td>
                    <span className="status-badge pending">{visite.statut_validation}</span>
                  </td>
                  <td>
                    <button onClick={() => navigate(`/visite/${visite.id}`)} className="action-button view-button">
                      Consulter & Décider
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="no-data-message">🎉 Aucun rapport en attente pour le moment !</p>
        )}
      </main>
    </div>
  );
}

export default ValidationPage;