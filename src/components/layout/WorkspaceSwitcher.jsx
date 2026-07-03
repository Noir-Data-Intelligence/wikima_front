import { ChevronsUpDown, Check, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

/**
 * Workspace picker. Wired with data in a later phase; accepts props so it can be
 * driven by WorkspaceContext when integrated.
 */
export default function WorkspaceSwitcher({ workspaces = [], current, onSelect }) {
  const active = current || workspaces[0] || { name: 'WiKima' };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="h-9 max-w-[200px] justify-between gap-2">
          <span className="flex items-center gap-2 truncate">
            <Building2 className="h-4 w-4 shrink-0 text-primary" />
            <span className="truncate">{active.name}</span>
          </span>
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuLabel>Workspaces</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {workspaces.length === 0 && (
          <DropdownMenuItem disabled>{active.name}</DropdownMenuItem>
        )}
        {workspaces.map((ws) => (
          <DropdownMenuItem key={ws.id} onClick={() => onSelect?.(ws)}>
            <Check className={cn('mr-2 h-4 w-4', active.id === ws.id ? 'opacity-100' : 'opacity-0')} />
            <span className="truncate">{ws.name}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
