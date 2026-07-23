// Small inline SVG flag icons used by the LanguageSwitcher.
// Kept as simplified, recognizable representations (not photographic) so they
// render crisply at small sizes (~20x14px) in both light and dark UI.

const baseClass = 'inline-block rounded-[2px] ring-1 ring-black/10 dark:ring-white/20 shrink-0';

export function FlagPT({ className = '' }) {
  return (
    <svg
      viewBox="0 0 30 20"
      width="20"
      height="14"
      className={`${baseClass} ${className}`}
      role="img"
      aria-label="Portugal"
    >
      <rect x="0" y="0" width="30" height="20" fill="#DA291C" />
      <rect x="0" y="0" width="12" height="20" fill="#046A38" />
      <circle cx="12" cy="10" r="4.2" fill="#FFE900" stroke="#DA291C" strokeWidth="0.6" />
      <circle cx="12" cy="10" r="2.1" fill="#046A38" />
    </svg>
  );
}

export function FlagUS({ className = '' }) {
  const stripeHeight = 20 / 13;
  const stripes = Array.from({ length: 13 }, (_, i) => (
    <rect
      key={i}
      x="0"
      y={i * stripeHeight}
      width="30"
      height={stripeHeight}
      fill={i % 2 === 0 ? '#B22234' : '#FFFFFF'}
    />
  ));

  const stars = [
    [1.6, 1.2], [3.6, 1.2], [5.6, 1.2],
    [1.6, 3.2], [3.6, 3.2], [5.6, 3.2],
    [1.6, 5.2], [3.6, 5.2], [5.6, 5.2],
    [2.6, 7.2], [4.6, 7.2],
  ];

  return (
    <svg
      viewBox="0 0 30 20"
      width="20"
      height="14"
      className={`${baseClass} ${className}`}
      role="img"
      aria-label="United States"
    >
      {stripes}
      <rect x="0" y="0" width="12" height="10.8" fill="#3C3B6E" />
      {stars.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="0.55" fill="#FFFFFF" />
      ))}
    </svg>
  );
}

export const FLAGS = {
  pt: FlagPT,
  en: FlagUS,
};
