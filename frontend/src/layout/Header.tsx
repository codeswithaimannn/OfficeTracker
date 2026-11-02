import { LogOut, Menu, Moon, Sun } from 'lucide-react';
import { ROLE_LABELS, useLogout, type User } from '../auth/auth';
import { useTheme } from '../theme/useTheme';

interface HeaderProps {
  user: User;
  onOpenMobileMenu: () => void;
}

const ICON_BUTTON =
  'flex size-11 items-center justify-center rounded-lg text-muted hover:bg-canvas hover:text-ink';

function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

export function Header({ user, onOpenMobileMenu }: HeaderProps) {
  const { theme, toggleTheme } = useTheme();
  const logout = useLogout();

  return (
    <header className="sticky top-0 z-20 flex items-center gap-2 border-b border-border bg-surface px-3 py-2 sm:px-6">
      <button
        type="button"
        onClick={onOpenMobileMenu}
        aria-label="Open menu"
        className={`${ICON_BUTTON} md:hidden`}
      >
        <Menu size={20} aria-hidden="true" />
      </button>

      <span className="truncate font-semibold">{user.organization.name}</span>

      <div className="ml-auto flex items-center gap-1 sm:gap-3">
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
          className={ICON_BUTTON}
        >
          {theme === 'dark' ? (
            <Sun size={20} aria-hidden="true" />
          ) : (
            <Moon size={20} aria-hidden="true" />
          )}
        </button>

        <div className="flex items-center gap-2.5">
          <span
            aria-hidden="true"
            className="flex size-9 items-center justify-center rounded-full bg-accent/15 text-sm font-semibold text-accent"
          >
            {initials(user.name)}
          </span>
          <span className="hidden flex-col leading-tight sm:flex">
            <span className="text-sm font-semibold">{user.name}</span>
            <span className="text-xs text-muted">{ROLE_LABELS[user.role]}</span>
          </span>
        </div>

        <button
          type="button"
          onClick={() => logout.mutate()}
          disabled={logout.isPending}
          aria-label="Log out"
          title="Log out"
          className={ICON_BUTTON}
        >
          <LogOut size={20} aria-hidden="true" />
        </button>
      </div>
    </header>
  );
}
