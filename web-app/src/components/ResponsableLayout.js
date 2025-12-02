// src/components/ResponsableLayout.js

import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import NotificationCenter from './NotificationCenter';
import './ResponsableLayout.css';

function ResponsableLayout({ onLogout }) {
  return (
    <div className="responsable-layout">
      {/* Menu latéral pour le responsable */}
      <nav className="responsable-sidebar">
        <div className="sidebar-header">
          <h3>Portail Responsable</h3>
        </div>
        <ul className="nav-list">
          {/* Les liens spécifiques au responsable */}
          <NavLink to="/responsable/dashboard">Tableau de Bord</NavLink>
          <NavLink to="/responsable/validations">À Valider</NavLink>
          <NavLink to="/responsable/historique">Mon Historique</NavLink>
          <NavLink to="/responsable/chefs-zone">Mes Chefs de Zone</NavLink>
        </ul>
        <button onClick={onLogout} className="sidebar-logout-button">Déconnexion</button>
      </nav>

      {/* Le contenu de la page s'affichera ici */}
      <main className="responsable-content">
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

export default ResponsableLayout;
