import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { CardTheme } from '../components/FifaCard';

export type AppTheme = 'greenOrange' | 'whiteGold' | 'blackPurple';

interface ThemeTokens {
  id: AppTheme;
  name: string;
  /** Default FifaCard style used wherever a card is shown without its own explicit style. */
  cardTheme: CardTheme;
  /** App-wide page background — kept dark for all three themes so the app's
   * near-universal `text-white` / translucent glass-panel styling stays readable. */
  bgGradient: string;
  accentText: string;
  accentTextSecondary: string;
  accentBg: string;
  gradientBtn: string;
  border: string;
  ring: string;
  /** Text/icon color for the see-through top and bottom navs, readable on this theme's page background. */
  navText: string;
  /** Mirrored into CSS custom properties so every shadcn primitive (Button, Input,
   * focus rings, ...) that reads --primary/--ring/--accent re-colors for free. */
  cssVars: {
    primary: string;
    primaryForeground: string;
    ring: string;
    accent: string;
    accentForeground: string;
  };
}

export const APP_THEMES: Record<AppTheme, ThemeTokens> = {
  greenOrange: {
    id: 'greenOrange',
    name: 'Classic',
    cardTheme: 'greenOrange',
    bgGradient: 'from-green-950 via-emerald-900 to-green-950',
    accentText: 'text-yellow-400',
    accentTextSecondary: 'text-green-200',
    accentBg: 'bg-yellow-500',
    gradientBtn: 'from-green-600 to-yellow-500',
    border: 'border-yellow-500/40',
    ring: 'ring-yellow-400',
    navText: 'text-white',
    cssVars: {
      primary: '#eab308',
      primaryForeground: '#052e12',
      ring: '#facc15',
      accent: '#14532d',
      accentForeground: '#ffffff',
    },
  },
  whiteGold: {
    id: 'whiteGold',
    name: 'Legendary',
    cardTheme: 'whiteGold',
    bgGradient: 'from-white via-yellow-50 to-yellow-100',
    accentText: 'text-yellow-600',
    accentTextSecondary: 'text-gray-600',
    accentBg: 'bg-yellow-500',
    gradientBtn: 'from-yellow-400 to-amber-400',
    border: 'border-yellow-500/50',
    ring: 'ring-yellow-500',
    navText: 'text-gray-900',
    cssVars: {
      primary: '#eab308',
      primaryForeground: '#111827',
      ring: '#eab308',
      accent: '#fef9c3',
      accentForeground: '#111827',
    },
  },
  blackPurple: {
    id: 'blackPurple',
    name: 'Custom',
    cardTheme: 'blackPurple',
    bgGradient: 'from-black via-purple-950 to-black',
    accentText: 'text-purple-400',
    accentTextSecondary: 'text-purple-200',
    accentBg: 'bg-purple-500',
    gradientBtn: 'from-purple-600 to-fuchsia-600',
    border: 'border-purple-500/60',
    ring: 'ring-purple-500',
    navText: 'text-white',
    cssVars: {
      primary: '#9333ea',
      primaryForeground: '#ffffff',
      ring: '#a855f7',
      accent: '#3b0764',
      accentForeground: '#ffffff',
    },
  },
};

const STORAGE_KEY = 'fifa-card-app-theme';

interface ThemeContextValue {
  theme: AppTheme;
  tokens: ThemeTokens;
  setTheme: (theme: AppTheme) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function readStoredTheme(): AppTheme {
  if (typeof window === 'undefined') return 'greenOrange';
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored && stored in APP_THEMES ? (stored as AppTheme) : 'greenOrange';
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<AppTheme>(readStoredTheme);

  useEffect(() => {
    const { cssVars } = APP_THEMES[theme];
    const root = document.documentElement;
    root.style.setProperty('--primary', cssVars.primary);
    root.style.setProperty('--primary-foreground', cssVars.primaryForeground);
    root.style.setProperty('--ring', cssVars.ring);
    root.style.setProperty('--accent', cssVars.accent);
    root.style.setProperty('--accent-foreground', cssVars.accentForeground);
    root.setAttribute('data-app-theme', theme);
    window.localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, tokens: APP_THEMES[theme], setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useAppTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useAppTheme must be used within a ThemeProvider');
  return ctx;
}
