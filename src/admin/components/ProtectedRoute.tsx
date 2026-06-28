/**
 * Componente Guard per proteggere le route admin.
 */
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { isAdminAuthenticated } from '../utils/adminAuth';

export const ProtectedRoute: React.FC = () => {
  if (!isAdminAuthenticated()) {
    return <Navigate to="/admin/login" replace />;
  }

  return <Outlet />;
};
