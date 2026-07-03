import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ResponsiveContainer } from 'recharts';
import { cn } from '@/lib/utils';

/**
 * Card wrapper for Recharts charts. Children receive a responsive container.
 * Chart series should read colors from the theme tokens, e.g.
 *   stroke="hsl(var(--chart-1))"  fill="hsl(var(--chart-2))"
 */
export default function ChartCard({ title, description, actions, height = 280, children, className }) {
  return (
    <Card className={cn('flex flex-col', className)}>
      {(title || actions) && (
        <CardHeader className="flex-row items-start justify-between space-y-0">
          <div className="space-y-1">
            {title && <CardTitle className="text-base font-semibold">{title}</CardTitle>}
            {description && <CardDescription>{description}</CardDescription>}
          </div>
          {actions}
        </CardHeader>
      )}
      <CardContent className="flex-1">
        <div style={{ width: '100%', height }}>
          <ResponsiveContainer width="100%" height="100%">
            {children}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

// Convenience token accessors for chart series colors.
export const chartColors = {
  1: 'hsl(var(--chart-1))',
  2: 'hsl(var(--chart-2))',
  3: 'hsl(var(--chart-3))',
  4: 'hsl(var(--chart-4))',
  5: 'hsl(var(--chart-5))',
};
