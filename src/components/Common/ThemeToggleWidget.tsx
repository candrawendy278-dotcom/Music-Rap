import React, { useEffect } from 'react';
import { useGameContext } from '../../GameContext';
import {
  resolveCurrentTheme,
  applyThemeToDocument,
  toggleAppThemeState
} from '../../data/themeSystemEngine';

interface ThemeToggleWidgetProps {
  variant?: 'compact' | 'card';
}

export default function ThemeToggleWidget({ variant = 'card' }: ThemeToggleWidgetProps) {
  const { state, setState } = useGameContext();
  const currentTheme = resolveCurrentTheme(state);
  const isDark = currentTheme === 'dark';

  useEffect(() => {
    applyThemeToDocument(currentTheme);
  }, [currentTheme]);

  const handleToggle = () => {
    setState(prev => toggleAppThemeState(prev));
  };

  if (variant === 'compact') {
    return (
      <button
        type="button"
        onClick={handleToggle}
        title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        className={`w-9 h-9 rounded-full flex items-center justify-center border transition-all active:scale-95 cursor-pointer ${
          isDark
            ? 'bg-zinc-800 border-zinc-700 text-amber-400 hover:bg-zinc-700'
            : 'bg-white/90 border-gray-200 text-zinc-700 hover:bg-gray-100'
        }`}
      >
        <i className={`ph-fill ${isDark ? 'ph-sun text-base' : 'ph-moon-stars text-base'}`}></i>
      </button>
    );
  }

  return (
    <div className="bg-apple-card rounded-3xl p-5 shadow-ios border border-apple-border/50 flex items-center justify-between">
      <div className="flex items-center gap-3.5">
        <div
          className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-xs ${
            isDark
              ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
              : 'bg-amber-100 text-amber-600'
          }`}
        >
          <i className={`ph-fill ${isDark ? 'ph-moon-stars' : 'ph-sun'}`}></i>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h4 className="font-black text-apple-text text-base">Appearance & Theme</h4>
            <span
              className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                isDark
                  ? 'bg-indigo-500/20 text-indigo-300'
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              {isDark ? 'DARK MODE' : 'LIGHT MODE'}
            </span>
          </div>
          <p className="text-xs text-apple-subtext mt-0.5">
            {isDark
              ? 'High-contrast OLED Dark Theme is active across the entire app.'
              : 'Switch to Dark Theme for a comfortable low-light studio experience.'}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={handleToggle}
        className={`px-4 py-2.5 rounded-2xl font-bold text-xs transition-all active:scale-95 cursor-pointer shrink-0 flex items-center gap-1.5 ${
          isDark
            ? 'bg-amber-400 text-black hover:bg-amber-300 shadow-sm'
            : 'bg-zinc-900 text-white hover:bg-zinc-800 shadow-sm'
        }`}
      >
        <i className={`ph-fill ${isDark ? 'ph-sun' : 'ph-moon'}`}></i>
        <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>
      </button>
    </div>
  );
}
