// src/pages/ExportExcelPage.js
import React, { useState, useEffect } from 'react';
import axiosInstance from '../api/axiosConfig';
import './ExportExcelPage.css';

function ExportExcelPage() {
  const [visites, setVisites] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  useEffect(() => {
    fetchValidatedVisites();
  }, []);

  const fetchValidatedVisites = async () => {
    try {
      setIsLoading(true);
      const response = await axiosInstance.get('/visites/?statut=valide');
      setVisites(response.data);
    } catch (error) {
      console.error('Erreur lors du chargement des visites validées:', error);
      alert('Impossible de charger les visites validées');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      setIsExporting(true);

      // Utiliser l'endpoint existant qui exporte toutes les visites validées
      const response = await axiosInstance.get('/chef-zone/export/visites-validees',
        { responseType: 'blob' }
      );

      // Créer un lien de téléchargement
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `visites_validees_${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      alert(`Export Excel réussi ! ${visites.length} visite(s) exportée(s).`);
    } catch (error) {
      console.error('Erreur lors de l\'export:', error);
      alert('Erreur lors de l\'export Excel');
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading) {
    return <div className="export-container"><p>Chargement...</p></div>;
  }

  return (
    <div className="export-container">
      <div className="export-header">
        <h1>Export Excel - Visites Validées</h1>
        <button
          className="export-button"
          onClick={handleExport}
          disabled={isExporting || visites.length === 0}
        >
          {isExporting ? 'Export en cours...' : `Exporter ${visites.length} visite(s)`}
        </button>
      </div>

      <div className="export-stats">
        <p><strong>{visites.length}</strong> visite(s) validée(s) disponible(s)</p>
        <p>Toutes les visites validées de votre équipe seront exportées</p>
      </div>

      {visites.length === 0 ? (
        <div className="empty-state">
          <p>Aucune visite validée disponible pour l'export</p>
        </div>
      ) : (
        <table className="visites-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Merchandiser</th>
              <th>Client</th>
              <th>Zone</th>
              <th>Validateur</th>
              <th>Date Validation</th>
            </tr>
          </thead>
          <tbody>
            {visites.map(visite => (
              <tr key={visite.id}>
                <td>{new Date(visite.date_visite).toLocaleDateString('fr-FR')}</td>
                <td>{visite.merchandiser?.user?.nom || 'N/A'}</td>
                <td>{visite.client?.nom_client || 'N/A'}</td>
                <td>{visite.merchandiser?.chef_zone?.zone || 'N/A'}</td>
                <td>{visite.validateur?.user?.nom || 'N/A'}</td>
                <td>{visite.date_validation ? new Date(visite.date_validation).toLocaleDateString('fr-FR') : 'N/A'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default ExportExcelPage;
