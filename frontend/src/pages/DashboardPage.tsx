import { ListChecks } from 'lucide-react';
import { useMe } from '../auth/auth';

// Placeholder dashboard. Counts and "My work" arrive in M8, once trackers
// exist (M5). For now it shows the empty state a new organisation sees.
export function DashboardPage() {
  const me = useMe();
  const firstName = me.data?.name.split(' ')[0] ?? '';

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-bold sm:text-3xl">
          Welcome, {firstName}
        </h1>
        <p className="mt-1.5 text-muted">
          Here is where your organisation&apos;s work will come together.
        </p>
      </div>

      <section className="glass flex flex-col items-center gap-3 rounded-2xl px-6 py-12 text-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-accent/15 text-accent">
          <ListChecks size={24} aria-hidden="true" />
        </span>
        <h2 className="font-display text-lg font-bold">No trackers yet</h2>
        <p className="max-w-md text-muted">
          Trackers hold your team&apos;s work: client follow-ups, meeting
          actions, daily tasks. Creating them arrives in a later milestone.
        </p>
      </section>
    </div>
  );
}
