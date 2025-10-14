import React, { useState, useEffect, useCallback } from 'react';
import axiosInstance from '../api/axiosConfig';
import Modal from 'react-modal';
import './ManagementPages.css';

Modal.setAppElement('#root');

function ClientManagementPage() {
  const [clients, setClients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // États pour la création
  const [newClient, setNewClient] = useState({ nom_client: '', contact: '', typologie: '', localisation: '' });
  
  // États pour la modification
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState(null);

  // État pour la recherche
  const [searchTerm, setSearchTerm] = useState('');

  const fetchData = useCallback(async (query = '') => {
    try {
      if (!query && !clients.length) setIsLoading(true);
      const response = await axiosInstance.get(`/admin/clients/search?query=${query}`);
      setClients(response.data);
    } catch (error) { console.error("Erreur de chargement:", error); }
    finally { setIsLoading(false); }
  }, [clients.length]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await axiosInstance.post('/admin/clients/', newClient);
      alert('Client créé avec succès !');
      fetchData(searchTerm);
      setNewClient({ nom_client: '', contact: '', typologie: '', localisation: '' });
    } catch (error) { alert('Erreur lors de la création.'); }
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

  const openEditModal = (client) => {
    setEditingClient(JSON.parse(JSON.stringify(client)));
    setIsModalOpen(true);
  };
  const closeEditModal = () => setIsModalOpen(false);

  if (isLoading) return <div>Chargement...</div>;

  return (
    <div className="management-page">
      <h1>Gestion des Clients</h1>
      
      <div className="management-form-container">
        <h3>Ajouter un client</h3>
        <form onSubmit={handleCreate} className="management-form">
          <input value={newClient.nom_client} onChange={e => setNewClient({...newClient, nom_client: e.target.value})} placeholder="Nom du client" required />
          <input value={newClient.contact} onChange={e => setNewClient({...newClient, contact: e.target.value})} placeholder="Contact" />
          <input value={newClient.typologie} onChange={e => setNewClient({...newClient, typologie: e.target.value})} placeholder="Typologie" />
          <input value={newClient.localisation} onChange={e => setNewClient({...newClient, localisation: e.target.value})} placeholder="Localisation" />
          <button type="submit">Ajouter</button>
        </form>
      </div>

      <div className="management-table-container">
        <div className="table-header">
          <h3>Liste des Clients</h3>
          <input type="text" placeholder="Rechercher par nom ou contact..." className="search-input" value={searchTerm} onChange={e => { setSearchTerm(e.target.value); fetchData(e.target.value); }}/>
        </div>
        <table className="data-table">
          <thead><tr><th>ID</th><th>Nom</th><th>Contact</th><th>Typologie</th><th>Localisation</th><th>Actions</th></tr></thead>
          <tbody>
            {clients.map(c => (
              <tr key={c.id}>
                <td>{c.id}</td><td>{c.nom_client}</td><td>{c.contact}</td><td>{c.typologie}</td><td>{c.localisation}</td>
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
            <div className="input-group"><label>Nom</label><input value={editingClient.nom_client} onChange={e => setEditingClient({...editingClient, nom_client: e.target.value})} /></div>
            <div className="input-group"><label>Contact</label><input value={editingClient.contact} onChange={e => setEditingClient({...editingClient, contact: e.target.value})} /></div>
            <div className="input-group"><label>Typologie</label><input value={editingClient.typologie} onChange={e => setEditingClient({...editingClient, typologie: e.target.value})} /></div>
            <div className="input-group"><label>Localisation</label><input value={editingClient.localisation} onChange={e => setEditingClient({...editingClient, localisation: e.target.value})} /></div>
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