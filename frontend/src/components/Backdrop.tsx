// The abstract background behind every page: a few soft bands sweeping
// across the screen, with thin highlight lines along them. It is fixed in
// place, ignored by screen readers and mouse clicks, and coloured by the
// --c-wave-* tokens in index.css, so it follows the light/dark theme.

// Each band is the area between two wavy curves (drawn in a 1440x900 box
// that is scaled to cover the screen).
const BANDS = [
  {
    fill: 'var(--c-wave-2)',
    d: 'M-200 210 C 200 40 520 380 900 240 S 1500 40 1700 160 L 1700 340 C 1400 230 1150 470 820 430 S 200 330 -200 430 Z',
  },
  {
    fill: 'var(--c-wave-1)',
    d: 'M-200 590 C 250 420 620 700 1000 560 S 1500 410 1700 500 L 1700 640 C 1350 570 1100 800 700 750 S 100 650 -200 740 Z',
  },
  {
    fill: 'var(--c-wave-1)',
    d: 'M-200 860 C 300 760 700 960 1100 860 S 1600 760 1700 800 L 1700 1000 L -200 1000 Z',
  },
];

// Thin shiny lines that follow the top edge of the bands.
const HIGHLIGHTS = [
  'M-200 230 C 200 60 520 400 900 260 S 1500 60 1700 180',
  'M-200 610 C 250 440 620 720 1000 580 S 1500 430 1700 520',
];

const BAND_BLUR = 28; // softness of the bands, in SVG units
const LINE_BLUR = 1.2;

export function Backdrop() {
  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 h-full w-full"
      viewBox="0 0 1440 900"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <filter id="band-blur" x="-20%" y="-50%" width="140%" height="200%">
          <feGaussianBlur stdDeviation={BAND_BLUR} />
        </filter>
        <filter id="line-blur">
          <feGaussianBlur stdDeviation={LINE_BLUR} />
        </filter>
      </defs>
      <g filter="url(#band-blur)">
        {BANDS.map((band) => (
          <path key={band.d} d={band.d} fill={band.fill} />
        ))}
      </g>
      <g filter="url(#line-blur)" fill="none" stroke="var(--c-wave-line)" strokeWidth="2">
        {HIGHLIGHTS.map((d) => (
          <path key={d} d={d} />
        ))}
      </g>
    </svg>
  );
}
