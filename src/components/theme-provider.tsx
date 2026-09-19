"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useUserPreferences, type DashboardTheme } from "@/lib/use-user-preferences";
import { useUpdateUserPreferences } from "@/lib/use-user-preferences";
import { useAuth } from "@/lib/auth-context";

interface ThemeContextType {
  theme: DashboardTheme;
  isDark: boolean;
  toggleDark: () => void;
  setTheme: (theme: DashboardTheme) => void;
  setDark: (v: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "system",
  isDark: false,
  toggleDark: () => {},
  setTheme: () => {},
  setDark: () => {},
});

function resolveIsDark(theme: DashboardTheme, prefersDark: boolean): boolean {
  if (theme === "dark") return true;
  if (theme === "light") return false;
  return prefersDark;
}

export function DashboardThemeProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const { data: prefs, isLoading: prefsLoading } = useUserPreferences();
  const updatePrefs = useUpdateUserPreferences();

  const [mounted, setMounted] = useState(false);
  const [localTheme, setLocalTheme] = useState<DashboardTheme>("system");

  useEffect(() => {
    setMounted(true);
  }, []);

  const isLoading = authLoading || prefsLoading;
  const theme: DashboardTheme = prefs?.dashboard_theme || localTheme;

  const prefersDark =
    typeof window !== "undefined" && window.matchMedia
      ? window.matchMedia("(prefers-color-scheme: dark)").matches
      : false;

  const isDark = resolveIsDark(theme, prefersDark);

  const persistTheme = (next: DashboardTheme) => {
    setLocalTheme(next);
    if (user) {
      updatePrefs.mutate({ dashboard_theme: next });
    }
  };

  const setTheme = (next: DashboardTheme) => {
    persistTheme(next);
  };

  const toggleDark = () => {
    const next = isDark ? "light" : "dark";
    persistTheme(next);
  };

  const setDark = (v: boolean) => {
    const next = v ? "dark" : "light";
    persistTheme(next);
  };

  if (!mounted || isLoading) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] text-[#0F172A]">
        {children}
      </div>
    );
  }

  return (
    <ThemeContext.Provider value={{ theme, isDark, toggleDark, setTheme, setDark }}>
      <div
        data-app-scope="dashboard"
        data-dashboard-theme={isDark ? "dark" : "light"}
        className={isDark ? "dark" : ""}
      >
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

export const ThemeProvider = DashboardThemeProvider;
export const useTheme = () => useContext(ThemeContext);
