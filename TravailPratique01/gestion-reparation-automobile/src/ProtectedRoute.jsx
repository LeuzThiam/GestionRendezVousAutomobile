// ProtectedRoute.jsx
import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';

function ProtectedRoute({ children, allowedRoles }) {
  const { user } = useSelector((state) => state.user);

  if (!user || !allowedRoles.includes(user.role)) {
    return <Navigate to="/connexion" replace />;
  }

  return children;
}

export default ProtectedRoute;
