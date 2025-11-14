import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAdmin } from '../../context/AdminContext';
import { Loader2 } from 'lucide-react';

/**
 * Protected Route Component for Admin
 * Redirects to login if not authenticated
 */
const AdminProtectedRoute = () => {
  const { isAuthenticated, loading } = useAdmin();
  const secretPath = import.meta.env.VITE_ADMIN_PANEL_SECRET || 'secure';

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Verifying credentials...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to={`/admin/${secretPath}/login`} replace />;
  }

  // Render child routes if authenticated
  return <Outlet />;
};

export default AdminProtectedRoute;
