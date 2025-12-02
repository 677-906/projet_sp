// src/components/ChefZoneLayout.js

import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import NotificationCenter from './NotificationCenter';
import './ChefZoneLayout.css';

function ChefZoneLayout({ onLogout }) {
  return (
    <div className="chef-zone-layout">
      {/* Menu latéral pour le chef de zone */}
      <nav className="chef-zone-sidebar">
        <div className="sidebar-header">
          <h3>Portail Chef de Zone</h3>
        </div>
        <ul className="nav-list">
          {/* Les liens spécifiques au chef de zone */}
          <NavLink to="/chef-zone/dashboard">Tableau de Bord</NavLink>
          <NavLink to="/chef-zone/validations">À Valider</NavLink>
          <NavLink to="/chef-zone/historique">Mon Historique</NavLink>
          <NavLink to="/chef-zone/export">Exporter Excel</NavLink>
        </ul>
        <button onClick={onLogout} className="sidebar-logout-button">Déconnexion</button>
      </nav>

      {/* Le contenu de la page s'affichera ici */}
      <main className="chef-zone-content">
        {/* Barre de navigation supérieure avec notifications */}
        <div className="top-navbar">
          <div className="navbar-spacer"></div>
          <NotificationCenter />
        </div>
        <Outlet />
      </main>
    </div>
  );
}

export default ChefZoneLayout;
