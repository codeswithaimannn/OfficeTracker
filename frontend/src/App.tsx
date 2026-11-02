import { useQuery } from '@tanstack/react-query';

interface Health {
  status: string;
  database: string;
}

async function fetchHealth(): Promise<Health> {
  const res = await fetch('/api/health');
  if (!res.ok) {
    throw new Error(`Backend answered ${res.status}`);
  }
  return res.json() as Promise<Health>;
}

// Temporary first screen: proves the frontend runs and can reach the
// backend through the Vite proxy. Replaced by the router in the next step.
export default function App() {
  const health = useQuery({ queryKey: ['health'], queryFn: fetchHealth });

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-surface p-8">
        <h1 className="font-display text-2xl font-bold">Orbitask</h1>
        <p className="mt-2 text-muted">The frontend is running.</p>
        <p className="mt-6 text-sm">
          Backend:{' '}
          {health.isPending && <span className="text-muted">checking…</span>}
          {health.isError && (
            <span className="text-danger">
              not reachable. Is <code>npm run start:dev</code> running?
            </span>
          )}
          {health.isSuccess && (
            <span className="font-semibold">
              {health.data.status}, database {health.data.database}
            </span>
          )}
        </p>
      </div>
    </main>
  );
}
