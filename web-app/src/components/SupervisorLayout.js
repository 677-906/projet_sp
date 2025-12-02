// src/components/SupervisorLayout.js

import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import './SupervisorLayout.css'; // On va utiliser un fichier de style dédié

function SupervisorLayout({ onLogout }) {
  return (
    <div className="supervisor-layout">
      {/* Menu latéral pour le superviseur */}
      <nav className="supervisor-sidebar">
        <div className="sidebar-header">
          <h3>Portail Superviseur</h3>
        </div>
        <ul className="nav-list">
          {/* Les liens spécifiques au superviseur */}
          <NavLink to="/app/dashboard">Tableau de Bord</NavLink>
          <NavLink to="/app/validations">A Valider</NavLink>
          <NavLink to="/app/historique">Mon Historique</NavLink>
        </ul>
        <button onClick={onLogout} className="sidebar-logout-button">Déconnexion</button>
      </nav>

      {/* Le contenu de la page (Tableau de Bord, Validations, etc.) s'affichera ici */}
      <main className="supervisor-content">
        <Outlet />
      </main>
    </div>
  );
}

export default SupervisorLayout;