// Theme System Engine (Light & Dark Mode Management)
// Separate module handling theme preference state, localStorage persistence, and DOM class synchronization.

import { GameState } from '../types';

export type AppThemeMode = 'light' | 'dark';

const THEME_STORAGE_KEY = 'onchart_preferred_theme';

export function getSavedThemePreference(): AppThemeMode {
  if (typeof window === 'undefined') return 'light';
  try {
    const saved = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === 'dark' || saved === 'light') return saved;
  } catch {
    // ignore storage access issues
  }
  return 'light';
}

export function resolveCurrentTheme(state?: Partial<GameState> | null): AppThemeMode {
  if (state?.theme === 'dark' || state?.theme === 'light') {
    return state.theme;
  }
  return getSavedThemePreference();
}

export function applyThemeToDocument(theme: AppThemeMode): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (theme === 'dark') {
    root.classList.add('dark');
    root.setAttribute('data-theme', 'dark');
  } else {
    root.classList.remove('dark');
    root.setAttribute('data-theme', 'light');
  }
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // ignore storage access issues
  }
}

export function toggleAppThemeState(state: GameState): GameState {
  const current = resolveCurrentTheme(state);
  const nextTheme: AppThemeMode = current === 'dark' ? 'light' : 'dark';
  applyThemeToDocument(nextTheme);
  return {
    ...state,
    theme: nextTheme
  };
}
