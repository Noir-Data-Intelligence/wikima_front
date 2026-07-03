import { cn } from '@/lib/utils';
import logoHorizontalDark from '@/assets/brand/logo-horizontal-dark.svg';
import logoHorizontalLight from '@/assets/brand/logo-horizontal-light.svg';
import logoVerticalDark from '@/assets/brand/logo-vertical-dark.svg';
import logoVerticalLight from '@/assets/brand/logo-vertical-light.svg';

/**
 * WiKima logo, theme-aware via CSS (no JS/flash).
 * variant: "horizontal" (default) | "vertical"
 */
export default function Logo({ variant = 'horizontal', className, alt = 'WiKima' }) {
  const light = variant === 'vertical' ? logoVerticalLight : logoHorizontalLight;
  const dark = variant === 'vertical' ? logoVerticalDark : logoHorizontalDark;
  return (
    <span className={cn('inline-flex items-center', className)}>
      <img src={light} alt={alt} className="block h-full w-auto dark:hidden" draggable={false} />
      <img src={dark} alt={alt} className="hidden h-full w-auto dark:block" draggable={false} />
    </span>
  );
}
