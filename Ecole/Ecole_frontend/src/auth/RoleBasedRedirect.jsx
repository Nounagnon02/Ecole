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
      // Direction
      'directeur': '/directeur/dashboard',
      'directeurM': '/maternelle/dashboard',
      'directeurP': '/primaire/dashboard',
      'directeurS': '/secondaire/dashboard',
      // Enseignants
      'enseignant': '/enseignant/dashboard',
      'enseignement': '/enseignant/secondaire',
      'enseignementM': '/enseignant/maternelle',
      'enseignementP': '/enseignant/primaire',
      // Élèves et parents
      'eleve': '/eleve/dashboard',
      'parent': '/parent/dashboard',
      // Personnel
      'comptable': '/comptable/dashboard',
      'surveillant': '/surveillant/dashboard',
      'censeur': '/censeur/dashboard',
      'infirmier': '/infirmier/dashboard',
      'bibliothecaire': '/bibliothecaire/dashboard',
      'secretaire': '/secretaire/dashboard',
      // Université
      'recteur': '/universite/dashboard',
      'doyen': '/universite/dashboard',
      'professeur': '/universite/dashboard',
      'etudiant': '/universite/dashboard',
      'personnel': '/universite/dashboard',
      // Admin
      'super-admin': '/admin/ecoles',
      'admin': '/admin/dashboard'
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