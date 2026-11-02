interface FullPageStatusProps {
  title: string;
  message?: string;
  onRetry?: () => void;
}

// Shown while the app first checks who is logged in, or if that check fails.
export function FullPageStatus({ title, message, onRetry }: FullPageStatusProps) {
  return (
    <main
      className="flex min-h-screen items-center justify-center p-4"
      aria-live="polite"
    >
      <div className="text-center">
        <p className="font-display text-lg font-bold">{title}</p>
        {message && <p className="mt-1 text-muted">{message}</p>}
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="mt-4 min-h-11 rounded-lg bg-accent px-5 font-semibold text-accent-ink"
          >
            Try again
          </button>
        )}
      </div>
    </main>
  );
}
