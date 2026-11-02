import { Navigate, Outlet, useLocation } from 'react-router';
import { FullPageStatus } from '../components/FullPageStatus';
import { useMe } from './auth';

// Wraps pages that need a login. Logged-out visitors go to /login, which
// sends them back to the page they wanted after logging in.
export function RequireAuth() {
  const me = useMe();
  const location = useLocation();

  if (me.isPending) {
    return <FullPageStatus title="Loading…" />;
  }
  if (me.isError) {
    return (
      <FullPageStatus
        title="Could not load Orbitask"
        message={me.error.message}
        onRetry={() => void me.refetch()}
      />
    );
  }
  if (!me.data) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return <Outlet />;
}

// Wraps the login and sign-up pages: already logged in means go home.
export function GuestOnly() {
  const me = useMe();

  if (me.isPending) {
    return <FullPageStatus title="Loading…" />;
  }
  if (me.data) {
    return <Navigate to="/" replace />;
  }
  // On an error we still show the form; submitting it shows the real error.
  return <Outlet />;
}
