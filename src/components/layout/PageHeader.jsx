import { cn } from '@/lib/utils';

/**
 * Standard page header: title (display font), optional description, breadcrumb
 * slot and right-aligned actions. Use at the top of every app page.
 */
export default function PageHeader({ title, description, actions, breadcrumb, className }) {
  return (
    <div className={cn('flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between', className)}>
      <div className="space-y-1">
        {breadcrumb}
        <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{title}</h1>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}

/** Standard content wrapper providing page padding/width. */
export function PageContainer({ children, className }) {
  return <div className={cn('mx-auto w-full max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8', className)}>{children}</div>;
}
