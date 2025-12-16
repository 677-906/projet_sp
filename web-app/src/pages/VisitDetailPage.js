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

    // Si c'est un rejet, demander la raison
    let commentaire = null;
    if (action === 'rejeter') {
      commentaire = window.prompt(
        'Veuillez indiquer la raison du rejet de cette visite :\n\n(Cette information sera envoyée au merchandiser)',
        ''
      );

      // Si l'utilisateur annule ou ne fournit pas de raison
      if (commentaire === null) {
        return; // Annuler l'action
      }

      // Trim le commentaire
      commentaire = commentaire.trim();

      // Demander confirmation si pas de raison fournie
      if (commentaire === '') {
        const confirmer = window.confirm(
          'Vous n\'avez pas indiqué de raison. Voulez-vous vraiment rejeter sans raison ?'
        );
        if (!confirmer) {
          return; // Annuler l'action
        }
      }
    }

    try {
      // Envoyer la requête avec le commentaire si c'est un rejet
      if (action === 'rejeter') {
        await axiosInstance.put(endpoint, { commentaire });
      } else {
        await axiosInstance.put(endpoint);
      }

      alert(`Rapport ${action === 'valider' ? 'validé' : 'rejeté'} avec succès !`);
      navigate('/dashboard');
    } catch (error) {
      console.error('Erreur lors de l\'action:', error);
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
            <strong>Date :</strong> {new Date(visite.date_visite).toLocaleDateString()} |
            <strong>Statut :</strong> <span className={`status-badge ${visite.statut_validation}`}>{visite.statut_validation}</span>
          </p>
        </div>
         <button onClick={() => navigate('/chef-zone/validation')} className="back-button">
          Retour à la liste
        </button>
      </header>

      {/* Informations Acteurs */}
      <section className="detail-section actors-section">
        <h2>👥 Acteurs de la Visite</h2>
        <div className="detail-grid">
          <div className="detail-item">
            <strong>Merchandiser :</strong> {visite.merchandiser?.user?.nom || 'N/A'}
          </div>
          <div className="detail-item">
            <strong>Zone :</strong> {visite.merchandiser?.chef_zone?.zone || 'N/A'}
          </div>
          <div className="detail-item">
            <strong>Chef de Zone :</strong> {visite.merchandiser?.chef_zone?.user?.nom || 'N/A'}
          </div>
          <div className="detail-item">
            <strong>Commercial :</strong> {visite.client?.commercial?.nom || visite.client?.commercial_nom || 'N/A'}
          </div>
        </div>
      </section>

      {/* Informations Client Enrichies */}
      <section className="detail-section client-section">
        <h2>🏪 Informations Client</h2>
        <div className="detail-grid">
          <div className="detail-item">
            <strong>Nom Client :</strong> {visite.client?.nom_client || 'N/A'}
          </div>
          <div className="detail-item">
            <strong>Zone :</strong> {visite.client?.zone || 'N/A'}
          </div>
          <div className="detail-item">
            <strong>Commercial :</strong> {visite.client?.commercial?.nom || visite.client?.commercial_nom || 'N/A'}
          </div>
          <div className="detail-item">
            <strong>Lieu-dit :</strong> {visite.client?.lieu_dit || 'N/A'}
          </div>
          <div className="detail-item">
            <strong>Contact :</strong> {visite.client?.contact || 'N/A'}
          </div>
          <div className="detail-item">
            <strong>Typologie :</strong> {visite.client?.typologie || 'N/A'}
          </div>
          <div className="detail-item">
            <strong>Localisation :</strong> {visite.client?.localisation || 'N/A'}
          </div>
        </div>
      </section>
      
      <div className="form-content">
        {/* Géolocalisation - Vérification présence sur site */}
        <section className="detail-section geolocation-section">
          <h2>📍 Vérification Terrain</h2>
          <div className="geolocation-status">
            {visite.est_sur_site !== null && visite.est_sur_site !== undefined ? (
              <div className={`geo-badge ${visite.est_sur_site ? 'on-site' : 'off-site'}`}>
                {visite.est_sur_site ? '✓ SUR SITE' : '✗ HORS SITE'}
              </div>
            ) : (
              <div className="geo-badge no-gps">
                Position non vérifiée
              </div>
            )}
          </div>
          <div className="detail-grid">
            <div className="detail-item">
              <strong>Distance :</strong> {visite.distance_client !== null && visite.distance_client !== undefined ? `${visite.distance_client} m` : 'N/A'}
            </div>
            <div className="detail-item">
              <strong>Précision :</strong> {visite.precision_gps ? `± ${Math.round(visite.precision_gps)} m` : 'N/A'}
            </div>
          </div>

          {/* --- C'EST LA SEULE PARTIE À AJOUTER/MODIFIER --- */}

          <div className="detail-item">
            <p><strong>Position de soumission du rapport</strong></p>
            {/* On vérifie que les coordonnées existent avant d'afficher le lien */}
            {visite.latitude_soumission && visite.longitude_soumission ? (
              <a 
                href={`https://www.google.com/maps/search/?api=1&query=${visite.latitude_soumission},${visite.longitude_soumission}`} 
                target="_blank" // Ouvre dans un nouvel onglet
                rel="noopener noreferrer" // Bonne pratique de sécurité
                className="map-link-inline"
              >
                  Voir la position sur Google Maps
              </a>
            ) : (
              <span style={{ color: '#888' }}>Position non enregistrée pour cette visite.</span>
            )}
          </div>


        </section>

        {/* Informations Générales */}
        <section className="detail-section">
          <h2>📋 Informations Générales</h2>
          <div className="detail-grid">
            <div className="detail-item"><strong>Base :</strong> {visite.base || 'N/A'}</div>
            <div className="detail-item"><strong>Heure Début :</strong> {visite.heure_debut || 'N/A'}</div>
            <div className="detail-item"><strong>Heure Fin :</strong> {visite.heure_fin || 'N/A'}</div>
            <div className="detail-item"><strong>Réseau Distribution :</strong> {visite.reseau_distribution || 'N/A'}</div>
            <div className="detail-item"><strong>Type Client :</strong> {visite.type_client || 'N/A'}</div>
            {visite.client_direct_nom && (
              <div className="detail-item"><strong>Client Direct :</strong> {visite.client_direct_nom}</div>
            )}
          </div>
        </section>

        {/* Équipements/Outils */}
        <section className="detail-section">
          <h2>🛠️ Équipements/Outils</h2>
          <div className="detail-grid">
            <div className="detail-item"><strong>Type Outil :</strong> {visite.type_outil || 'N/A'}</div>
            <div className="detail-item"><strong>Marque Outil :</strong> {visite.marque_outil || 'N/A'}</div>
            <div className="detail-item"><strong>État Outil :</strong> {visite.etat_outil || 'N/A'}</div>
          </div>
        </section>

        {/* Conformité */}
        <section className="detail-section">
          <h2>✅ Conformité</h2>
          <div className="detail-grid">
            <div className="detail-item"><strong>FIFO respecté :</strong> {visite.fifo_respecte ? '✓ Oui' : '✗ Non'}</div>
            <div className="detail-item"><strong>Planogramme respecté :</strong> {visite.planogramme_respecte ? '✓ Oui' : '✗ Non'}</div>
          </div>
          {visite.observation_planogramme && (
            <div className="detail-item">
              <p><strong>Observation Planogramme :</strong></p>
              <p className="observation-text">{visite.observation_planogramme}</p>
            </div>
          )}
        </section>

        {/* Ruptures de Stock */}
        <section className="detail-section">
          <h2>📦 Ruptures de Stock</h2>
          <div className="detail-item">
            {visite.ruptures ? (
              <p className="observation-text">{visite.ruptures}</p>
            ) : (
              <p className="no-data-message">Aucune rupture signalée</p>
            )}
          </div>
        </section>

        {/* Incidents */}
        <section className="detail-section">
          <h2>⚠️ Incidents</h2>
          {(() => {
            const incidents = visite.details_produits?.filter(d => d.type_detail === 'incident') || [];
            if (incidents.length > 0) {
              return (
                <div className="veille-grid">
                  {incidents.map((incident, index) => (
                    <div key={`incident-${incident.id || index}`} className="veille-card">
                      <div className="veille-header">
                        <strong>{incident.produit?.article || incident.produit?.nom_produit || 'Article inconnu'}</strong>
                      </div>
                      <div className="veille-body">
                        <div className="veille-info">
                          <span className="veille-label">Type:</span>
                          <span className="veille-value">{incident.observation || visite.type_incidents || 'N/A'}</span>
                        </div>
                        <div className="veille-info">
                          <span className="veille-label">Quantité:</span>
                          <span className="veille-value">{incident.quantite || 0}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              );
            } else if (visite.type_incidents || visite.articles_incidents) {
              // Fallback sur les champs récapitulatifs si pas de détails
              return (
                <div className="detail-grid">
                  <div className="detail-item"><strong>Type :</strong> {visite.type_incidents || 'N/A'}</div>
                  <div className="detail-item"><strong>Articles :</strong> {visite.articles_incidents || 'N/A'}</div>
                  <div className="detail-item"><strong>Quantité :</strong> {visite.quantite_incidents || 'N/A'}</div>
                </div>
              );
            } else {
              return <p className="no-data-message">Aucun incident signalé</p>;
            }
          })()}
        </section>

        {/* Veille Concurrentielle */}
        <section className="detail-section">
          <h2>🔍 Veille Concurrentielle</h2>
          {visite.veilles_concurrentielles?.length > 0 ? (
            <div className="veille-grid">
              {visite.veilles_concurrentielles.map((item, index) => (
                <div key={`veille-${item.id || index}`} className="veille-card">
                  <div className="veille-header">
                    <strong>{item.marque}</strong>
                  </div>
                  <div className="veille-body">
                    {item.concurrent?.nom && (
                      <div className="veille-info">
                        <span className="veille-label">Concurrent:</span>
                        <span className="veille-value">🏢 {item.concurrent.nom}</span>
                      </div>
                    )}
                    {item.nombre_packs > 0 && (
                      <div className="veille-info">
                        <span className="veille-label">Nombre de packs:</span>
                        <span className="veille-value">{item.nombre_packs}</span>
                      </div>
                    )}
                    {item.activite_observee && (
                      <div className="veille-info">
                        <span className="veille-label">Activité:</span>
                        <span className="veille-value">{item.activite_observee}</span>
                      </div>
                    )}
                    {item.mecanisme && (
                      <div className="veille-info">
                        <span className="veille-label">Mécanisme:</span>
                        <span className="veille-value">{item.mecanisme}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : <p className="no-data-message">Aucune observation de veille pour cette visite.</p>}
        </section>

        {/* Observations Générales */}
        {visite.observations_generales && (
          <section className="detail-section">
            <h2>📝 Observations Générales</h2>
            <div className="detail-item">
              <p className="observation-text">{visite.observations_generales}</p>
            </div>
          </section>
        )}

        <section className="actions-section">
          <button onClick={() => handleAction('valider')} className="action-button approve-button">Valider le Rapport</button>
          <button onClick={() => handleAction('rejeter')} className="action-button reject-button">Rejeter le Rapport</button>
        </section>
      </div>
    </div>
  );
}

export default VisitDetailPage;