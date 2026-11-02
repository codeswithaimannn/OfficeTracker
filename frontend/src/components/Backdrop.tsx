// The abstract background behind every page, themed on progress and
// tracking: a big progress ring, a rising trend line, bar columns, a small
// donut chart, check marks and faint grid lines. The frosted glass panels
// blur whatever sits behind them.
//
// It is fixed in place, ignored by screen readers and mouse clicks, and all
// colours come from the --c-chart-* tokens in index.css, so it follows the
// light/dark theme. Drawn in a 1440x900 box scaled to cover the screen;
// shapes sit near the edges so page headings stay readable.

const stop = (offset: string, color: string, opacity = 1) => (
  <stop
    offset={offset}
    style={{ stopColor: `var(${color})`, stopOpacity: opacity }}
  />
);

// A ring "filled" to a percentage: a full faint track plus a coloured arc.
function ProgressRing(props: {
  cx: number;
  cy: number;
  r: number;
  width: number;
  percent: number;
  color: string;
}) {
  const { cx, cy, r, width, percent, color } = props;
  const circumference = 2 * Math.PI * r;
  return (
    <g transform={`rotate(-90 ${cx} ${cy})`} fill="none" strokeWidth={width}>
      <circle cx={cx} cy={cy} r={r} stroke="var(--c-chart-track)" />
      <circle
        cx={cx}
        cy={cy}
        r={r}
        stroke={color}
        strokeLinecap="round"
        strokeDasharray={`${(circumference * percent) / 100} ${circumference}`}
      />
    </g>
  );
}

// A tick inside a circle.
function Check({ x, y, size }: { x: number; y: number; size: number }) {
  const s = size / 24; // the tick path is drawn on a 24-unit grid
  return (
    <g transform={`translate(${x - size / 2} ${y - size / 2}) scale(${s})`}>
      <circle cx="12" cy="12" r="11" fill="var(--c-chart-track)" />
      <path
        d="M7 12.5l3.2 3.2L17 9"
        fill="none"
        stroke="var(--c-chart-1)"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </g>
  );
}

// Heights of the bar columns, bottom left (in SVG units).
const BARS = [70, 110, 90, 150, 130, 190, 230];
const BAR_WIDTH = 34;
const BAR_GAP = 18;
const BARS_X = 70;
const BARS_BASE = 860;

// The trend line rises from bottom middle to top right.
const TREND =
  'M560 760 C 700 740 760 640 880 650 S 1040 560 1120 520 S 1290 360 1460 260';
const TREND_POINTS = [
  [880, 650],
  [1120, 520],
  [1300, 380],
];

export function Backdrop() {
  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 h-full w-full"
      viewBox="0 0 1440 900"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <linearGradient id="trend-area" x1="0" y1="0" x2="0" y2="1">
          {stop('0%', '--c-chart-1', 0.35)}
          {stop('100%', '--c-chart-1', 0)}
        </linearGradient>
        <linearGradient id="bar" x1="0" y1="0" x2="0" y2="1">
          {stop('0%', '--c-chart-2')}
          {stop('100%', '--c-chart-2', 0.2)}
        </linearGradient>
        <radialGradient id="glow" cx="50%" cy="50%" r="50%">
          {stop('0%', '--c-glow')}
          {stop('100%', '--c-glow', 0)}
        </radialGradient>
      </defs>

      {/* Soft colour glows give the glass something to tint. */}
      <circle cx="260" cy="200" r="520" fill="url(#glow)" />
      <circle cx="1240" cy="640" r="560" fill="url(#glow)" />

      {/* Faint chart grid. */}
      <g stroke="var(--c-chart-grid)" strokeWidth="1">
        {[180, 360, 540, 720].map((y) => (
          <line key={y} x1="0" y1={y} x2="1440" y2={y} />
        ))}
      </g>

      {/* Rising trend line with a filled area under it. */}
      <path d={`${TREND} L1460 900 L560 900 Z`} fill="url(#trend-area)" />
      <path d={TREND} fill="none" stroke="var(--c-chart-1)" strokeWidth="4" strokeLinecap="round" />
      {TREND_POINTS.map(([x, y]) => (
        <circle key={x} cx={x} cy={y} r="9" fill="var(--c-canvas)" stroke="var(--c-chart-1)" strokeWidth="4" />
      ))}

      {/* Bar columns, bottom left. */}
      {BARS.map((height, i) => (
        <rect
          key={i}
          x={BARS_X + i * (BAR_WIDTH + BAR_GAP)}
          y={BARS_BASE - height}
          width={BAR_WIDTH}
          height={height}
          rx="8"
          fill="url(#bar)"
        />
      ))}

      {/* Big progress ring, top left; small donut, right. */}
      <ProgressRing cx={210} cy={230} r={130} width={30} percent={72} color="var(--c-chart-1)" />
      <ProgressRing cx={1330} cy={130} r={60} width={18} percent={40} color="var(--c-chart-2)" />

      {/* A few completed tasks. */}
      <Check x={470} y={140} size={44} />
      <Check x={1360} y={800} size={52} />
      <Check x={980} y={110} size={36} />
    </svg>
  );
}
