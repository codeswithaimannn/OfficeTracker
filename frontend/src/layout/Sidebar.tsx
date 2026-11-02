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
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      <nav
        aria-label="Main"
        className={[
          'fixed inset-y-0 left-0 z-40 flex w-64 flex-col gap-1 bg-sidebar p-3 text-sidebar-ink transition-transform',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
          // From the md breakpoint up the sidebar is always visible and
          // takes part in the page layout.
          'md:sticky md:top-0 md:h-screen md:translate-x-0',
          collapsed ? 'md:w-[72px]' : 'md:w-60',
        ].join(' ')}
      >
        <div className="flex items-center justify-between px-2 pt-1 pb-4">
          <Logo showName={!collapsed} className="text-white" />
          <button
            type="button"
            onClick={onCloseMobile}
            aria-label="Close menu"
            className="flex size-11 items-center justify-center rounded-lg hover:bg-sidebar-active md:hidden"
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
                `${ITEM_CLASS} ${isActive ? 'bg-sidebar-active text-white' : 'hover:bg-sidebar-active/60'}`
              }
            >
              <item.icon size={18} aria-hidden="true" className="shrink-0" />
              <span className={collapsed ? 'md:sr-only' : ''}>{item.label}</span>
            </NavLink>
          ) : (
            <div
              key={item.label}
              title={`${item.label}: coming in ${item.soon}`}
              className={`${ITEM_CLASS} cursor-default text-[#8e96a6]`}
            >
              <item.icon size={18} aria-hidden="true" className="shrink-0" />
              <span className={collapsed ? 'md:sr-only' : ''}>{item.label}</span>
              {!collapsed && (
                <span className="ml-auto rounded bg-sidebar-active px-1.5 py-0.5 text-[11px]">
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
          className={`${ITEM_CLASS} mt-auto hidden hover:bg-sidebar-active/60 md:flex`}
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
