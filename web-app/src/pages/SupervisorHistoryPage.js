// src/pages/SupervisorHistoryPage.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axiosConfig';
import './ManagementPages.css';

function SupervisorHistoryPage() {
  const [visites, setVisites] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await axiosInstance.get('/superviseur/visites/historique');
        setVisites(response.data);
      } catch (error) { console.error(error); } 
      finally { setIsLoading(false); }
    };
    fetchHistory();
  }, []);

  const handleExport = async () => {
    try {
        const response = await axiosInstance.get('/superviseur/export/visites-validees', { responseType: 'blob' });
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `export_rapports_valides.csv`);
        document.body.appendChild(link);
        link.click();
        link.remove();
    } catch (error) {
        alert("Erreur lors de l'exportation.");
    }
  };

  if (isLoading) return <div>Chargement de l'historique...</div>;

  return (
    <div className="management-page">
      <div className="page-header">
        <h1>Historique des Rapports Traités</h1>
        <button onClick={handleExport} className="export-button">Exporter les Validés (CSV)</button>
      </div>
      <table className="data-table">
        <thead>
            <tr>
                <th>Date</th>
                <th>Merchandiser</th>
                <th>Client</th>
                <th>Statut Final</th>
            </tr>
        </thead>
        <tbody>
          {visites.map(visite => (
            // --- LA MODIFICATION EST ICI ---
            // On rend la ligne cliquable et on appelle la navigation
            <tr 
                key={visite.id} 
                onClick={() => navigate(`/visite/${visite.id}`)} 
                className="clickable-row"
            >
              <td>{new Date(visite.date_visite).toLocaleDateString()}</td>
              <td>{visite.merchandiser?.user?.nom}</td>
              <td>{visite.client?.nom_client}</td>
              <td>
                <span className={`status-badge ${visite.statut_validation === 'valide' ? 'approved' : 'rejected'}`}>
                  {visite.statut_validation}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default SupervisorHistoryPage;