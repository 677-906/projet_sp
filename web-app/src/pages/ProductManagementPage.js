// src/pages/ProductManagementPage.js
import React, { useState, useEffect } from 'react';
import axiosInstance from '../api/axiosConfig';
import './ManagementPages.css'; // On réutilise le même style que pour les utilisateurs

function ProductManagementPage() {
  const [produits, setProduits] = useState([]);
  
  // États pour le formulaire de création
  const [nomProduit, setNomProduit] = useState('');
  const [marque, setMarque] = useState('');

  const fetchProduits = async () => {
    try {
      const response = await axiosInstance.get('/produits/');
      setProduits(response.data);
    } catch (error) { console.error("Erreur chargement produits:", error); }
  };

  useEffect(() => {
    fetchProduits();
  }, []);

  const handleCreateProduit = async (event) => {
    event.preventDefault();
    try {
      const newProduct = { nom_produit: nomProduit, marque: marque };
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

  return (
    <div className="management-page">
      <h1>Gestion du Catalogue de Produits</h1>

      <div className="management-form-container">
        <h3>Ajouter un nouveau produit</h3>
        <form onSubmit={handleCreateProduit} className="management-form">
          <input type="text" value={nomProduit} onChange={e => setNomProduit(e.target.value)} placeholder="Nom du produit" required />
          <input type="text" value={marque} onChange={e => setMarque(e.target.value)} placeholder="Marque" required />
          <button type="submit">Ajouter</button>
        </form>
      </div>

      <div className="management-table-container">
        <h3>Liste des Produits Existants</h3>
        <table className="data-table">
          <thead><tr><th>ID</th><th>Nom du Produit</th><th>Marque</th></tr></thead>
          <tbody>
            {produits.map(produit => (
              <tr key={produit.id}>
                <td>{produit.id}</td>
                <td>{produit.nom_produit}</td>
                <td>{produit.marque}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ProductManagementPage;