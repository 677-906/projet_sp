import React, { useState, useEffect, useCallback } from 'react';
import axiosInstance from '../api/axiosConfig';
import Modal from 'react-modal';
import './ManagementPages.css';

Modal.setAppElement('#root');

function UserManagementPage() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [superviseurs, setSuperviseurs] = useState([]);
  const [responsables, setResponsables] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // --- États pour le formulaire de CRÉATION ---
  const [newUser, setNewUser] = useState({ nom: '', email: '', password: '', roleId: '', zone: '', sous_zone: '', managerId: '', responsableId: '', base: '', est_superviseur: false });

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
      console.log('🔄 Début du chargement des données...');
      // On lance tous les appels en parallèle - ajout de l'endpoint pour les responsables
      const [usersRes, rolesRes, superviseursRes, responsablesRes] = await Promise.all([
        axiosInstance.get(`/admin/users/search?query=${query}`),
        axiosInstance.get('/roles/'),
        axiosInstance.get('/chefs-zone/'),
        axiosInstance.get('/responsables/')
      ]);

      console.log('✅ Roles reçus:', rolesRes.data);
      console.log('✅ Users reçus:', usersRes.data);
      console.log('✅ Superviseurs reçus:', superviseursRes.data);
      console.log('✅ Responsables reçus:', responsablesRes.data);

      const filteredRoles = rolesRes.data.filter(r => r.nom.toLowerCase() !== 'administrateur');
      console.log('✅ Roles filtrés (sans admin):', filteredRoles);

      setUsers(usersRes.data);
      setRoles(filteredRoles);
      setSuperviseurs(superviseursRes.data);
      setResponsables(responsablesRes.data);

      // On pré-sélectionne les valeurs par défaut du formulaire de création
      if (filteredRoles.length > 0) {
        setNewUser(prev => ({
          ...prev,
          roleId: prev.roleId === '' ? filteredRoles[0].id : prev.roleId
        }));
      }
      if (superviseursRes.data.length > 0) {
        setNewUser(prev => ({
          ...prev,
          managerId: prev.managerId === '' ? superviseursRes.data[0].id : prev.managerId
        }));
      }
    } catch (error) {
      console.error("Erreur de chargement des données:", error);
      alert("Erreur: Impossible de charger les données de la page.");
    } finally {
      setIsLoading(false);
    }
  }, []); // Pas de dépendances - évite les boucles infinies

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

    if (selectedRole.nom.toLowerCase() === 'responsable') {
      if (!newUser.base) {
        alert("Pour un responsable, la base est obligatoire.");
        return;
      }
      payload.base = newUser.base;
      payload.zone = newUser.zone || null;  // Zone optionnelle
    }

    else if (selectedRole.nom.toLowerCase() === 'chef de zone') {
      if (!newUser.responsableId || !newUser.zone) {
        alert("Pour un chef de zone, le responsable et la zone sont obligatoires.");
        return;
      }
      payload.responsable_id = parseInt(newUser.responsableId);
      payload.zone = newUser.zone;
      payload.est_superviseur = newUser.est_superviseur || false;
    }

    else if (selectedRole.nom.toLowerCase() === 'merchandiser') {
      if (!newUser.managerId) {
        alert("Pour un merchandiser, le superviseur (chef de zone) est obligatoire.");
        return;
      }
      payload.chef_zone_id = parseInt(newUser.managerId);
      payload.sous_zone = newUser.sous_zone || null;
    }
    try {
      await axiosInstance.post('/admin/full-user', payload);
      alert('Utilisateur et profil créés avec succès !');
      fetchData(searchTerm);
      setNewUser({ nom: '', email: '', password: '', roleId: roles[0]?.id || '', zone: '', sous_zone: '', managerId: superviseurs[0]?.id || '', responsableId: '', base: '', est_superviseur: false });
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
        role_id: parseInt(editingUser.role.id),
        is_active: editingUser.is_active
      };

      // Ajouter le mot de passe uniquement s'il est renseigné
      if (editingUser.new_password && editingUser.new_password.trim() !== '') {
        updatedData.password = editingUser.new_password;
      }

      // Mise à jour du profil spécifique au rôle
      const roleName = editingUser.role.nom.toLowerCase();

      if (roleName === 'responsable' && editingUser.responsable_profile) {
        await axiosInstance.put(`/admin/responsables/${editingUser.responsable_profile.id}`, {
          base: editingUser.responsable_profile.base,
          zone: editingUser.responsable_profile.zone || null
        });
      } else if (roleName === 'chef de zone' && editingUser.chef_zone_profile) {
        await axiosInstance.put(`/admin/chefs-zone/${editingUser.chef_zone_profile.id}`, {
          zone: editingUser.chef_zone_profile.zone,
          responsable_id: parseInt(editingUser.chef_zone_profile.responsable_id),
          est_superviseur: editingUser.chef_zone_profile.est_superviseur || false
        });
      } else if (roleName === 'merchandiser' && editingUser.merchandiser_profile) {
        await axiosInstance.put(`/admin/merchandisers/${editingUser.merchandiser_profile.id}`, {
          chef_zone_id: parseInt(editingUser.merchandiser_profile.chef_zone_id),
          sous_zone: editingUser.merchandiser_profile.sous_zone || null
        });
      }

      await axiosInstance.put(`/admin/users/${editingUser.id}`, updatedData);
      alert('Utilisateur mis à jour avec succès !');
      closeEditModal();
      fetchData(searchTerm);
    } catch (error) {
      console.error('Erreur de mise à jour:', error);
      alert(`Erreur lors de la mise à jour: ${error.response?.data?.detail || 'Une erreur est survenue.'}`);
    }
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

          {selectedRoleName.toLowerCase() === 'responsable' && (
            <>
              <input
                name="base"
                value={newUser.base}
                onChange={handleNewUserChange}
                placeholder="Base (ex: DOUALA, YAOUNDE)"
                required
              />
              <input
                name="zone"
                value={newUser.zone}
                onChange={handleNewUserChange}
                placeholder="Zones (ex: Douala 1A; Douala 1B; Douala 2)"
              />
              <small style={{color: '#666', fontSize: '11px', display: 'block', marginTop: '-8px', marginBottom: '8px'}}>
                Séparez les zones par des point-virgules (;) pour plusieurs zones
              </small>
            </>
          )}

          {selectedRoleName.toLowerCase() === 'chef de zone' && (
            <>
              <select name="responsableId" value={newUser.responsableId} onChange={handleNewUserChange} required>
                <option value="">-- Choisir un responsable --</option>
                {responsables.map(resp => <option key={resp.id} value={resp.id}>{resp.user?.nom || `Responsable ID ${resp.id}`} - Base: {resp.base}</option>)}
              </select>
              <input
                name="zone"
                value={newUser.zone}
                onChange={handleNewUserChange}
                placeholder="Zone (ex: A, B, DOUALA 4, YAOUNDE 2)"
                required
              />
              <div className="checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    checked={newUser.est_superviseur}
                    onChange={e => setNewUser({...newUser, est_superviseur: e.target.checked})}
                  />
                  <span className="checkbox-label">Superviseur GMS</span>
                </label>
              </div>
            </>
          )}

          {selectedRoleName.toLowerCase() === 'merchandiser' && (
            <>
              <select
                name="responsableId"
                value={newUser.responsableId}
                onChange={(e) => {
                  setNewUser({...newUser, responsableId: e.target.value, managerId: ''});
                }}
                required
              >
                <option value="">-- Choisir un responsable --</option>
                {responsables.map(resp => (
                  <option key={resp.id} value={resp.id}>
                    {resp.user?.nom || `Responsable ID ${resp.id}`} - {resp.base} {resp.zone ? `(${resp.zone})` : ''}
                  </option>
                ))}
              </select>
              <select
                name="managerId"
                value={newUser.managerId}
                onChange={handleNewUserChange}
                required
                disabled={!newUser.responsableId}
              >
                <option value="">-- Choisir un chef de zone --</option>
                {superviseurs
                  .filter(sup => !newUser.responsableId || sup.responsable_id === parseInt(newUser.responsableId))
                  .map(sup => (
                    <option key={sup.id} value={sup.id}>
                      {sup.user?.nom || `Chef de Zone ID ${sup.id}`} - Zone: {sup.zone}
                    </option>
                  ))
                }
              </select>
              <input
                name="sous_zone"
                value={newUser.sous_zone}
                onChange={handleNewUserChange}
                placeholder="Sous-zone (ex: A1, A2, B3)"
              />
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
          <thead><tr><th>ID</th><th>Nom</th><th>Email</th><th>Rôle</th><th>Zone/Sous-zone</th><th>Statut</th><th>Actions</th></tr></thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                <td>{user.id}</td>
                <td>{user.nom}</td>
                <td>{user.email}</td>
                <td>{user.role?.nom}</td>
                <td>
                  {user.role?.nom?.toLowerCase() === 'chef de zone' && user.chef_zone_profile && (
                    <div>
                      <span className={`badge ${user.chef_zone_profile.est_superviseur ? 'badge-superviseur' : 'badge-chef'}`}>
                        {user.chef_zone_profile.est_superviseur ? '👔 Superviseur' : '📍 Chef'}
                      </span>
                      <div style={{marginTop: '4px', fontSize: '0.9em'}}>
                        <strong>Zone:</strong> {user.chef_zone_profile.zone || 'N/A'}
                      </div>
                    </div>
                  )}
                  {user.role?.nom?.toLowerCase() === 'merchandiser' && user.merchandiser_profile && (
                    <div style={{fontSize: '0.9em'}}>
                      <div><strong>Zone:</strong> {superviseurs.find(s => s.id === user.merchandiser_profile.chef_zone_id)?.zone || 'N/A'}</div>
                      {user.merchandiser_profile.sous_zone && (
                        <div style={{marginTop: '2px'}}><strong>Sous-zone:</strong> {user.merchandiser_profile.sous_zone}</div>
                      )}
                    </div>
                  )}
                  {user.role?.nom?.toLowerCase() === 'responsable' && user.responsable_profile && (
                    <div style={{fontSize: '0.9em'}}>
                      <div><strong>Base:</strong> {user.responsable_profile.base || 'N/A'}</div>
                      {user.responsable_profile.zone && (
                        <div style={{marginTop: '2px'}}>
                          <strong>Zone{user.responsable_profile.zone.includes(';') ? 's' : ''}:</strong> {user.responsable_profile.zone}
                        </div>
                      )}
                    </div>
                  )}
                </td>
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

            {/* Section: Informations de base */}
            <div className="form-section">
              <h3 style={{fontSize: '1.1em', marginBottom: '10px', color: '#333'}}>Informations de base</h3>

              <div className="input-group">
                <label>Nom complet</label>
                <input name="nom" type="text" value={editingUser.nom} onChange={handleEditingUserChange} required />
              </div>

              <div className="input-group">
                <label>Email</label>
                <input name="email" type="email" value={editingUser.email} onChange={handleEditingUserChange} required />
              </div>

              <div className="input-group">
                <label>Rôle</label>
                <select value={editingUser.role.id} onChange={handleEditingUserRoleChange} required>
                  {roles.map(role => <option key={role.id} value={role.id}>{role.nom}</option>)}
                </select>
              </div>

              <div className="input-group">
                <label>Nouveau mot de passe (optionnel)</label>
                <input
                  type="password"
                  placeholder="Laisser vide pour conserver le mot de passe actuel"
                  value={editingUser.new_password || ''}
                  onChange={e => setEditingUser({...editingUser, new_password: e.target.value})}
                />
                <small style={{color: '#666', fontSize: '0.85em'}}>
                  Ne remplir que si vous souhaitez changer le mot de passe
                </small>
              </div>

              <div className="input-group">
                <label>Date de création</label>
                <input
                  type="text"
                  value={editingUser.created_at ? new Date(editingUser.created_at).toLocaleString('fr-FR') : 'N/A'}
                  disabled
                  style={{backgroundColor: '#f5f5f5', cursor: 'not-allowed'}}
                />
              </div>

              <div className="input-group-checkbox">
                <label>Compte actif ?</label>
                <input name="is_active" type="checkbox" checked={editingUser.is_active} onChange={handleEditingUserChange} />
              </div>
            </div>

            {/* Champs spécifiques au Responsable */}
            {(() => {
              const isResponsable = editingUser.role.nom.toLowerCase() === 'responsable';
              const hasProfile = !!editingUser.responsable_profile;
              console.log('DEBUG Responsable:', {
                roleName: editingUser.role.nom,
                isResponsable,
                hasProfile,
                profile: editingUser.responsable_profile
              });
              return isResponsable && hasProfile;
            })() && (
              <div className="form-section" style={{marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #ddd'}}>
                <h3 style={{fontSize: '1.1em', marginBottom: '10px', color: '#333'}}>Profil Responsable</h3>
                <div className="input-group">
                  <label>Base</label>
                  <input
                    value={editingUser.responsable_profile.base || ''}
                    onChange={e => setEditingUser({
                      ...editingUser,
                      responsable_profile: { ...editingUser.responsable_profile, base: e.target.value }
                    })}
                    placeholder="Ex: DOUALA, YAOUNDE"
                    required
                  />
                </div>
                <div className="input-group">
                  <label>Zone(s)</label>
                  <input
                    value={editingUser.responsable_profile.zone || ''}
                    onChange={e => setEditingUser({
                      ...editingUser,
                      responsable_profile: { ...editingUser.responsable_profile, zone: e.target.value }
                    })}
                    placeholder="Zones (ex: Douala 1A; Douala 1B; Douala 2)"
                  />
                  <small style={{color: '#666', fontSize: '0.85em', marginTop: '5px', display: 'block'}}>
                    Separez les zones par des point-virgules (;) pour plusieurs zones
                  </small>
                </div>
              </div>
            )}

            {/* Champs spécifiques au Chef de Zone */}
            {editingUser.role.nom.toLowerCase() === 'chef de zone' && editingUser.chef_zone_profile && (
              <div className="form-section" style={{marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #ddd'}}>
                <h3 style={{fontSize: '1.1em', marginBottom: '10px', color: '#333'}}>Profil Chef de Zone</h3>

                <div className="input-group">
                  <label>Zone</label>
                  <input
                    value={editingUser.chef_zone_profile.zone || ''}
                    onChange={e => setEditingUser({
                      ...editingUser,
                      chef_zone_profile: { ...editingUser.chef_zone_profile, zone: e.target.value }
                    })}
                    placeholder="Ex: DOUALA 4, DOUALA 5, YAOUNDE 2, etc."
                    required
                  />
                  <small style={{color: '#666', fontSize: '0.85em', marginTop: '5px', display: 'block'}}>
                    💡 Cette zone sera héritée par tous les merchandisers de ce chef
                  </small>
                </div>

                <div className="input-group">
                  <label>Responsable</label>
                  <select
                    value={editingUser.chef_zone_profile.responsable_id || ''}
                    onChange={e => setEditingUser({
                      ...editingUser,
                      chef_zone_profile: { ...editingUser.chef_zone_profile, responsable_id: e.target.value }
                    })}
                    required
                  >
                    <option value="">-- Choisir un responsable --</option>
                    {responsables.map(resp => (
                      <option key={resp.id} value={resp.id}>
                        {resp.user?.nom || `Responsable ID ${resp.id}`} - Base: {resp.base}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="checkbox-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={editingUser.chef_zone_profile.est_superviseur || false}
                      onChange={e => setEditingUser({
                        ...editingUser,
                        chef_zone_profile: { ...editingUser.chef_zone_profile, est_superviseur: e.target.checked }
                      })}
                    />
                    <span className="checkbox-label">
                      Superviseur GMS (Grande/Moyenne Surface)
                    </span>
                  </label>
                  <small style={{color: '#666', fontSize: '0.85em', marginTop: '5px', display: 'block', marginLeft: '25px'}}>
                    ℹ️ Les superviseurs GMS sont affichés dans l'app mobile pour les visites MT
                  </small>
                </div>
              </div>
            )}

            {/* Champs spécifiques au Merchandiser */}
            {editingUser.role.nom.toLowerCase() === 'merchandiser' && editingUser.merchandiser_profile && (
              <div className="form-section" style={{marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #ddd'}}>
                <h3 style={{fontSize: '1.1em', marginBottom: '10px', color: '#333'}}>Profil Merchandiser</h3>

                {/* Affichage de la zone actuelle */}
                <div className="input-group">
                  <label>Zone actuelle (héritée du Chef de Zone)</label>
                  <input
                    type="text"
                    value={
                      superviseurs.find(sup => sup.id === parseInt(editingUser.merchandiser_profile.chef_zone_id))?.zone || 'Non définie'
                    }
                    disabled
                    style={{backgroundColor: '#f5f5f5', cursor: 'not-allowed', fontWeight: 'bold', color: '#2196F3'}}
                  />
                  <small style={{color: '#666', fontSize: '0.85em', marginTop: '5px', display: 'block'}}>
                    La zone est automatiquement héritée du chef de zone sélectionné ci-dessous
                  </small>
                </div>

                <div className="input-group">
                  <label>Chef de Zone (modifier pour changer de zone)</label>
                  <select
                    value={editingUser.merchandiser_profile.chef_zone_id || ''}
                    onChange={e => setEditingUser({
                      ...editingUser,
                      merchandiser_profile: { ...editingUser.merchandiser_profile, chef_zone_id: e.target.value }
                    })}
                    required
                  >
                    <option value="">-- Choisir un chef de zone --</option>
                    {superviseurs.map(sup => (
                      <option key={sup.id} value={sup.id}>
                        {sup.user?.nom || `Chef de Zone ID ${sup.id}`} - Zone: {sup.zone}
                      </option>
                    ))}
                  </select>
                  <small style={{color: '#666', fontSize: '0.85em', marginTop: '5px', display: 'block'}}>
                    Changer le chef de zone changera automatiquement la zone du merchandiser
                  </small>
                </div>

                <div className="input-group">
                  <label>Sous-zone (optionnel)</label>
                  <input
                    value={editingUser.merchandiser_profile.sous_zone || ''}
                    onChange={e => setEditingUser({
                      ...editingUser,
                      merchandiser_profile: { ...editingUser.merchandiser_profile, sous_zone: e.target.value }
                    })}
                    placeholder="Ex: A1, A2, B3"
                  />
                  <small style={{color: '#666', fontSize: '0.85em', marginTop: '5px', display: 'block'}}>
                    Sous-zone au sein de la zone du chef (ex: si zone = A, sous-zone = A1, A2, etc.)
                  </small>
                </div>
              </div>
            )}

            <div className="modal-actions" style={{marginTop: '30px', paddingTop: '20px', borderTop: '2px solid #ddd'}}>
              <button type="button" onClick={closeEditModal} className="button-secondary">Annuler</button>
              <button type="submit" className="button-primary">Sauvegarder les modifications</button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}

export default UserManagementPage;