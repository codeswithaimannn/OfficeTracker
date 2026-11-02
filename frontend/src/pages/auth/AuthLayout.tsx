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
    <div className="flex min-h-screen flex-wrap">
      <section className="flex flex-[1_1_420px] flex-col justify-between gap-10 bg-sidebar px-8 py-10 text-sidebar-ink sm:px-12 sm:py-14">
        <Logo className="text-white" />
        <div className="flex max-w-md flex-col gap-4">
          <h1 className="font-display text-3xl leading-tight font-bold text-white sm:text-4xl">
            Track any kind of office work, your way.
          </h1>
          <p className="text-base leading-relaxed">
            Build trackers with your own fields and statuses: client
            follow-ups, meeting actions, daily work, audits. No code needed.
          </p>
        </div>
        <p className="text-sm text-[#8e96a6]">Portfolio project · demo data only</p>
      </section>

      <section className="flex flex-[1_1_420px] items-center justify-center px-5 py-12">
        <div className="flex w-full max-w-sm flex-col gap-5">
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
