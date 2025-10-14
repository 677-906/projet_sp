// src/pages/HomeRedirector.js
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function HomeRedirector() {
  const navigate = useNavigate();
  useEffect(() => {
    const role = localStorage.getItem('userRole');
    if (role && role.toLowerCase() === 'administrateur') {
      navigate('/admin/dashboard', { replace: true });
    } else {
      navigate('/app/dashboard', { replace: true }); // On redirige vers la nouvelle route du superviseur
    }
  }, [navigate]);
  return <div>Chargement...</div>;
}
export default HomeRedirector;