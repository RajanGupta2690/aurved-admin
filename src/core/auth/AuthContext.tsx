import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { User, AuthState } from './types';
import { UserRole, ROLE_PERMISSIONS, Permission } from './types';

interface AuthContextType extends AuthState {
  login: (email: string, password: string, role?: UserRole) => Promise<void>;
  logout: () => void;
  hasPermission: (permission: Permission) => boolean;
  hasAnyPermission: (permissions: Permission[]) => boolean;
  hasAllPermissions: (permissions: Permission[]) => boolean;
  switchRole: (role: UserRole) => void; // For demo purposes
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock users for demo (replace with API call in production)
const MOCK_USERS: Record<string, User> = {
  'admin@school.com': {
    id: '1',
    name: 'Rajesh Kumar',
    email: 'admin@school.com',
    role: UserRole.SUPER_ADMIN,
    permissions: ROLE_PERMISSIONS[UserRole.SUPER_ADMIN],
    employeeId: 'EMP001',
    isActive: true,
  },
  'teacher@school.com': {
    id: '2',
    name: 'Priya Sharma',
    email: 'teacher@school.com',
    role: UserRole.TEACHER,
    permissions: ROLE_PERMISSIONS[UserRole.TEACHER],
    assignedClasses: ['class-1', 'class-2'],
    assignedSubjects: ['math', 'science'],
    employeeId: 'EMP002',
    isActive: true,
  },
  'librarian@school.com': {
    id: '3',
    name: 'Amit Patel',
    email: 'librarian@school.com',
    role: UserRole.LIBRARIAN,
    permissions: ROLE_PERMISSIONS[UserRole.LIBRARIAN],
    employeeId: 'EMP003',
    isActive: true,
  },
  'accountant@school.com': {
    id: '4',
    name: 'Sunita Verma',
    email: 'accountant@school.com',
    role: UserRole.ACCOUNTANT,
    permissions: ROLE_PERMISSIONS[UserRole.ACCOUNTANT],
    employeeId: 'EMP004',
    isActive: true,
  },
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });

  // Check if user is already logged in (from localStorage)
  useEffect(() => {
    const savedUser = localStorage.getItem('aurved_user');
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        setAuthState({
          user,
          isAuthenticated: true,
          isLoading: false,
        });
      } catch (error) {
        console.error('Failed to parse saved user:', error);
        localStorage.removeItem('aurved_user');
        setAuthState({ user: null, isAuthenticated: false, isLoading: false });
      }
    } else {
      // Auto-login as Super Admin for demo
      const defaultUser = MOCK_USERS['admin@school.com'];
      setAuthState({
        user: defaultUser,
        isAuthenticated: true,
        isLoading: false,
      });
      localStorage.setItem('aurved_user', JSON.stringify(defaultUser));
    }
  }, []);

  const login = async (email: string, password: string, role?: UserRole) => {
    // Mock login - replace with actual API call
    setAuthState(prev => ({ ...prev, isLoading: true }));
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const user = MOCK_USERS[email] || MOCK_USERS['admin@school.com'];
    
    setAuthState({
      user,
      isAuthenticated: true,
      isLoading: false,
    });
    
    localStorage.setItem('aurved_user', JSON.stringify(user));
  };

  const logout = () => {
    setAuthState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });
    localStorage.removeItem('aurved_user');
  };

  const hasPermission = (permission: Permission): boolean => {
    if (!authState.user) return false;
    return authState.user.permissions.includes(permission);
  };

  const hasAnyPermission = (permissions: Permission[]): boolean => {
    if (!authState.user) return false;
    return permissions.some(permission => authState.user!.permissions.includes(permission));
  };

  const hasAllPermissions = (permissions: Permission[]): boolean => {
    if (!authState.user) return false;
    return permissions.every(permission => authState.user!.permissions.includes(permission));
  };

  // Demo: Switch role on the fly
  const switchRole = (role: UserRole) => {
    if (!authState.user) return;
    
    const updatedUser: User = {
      ...authState.user,
      role,
      permissions: ROLE_PERMISSIONS[role],
    };
    
    setAuthState({
      user: updatedUser,
      isAuthenticated: true,
      isLoading: false,
    });
    
    localStorage.setItem('aurved_user', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider
      value={{
        ...authState,
        login,
        logout,
        hasPermission,
        hasAnyPermission,
        hasAllPermissions,
        switchRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
