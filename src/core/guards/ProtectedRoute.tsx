import { Navigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { Permission } from '../auth/types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermissions?: Permission[];
  requireAll?: boolean; // If true, user needs ALL permissions; if false, needs ANY
}

export default function ProtectedRoute({
  children,
  requiredPermissions = [],
  requireAll = false,
}: ProtectedRouteProps) {
  const { isAuthenticated, hasPermission, hasAllPermissions, hasAnyPermission } = useAuth();

  // If not authenticated, redirect to login (for now just show dashboard)
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // Check permissions
  if (requiredPermissions.length > 0) {
    const hasAccess = requireAll
      ? hasAllPermissions(requiredPermissions)
      : hasAnyPermission(requiredPermissions);

    if (!hasAccess) {
      // No permission - redirect to dashboard with message
      return (
        <div className="flex items-center justify-center h-screen bg-warm-50">
          <div className="text-center p-8 bg-white rounded-2xl shadow-xl max-w-md border border-warm-200">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-charcoal-900 mb-2">Access Denied</h2>
            <p className="text-charcoal-600 mb-6">
              You don't have permission to access this page. Please contact your administrator.
            </p>
            <button
              onClick={() => window.history.back()}
              className="px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
}
