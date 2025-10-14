import React, { useState } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';

// Import de toutes les pages et layouts
import LoginPage from './pages/LoginPage';
import SupervisorLayout from './components/SupervisorLayout';
import DashboardPage from './pages/DashboardPage';
import ValidationPage from './pages/ValidationPage';
import SupervisorHistoryPage from './pages/SupervisorHistoryPage';
import VisitDetailPage from './pages/VisitDetailPage';
import AdminLayout from './components/AdminLayout';
import AdminDashboardPage from './pages/AdminDashboardPage';
import UserManagementPage from './pages/UserManagementPage';
import ProductManagementPage from './pages/ProductManagementPage';
import ValidatedReportsPage from './pages/ValidatedReportsPage';
import ClientManagementPage from './pages/ClientManagementPage';
import HomeRedirector from './pages/HomeRedirector';
import './App.css';

// Le garde du corps ne change pas
function PrivateRoute({ children }) {
  const token = localStorage.getItem('authToken');
  return token ? children : <Navigate to="/login" />;
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('authToken'));
  const navigate = useNavigate();

  const handleLoginSuccess = (loginData) => {
    localStorage.setItem('authToken', loginData.access_token);
    localStorage.setItem('userRole', loginData.user_role); 
    setIsAuthenticated(true);
    navigate('/');
  };
  
  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userRole');
    setIsAuthenticated(false);
    navigate('/login');
  };

  return (
    <Routes>
      <Route 
        path="/login" 
        element={!isAuthenticated ? <LoginPage onLoginSuccess={handleLoginSuccess} /> : <Navigate to="/" />}
      />

      {/* --- Route Portail de Redirection --- */}
      <Route path="/" element={<PrivateRoute><HomeRedirector /></PrivateRoute>} />

      {/* --- GROUPE DES ROUTES DU SUPERVISEUR --- */}
      {/* Toutes ces routes utiliseront le SupervisorLayout et seront accessibles avec un préfixe comme /app */}
      <Route path="/app" element={<PrivateRoute><SupervisorLayout onLogout={handleLogout} /></PrivateRoute>}>
        <Route index element={<Navigate to="dashboard" />} /> {/* Redirection par défaut pour /app */}
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="validations" element={<ValidationPage />} />
        <Route path="historique" element={<SupervisorHistoryPage />} />
        <Route path="visite/:visiteId" element={<VisitDetailPage />} />
      </Route>

      {/* --- GROUPE DES ROUTES DE L'ADMINISTRATEUR --- */}
      <Route path="/admin" element={<PrivateRoute><AdminLayout onLogout={handleLogout} /></PrivateRoute>}>
        <Route index element={<Navigate to="dashboard" />} /> {/* Redirection par défaut pour /admin */}
        <Route path="dashboard" element={<AdminDashboardPage />} />
        <Route path="users" element={<UserManagementPage />} />
        <Route path="products" element={<ProductManagementPage />} />
        <Route path="clients" element={<ClientManagementPage />} />
        <Route path="reports" element={<ValidatedReportsPage />} />
      </Route>

      {/* La route "attrape-tout" finale */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;