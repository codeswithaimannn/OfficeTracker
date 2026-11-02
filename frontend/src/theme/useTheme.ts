import { useState } from 'react';
import { writeSetting } from '../lib/storage';

export type Theme = 'light' | 'dark';

// Must match the key read by the script in index.html.
export const THEME_KEY = 'orbitask-theme';

// index.html already applied the saved (or system) theme before React
// started, so the current theme is simply whether <html> has the class.
function currentTheme(): Theme {
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(currentTheme);

  function toggleTheme() {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.classList.toggle('dark', next === 'dark');
    writeSetting(THEME_KEY, next);
    setTheme(next);
  }

  return { theme, toggleTheme };
}
