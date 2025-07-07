import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
    const { authData } = useAuth();
    const location = useLocation();

    if (!authData?.user) {
        return <Navigate to="/dashboard-admin" state={{ from: location }} replace />;
    }

    if (allowedRoles && !allowedRoles.includes(authData.user.role)) {
        // Rediriger vers une page "non autorisé" ou la page par défaut selon le rôle
        const defaultRoute = 
            authData.user.role === 'eleve' 
            ? '/dashboard-eleve' 
            :authData.user.role === 'parent' 
            ? '/dashboard-parent'
            : authData.user.role === 'directeur' 
                ? '/dashboard-admin' 
            : authData.user.role === 'directeurM' 
                ? '/dashboard-maternelle' 
            : authData.user.role === 'directeurP' 
                ? '/dashboard-primaire' 
            : authData.user.role === 'directeurS' 
                ? '/dashboard-secondaire' 
            
            : authData.user.role === 'censeur' 
                ? '/dashboard-censeur' 
            :authData.user.role === 'enseignement'
                ? '/dashboard-enseignement'
            :authData.user.role === 'enseignementM' 
                ? '/dashboard-enseignementM'
            :authData.user.role === 'enseignementP' 
                ? '/dashboard-enseignementP'
            :authData.user.role === 'comptable'
                ? '/dashboard-comptable'
            :authData.user.role === 'surveillant'
                ? '/dashboard-surveillant'
            :authData.user.role === 'secretaire'
                ? '/dashboard-secretaire'
            :'/'; 

        return <Navigate to={defaultRoute} replace />;
    }

    return children;
};

export default ProtectedRoute;