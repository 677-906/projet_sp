import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axiosConfig';
import './VisitDetailPage.css';

function VisitDetailPage() {
  const { visiteId } = useParams();
  const navigate = useNavigate();
  
  const [visite, setVisite] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const response = await axiosInstance.get(`/visites/${visiteId}`);
        setVisite(response.data);
      } catch (error) {
        console.error("Erreur de chargement des détails:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDetails();
  }, [visiteId]);

  const handleAction = async (action) => {
    const endpoint = action === 'valider' ? `/visites/${visiteId}/valider` : `/visites/${visiteId}/rejeter`;
    try {
      await axiosInstance.put(endpoint);
      alert(`Rapport ${action === 'valider' ? 'validé' : 'rejeté'} avec succès !`);
      navigate('/dashboard');
    } catch (error) {
      alert(`Erreur lors de l'action : ${action}`);
    }
  };

  if (isLoading) return <div className="loading">Chargement des détails...</div>;
  if (!visite) return <div className="error">Impossible de charger les détails de la visite.</div>;

  return (
    <div className="visit-detail-page">
      <header className="detail-header">
        <div>
          <h1>Rapport de Visite #{visite.id}</h1>
          <p>
            <strong>Client :</strong> {visite.client?.nom_client} | 
            <strong>Merchandiser :</strong> {visite.merchandiser?.user?.nom} | 
            <strong>Date :</strong> {new Date(visite.date_visite).toLocaleDateString()}
          </p>
        </div>
         <button onClick={() => navigate(-1)} className="back-button">
          Retour à la liste
        </button>
      </header>
      
      <div className="form-content">
        <section className="detail-section">
          <h2>Résumé de la Visite</h2>
          <div className="detail-item"><p><strong>FIFO respecté :</strong> {visite.fifo_respecte ? 'Oui' : 'Non'}</p></div>
          <div className="detail-item"><p><strong>Planogramme respecté :</strong> {visite.planogramme_respecte ? 'Oui' : 'Non'}</p></div>
          {visite.observations_generales && (
            <div className="detail-item">
              <p><strong>Observations Générales :</strong></p>
              <p className="observation-text">{visite.observations_generales}</p>
            </div>
          )}
        </section>

        <section className="detail-section">
          <h2>Stocks & Ruptures</h2>
          {visite.releves_stock?.length > 0 ? (
            <table>
              <thead><tr><th>Produit</th><th>Qté en Stock</th><th>En Rupture</th><th>Type Rupture</th></tr></thead>
              <tbody>
                {visite.releves_stock.map(item => (
                  <tr key={`stock-${item.id}`}>
                    <td>{item.produit?.nom_produit}</td>
                    <td>{item.quantite_en_stock}</td>
                    <td>{item.est_en_rupture ? 'Oui' : 'Non'}</td>
                    <td>{item.type_rupture}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <p>Aucun relevé de stock pour cette visite.</p>}
        </section>

        <section className="detail-section">
          <h2>Incidents & Commandes</h2>
          {visite.details_produits?.length > 0 ? (
            <table>
              <thead><tr><th>Produit</th><th>Type</th><th>Quantité</th><th>Observation</th></tr></thead>
              <tbody>
                {visite.details_produits.map(item => (
                  <tr key={`detail-${item.id}`}>
                    <td>{item.produit?.nom_produit}</td>
                    <td>{item.type_detail}</td>
                    <td>{item.quantite}</td>
                    <td>{item.observation}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <p>Aucun incident ou commande pour cette visite.</p>}
        </section>

        <section className="detail-section">
          <h2>Veille Concurrentielle</h2>
          {visite.veilles_concurrentielles?.length > 0 ? (
            <table>
              <thead><tr><th>Concurrent</th><th>Marque</th><th>Nb Packs</th><th>Activité</th><th>Mécanisme</th></tr></thead>
              <tbody>
                {visite.veilles_concurrentielles.map(item => (
                  <tr key={`veille-${item.id}`}>
                    <td>{item.concurrent?.nom}</td>
                    <td>{item.marque}</td>
                    <td>{item.nombre_packs}</td>
                    <td>{item.activite_observee}</td>
                    <td>{item.mecanisme}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <p>Aucune observation de veille pour cette visite.</p>}
        </section>

        <section className="actions-section">
          <button onClick={() => handleAction('valider')} className="action-button approve-button">Valider le Rapport</button>
          <button onClick={() => handleAction('rejeter')} className="action-button reject-button">Rejeter le Rapport</button>
        </section>
      </div>
    </div>
  );
}

export default VisitDetailPage;