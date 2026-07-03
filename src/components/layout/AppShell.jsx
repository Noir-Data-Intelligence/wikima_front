import { useState } from 'react';
import { cn } from '@/lib/utils';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { Sheet, SheetContent } from '@/components/ui/sheet';

/**
 * Shared authenticated app shell: fixed collapsible sidebar (desktop),
 * off-canvas sidebar (mobile), sticky topbar, and a scrollable content area.
 */
export default function AppShell({
  children,
  profile = 'company',
  isAdmin = false,
  user,
  workspaces,
  currentWorkspace,
  onSelectWorkspace,
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 hidden border-r border-sidebar-border transition-[width] duration-300 lg:block',
          collapsed ? 'w-[4.5rem]' : 'w-64',
        )}
      >
        <Sidebar profile={profile} isAdmin={isAdmin} collapsed={collapsed} />
      </aside>

      {/* Mobile sidebar */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-64 border-sidebar-border p-0">
          <Sidebar profile={profile} isAdmin={isAdmin} onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Main column */}
      <div className={cn('flex min-h-screen flex-col transition-[padding] duration-300', collapsed ? 'lg:pl-[4.5rem]' : 'lg:pl-64')}>
        <Topbar
          onOpenMobile={() => setMobileOpen(true)}
          onToggleCollapse={() => setCollapsed((v) => !v)}
          user={user}
          workspaces={workspaces}
          currentWorkspace={currentWorkspace}
          onSelectWorkspace={onSelectWorkspace}
        />
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
