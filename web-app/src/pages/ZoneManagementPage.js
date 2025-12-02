import React, { useState, useEffect, useCallback } from 'react';
import axiosInstance from '../api/axiosConfig';
import Modal from 'react-modal';
import './ManagementPages.css';

Modal.setAppElement('#root');

function ZoneManagementPage() {
  const [zones, setZones] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // États pour le modal de détails
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedZone, setSelectedZone] = useState(null);
  const [zoneDetails, setZoneDetails] = useState(null);

  const fetchZones = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await axiosInstance.get('/admin/zones/');
      setZones(response.data);
    } catch (error) {
      console.error("Erreur de chargement des zones:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchZones();
  }, [fetchZones]);

  const viewZoneDetails = async (zoneName) => {
    try {
      const response = await axiosInstance.get(`/admin/zones/${encodeURIComponent(zoneName)}/details`);
      setZoneDetails(response.data);
      setSelectedZone(zoneName);
      setIsDetailsModalOpen(true);
    } catch (error) {
      console.error("Erreur lors du chargement des détails:", error);
      alert("Erreur lors du chargement des détails de la zone.");
    }
  };

  const closeDetailsModal = () => {
    setIsDetailsModalOpen(false);
    setZoneDetails(null);
    setSelectedZone(null);
  };

  if (isLoading) return <div>Chargement...</div>;

  return (
    <div className="management-page">
      <h1>Gestion des Zones</h1>

      <div className="info-box" style={{marginBottom: '20px', padding: '15px', backgroundColor: '#e3f2fd', borderRadius: '8px'}}>
        <h3 style={{marginTop: 0}}>ℹ️ Comment ajouter une nouvelle zone ?</h3>
        <p>Les zones sont créées automatiquement lorsque vous:</p>
        <ul>
          <li><strong>Créez un Chef de Zone</strong> avec une nouvelle zone dans "Gestion Utilisateurs"</li>
          <li><strong>Créez un Client</strong> avec une nouvelle zone dans "Gestion Clients"</li>
        </ul>
        <p style={{marginBottom: 0}}><em>Format recommandé: DOUALA 1, DOUALA 2, YAOUNDE 1, etc. (avec espace)</em></p>
      </div>

      <div className="management-table-container">
        <div className="table-header">
          <h3>Liste des Zones ({zones.length})</h3>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Zone</th>
              <th>Chefs de Zone</th>
              <th>Commerciaux</th>
              <th>Clients</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {zones.map(zone => (
              <tr key={zone.zone}>
                <td><strong>{zone.zone}</strong></td>
                <td>{zone.nb_chefs_zone}</td>
                <td>{zone.nb_commerciaux}</td>
                <td>{zone.nb_clients}</td>
                <td className="actions-cell">
                  <button
                    className="action-button view-button"
                    onClick={() => viewZoneDetails(zone.zone)}
                  >
                    Voir Détails
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal
        isOpen={isDetailsModalOpen}
        onRequestClose={closeDetailsModal}
        className="modal"
        overlayClassName="overlay"
        style={{
          content: {
            maxWidth: '800px',
            maxHeight: '80vh',
            overflow: 'auto'
          }
        }}
      >
        {zoneDetails && (
          <div>
            <h2>Détails de la zone: {selectedZone}</h2>

            <div style={{marginBottom: '20px'}}>
              <h3>Chefs de Zone ({zoneDetails.chefs_zone.length})</h3>
              {zoneDetails.chefs_zone.length === 0 ? (
                <p style={{color: '#999'}}>Aucun chef de zone dans cette zone</p>
              ) : (
                <ul>
                  {zoneDetails.chefs_zone.map(chef => (
                    <li key={chef.id}>{chef.nom} (ID: {chef.id})</li>
                  ))}
                </ul>
              )}
            </div>

            <div style={{marginBottom: '20px'}}>
              <h3>Commerciaux ({zoneDetails.commerciaux.length})</h3>
              {zoneDetails.commerciaux.length === 0 ? (
                <p style={{color: '#999'}}>Aucun commercial dans cette zone</p>
              ) : (
                <ul>
                  {zoneDetails.commerciaux.map(com => (
                    <li key={com.id}>{com.nom} (ID: {com.id})</li>
                  ))}
                </ul>
              )}
            </div>

            <div style={{marginBottom: '20px'}}>
              <h3>Clients ({zoneDetails.clients.length})</h3>
              {zoneDetails.clients.length === 0 ? (
                <p style={{color: '#999'}}>Aucun client dans cette zone</p>
              ) : (
                <div style={{maxHeight: '200px', overflow: 'auto', border: '1px solid #ddd', padding: '10px'}}>
                  <ul>
                    {zoneDetails.clients.map(client => (
                      <li key={client.id}>{client.nom} (ID: {client.id})</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="modal-actions">
              <button type="button" onClick={closeDetailsModal} className="button-secondary">Fermer</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default ZoneManagementPage;
