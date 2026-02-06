'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface User {
  id: number;
  department_id: number;
  name: string;
  email: string;
  role: 'admin' | 'hod' | 'staff';
  is_active: boolean;
  account_type?: 'acbs' | 'innovision' | 'infrastructure' | null;
}

type AccountType = 'acbs' | 'innovision' | 'infrastructure';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  // Account switching for HOD/Admin
  selectedAccount: AccountType;
  setSelectedAccount: (account: AccountType) => void;
  // Get the effective account type (staff's fixed account or HOD/Admin's selected)
  effectiveAccountType: AccountType;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAccount, setSelectedAccount] = useState<AccountType>('acbs');
  const router = useRouter();
  const pathname = usePathname();

  // For staff, use their fixed account_type. For HOD/Admin, use selectedAccount
  const effectiveAccountType: AccountType = user?.role === 'staff' && user?.account_type
    ? user.account_type as AccountType
    : selectedAccount;

  const refreshUser = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.user) {
          setUser(data.user);
          return;
        }
      }

      setUser(null);
    } catch (error) {
      console.error('Failed to refresh user:', error);
      setUser(null);
    }
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      setIsLoading(true);
      await refreshUser();
      setIsLoading(false);
    };

    initAuth();
  }, [refreshUser]);

  useEffect(() => {
    if (!isLoading && !user && pathname !== '/login') {
      router.push('/login');
    }
  }, [user, isLoading, pathname, router]);

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (data.success && data.user) {
        setUser(data.user);
        router.push('/');
        return { success: true };
      }

      return { success: false, error: data.error || 'Login failed' };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'An error occurred during login' };
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      router.push('/login');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        refreshUser,
        selectedAccount,
        setSelectedAccount,
        effectiveAccountType,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

// Role check hooks
export function useRole() {
  const { user } = useAuth();

  return {
    isAdmin: user?.role === 'admin',
    isHOD: user?.role === 'hod',
    isStaff: user?.role === 'staff',
    canApprove: user?.role === 'admin' || user?.role === 'hod',
    canManageBudgets: user?.role === 'admin' || user?.role === 'hod',
    canDownloadReports: user?.role !== 'staff',
  };
}