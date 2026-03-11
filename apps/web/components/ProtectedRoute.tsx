import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../src/stores/authStore';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuthStore();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-jam-red rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    // Preserve current path so user returns here after login
    const returnUrl = location.pathname + location.search;
    return <Navigate to={`/login?returnUrl=${encodeURIComponent(returnUrl)}`} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
