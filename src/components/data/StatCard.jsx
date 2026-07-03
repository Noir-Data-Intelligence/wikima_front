import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';

/**
 * KPI card: label, value, optional icon and trend (percent + direction).
 */
export default function StatCard({ label, value, icon: Icon, trend, hint, className }) {
  const up = trend != null && trend >= 0;
  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          {Icon && (
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Icon className="h-4 w-4" />
            </span>
          )}
        </div>
        <div className="mt-3 flex items-end justify-between">
          <span className="font-display text-3xl font-bold tracking-tight text-foreground">{value}</span>
          {trend != null && (
            <span className={cn('flex items-center gap-0.5 text-sm font-medium', up ? 'text-success' : 'text-destructive')}>
              {up ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
              {Math.abs(trend)}%
            </span>
          )}
        </div>
        {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
      </CardContent>
    </Card>
  );
}
