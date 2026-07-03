import { cn } from '@/lib/utils';

/** Brand loading spinner — orange ring on the current surface. */
export default function BrandSpinner({ className, size = 32 }) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={cn(
        'inline-block animate-spin rounded-full border-2 border-muted border-t-primary',
        className,
      )}
      style={{ width: size, height: size }}
    />
  );
}

/** Full-screen centered loader on the app background. */
export function FullPageSpinner() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
      <BrandSpinner size={40} />
    </div>
  );
}
