import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import './AdminLayout.css';

function AdminLayout({ onLogout }) {
  return (
    <div className="admin-layout">
      <nav className="admin-sidebar">
        <div className="sidebar-header">
          <h3>Panneau Admin</h3>
        </div>
        <ul className="nav-list">
          <li><NavLink to="/admin/dashboard">Tableau de Bord</NavLink></li>
          <li><NavLink to="/admin/users">Gestion Utilisateurs</NavLink></li>
          <li><NavLink to="/admin/products">Gestion Produits</NavLink></li>
          <li><NavLink to="/admin/reports">Rapports Validés</NavLink></li>
          <li><NavLink to="/admin/clients">Gestion Clients</NavLink></li>

          {/* <li><NavLink to="/admin/products">Gestion Produits</NavLink></li> */}
        </ul>
        <button onClick={onLogout} className="sidebar-logout-button">Déconnexion</button>
      </nav>
      <main className="admin-content">
        <Outlet />
      </main>
    </div>
  );
}
export default AdminLayout;