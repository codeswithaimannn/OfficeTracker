import type { ReactNode } from 'react';
import { Button } from './Button';

interface StatusBlockProps {
  title: string;
  message?: string;
  action?: ReactNode;
  onRetry?: () => void;
}

// The box shown inside a page while loading, when a list is empty, or when
// loading failed.
export function StatusBlock({ title, message, action, onRetry }: StatusBlockProps) {
  return (
    <div
      className="glass flex flex-col items-center gap-2 rounded-2xl px-6 py-12 text-center"
      aria-live="polite"
    >
      <p className="font-display text-lg font-bold">{title}</p>
      {message && <p className="max-w-md text-muted">{message}</p>}
      {onRetry && (
        <Button variant="secondary" onClick={onRetry} className="mt-2">
          Try again
        </Button>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
