import React, { useState, useEffect } from 'react';
import axiosInstance from '../api/axiosConfig';
import './ManagementPages.css'; // Assurez-vous que ce fichier CSS existe

function UserManagementPage() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [superviseurs, setSuperviseurs] = useState([]);
  
  // États pour le formulaire de création
  const [nom, setNom] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [roleId, setRoleId] = useState('');
  const [zone, setZone] = useState('');
  const [managerId, setManagerId] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Fonction pour recharger toutes les données de la page
  const fetchData = async () => {
    try {
      // On lance tous les appels en parallèle
      const [usersRes, rolesRes, superviseursRes] = await Promise.all([
        axiosInstance.get('/admin/users'),
        axiosInstance.get('/roles/'),
        axiosInstance.get('/superviseurs/') // NOTE: Assurez-vous que cette route existe sur votre backend
      ]);
      setUsers(usersRes.data);
       const filteredRoles = rolesRes.data.filter(
        role => role.nom.toLowerCase() !== 'administrateur');
       setRoles(filteredRoles);
      setSuperviseurs(superviseursRes.data);
      // On présélectionne les listes déroulantes
      if (rolesRes.data.length > 0) { setRoleId(rolesRes.data[0].id); }
      if (superviseursRes.data.length > 0) { setManagerId(superviseursRes.data[0].id); }
    } catch (error) { 
      console.error("Erreur de chargement des données:", error); 
      alert("Erreur: Impossible de charger les données de la page.");
    } finally {
      setIsLoading(false);
    }
  };

  // Au premier chargement de la page, on récupère tout
  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateUser = async (event) => {
    event.preventDefault();
    const selectedRole = roles.find(r => r.id === parseInt(roleId));
    if (!selectedRole) {
      alert('Veuillez sélectionner un rôle valide.');
      return;
    }

    const newUserPayload = { 
      nom, 
      email, 
      password,
      role_nom: selectedRole.nom,
      zone_geographique: zone,
      manager_id: parseInt(managerId) || null
    };

    try {
      // On appelle la route de création unifiée
      await axiosInstance.post('/admin/full-user', newUserPayload);
      alert('Utilisateur et profil créés avec succès !');
      fetchData(); // On recharge toutes les données
      // On vide le formulaire
      setNom(''); setEmail(''); setPassword(''); setZone('');
    } catch (error) {
      alert(`Erreur: ${error.response?.data?.detail || 'Une erreur est survenue lors de la création.'}`);
      console.error(error.response?.data);
    }
  };

  const handleDeleteUser = async (userId) => {
    // Utilisation des backticks (`) pour une chaîne de caractères formatée
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer l'utilisateur ID ${userId} ?`)) {
      try {
        await axiosInstance.delete(`/admin/users/${userId}`);
        alert('Utilisateur supprimé avec succès !');
        fetchData(); // On recharge la liste
      } catch (error) {
        alert('Erreur lors de la suppression de l\'utilisateur.');
      }
    }
  };
  
  // Trouve le nom du rôle actuellement sélectionné dans la liste déroulante
  const selectedRoleName = roles.find(r => r.id === parseInt(roleId))?.nom || '';

  if (isLoading) {
    return <div>Chargement de la page de gestion...</div>;
  }

  return (
    <div className="management-page">
      <h1>Gestion des Utilisateurs</h1>

      <div className="management-form-container">
        <h3>Créer un utilisateur et son profil</h3>
        <form onSubmit={handleCreateUser} className="management-form">
          <input type="text" value={nom} onChange={e => setNom(e.target.value)} placeholder="Nom complet" required />
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" required />
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder='Mot de passe' required />
          <select value={roleId} onChange={e => setRoleId(e.target.value)}>
            {roles.map(role => (
              <option key={role.id} value={role.id}>{role.nom}</option>
            ))}
          </select>
          
          {/* Champs conditionnels qui n'apparaissent que si le rôle est "Merchandiser" */}
          {selectedRoleName.toLowerCase() === 'merchandiser' && (
            <>
              <input type="text" value={zone} onChange={e => setZone(e.target.value)} placeholder="Zone Géographique" required />
              <select value={managerId} onChange={e => setManagerId(e.target.value)} required>
                <option value="">-- Choisir un superviseur --</option>
                {superviseurs.map(sup => (
                  // On affiche le nom de l'utilisateur associé au profil superviseur
                  <option key={sup.id} value={sup.id}>{sup.user?.nom || `Superviseur ID ${sup.id}`}</option>
                ))}
              </select>
            </>
          )}
          <button type="submit">Créer Utilisateur</button>
        </form>
      </div>

      <div className="management-table-container">
        <h3>Liste des Utilisateurs</h3>
        <table className="data-table">
          <thead>
            <tr>
                <th>ID</th>
                <th>Nom</th>
                <th>Email</th>
                <th>Rôle</th>
                <th>Actif</th>
                <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                <td>{user.id}</td>
                <td>{user.nom}</td>
                <td>{user.email}</td>
                <td>{user.role?.nom}</td>
                <td>{user.is_active ? 'Oui' : 'Non'}</td>
                <td>
                  {user.role?.nom?.toLowerCase() !== 'administrateur' && (
                    <button 
                      className="action-button reject-button" 
                      onClick={() => handleDeleteUser(user.id)}
                    >
                      Supprimer
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default UserManagementPage;




