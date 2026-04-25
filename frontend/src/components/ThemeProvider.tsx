'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextValue {
  theme: Theme;
  mounted: boolean;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const THEME_STORAGE_KEY = 'ttms_theme_v2';

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
    const resolvedTheme: Theme = storedTheme === 'light' || storedTheme === 'dark'
      ? storedTheme
      : 'light';

    setThemeState(resolvedTheme);
    applyTheme(resolvedTheme);
    setMounted(true);
  }, []);

  const setTheme = (nextTheme: Theme) => {
    setThemeState(nextTheme);
    window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    applyTheme(nextTheme);
  };

  const value = useMemo<ThemeContextValue>(() => ({
    theme,
    mounted,
    setTheme,
    toggleTheme: () => setTheme(theme === 'dark' ? 'light' : 'dark'),
  }), [mounted, theme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }

  return context;
}
