import { useLanguage } from './LanguageContext';
import { Button } from '@/components/ui/button';
import { Globe } from 'lucide-react';

export default function LanguageSwitcher({ variant = "default" }) {
  const { language, toggleLanguage } = useLanguage();

  return (
    <Button
      variant={variant}
      size="sm"
      onClick={toggleLanguage}
      className="gap-2"
    >
      <Globe className="w-4 h-4" />
      {language === 'pt' ? 'PT' : 'EN'}
    </Button>
  );
}