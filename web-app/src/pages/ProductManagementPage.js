import React, { useState, useEffect, useCallback } from 'react';
import axiosInstance from '../api/axiosConfig';
import Modal from 'react-modal';
import './ManagementPages.css';

Modal.setAppElement('#root');

function ProductManagementPage() {
  const [produits, setProduits] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // États pour la création
  const [newProduit, setNewProduit] = useState({ nom_produit: '', marque: '', categorie_id: '' });
  
  // États pour la modification
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduit, setEditingProduit] = useState(null);

  // État pour la recherche
  const [searchTerm, setSearchTerm] = useState('');

  const fetchData = useCallback(async (query = '') => {
    try {
      if (!query && !produits.length) setIsLoading(true); // Affiche le chargement uniquement la première fois
      const [produitsRes, categoriesRes] = await Promise.all([
        axiosInstance.get(`/admin/produits/search?query=${query}`),
        axiosInstance.get('/categories-produit/')
      ]);
      setProduits(produitsRes.data);
      setCategories(categoriesRes.data);
      if (categoriesRes.data.length > 0 && newProduit.categorie_id === '') {
        setNewProduit(prev => ({ ...prev, categorie_id: categoriesRes.data[0].id }));
      }
    } catch (error) { console.error("Erreur de chargement:", error); }
    finally { setIsLoading(false); }
  }, [newProduit.categorie_id, produits.length]); // Dépendances de useCallback

  // 2. On met à jour useEffect
  useEffect(() => { 
    fetchData(); 
  }, [fetchData]); // On ajoute fetchData comme dépendance

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await axiosInstance.post('/produits/', newProduit);
      alert('Produit créé avec succès !');
      fetchData(searchTerm);
      setNewProduit({ nom_produit: '', marque: '', categorie_id: categories[0]?.id || '' });
    } catch (error) { alert('Erreur lors de la création.'); }
  };
  
  const handleDelete = async (produitId) => {
    if (window.confirm(`Supprimer le produit ID ${produitId} ?`)) {
      try {
        await axiosInstance.delete(`/produits/${produitId}`);
        alert('Produit supprimé !');
        fetchData(searchTerm);
      } catch (error) { alert('Erreur de suppression.'); }
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await axiosInstance.put(`/admin/produits/${editingProduit.id}`, {
        nom_produit: editingProduit.nom_produit,
        marque: editingProduit.marque,
        categorie_id: editingProduit.categorie.id
      });
      alert('Produit mis à jour !');
      closeEditModal();
      fetchData(searchTerm);
    } catch (error) { alert('Erreur de mise à jour.'); }
  };

  const openEditModal = (produit) => {
    setEditingProduit(JSON.parse(JSON.stringify(produit)));
    setIsModalOpen(true);
  };
  const closeEditModal = () => setIsModalOpen(false);

  if (isLoading) return <div>Chargement...</div>;

  return (
    <div className="management-page">
      <h1>Gestion du Catalogue de Produits</h1>
      
      <div className="management-form-container">
        <h3>Ajouter un produit</h3>
        <form onSubmit={handleCreate} className="management-form">
          <input value={newProduit.nom_produit} onChange={e => setNewProduit({...newProduit, nom_produit: e.target.value})} placeholder="Nom du produit" required />
          <input value={newProduit.marque} onChange={e => setNewProduit({...newProduit, marque: e.target.value})} placeholder="Marque" required />
          <select value={newProduit.categorie_id} onChange={e => setNewProduit({...newProduit, categorie_id: e.target.value})} required>
            {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.nom}</option>)}
          </select>
          <button type="submit">Ajouter</button>
        </form>
      </div>

      <div className="management-table-container">
        <div className="table-header">
          <h3>Liste des Produits</h3>
          <input type="text" placeholder="Rechercher..." className="search-input" value={searchTerm} onChange={e => { setSearchTerm(e.target.value); fetchData(e.target.value); }}/>
        </div>
        <table className="data-table">
          <thead><tr><th>ID</th><th>Nom</th><th>Marque</th><th>Catégorie</th><th>Actions</th></tr></thead>
          <tbody>
            {produits.map(p => (
              <tr key={p.id}>
                <td>{p.id}</td><td>{p.nom_produit}</td><td>{p.marque}</td><td>{p.categorie?.nom}</td>
                <td className="actions-cell">
                  <button className="action-button view-button" onClick={() => openEditModal(p)}>Modifier</button>
                  <button className="action-button reject-button" onClick={() => handleDelete(p.id)}>Supprimer</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isModalOpen} onRequestClose={closeEditModal} className="modal" overlayClassName="overlay">
        {editingProduit && (
          <form onSubmit={handleUpdate}>
            <h2>Modifier le Produit : {editingProduit.nom_produit}</h2>
            <div className="input-group"><label>Nom</label><input value={editingProduit.nom_produit} onChange={e => setEditingProduit({...editingProduit, nom_produit: e.target.value})} /></div>
            <div className="input-group"><label>Marque</label><input value={editingProduit.marque} onChange={e => setEditingProduit({...editingProduit, marque: e.target.value})} /></div>
            <div className="input-group"><label>Catégorie</label>
              <select value={editingProduit.categorie.id} onChange={e => setEditingProduit({...editingProduit, categorie: {...editingProduit.categorie, id: parseInt(e.target.value)}})}>
                {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.nom}</option>)}
              </select>
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

export default ProductManagementPage;