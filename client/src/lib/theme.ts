const THEME_STORAGE_KEY = 'osito-theme';

export type Theme = 'light' | 'dark';

export const readTheme = (): Theme =>
  window.localStorage.getItem(THEME_STORAGE_KEY) === 'dark' ? 'dark' : 'light';

export const applyTheme = (theme: Theme): void => {
  document.documentElement.classList.toggle('dark', theme === 'dark');
  window.localStorage.setItem(THEME_STORAGE_KEY, theme);
};

export const initializeTheme = (): Theme => {
  const theme = readTheme();
  document.documentElement.classList.toggle('dark', theme === 'dark');
  return theme;
};
