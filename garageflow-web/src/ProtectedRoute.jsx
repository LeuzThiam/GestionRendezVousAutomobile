// ProtectedRoute.jsx
import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';

function ProtectedRoute({ children, allowedRoles }) {
  const { user, isAuthenticated } = useSelector((state) => state.user);

  if (!isAuthenticated || !user || !allowedRoles.includes(user.role)) {
    return <Navigate to="/connexion" replace />;
  }

  return children;
}

export default ProtectedRoute;
