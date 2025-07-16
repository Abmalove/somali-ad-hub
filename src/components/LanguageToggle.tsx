import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { Globe } from 'lucide-react';

export const LanguageToggle = () => {
  const { language, setLanguage } = useLanguage();

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => setLanguage(language === 'so' ? 'en' : 'so')}
      className="fixed top-4 right-4 z-50"
    >
      <Globe className="h-4 w-4 mr-2" />
      {language === 'so' ? 'English' : 'Soomaali'}
    </Button>
  );
};