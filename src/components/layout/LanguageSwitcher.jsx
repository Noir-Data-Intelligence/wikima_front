import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { FLAGS } from '@/components/layout/flags';

const LANGS = [
  { code: 'pt', label: 'Português' },
  { code: 'en', label: 'English' },
];

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const current = (i18n.language || 'en').startsWith('pt') ? 'pt' : 'en';
  const CurrentFlag = FLAGS[current];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Mudar idioma">
          <CurrentFlag />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {LANGS.map(({ code, label }) => {
          const Flag = FLAGS[code];
          return (
            <DropdownMenuItem
              key={code}
              onClick={() => i18n.changeLanguage(code)}
              className={`gap-2 ${current === code ? 'text-primary' : ''}`}
            >
              <Flag />
              {label}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
