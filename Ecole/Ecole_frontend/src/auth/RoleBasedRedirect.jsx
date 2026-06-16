import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { ROLE_REDIRECT_MAP } from '../config/routes';

const RoleBasedRedirect = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/connexion', { replace: true });
      return;
    }

    const route = ROLE_REDIRECT_MAP[user?.role];
    navigate(route || '/unauthorized', { replace: true });
  }, [user, isAuthenticated, navigate]);

  return null;
};

export default RoleBasedRedirect;