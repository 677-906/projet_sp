import React, { useState, useEffect, useCallback } from 'react';
import axiosInstance from '../api/axiosConfig';
import Modal from 'react-modal';
import './ManagementPages.css';

Modal.setAppElement('#root');

function UserManagementPage() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [superviseurs, setSuperviseurs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // --- États pour le formulaire de CRÉATION ---
  const [newUser, setNewUser] = useState({ nom: '', email: '', password: '', roleId: '', zone: '', managerId: '' });

  // --- États pour la MODIFICATION ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  
  // --- État pour la RECHERCHE ---
  const [searchTerm, setSearchTerm] = useState('');

  // Fonction de chargement des données
  const fetchData = useCallback(async (query = '') => {
    // La recherche seule ne devrait pas afficher le grand "Chargement..."
    if (!query) setIsLoading(true);

    try {
      // On lance tous les appels en parallèle
      const [usersRes, rolesRes, superviseursRes] = await Promise.all([
        axiosInstance.get(`/admin/users/search?query=${query}`),
        axiosInstance.get('/roles/'),
        axiosInstance.get('/superviseurs/')
      ]);
      
      const filteredRoles = rolesRes.data.filter(r => r.nom.toLowerCase() !== 'administrateur');
      
      setUsers(usersRes.data);
      setRoles(filteredRoles);
      setSuperviseurs(superviseursRes.data);
      
      // On pré-sélectionne les valeurs par défaut du formulaire de création, mais seulement si elles sont vides
      if (filteredRoles.length > 0 && newUser.roleId === '') { 
        setNewUser(prev => ({...prev, roleId: filteredRoles[0].id})); 
      }
      if (superviseursRes.data.length > 0 && newUser.managerId === '') { 
        setNewUser(prev => ({...prev, managerId: superviseursRes.data[0].id}));
      }
    } catch (error) { 
      console.error("Erreur de chargement des données:", error); 
      alert("Erreur: Impossible de charger les données de la page.");
    } finally {
      setIsLoading(false);
    }
  }, [newUser.roleId, newUser.managerId]); // Dépendances pour la condition de pré-sélection

  // Chargement initial des données au premier rendu
  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  // --- Logique CRUD ---
  const handleCreateUser = async (event) => {
    event.preventDefault();
    const selectedRole = roles.find(r => r.id === parseInt(newUser.roleId));
    if (!selectedRole) {
      alert('Veuillez sélectionner un rôle valide.');
      return;
    }
    const payload = { nom: newUser.nom, email: newUser.email, password: newUser.password, role_nom: selectedRole.nom };
    if (selectedRole.nom.toLowerCase() === 'merchandiser') {
      if (!newUser.zone || !newUser.managerId) {
        alert("Pour un merchandiser, la zone et le superviseur sont obligatoires.");
        return;
      }
      payload.zone_geographique = newUser.zone;
      payload.manager_id = parseInt(newUser.managerId);
    }
    try {
      await axiosInstance.post('/admin/full-user', payload);
      alert('Utilisateur et profil créés avec succès !');
      fetchData(searchTerm);
      setNewUser({ nom: '', email: '', password: '', roleId: roles[0]?.id || '', zone: '', managerId: superviseurs[0]?.id || '' });
    } catch (error) {
      alert(`Erreur de création: ${error.response?.data?.detail || 'Une erreur est survenue.'}`);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer l'utilisateur ID ${userId} ?`)) {
      try {
        await axiosInstance.delete(`/admin/users/${userId}`);
        alert('Utilisateur supprimé avec succès !');
        fetchData(searchTerm);
      } catch (error) { alert('Erreur lors de la suppression.'); }
    }
  };

  const handleUpdateUser = async (event) => {
    event.preventDefault();
    if (!editingUser) return;
    try {
      const updatedData = {
        nom: editingUser.nom,
        email: editingUser.email,
        role_id: parseInt(editingUser.role.id)
      };
      await axiosInstance.put(`/admin/users/${editingUser.id}`, updatedData);
      alert('Utilisateur mis à jour !');
      closeEditModal();
      fetchData(searchTerm);
    } catch (error) { alert('Erreur lors de la mise à jour.'); }
  };

  const handleToggleActive = async (user) => {
    if (window.confirm(`Voulez-vous ${user.is_active ? 'désactiver' : 'activer'} le compte de ${user.nom} ?`)) {
      try {
        await axiosInstance.put(`/admin/users/${user.id}`, { is_active: !user.is_active });
        alert('Statut mis à jour avec succès !');
        fetchData(searchTerm);
      } catch (error) { alert('Erreur lors de la mise à jour du statut.'); }
    }
  };
  
  // --- Gestion de la Modale ---
  const openEditModal = (user) => {
    setEditingUser(JSON.parse(JSON.stringify(user)));
    setIsModalOpen(true);
  };
  const closeEditModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
  };

  const handleNewUserChange = (e) => {
    const { name, value } = e.target;
    setNewUser(prev => ({ ...prev, [name]: value }));
  };

  const handleEditingUserChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditingUser(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };
  
  const handleEditingUserRoleChange = (e) => {
    const newRoleId = parseInt(e.target.value);
    const newRole = roles.find(r => r.id === newRoleId);
    setEditingUser(prev => ({...prev, role: newRole}));
  };

  const selectedRoleName = roles.find(r => r.id === parseInt(newUser.roleId))?.nom || '';
  if (isLoading) return <div>Chargement de la page de gestion...</div>;

  // Le JSX reste le même
  return (
    <div className="management-page">
      <h1>Gestion des Utilisateurs</h1>
      <div className="management-form-container">
        <h3>Créer un utilisateur et son profil</h3>
        <form onSubmit={handleCreateUser} className="management-form">
          <input name="nom" value={newUser.nom} onChange={handleNewUserChange} placeholder="Nom complet" required />
          <input name="email" type="email" value={newUser.email} onChange={handleNewUserChange} placeholder="Email" required />
          <input name="password" type="password" value={newUser.password} onChange={handleNewUserChange} placeholder="Mot de passe" required />
          <select name="roleId" value={newUser.roleId} onChange={handleNewUserChange} required>
            <option value="">-- Choisir un rôle --</option>
            {roles.map(role => <option key={role.id} value={role.id}>{role.nom}</option>)}
          </select>
          {selectedRoleName.toLowerCase() === 'merchandiser' && (
            <>
              <input name="zone" value={newUser.zone} onChange={handleNewUserChange} placeholder="Zone Géographique" required />
              <select name="managerId" value={newUser.managerId} onChange={handleNewUserChange} required>
                <option value="">-- Choisir un superviseur --</option>
                {superviseurs.map(sup => <option key={sup.id} value={sup.id}>{sup.user?.nom || `Superviseur ID ${sup.id}`}</option>)}
              </select>
            </>
          )}
          <button type="submit">Créer</button>
        </form>
      </div>
      <div className="management-table-container">
        <div className="table-header">
          <h3>Liste des Utilisateurs</h3>
          <input type="text" placeholder="Rechercher par nom ou email..." className="search-input" value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); fetchData(e.target.value); }}/>
        </div>
        <table className="data-table">
          <thead><tr><th>ID</th><th>Nom</th><th>Email</th><th>Rôle</th><th>Statut</th><th>Actions</th></tr></thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                <td>{user.id}</td>
                <td>{user.nom}</td>
                <td>{user.email}</td>
                <td>{user.role?.nom}</td>
                <td><span className={`status-badge ${user.is_active ? 'approved' : 'rejected'}`}>{user.is_active ? 'Actif' : 'Inactif'}</span></td>
                <td className="actions-cell">
                  {user.role?.nom?.toLowerCase() !== 'administrateur' && (
                    <>
                      <button className={`action-button ${user.is_active ? 'warning-button' : 'approve-button'}`} onClick={() => handleToggleActive(user)}>{user.is_active ? 'Désactiver' : 'Activer'}</button>
                      <button className="action-button view-button" onClick={() => openEditModal(user)}>Modifier</button>
                      <button className="action-button reject-button" onClick={() => handleDeleteUser(user.id)}>Supprimer</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Modal isOpen={isModalOpen} onRequestClose={closeEditModal} className="modal" overlayClassName="overlay">
        {editingUser && (
          <form onSubmit={handleUpdateUser}>
            <h2>Modifier l'Utilisateur: {editingUser.nom}</h2>
            <div className="input-group"><label>Nom</label><input name="nom" type="text" value={editingUser.nom} onChange={handleEditingUserChange} /></div>
            <div className="input-group"><label>Email</label><input name="email" type="email" value={editingUser.email} onChange={handleEditingUserChange} /></div>
            <div className="input-group"><label>Rôle</label>
              <select value={editingUser.role.id} onChange={handleEditingUserRoleChange}>
                {roles.map(role => <option key={role.id} value={role.id}>{role.nom}</option>)}
              </select>
            </div>
            <div className="input-group-checkbox"><label>Compte Actif ?</label><input name="is_active" type="checkbox" checked={editingUser.is_active} onChange={handleEditingUserChange} /></div>
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

export default UserManagementPage;