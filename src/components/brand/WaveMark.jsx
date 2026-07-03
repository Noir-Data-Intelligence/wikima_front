import { cn } from '@/lib/utils';
import waveMark from '@/assets/brand/wave-mark.svg';

/** The WiKima "W" wave icon (orange). Good on light and dark. */
export default function WaveMark({ className, alt = 'WiKima' }) {
  return <img src={waveMark} alt={alt} className={cn('h-8 w-auto', className)} draggable={false} />;
}
