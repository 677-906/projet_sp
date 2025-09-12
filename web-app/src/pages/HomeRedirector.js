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
      navigate('/dashboard', { replace: true });
    }
  }, [navigate]);

  // On affiche un simple message de chargement pendant la redirection
  return <div>Chargement...</div>;
}

export default HomeRedirector;