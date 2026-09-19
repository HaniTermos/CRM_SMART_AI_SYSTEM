import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { api } from "./api";

export type User = {
  id: string;
  email: string;
  name: string | null;
  role: string;
  has_store: boolean;
};

type AuthState = {
  user: User | null;
  loading: boolean;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthState>({
  user: null,
  loading: true,
  logout: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<{ user: User | null; loading: boolean }>({
    user: null,
    loading: true,
  });

  useEffect(() => {
    let mounted = true;

    const checkAuth = async () => {
      const token = localStorage.getItem('smartstore_token');
      
      // Treat empty/whitespace-only tokens as missing
      if (!token || typeof token !== 'string' || token.trim() === '' || token === 'undefined' || token === 'null') {
        localStorage.removeItem('smartstore_token');
        if (mounted) setState({ user: null, loading: false });
        return;
      }

      try {
        const res = await api.get('/auth/me');
        const user = res.data?.data;
        if (mounted) setState({ user: user ?? null, loading: false });
      } catch (error) {
        console.error("Auth check failed:", error);
        localStorage.removeItem('smartstore_token');
        if (mounted) setState({ user: null, loading: false });
      }
    };

    checkAuth();
    
    const handleAuthError = () => {
      if (mounted) setState({ user: null, loading: false });
    };
    
    window.addEventListener('auth-error', handleAuthError);

    return () => {
      mounted = false;
      window.removeEventListener('auth-error', handleAuthError);
    };
  }, []);

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.warn("Server logout notification failed, proceeding with local token clearance:", error);
    } finally {
      localStorage.removeItem('smartstore_token');
      setState({ user: null, loading: false });
      window.location.href = '/login';
    }
  };

  return (
    <AuthContext.Provider value={{ user: state.user, loading: state.loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
