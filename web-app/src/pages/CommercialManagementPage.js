import React, { useState, useEffect, useCallback } from 'react';
import axiosInstance from '../api/axiosConfig';
import Modal from 'react-modal';
import './ManagementPages.css';

Modal.setAppElement('#root');

function CommercialManagementPage() {
  const [commerciaux, setCommerciaux] = useState([]);
  const [chefsZone, setChefsZone] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // États pour la création
  const [newCommercial, setNewCommercial] = useState({
    nom: '',
    contact: '',
    chef_zone_id: ''
  });

  // États pour la modification
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCommercial, setEditingCommercial] = useState(null);

  // États pour afficher les clients
  const [isClientsModalOpen, setIsClientsModalOpen] = useState(false);
  const [selectedCommercialClients, setSelectedCommercialClients] = useState([]);
  const [selectedCommercialName, setSelectedCommercialName] = useState('');

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [commerciauxRes, chefsZoneRes] = await Promise.all([
        axiosInstance.get('/admin/commerciaux/'),
        axiosInstance.get('/chefs-zone/')
      ]);
      setCommerciaux(commerciauxRes.data);
      setChefsZone(chefsZoneRes.data);
    } catch (error) {
      console.error("Erreur de chargement:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await axiosInstance.post('/admin/commerciaux/', newCommercial);
      alert('Commercial créé avec succès !');
      fetchData();
      setNewCommercial({ nom: '', contact: '', chef_zone_id: '' });
    } catch (error) {
      alert('Erreur lors de la création.');
      console.error(error);
    }
  };

  const handleDelete = async (commercialId) => {
    if (window.confirm(`Supprimer le commercial ID ${commercialId} ?`)) {
      try {
        await axiosInstance.delete(`/admin/commerciaux/${commercialId}`);
        alert('Commercial supprimé !');
        fetchData();
      } catch (error) {
        alert('Erreur de suppression.');
      }
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await axiosInstance.put(`/admin/commerciaux/${editingCommercial.id}`, editingCommercial);
      alert('Commercial mis à jour !');
      closeEditModal();
      fetchData();
    } catch (error) {
      alert('Erreur de mise à jour.');
    }
  };

  const openEditModal = (commercial) => {
    setEditingCommercial(JSON.parse(JSON.stringify(commercial)));
    setIsModalOpen(true);
  };

  const closeEditModal = () => {
    setIsModalOpen(false);
  };

  const viewClients = async (commercial) => {
    try {
      const response = await axiosInstance.get(`/admin/commerciaux/${commercial.id}/clients`);
      setSelectedCommercialClients(response.data);
      setSelectedCommercialName(commercial.nom);
      setIsClientsModalOpen(true);
    } catch (error) {
      console.error("Erreur lors du chargement des clients:", error);
      alert("Erreur lors du chargement des clients.");
    }
  };

  const closeClientsModal = () => {
    setIsClientsModalOpen(false);
    setSelectedCommercialClients([]);
    setSelectedCommercialName('');
  };

  const getChefZoneName = (chefZoneId) => {
    const chef = chefsZone.find(cz => cz.id === chefZoneId);
    return chef ? `${chef.user?.nom || 'N/A'} (${chef.zone || 'N/A'})` : 'N/A';
  };

  const getZoneName = (chefZoneId) => {
    const chef = chefsZone.find(cz => cz.id === chefZoneId);
    return chef?.zone || 'N/A';
  };

  if (isLoading) return <div>Chargement...</div>;

  return (
    <div className="management-page">
      <h1>Gestion des Commerciaux</h1>

      <div className="management-form-container">
        <h3>Ajouter un commercial</h3>
        <form onSubmit={handleCreate} className="management-form">
          <input
            value={newCommercial.nom}
            onChange={e => setNewCommercial({...newCommercial, nom: e.target.value})}
            placeholder="Nom du commercial"
            required
          />
          <input
            value={newCommercial.contact}
            onChange={e => setNewCommercial({...newCommercial, contact: e.target.value})}
            placeholder="Contact"
          />
          <select
            value={newCommercial.chef_zone_id}
            onChange={e => setNewCommercial({...newCommercial, chef_zone_id: e.target.value})}
            required
          >
            <option value="">-- Sélectionner un Chef de Zone --</option>
            {chefsZone.map(cz => (
              <option key={cz.id} value={cz.id}>
                {cz.user?.nom || 'N/A'} - Zone: {cz.zone || 'N/A'}
              </option>
            ))}
          </select>
          <button type="submit">Ajouter</button>
        </form>
      </div>

      <div className="management-table-container">
        <div className="table-header">
          <h3>Liste des Commerciaux</h3>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nom</th>
              <th>Contact</th>
              <th>Zone</th>
              <th>Chef de Zone</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {commerciaux.map(c => (
              <tr key={c.id}>
                <td>{c.id}</td>
                <td>{c.nom}</td>
                <td>{c.contact || '-'}</td>
                <td>{getZoneName(c.chef_zone_id)}</td>
                <td>{getChefZoneName(c.chef_zone_id)}</td>
                <td className="actions-cell">
                  <button className="action-button view-button" onClick={() => viewClients(c)}>Voir Clients</button>
                  <button className="action-button view-button" onClick={() => openEditModal(c)}>Modifier</button>
                  <button className="action-button reject-button" onClick={() => handleDelete(c.id)}>Supprimer</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isModalOpen} onRequestClose={closeEditModal} className="modal" overlayClassName="overlay">
        {editingCommercial && (
          <form onSubmit={handleUpdate}>
            <h2>Modifier le Commercial : {editingCommercial.nom}</h2>
            <div className="input-group">
              <label>Nom</label>
              <input
                value={editingCommercial.nom || ''}
                onChange={e => setEditingCommercial({...editingCommercial, nom: e.target.value})}
                required
              />
            </div>
            <div className="input-group">
              <label>Contact</label>
              <input
                value={editingCommercial.contact || ''}
                onChange={e => setEditingCommercial({...editingCommercial, contact: e.target.value})}
              />
            </div>
            <div className="input-group">
              <label>Chef de Zone</label>
              <select
                value={editingCommercial.chef_zone_id || ''}
                onChange={e => setEditingCommercial({...editingCommercial, chef_zone_id: parseInt(e.target.value)})}
                required
              >
                <option value="">-- Sélectionner un Chef de Zone --</option>
                {chefsZone.map(cz => (
                  <option key={cz.id} value={cz.id}>
                    {cz.user?.nom || 'N/A'} - Zone: {cz.zone || 'N/A'}
                  </option>
                ))}
              </select>
            </div>
            <div className="modal-actions">
              <button type="button" onClick={closeEditModal} className="button-secondary">Annuler</button>
              <button type="submit" className="button-primary">Sauvegarder</button>
            </div>
          </form>
        )}
      </Modal>

      <Modal isOpen={isClientsModalOpen} onRequestClose={closeClientsModal} className="modal" overlayClassName="overlay">
        <div>
          <h2>Clients de {selectedCommercialName}</h2>
          {selectedCommercialClients.length === 0 ? (
            <p>Aucun client associé à ce commercial.</p>
          ) : (
            <table className="data-table" style={{marginTop: '20px'}}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nom Client</th>
                  <th>Zone</th>
                  <th>Lieu-dit</th>
                  <th>Contact</th>
                  <th>Typologie</th>
                </tr>
              </thead>
              <tbody>
                {selectedCommercialClients.map(client => (
                  <tr key={client.id}>
                    <td>{client.id}</td>
                    <td>{client.nom_client}</td>
                    <td>{client.zone || '-'}</td>
                    <td>{client.lieu_dit || '-'}</td>
                    <td>{client.contact || '-'}</td>
                    <td>{client.typologie || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <div className="modal-actions" style={{marginTop: '20px'}}>
            <button type="button" onClick={closeClientsModal} className="button-secondary">Fermer</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default CommercialManagementPage;
