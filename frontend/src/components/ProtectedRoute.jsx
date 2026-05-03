import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const ProtectedRoute = ({ children, roles = [], allowGuest = false }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div className="loader">Загрузка...</div>;

  if (!user || user.role === 'GUEST') {
    if (allowGuest) return children;
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (roles.length > 0 && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }
  
  return children;
};