import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export const ProtectedRoute = ({ allowedRoles = [] }) => {
  const { token, user } = useAuthStore();

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  // Basic RBAC implementation
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    // If they are logged in but don't have the correct role, redirect them somewhere safe
    // For now, redirecting to a generic unauthorized route or just dashboard (e.g. /pos)
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};
