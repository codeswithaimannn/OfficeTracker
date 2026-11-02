import { useEffect, useState } from 'react';
import { Outlet } from 'react-router';
import { useMe } from '../auth/auth';
import { readSetting, writeSetting } from '../lib/storage';
import { Header } from './Header';
import { Sidebar } from './Sidebar';

export const SIDEBAR_KEY = 'orbitask-sidebar-collapsed';

// The frame around every logged-in page: sidebar, header, page content.
export function AppLayout() {
  const me = useMe();
  const [collapsed, setCollapsed] = useState(
    () => readSetting(SIDEBAR_KEY) === 'true',
  );
  const [mobileOpen, setMobileOpen] = useState(false);

  // Escape closes the phone menu.
  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mobileOpen]);

  function toggleCollapsed() {
    setCollapsed((current) => {
      writeSetting(SIDEBAR_KEY, String(!current));
      return !current;
    });
  }

  const user = me.data;
  if (!user) return null; // RequireAuth guarantees a user; this satisfies TypeScript.

  return (
    <div className="flex min-h-screen">
      <Sidebar
        collapsed={collapsed}
        onToggleCollapsed={toggleCollapsed}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header user={user} onOpenMobileMenu={() => setMobileOpen(true)} />
        <main className="mx-auto w-full max-w-6xl flex-1 p-4 sm:p-7">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
