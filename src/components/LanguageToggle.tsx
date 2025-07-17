import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Moon, Sun } from 'lucide-react';

export const LanguageToggle = () => {
  const { language, setLanguage } = useLanguage();
  const { isDarkMode, toggleDarkMode } = useTheme();

  return (
    <div className="fixed top-4 right-4 z-50 flex gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={toggleDarkMode}
        className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-border"
      >
        {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setLanguage(language === 'so' ? 'en' : 'so')}
        className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-border"
      >
        {language === 'so' ? 'EN' : 'SO'}
      </Button>
    </div>
  );
};