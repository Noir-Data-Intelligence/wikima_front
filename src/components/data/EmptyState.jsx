import { cn } from '@/lib/utils';
import WaveMark from '@/components/brand/WaveMark';

/**
 * Empty / no-data state with a subtle brand watermark, title, description and
 * an optional action.
 */
export default function EmptyState({ icon: Icon, title, description, action, className }) {
  return (
    <div className={cn('flex flex-col items-center justify-center rounded-xl border border-dashed border-border px-6 py-14 text-center', className)}>
      <div className="relative mb-4 flex h-16 w-16 items-center justify-center">
        <WaveMark className="absolute h-16 opacity-10" />
        {Icon && <Icon className="relative h-8 w-8 text-primary" />}
      </div>
      <h3 className="font-display text-lg font-semibold text-foreground">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
