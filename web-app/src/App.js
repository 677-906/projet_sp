// src/App.js
import React, { useState } from 'react';
// ON NE IMPORTE PLUS BrowserRouter d'ici
import {
  Routes,
  Route,
  Navigate,
  useNavigate,
} from 'react-router-dom';

// Import de toutes les pages
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ValidationPage from './pages/ValidationPage';
import VisitDetailPage from './pages/VisitDetailPage';
import AdminLayout from './components/AdminLayout';
import AdminDashboardPage from './pages/AdminDashboardPage';
import UserManagementPage from './pages/UserManagementPage';
import HomeRedirector from './pages/HomeRedirector';
import ProductManagementPage from './pages/ProductManagementPage';
import ValidatedReportsPage from './pages/ValidatedReportsPage';
import ClientManagementPage from './pages/ClientManagementPage';
import './App.css';

function PrivateRoute({ children }) {
  const token = localStorage.getItem('authToken');
  return token ? children : <Navigate to="/login" />;
}

// On renomme AppRoutes en App et on l'exporte
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
    // Les Routes sont directement ici, sans Router parent
    <Routes>
      <Route 
        path="/login" 
        element={!isAuthenticated ? <LoginPage onLoginSuccess={handleLoginSuccess} /> : <Navigate to="/" />}
      />
      <Route path="/" element={<PrivateRoute><HomeRedirector /></PrivateRoute>} />
      <Route path="/dashboard" element={<PrivateRoute><DashboardPage onLogout={handleLogout} /></PrivateRoute>} />
      <Route path="/validations" element={<PrivateRoute><ValidationPage /></PrivateRoute>} />
      <Route path="/visite/:visiteId" element={<PrivateRoute><VisitDetailPage /></PrivateRoute>} />
      <Route path="/admin" element={<PrivateRoute><AdminLayout onLogout={handleLogout} /></PrivateRoute>}>
        <Route path="dashboard" element={<AdminDashboardPage />} />
        <Route path="users" element={<UserManagementPage />} />
        <Route path="products" element={<ProductManagementPage />} />
        <Route path="reports" element={<ValidatedReportsPage />} />
        <Route path="clients" element={<ClientManagementPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;