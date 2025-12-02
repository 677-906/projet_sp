import React, { useState, useEffect, useCallback } from 'react';
import axiosInstance from '../api/axiosConfig';
import Modal from 'react-modal';
import './ManagementPages.css';

Modal.setAppElement('#root');

function ClientManagementPage() {
  const [clients, setClients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // États pour la création
  const [newClient, setNewClient] = useState({
    nom_client: '',
    contact: '',
    typologie: '',
    localisation: '',
    zone: '',
    sous_zone: '',
    commercial_id: '',
    merchandiser_id: '',
    lieu_dit: '',
    est_gms: false
  });

  // États pour la modification
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState(null);

  // État pour la recherche
  const [searchTerm, setSearchTerm] = useState('');

  // États pour les listes déroulantes
  const [zones, setZones] = useState([]);
  const [chefsZone, setChefsZone] = useState([]);
  const [commerciaux, setCommerciaux] = useState([]);
  const [merchandisers, setMerchandisers] = useState([]);
  const [selectedChefZone, setSelectedChefZone] = useState(null);

  const fetchData = useCallback(async (query = '') => {
    try {
      if (!query && !clients.length) setIsLoading(true);
      const response = await axiosInstance.get(`/admin/clients/search?query=${query}`);
      setClients(response.data);
    } catch (error) { console.error("Erreur de chargement:", error); }
    finally { setIsLoading(false); }
  }, [clients.length]);

  const fetchZonesAndChefs = useCallback(async () => {
    try {
      const [zonesRes, chefsRes] = await Promise.all([
        axiosInstance.get('/zones/'),
        axiosInstance.get('/chefs-zone/')
      ]);
      setZones(zonesRes.data);
      setChefsZone(chefsRes.data);
    } catch (error) {
      console.error("Erreur chargement zones/chefs:", error);
    }
  }, []);

  const fetchCommerciaux = async (chefZoneId) => {
    try {
      const response = await axiosInstance.get(`/chef-zone/${chefZoneId}/commerciaux`);
      setCommerciaux(response.data || []);
    } catch (error) {
      console.error("Erreur chargement commerciaux:", error);
      setCommerciaux([]);
    }
  };

  const fetchMerchandisers = async (chefZoneId) => {
    try {
      const response = await axiosInstance.get(`/chef-zone/${chefZoneId}/merchandisers`);
      setMerchandisers(response.data || []);
    } catch (error) {
      console.error("Erreur chargement merchandisers:", error);
      setMerchandisers([]);
    }
  };

  useEffect(() => {
    fetchData();
    fetchZonesAndChefs();
  }, [fetchData, fetchZonesAndChefs]);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await axiosInstance.post('/admin/clients/', newClient);
      alert('Client créé avec succès !');
      fetchData(searchTerm);
      setNewClient({
        nom_client: '',
        contact: '',
        typologie: '',
        localisation: '',
        zone: '',
        sous_zone: '',
        commercial_id: '',
        merchandiser_id: '',
        lieu_dit: '',
        est_gms: false
      });
      setSelectedChefZone(null);
      setCommerciaux([]);
      setMerchandisers([]);
    } catch (error) { alert('Erreur lors de la création.'); }
  };

  const handleZoneChange = (zone) => {
    setNewClient({ ...newClient, zone });
    const chefZone = chefsZone.find(cz => cz.zone === zone);
    if (chefZone) {
      setSelectedChefZone(chefZone.id);
      fetchCommerciaux(chefZone.id);
      fetchMerchandisers(chefZone.id);
    } else {
      setSelectedChefZone(null);
      setCommerciaux([]);
      setMerchandisers([]);
    }
  };
  
  const handleDelete = async (clientId) => {
    if (window.confirm(`Supprimer le client ID ${clientId} ?`)) {
      try {
        await axiosInstance.delete(`/admin/clients/${clientId}`);
        alert('Client supprimé !');
        fetchData(searchTerm);
      } catch (error) { alert('Erreur de suppression.'); }
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await axiosInstance.put(`/admin/clients/${editingClient.id}`, editingClient);
      alert('Client mis à jour !');
      closeEditModal();
      fetchData(searchTerm);
    } catch (error) { alert('Erreur de mise à jour.'); }
  };

  const openEditModal = async (client) => {
    setEditingClient(JSON.parse(JSON.stringify(client)));
    setIsModalOpen(true);

    // Charger les commerciaux et merchandisers si le client a une zone
    if (client.zone) {
      const chefZone = chefsZone.find(cz => cz.zone === client.zone);
      if (chefZone) {
        await fetchCommerciaux(chefZone.id);
        await fetchMerchandisers(chefZone.id);
      }
    }
  };

  const closeEditModal = () => {
    setIsModalOpen(false);
    setCommerciaux([]);
    setMerchandisers([]);
  };

  if (isLoading) return <div>Chargement...</div>;

  return (
    <div className="management-page">
      <h1>Gestion des Clients</h1>
      
      <div className="management-form-container">
        <h3>Ajouter un client</h3>
        <form onSubmit={handleCreate} className="management-form">
          <input
            value={newClient.nom_client}
            onChange={e => setNewClient({...newClient, nom_client: e.target.value})}
            placeholder="Nom du client"
            required
          />
          <input
            value={newClient.contact}
            onChange={e => setNewClient({...newClient, contact: e.target.value})}
            placeholder="Contact"
          />
          <input
            value={newClient.typologie}
            onChange={e => setNewClient({...newClient, typologie: e.target.value})}
            placeholder="Typologie"
          />
          <input
            value={newClient.localisation}
            onChange={e => setNewClient({...newClient, localisation: e.target.value})}
            placeholder="Localisation"
          />

          <select
            value={newClient.zone}
            onChange={e => handleZoneChange(e.target.value)}
            required
          >
            <option value="">-- Sélectionner une zone --</option>
            {zones.map((z, idx) => (
              <option key={idx} value={z.zone}>{z.zone}</option>
            ))}
          </select>

          <input
            value={newClient.sous_zone}
            onChange={e => setNewClient({...newClient, sous_zone: e.target.value})}
            placeholder="Sous-zone (optionnel)"
          />

          <select
            value={newClient.commercial_id}
            onChange={e => setNewClient({...newClient, commercial_id: e.target.value})}
            disabled={!selectedChefZone}
          >
            <option value="">-- Sélectionner un commercial --</option>
            {commerciaux.map((com) => (
              <option key={com.id} value={com.id}>{com.nom}</option>
            ))}
          </select>

          <select
            value={newClient.merchandiser_id}
            onChange={e => setNewClient({...newClient, merchandiser_id: e.target.value})}
            disabled={!selectedChefZone}
          >
            <option value="">-- Sélectionner un merchandiser (optionnel) --</option>
            {merchandisers.map((merc) => (
              <option key={merc.id} value={merc.id}>{merc.user?.nom || `Merchandiser #${merc.id}`}</option>
            ))}
          </select>

          <input
            value={newClient.lieu_dit}
            onChange={e => setNewClient({...newClient, lieu_dit: e.target.value})}
            placeholder="Lieu-dit / Secteur"
          />

          <div className="checkbox-group">
            <label>
              <input
                type="checkbox"
                checked={newClient.est_gms}
                onChange={e => setNewClient({...newClient, est_gms: e.target.checked})}
              />
              <span className="checkbox-label">Client GMS (Grande/Moyenne Surface)</span>
            </label>
          </div>

          <button type="submit">Ajouter</button>
        </form>
      </div>

      <div className="management-table-container">
        <div className="table-header">
          <h3>Liste des Clients</h3>
          <input type="text" placeholder="Rechercher par nom ou contact..." className="search-input" value={searchTerm} onChange={e => { setSearchTerm(e.target.value); fetchData(e.target.value); }}/>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nom</th>
              <th>Contact</th>
              <th>Typologie</th>
              <th>Type Surface</th>
              <th>Localisation</th>
              <th>Zone</th>
              <th>Commercial</th>
              <th>Lieu-dit</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {clients.map(c => (
              <tr key={c.id}>
                <td>{c.id}</td>
                <td>{c.nom_client}</td>
                <td>{c.contact}</td>
                <td>{c.typologie}</td>
                <td>
                  <span className={`badge ${c.est_gms ? 'badge-gms' : 'badge-petite'}`}>
                    {c.est_gms ? '🏢 GMS' : '🏪 Petite Surface'}
                  </span>
                </td>
                <td>{c.localisation}</td>
                <td>{c.zone || '-'}</td>
                <td>{c.commercial?.nom || (c.commercial_id ? `Commercial #${c.commercial_id}` : '-')}</td>
                <td>{c.lieu_dit || '-'}</td>
                <td className="actions-cell">
                  <button className="action-button view-button" onClick={() => openEditModal(c)}>Modifier</button>
                  <button className="action-button reject-button" onClick={() => handleDelete(c.id)}>Supprimer</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isModalOpen} onRequestClose={closeEditModal} className="modal" overlayClassName="overlay">
        {editingClient && (
          <form onSubmit={handleUpdate}>
            <h2>Modifier le Client : {editingClient.nom_client}</h2>
            <div className="input-group">
              <label>Nom</label>
              <input
                value={editingClient.nom_client || ''}
                onChange={e => setEditingClient({...editingClient, nom_client: e.target.value})}
              />
            </div>
            <div className="input-group">
              <label>Contact</label>
              <input
                value={editingClient.contact || ''}
                onChange={e => setEditingClient({...editingClient, contact: e.target.value})}
              />
            </div>
            <div className="input-group">
              <label>Typologie</label>
              <input
                value={editingClient.typologie || ''}
                onChange={e => setEditingClient({...editingClient, typologie: e.target.value})}
              />
            </div>
            <div className="input-group">
              <label>Localisation</label>
              <input
                value={editingClient.localisation || ''}
                onChange={e => setEditingClient({...editingClient, localisation: e.target.value})}
              />
            </div>
            <div className="input-group">
              <label>Zone</label>
              <select
                value={editingClient.zone || ''}
                onChange={e => {
                  const zone = e.target.value;
                  setEditingClient({...editingClient, zone});
                  const chefZone = chefsZone.find(cz => cz.zone === zone);
                  if (chefZone) {
                    fetchCommerciaux(chefZone.id);
                    fetchMerchandisers(chefZone.id);
                  }
                }}
              >
                <option value="">-- Sélectionner une zone --</option>
                {zones.map((z, idx) => (
                  <option key={idx} value={z.zone}>{z.zone}</option>
                ))}
              </select>
            </div>
            <div className="input-group">
              <label>Sous-zone (optionnel)</label>
              <input
                value={editingClient.sous_zone || ''}
                onChange={e => setEditingClient({...editingClient, sous_zone: e.target.value})}
                placeholder="Ex: Secteur A, Zone Nord"
              />
            </div>
            <div className="input-group">
              <label>Commercial</label>
              <select
                value={editingClient.commercial_id || ''}
                onChange={e => setEditingClient({...editingClient, commercial_id: parseInt(e.target.value)})}
              >
                <option value="">-- Sélectionner un commercial --</option>
                {commerciaux.map((com) => (
                  <option key={com.id} value={com.id}>{com.nom}</option>
                ))}
              </select>
            </div>
            <div className="input-group">
              <label>Merchandiser</label>
              <select
                value={editingClient.merchandiser_id || ''}
                onChange={e => setEditingClient({...editingClient, merchandiser_id: e.target.value ? parseInt(e.target.value) : null})}
              >
                <option value="">-- Sélectionner un merchandiser (optionnel) --</option>
                {merchandisers.map((merc) => (
                  <option key={merc.id} value={merc.id}>{merc.user?.nom || `Merchandiser #${merc.id}`}</option>
                ))}
              </select>
            </div>
            <div className="input-group">
              <label>Lieu-dit</label>
              <input
                value={editingClient.lieu_dit || ''}
                onChange={e => setEditingClient({...editingClient, lieu_dit: e.target.value})}
              />
            </div>
            <div className="input-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  checked={editingClient.est_gms || false}
                  onChange={e => setEditingClient({...editingClient, est_gms: e.target.checked})}
                />
                <span className="checkbox-label">Client GMS (Grande/Moyenne Surface)</span>
              </label>
            </div>
            <div className="modal-actions">
              <button type="button" onClick={closeEditModal} className="button-secondary">Annuler</button>
              <button type="submit" className="button-primary">Sauvegarder</button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}

export default ClientManagementPage;