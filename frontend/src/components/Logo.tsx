interface LogoProps {
  showName?: boolean;
  className?: string;
}

export function Logo({ showName = true, className = '' }: LogoProps) {
  return (
    <span className={`flex items-center gap-2.5 ${className}`}>
      <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden="true">
        <circle
          cx="14"
          cy="14"
          r="11"
          fill="none"
          stroke="var(--c-accent)"
          strokeWidth="2.5"
        />
        <circle cx="22" cy="8" r="3.5" fill="currentColor" />
      </svg>
      {showName && (
        <span className="font-display text-xl font-bold">Orbitask</span>
      )}
    </span>
  );
}
