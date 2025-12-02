// src/pages/ValidatedReportsPage.js

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axiosConfig';
import './ManagementPages.css'; // On réutilise le même style que les autres pages de gestion

function ValidatedReportsPage() {
  const [visites, setVisites] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchValidatedVisites = async () => {
      try {
        // On appelle la nouvelle route pour les rapports validés
        const response = await axiosInstance.get('/admin/visites/validees');
        setVisites(response.data);
      } catch (error) {
        console.error("Erreur lors du chargement des rapports validés :", error);
        alert("Impossible de charger les rapports.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchValidatedVisites();
  }, []);

  if (isLoading) {
    return <div>Chargement des rapports validés...</div>;
  }

  return (
    <div className="management-page">
      <h1>Historique des Rapports Validés</h1>
      
      <div className="management-table-container">
        {visites.length > 0 ? (
          <table className="data-table">
            <thead>
    <tr>
      <th>Date</th>
      <th>Merchandiser</th>
      <th>Client</th>
      <th>Statut</th>
      <th>Validé par</th>
      <th>Actions</th>
    </tr>
  </thead>
            <tbody>
              {visites.map(visite => (
                <tr key={visite.id}>
                  <td>{new Date(visite.date_visite).toLocaleDateString()}</td>
                  <td>{visite.merchandiser?.user?.nom}</td>
                  <td>{visite.client?.nom_client}</td>
                  <td>
                    {/* On peut ajouter un style différent pour le statut "validé" */}
                    <span className="status-badge approved">{visite.statut_validation}</span>
                  </td>
                  <td>{visite.validateur?.user?.nom}</td>
                  <td>
                    {/* Le bouton "Voir" mène toujours à la page de détail */}
                    <button 
                      onClick={() => navigate(`/visite/${visite.id}`)} 
                      className="action-button view-button"
                    >
                      Voir Détails
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>Aucun rapport validé trouvé dans l'historique.</p>
        )}
      </div>
    </div>
  );
}

export default ValidatedReportsPage;