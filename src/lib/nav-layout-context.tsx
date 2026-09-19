import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useUserPreferences, useUpdateUserPreferences, type NavMode } from "./use-user-preferences";
import { useAuth } from "./auth-context";
import { getStorage, setStorage } from "./ssr-safe";

export type { NavMode };

type NavLayoutContextType = {
  navMode: NavMode;
  setNavMode: (mode: NavMode) => void;
  toggleNavMode: () => void;
};

const NavLayoutContext = createContext<NavLayoutContextType>({
  navMode: "dock",
  setNavMode: () => {},
  toggleNavMode: () => {},
});

const STORAGE_KEY = "smartstore_nav_mode";

export function NavLayoutProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { data: prefs } = useUserPreferences();
  const updatePrefs = useUpdateUserPreferences();

  const [localMode, setLocalMode] = useState<NavMode>(() => {
    return (getStorage(STORAGE_KEY, "dock") as NavMode) || "dock";
  });

  useEffect(() => {
    if (prefs?.nav_mode && (prefs.nav_mode === "dock" || prefs.nav_mode === "sidebar")) {
      setLocalMode(prefs.nav_mode);
      setStorage(STORAGE_KEY, prefs.nav_mode);
    }
  }, [prefs?.nav_mode]);

  const navMode = localMode;

  const setNavMode = (mode: NavMode) => {
    setLocalMode(mode);
    setStorage(STORAGE_KEY, mode);
    if (user) {
      updatePrefs.mutate({ nav_mode: mode });
    }
  };

  const toggleNavMode = () => {
    setNavMode(localMode === "dock" ? "sidebar" : "dock");
  };

  return (
    <NavLayoutContext.Provider value={{ navMode, setNavMode, toggleNavMode }}>
      {children}
    </NavLayoutContext.Provider>
  );
}

export function useNavLayout() {
  return useContext(NavLayoutContext);
}
