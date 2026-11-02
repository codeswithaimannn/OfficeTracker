import {
  Building2,
  LayoutDashboard,
  ListChecks,
  PanelLeftClose,
  PanelLeftOpen,
  Users,
  X,
  type LucideIcon,
} from 'lucide-react';
import { NavLink } from 'react-router';
import { Logo } from '../components/Logo';

interface NavItem {
  label: string;
  icon: LucideIcon;
  to?: string; // no link yet = a page coming in a later milestone
  soon?: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', icon: LayoutDashboard, to: '/' },
  { label: 'Trackers', icon: ListChecks, soon: 'M5' },
  { label: 'Departments', icon: Building2, to: '/departments' },
  { label: 'Employees', icon: Users, soon: 'M4' },
];

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapsed: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

const ITEM_CLASS =
  'flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium';

export function Sidebar({
  collapsed,
  onToggleCollapsed,
  mobileOpen,
  onCloseMobile,
}: SidebarProps) {
  return (
    <>
      {/* Dark backdrop behind the menu on phones; click it to close. */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/30 backdrop-blur-sm md:hidden"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      <nav
        aria-label="Main"
        className={[
          // On phones: a frosted drawer that slides in from the left.
          'glass-strong fixed inset-y-3 left-3 z-40 flex w-64 flex-col gap-1 rounded-2xl p-3 text-ink transition-transform',
          mobileOpen ? 'translate-x-0' : '-translate-x-[calc(100%+1rem)]',
          // From the md breakpoint up: a floating glass panel that is always
          // visible and takes part in the page layout.
          'md:glass md:sticky md:top-3 md:m-3 md:h-[calc(100vh-1.5rem)] md:translate-x-0',
          collapsed ? 'md:w-[72px]' : 'md:w-60',
        ].join(' ')}
      >
        <div className="flex items-center justify-between px-2 pt-1 pb-4">
          <Logo showName={!collapsed} />
          <button
            type="button"
            onClick={onCloseMobile}
            aria-label="Close menu"
            className="flex size-11 items-center justify-center rounded-lg text-muted hover:bg-hover md:hidden"
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        {NAV_ITEMS.map((item) =>
          item.to ? (
            <NavLink
              key={item.label}
              to={item.to}
              end
              onClick={onCloseMobile}
              title={collapsed ? item.label : undefined}
              className={({ isActive }) =>
                `${ITEM_CLASS} ${isActive ? 'bg-accent-soft font-semibold text-accent' : 'text-muted hover:bg-hover hover:text-ink'}`
              }
            >
              <item.icon size={18} aria-hidden="true" className="shrink-0" />
              <span className={collapsed ? 'md:sr-only' : ''}>{item.label}</span>
            </NavLink>
          ) : (
            <div
              key={item.label}
              title={`${item.label}: coming in ${item.soon}`}
              className={`${ITEM_CLASS} cursor-default text-muted`}
            >
              <item.icon size={18} aria-hidden="true" className="shrink-0" />
              <span className={collapsed ? 'md:sr-only' : ''}>{item.label}</span>
              {!collapsed && (
                <span className="ml-auto rounded bg-hover px-1.5 py-0.5 text-[11px]">
                  {item.soon}
                </span>
              )}
            </div>
          ),
        )}

        <button
          type="button"
          onClick={onToggleCollapsed}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-expanded={!collapsed}
          className={`${ITEM_CLASS} mt-auto hidden text-muted hover:bg-hover hover:text-ink md:flex`}
        >
          {collapsed ? (
            <PanelLeftOpen size={18} aria-hidden="true" className="shrink-0" />
          ) : (
            <PanelLeftClose size={18} aria-hidden="true" className="shrink-0" />
          )}
          {!collapsed && <span>Collapse</span>}
        </button>
      </nav>
    </>
  );
}
