import React from 'react';
import { Navigate } from 'react-router-dom';

import { useAuth } from '../auth';

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user || !allowedRoles.includes(user.role)) {
    return <Navigate to="/connexion" replace />;
  }

  return children;
}
