import { ROLE_LABELS, useLogout, useMe } from '../auth/auth';

// Temporary home page. The real layout (sidebar, header, theme) and the
// dashboard come in the next steps.
export function HomePage() {
  const me = useMe();
  const logout = useLogout();
  const user = me.data;
  if (!user) return null; // RequireAuth guarantees a user; this satisfies TypeScript.

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-4 p-8">
      <h1 className="font-display text-2xl font-bold">Welcome, {user.name}</h1>
      <p className="text-muted">
        {user.organization.name} · {ROLE_LABELS[user.role]} · {user.email}
      </p>
      <button
        type="button"
        onClick={() => logout.mutate()}
        disabled={logout.isPending}
        className="min-h-11 self-start rounded-lg border border-border bg-surface px-5 font-semibold"
      >
        Log out
      </button>
    </main>
  );
}
