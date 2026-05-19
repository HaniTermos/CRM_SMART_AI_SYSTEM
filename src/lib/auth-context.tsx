import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { api } from "./api";

// Custom User type for our new backend
export type User = {
  id: string;
  email: string;
  name: string | null;
  role: string;
  has_store: boolean;
};

// We drop the Supabase "Session" concept and just track the User and loading state.
type AuthState = {
  user: User | null;
  loading: boolean;
};

const AuthContext = createContext<AuthState>({ user: null, loading: true });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ user: null, loading: true });

  useEffect(() => {
    let mounted = true;

    const checkAuth = async () => {
      const token = localStorage.getItem('smartstore_token');
      
      if (!token) {
        if (mounted) setState({ user: null, loading: false });
        return;
      }

      try {
        // Fetch current user from our custom backend
        const res = await api.get('/auth/me');
        if (mounted) setState({ user: res.data.data, loading: false });
      } catch (error) {
        console.error("Auth check failed:", error);
        localStorage.removeItem('smartstore_token');
        if (mounted) setState({ user: null, loading: false });
      }
    };

    checkAuth();

    // Listen for the custom global auth error event dispatched by api.ts
    const handleAuthError = () => {
      if (mounted) setState({ user: null, loading: false });
    };
    
    window.addEventListener('auth-error', handleAuthError);

    return () => {
      mounted = false;
      window.removeEventListener('auth-error', handleAuthError);
    };
  }, []);

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
