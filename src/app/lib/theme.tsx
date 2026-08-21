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
    name: 'Yellow & Green',
    cardTheme: 'greenOrange',
    bgGradient: 'from-green-950 via-emerald-900 to-green-950',
    accentText: 'text-yellow-400',
    accentTextSecondary: 'text-green-200',
    accentBg: 'bg-yellow-500',
    gradientBtn: 'from-green-600 to-yellow-500',
    border: 'border-yellow-500/40',
    ring: 'ring-yellow-400',
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
    name: 'White & Gold',
    cardTheme: 'whiteGold',
    bgGradient: 'from-amber-950 via-yellow-900 to-amber-950',
    accentText: 'text-amber-400',
    accentTextSecondary: 'text-amber-200',
    accentBg: 'bg-amber-500',
    gradientBtn: 'from-amber-400 to-yellow-500',
    border: 'border-amber-400/40',
    ring: 'ring-amber-400',
    cssVars: {
      primary: '#f59e0b',
      primaryForeground: '#1c1917',
      ring: '#fbbf24',
      accent: '#451a03',
      accentForeground: '#ffffff',
    },
  },
  blackPurple: {
    id: 'blackPurple',
    name: 'Black & Purple',
    cardTheme: 'blackPurple',
    bgGradient: 'from-black via-purple-950 to-black',
    accentText: 'text-purple-400',
    accentTextSecondary: 'text-purple-200',
    accentBg: 'bg-purple-500',
    gradientBtn: 'from-purple-600 to-fuchsia-600',
    border: 'border-purple-500/60',
    ring: 'ring-purple-500',
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
