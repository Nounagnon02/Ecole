import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

const RoleBasedRedirect = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/connexion');
      return;
    }

    const roleRoutes = {
      'directeur': '/directeur/dashboard',
      'enseignant': '/enseignant/dashboard',
      'eleve': '/eleve/dashboard',
      'parent': '/parent/dashboard',
      'comptable': '/comptable/dashboard',
      'surveillant': '/surveillant/dashboard',
      'censeur': '/censeur/dashboard',
      'infirmier': '/infirmier/dashboard',
      'bibliothecaire': '/bibliothecaire/dashboard',
      'secretaire': '/secretaire/dashboard'
    };

    const route = roleRoutes[user?.role];
    if (route) {
      navigate(route, { replace: true });
    } else {
      navigate('/unauthorized', { replace: true });
    }
  }, [user, isAuthenticated, navigate]);

  return null;
};

export default RoleBasedRedirect;