import { useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { applyTheme, initializeTheme, type Theme } from '../lib/theme';
import { Button } from './ui/button';

const ThemeSwitcher = () => {
  const { t } = useTranslation();
  const [theme, setTheme] = useState<Theme>(initializeTheme);
  const nextTheme = theme === 'dark' ? 'light' : 'dark';

  const toggleTheme = () => {
    applyTheme(nextTheme);
    setTheme(nextTheme);
  };

  return (
    <Button
      type="button"
      size="icon"
      variant="ghost"
      onClick={toggleTheme}
      aria-label={t(theme === 'dark' ? 'theme.switchToLight' : 'theme.switchToDark')}
      aria-pressed={theme === 'dark'}
      title={t(theme === 'dark' ? 'theme.switchToLight' : 'theme.switchToDark')}
    >
      {theme === 'dark' ? (
        <Sun className="h-4 w-4" aria-hidden="true" />
      ) : (
        <Moon className="h-4 w-4" aria-hidden="true" />
      )}
    </Button>
  );
};

export default ThemeSwitcher;
