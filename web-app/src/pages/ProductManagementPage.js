// src/pages/ProductManagementPage.js
import React, { useState, useEffect } from 'react';
import axiosInstance from '../api/axiosConfig';
import './ManagementPages.css'; // On réutilise le même style que pour les utilisateurs

function ProductManagementPage() {
  const [produits, setProduits] = useState([]);
  
  // États pour le formulaire de création
  const [nomProduit, setNomProduit] = useState('');
  const [marque, setMarque] = useState('');
  const [categories, setCategories] = useState([]); // Pour stocker la liste des catégories
  const [categorieId, setCategorieId] = useState('');

  const fetchProduits = async () => {
    try {
      const [produitsRes, categoriesRes] = await Promise.all([
        axiosInstance.get('/produits/'),
        axiosInstance.get('/categories-produit/')
      ]);
      setProduits(produitsRes.data);
      setCategories(categoriesRes.data);
       if (categoriesRes.data.length > 0) {
        setCategorieId(categoriesRes.data[0].id);
      }
    } catch (error) { console.error("Erreur chargement produits:", error); }
  };

  useEffect(() => {
    fetchProduits();
  }, []);

  const handleCreateProduit = async (event) => {
    event.preventDefault();
    try {
      const newProduct = { nom_produit: nomProduit, marque: marque, categorie_id: parseInt(categorieId) };
      await axiosInstance.post('/produits/', newProduct);
      alert('Produit créé avec succès !');
      fetchProduits(); // On recharge la liste
      setNomProduit('');
      setMarque('');
    } catch (error) {
      alert('Erreur lors de la création du produit.');
      console.error(error.response?.data);
    }
  };

const handleDeleteProduit = async (produitId) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer le produit ID ${produitId} ?`)) {
      try {
        await axiosInstance.delete(`/produits/${produitId}`);
        alert('Produit supprimé avec succès !');
        // On rafraîchit la liste des produits
        fetchProduits();
      } catch (error) {
        alert('Erreur lors de la suppression du produit.');
        console.error(error.response?.data);
      }
    }
  };

  return (
    <div className="management-page">
      <h1>Gestion du Catalogue de Produits</h1>

      <div className="management-form-container">
        <h3>Ajouter un nouveau produit</h3>
        <form onSubmit={handleCreateProduit} className="management-form">
          <input type="text" value={nomProduit} onChange={e => setNomProduit(e.target.value)} placeholder="Nom du produit" required />
          <input type="text" value={marque} onChange={e => setMarque(e.target.value)} placeholder="Marque" required />
          <select value={categorieId} onChange={e => setCategorieId(e.target.value)} required>
            <option value="">-- Choisir une catégorie --</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.nom}</option>
            ))}
          </select>
          <button type="submit">Ajouter</button>
        </form>
      </div>

      <div className="management-table-container">
    <h3>Liste des Produits Existants</h3>
    <table className="data-table">
      {/* On ajoute une colonne "Actions" */}
      <thead><tr><th>ID</th><th>Nom du Produit</th><th>Marque</th><th>Actions</th></tr></thead>
      <tbody>
        {produits.map(produit => (
          <tr key={produit.id}>
            <td>{produit.id}</td>
            <td>{produit.nom_produit}</td>
            <td>{produit.marque}</td>
            {/* On ajoute le bouton de suppression */}
            <td>
              <button 
                  className="action-button reject-button" 
                  onClick={() => handleDeleteProduit(produit.id)}
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

export default ProductManagementPage;