// The background behind every page: a few large, heavily blurred pools of
// light and shade, so the frosted glass has something soft to blur. It is
// fixed in place, ignored by screen readers and mouse clicks, and coloured
// by the --c-shape-* tokens in index.css, so it follows the light/dark theme.

// Ellipses drawn in a 1440x900 box that is scaled to cover the screen.
const SHAPES = [
  { cx: 180, cy: 120, rx: 520, ry: 360, fill: 'var(--c-shape-1)' },
  { cx: 1320, cy: 300, rx: 460, ry: 420, fill: 'var(--c-shape-2)' },
  { cx: 700, cy: 980, rx: 640, ry: 320, fill: 'var(--c-shape-1)' },
];

const SOFTNESS = 90; // blur amount, in SVG units: higher = mistier

export function Backdrop() {
  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 h-full w-full"
      viewBox="0 0 1440 900"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <filter id="backdrop-blur" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation={SOFTNESS} />
        </filter>
      </defs>
      <g filter="url(#backdrop-blur)">
        {SHAPES.map((shape) => (
          <ellipse key={`${shape.cx}-${shape.cy}`} {...shape} />
        ))}
      </g>
    </svg>
  );
}
