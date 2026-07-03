import { Menu, PanelLeft, Search, Bell } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import ThemeToggle from './ThemeToggle';
import LanguageSwitcher from './LanguageSwitcher';
import UserMenu from './UserMenu';
import WorkspaceSwitcher from './WorkspaceSwitcher';

export default function Topbar({ onOpenMobile, onToggleCollapse, user, workspaces, currentWorkspace, onSelectWorkspace }) {
  const { t } = useTranslation();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-2 border-b border-border bg-background/80 px-3 backdrop-blur sm:px-4">
      {/* Mobile menu */}
      <Button variant="ghost" size="icon" className="lg:hidden" onClick={onOpenMobile} aria-label="Open menu">
        <Menu className="h-5 w-5" />
      </Button>
      {/* Desktop collapse */}
      <Button variant="ghost" size="icon" className="hidden lg:inline-flex" onClick={onToggleCollapse} aria-label="Collapse sidebar">
        <PanelLeft className="h-5 w-5" />
      </Button>

      <div className="hidden sm:block">
        <WorkspaceSwitcher workspaces={workspaces} current={currentWorkspace} onSelect={onSelectWorkspace} />
      </div>

      {/* Search */}
      <div className="relative ml-1 hidden max-w-sm flex-1 md:block">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder={t('common_search', 'Search') + '…'}
          className="h-9 pl-9"
        />
      </div>

      <div className="ml-auto flex items-center gap-1">
        <Button variant="ghost" size="icon" aria-label="Notifications" className="relative">
          <Bell className="h-5 w-5" />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-primary" />
        </Button>
        <LanguageSwitcher />
        <ThemeToggle />
        <UserMenu user={user} />
      </div>
    </header>
  );
}
