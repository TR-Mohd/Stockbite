import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export const ProtectedRoute = ({ allowedRoles = [] }) => {
  const { token, user } = useAuthStore();

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    if (user.role === 'Cashier') {
      return <Navigate to="/pos" replace />;
    }
    if (user.role === 'Warehouse') {
      return <Navigate to="/inventory" replace />;
    }
    if (user.role === 'Manager') {
      return <Navigate to="/manager/dashboard" replace />;
    }
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};
