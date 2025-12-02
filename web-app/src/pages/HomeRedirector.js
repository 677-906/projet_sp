// src/pages/HomeRedirector.js
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function HomeRedirector() {
  const navigate = useNavigate();
  useEffect(() => {
    const role = localStorage.getItem('userRole');
    const roleLower = role?.toLowerCase();

    if (roleLower === 'administrateur') {
      navigate('/admin/dashboard', { replace: true });
    } else if (roleLower === 'responsable') {
      navigate('/responsable/dashboard', { replace: true });
    } else if (roleLower === 'chef de zone') {
      navigate('/chef-zone/dashboard', { replace: true });
    } else {
      // Par défaut, redirection vers chef de zone (anciennes données)
      navigate('/chef-zone/dashboard', { replace: true });
    }
  }, [navigate]);
  return <div>Chargement...</div>;
}
export default HomeRedirector;