import React from 'react';
import { Pencil, Trash2, Copy, Archive, Calendar } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

export default function ActionMenu({ onEdit, onDelete, onDuplicate, onArchive, onMoveToMonth, archiveLabel = 'Archive' }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="w-8 h-8 rounded-full hover:bg-accent/50 flex items-center justify-center transition-all duration-200 group">
          <svg className="w-4 h-4 text-muted-foreground group-hover:text-muted-foreground" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="12" cy="6" r="2" />
            <circle cx="12" cy="12" r="2" />
            <circle cx="12" cy="18" r="2" />
          </svg>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-[#0d1829] border border-border rounded-xl shadow-xl">
        {onEdit && (
          <DropdownMenuItem onClick={onEdit} className="text-muted-foreground hover:text-foreground hover:bg-accent/50 cursor-pointer">
            <Pencil className="w-4 h-4 mr-2" />
            Edit
          </DropdownMenuItem>
        )}
        {onDuplicate && (
          <DropdownMenuItem onClick={onDuplicate} className="text-muted-foreground hover:text-foreground hover:bg-accent/50 cursor-pointer">
            <Copy className="w-4 h-4 mr-2" />
            Duplicate
          </DropdownMenuItem>
        )}
        {onMoveToMonth && (
          <DropdownMenuItem onClick={onMoveToMonth} className="text-muted-foreground hover:text-foreground hover:bg-accent/50 cursor-pointer">
            <Calendar className="w-4 h-4 mr-2" />
            Move to month
          </DropdownMenuItem>
        )}
        {onArchive && (
          <>
            <DropdownMenuItem onClick={onArchive} className="text-muted-foreground hover:text-foreground hover:bg-accent/50 cursor-pointer">
              <Archive className="w-4 h-4 mr-2" />
              {archiveLabel}
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-muted" />
          </>
        )}
        {onDelete && (
          <DropdownMenuItem onClick={onDelete} className="text-red-400 hover:text-red-300 hover:bg-red-500/10 cursor-pointer">
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}