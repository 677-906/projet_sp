
import React, { useState, useEffect } from 'react';
import axiosInstance from '../api/axiosConfig';
import './ManagementPages.css';

function ClientManagementPage() {
  const [clients, setClients] = useState([]);
  
  // États pour le formulaire
  const [nomClient, setNomClient] = useState('');
  const [contact, setContact] = useState('');
  const [typologie, setTypologie] = useState('');
  const [localisation, setLocalisation] = useState('');

  const fetchClients = async () => {
    try {
      const response = await axiosInstance.get('/clients/');
      setClients(response.data);
    } catch (error) { console.error("Erreur chargement clients:", error); }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleCreateClient = async (event) => {
    event.preventDefault();
    try {
      const newClient = { nom_client: nomClient, contact, typologie, localisation };
      await axiosInstance.post('/admin/clients/', newClient);
      alert('Client créé avec succès !');
      fetchClients();
      setNomClient(''); setContact(''); setTypologie(''); setLocalisation('');
    } catch (error) {
      alert('Erreur lors de la création du client.');
    }
  };

  const handleDeleteClient = async (clientId) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer le client ID ${clientId} ?`)) {
      try {
        await axiosInstance.delete(`/admin/clients/${clientId}`);
        alert('Client supprimé avec succès !');
        // On rafraîchit la liste des clients
        fetchClients();
      } catch (error) {
        alert('Erreur lors de la suppression du client. Il est peut-être lié à des visites existantes.');
        console.error(error.response?.data);
      }
    }
  };

  

  return (
    <div className="management-page">
      <h1>Gestion des Clients</h1>
      <div className="management-form-container">
        <h3>Ajouter un nouveau client</h3>
        <form onSubmit={handleCreateClient} className="management-form">
          <input value={nomClient} onChange={e => setNomClient(e.target.value)} placeholder="Nom du client" required />
          <input value={contact} onChange={e => setContact(e.target.value)} placeholder="Contact" />
          <input value={typologie} onChange={e => setTypologie(e.target.value)} placeholder="Typologie" />
          <input value={localisation} onChange={e => setLocalisation(e.target.value)} placeholder="Localisation" />
          <button type="submit">Ajouter</button>
        </form>
      </div>
      <div className="management-table-container">
        <h3>Liste des Clients</h3>
        <table className="data-table">
            <thead><tr><th>ID</th><th>Nom</th><th>Contact</th><th>Typologie</th><th>Localisation</th><th>Actions</th></tr></thead>
          <tbody>
            {clients.map(client => (
              <tr key={client.id}>
                <td>{client.id}</td>
                <td>{client.nom_client}</td>
                <td>{client.contact}</td>
                <td>{client.typologie}</td>
                <td>{client.localisation}</td>
                {/* On ajoute le bouton de suppression */}
                <td>
                  <button 
                      className="action-button reject-button" 
                      onClick={() => handleDeleteClient(client.id)}
                  >
                      Supprimer
                  </button>
                </td>
                </tr>
              ))}
            </tbody>
        </table>
      </div>
    </div>
  );
}

export default ClientManagementPage;