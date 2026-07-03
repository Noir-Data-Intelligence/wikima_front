import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronDown, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import { buildNavGroups, ADMIN_NAV } from './nav-config';
import Logo from '@/components/brand/Logo';
import WaveMark from '@/components/brand/WaveMark';
import {
  Tooltip, TooltipContent, TooltipTrigger,
} from '@/components/ui/tooltip';

function NavItem({ item, collapsed, onNavigate }) {
  const { t } = useTranslation();
  const Icon = item.icon;
  const label = t(item.tKey, item.fallback);

  const link = (
    <NavLink
      to={item.to}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          'group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
          collapsed && 'justify-center px-0',
          isActive
            ? 'bg-sidebar-accent text-primary'
            : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground',
        )
      }
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <span className="absolute left-0 h-5 w-0.5 rounded-r-full bg-primary" />
          )}
          <Icon className="h-4 w-4 shrink-0" />
          {!collapsed && <span className="flex-1 truncate">{label}</span>}
        </>
      )}
    </NavLink>
  );

  if (!collapsed) return link;
  return (
    <Tooltip delayDuration={0}>
      <TooltipTrigger asChild>{link}</TooltipTrigger>
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  );
}

function NavGroup({ group, collapsed, onNavigate }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(true);

  return (
    <div className="mb-1">
      {!collapsed && (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex w-full items-center justify-between px-3 py-2 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/40 hover:text-sidebar-foreground/70"
        >
          <span>{t(group.tKey, group.fallback)}</span>
          <ChevronDown className={cn('h-3 w-3 transition-transform', !open && '-rotate-90')} />
        </button>
      )}
      {(open || collapsed) && (
        <div className="space-y-0.5">
          {group.items.map((item) => (
            <NavItem key={item.to + item.tKey} item={item} collapsed={collapsed} onNavigate={onNavigate} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function Sidebar({ profile = 'company', isAdmin = false, collapsed = false, onNavigate }) {
  const { t } = useTranslation();
  const groups = buildNavGroups(profile);

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      {/* Logo */}
      <div className={cn('flex h-16 shrink-0 items-center border-b border-sidebar-border px-4', collapsed && 'justify-center px-0')}>
        {collapsed ? <WaveMark className="h-7" /> : <Logo className="h-8" />}
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {isAdmin && (
          <div className="mb-2">
            {!collapsed && (
              <div className="flex items-center gap-2 px-3 py-2 text-[10px] font-semibold uppercase tracking-widest text-primary/80">
                <Shield className="h-3 w-3" />
                <span>{t(ADMIN_NAV.tKey, ADMIN_NAV.fallback)}</span>
              </div>
            )}
            <div className="space-y-0.5">
              {ADMIN_NAV.items.map((item) => (
                <NavItem key={item.to} item={item} collapsed={collapsed} onNavigate={onNavigate} />
              ))}
            </div>
            <div className="mx-3 my-2 border-t border-sidebar-border" />
          </div>
        )}

        {groups.map((group) => (
          <NavGroup key={group.id} group={group} collapsed={collapsed} onNavigate={onNavigate} />
        ))}
      </nav>
    </div>
  );
}
