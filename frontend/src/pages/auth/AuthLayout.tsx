import type { ReactNode } from 'react';
import { Logo } from '../../components/Logo';

interface AuthLayoutProps {
  title: string;
  subtitle: string;
  children: ReactNode;
}

// Split screen for login and sign-up: brand panel on the left, form on the
// right. On a phone the panels stack.
export function AuthLayout({ title, subtitle, children }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen flex-wrap gap-3 p-3">
      <section className="glass flex flex-[1_1_420px] flex-col justify-between gap-10 rounded-3xl px-8 py-10 sm:px-12 sm:py-14">
        <Logo />
        <div className="flex max-w-md flex-col gap-4">
          <h1 className="font-display text-3xl leading-tight font-bold sm:text-4xl">
            Track any kind of office work, your way.
          </h1>
          <p className="text-base leading-relaxed text-muted">
            Build trackers with your own fields and statuses: client
            follow-ups, meeting actions, daily work, audits. No code needed.
          </p>
        </div>
        <p className="text-sm text-muted">Portfolio project · demo data only</p>
      </section>

      <section className="flex flex-[1_1_420px] items-center justify-center py-6">
        <div className="glass-strong flex w-full max-w-md flex-col gap-5 rounded-3xl p-6 sm:p-8">
          <div>
            <h2 className="font-display text-2xl font-bold">{title}</h2>
            <p className="mt-1.5 text-muted">{subtitle}</p>
          </div>
          {children}
        </div>
      </section>
    </div>
  );
}

export function SubmitButton({ busy, label }: { busy: boolean; label: string }) {
  return (
    <button
      type="submit"
      disabled={busy}
      className="min-h-11 rounded-lg bg-accent font-semibold text-accent-ink disabled:opacity-60"
    >
      {busy ? 'Please wait…' : label}
    </button>
  );
}
