import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { User } from './auth/auth';
import { SIDEBAR_KEY } from './layout/AppLayout';
import { mockApi, renderApp } from './test/render';
import { THEME_KEY } from './theme/useTheme';

const PRIYA: User = {
  id: 'u1',
  name: 'Priya Sharma',
  email: 'priya@demo.test',
  role: 'SUPER_ADMIN',
  organization: { id: 'o1', name: 'Demo Office' },
};

const LOGGED_OUT = {
  status: 401,
  body: { statusCode: 401, message: 'Unauthorized' },
};

afterEach(() => {
  vi.unstubAllGlobals();
  localStorage.clear();
  document.documentElement.classList.remove('dark');
});

describe('logged out', () => {
  it('sends a visitor to the login page', async () => {
    mockApi({ 'GET /api/auth/me': () => LOGGED_OUT });

    renderApp('/');

    expect(await screen.findByRole('heading', { name: 'Log in' })).toBeInTheDocument();
  });

  it('shows the server error for a wrong password', async () => {
    mockApi({
      'GET /api/auth/me': () => LOGGED_OUT,
      'POST /api/auth/login': () => ({
        status: 401,
        body: { statusCode: 401, message: 'Invalid email or password' },
      }),
    });
    const user = userEvent.setup();
    renderApp('/login');

    await user.type(await screen.findByLabelText('Email'), 'priya@demo.test');
    await user.type(screen.getByLabelText('Password'), 'wrong-password');
    await user.click(screen.getByRole('button', { name: 'Log in' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid email or password');
  });

  it('logs in and shows the dashboard', async () => {
    const fetchMock = mockApi({
      'GET /api/auth/me': () => LOGGED_OUT,
      'POST /api/auth/login': () => ({ status: 200, body: PRIYA }),
    });
    const user = userEvent.setup();
    renderApp('/login');

    await user.type(await screen.findByLabelText('Email'), 'priya@demo.test');
    await user.type(screen.getByLabelText('Password'), 'correct-horse-1');
    await user.click(screen.getByRole('button', { name: 'Log in' }));

    expect(await screen.findByRole('heading', { name: 'Welcome, Priya' })).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/auth/login',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ email: 'priya@demo.test', password: 'correct-horse-1' }),
      }),
    );
  });
});

describe('logged in', () => {
  beforeEach(() => {
    // Like the real server: after logout, "me" answers 401.
    let loggedIn = true;
    mockApi({
      'GET /api/auth/me': () => (loggedIn ? { status: 200, body: PRIYA } : LOGGED_OUT),
      'POST /api/auth/logout': () => {
        loggedIn = false;
        return { status: 204 };
      },
    });
  });

  it('shows the organisation, user and role in the header', async () => {
    renderApp('/');

    expect(await screen.findByText('Demo Office')).toBeInTheDocument();
    expect(screen.getByText('Priya Sharma')).toBeInTheDocument();
    expect(screen.getByText('Super Admin')).toBeInTheDocument();
  });

  it('keeps logged-in users away from the login page', async () => {
    renderApp('/login');

    expect(await screen.findByRole('heading', { name: 'Welcome, Priya' })).toBeInTheDocument();
  });

  it('collapses the sidebar and remembers it', async () => {
    const user = userEvent.setup();
    renderApp('/');

    await user.click(await screen.findByRole('button', { name: 'Collapse sidebar' }));

    expect(screen.getByRole('button', { name: 'Expand sidebar' })).toBeInTheDocument();
    expect(localStorage.getItem(SIDEBAR_KEY)).toBe('true');
  });

  it('switches to the dark theme and remembers it', async () => {
    const user = userEvent.setup();
    renderApp('/');

    await user.click(await screen.findByRole('button', { name: 'Switch to dark theme' }));

    expect(document.documentElement).toHaveClass('dark');
    expect(localStorage.getItem(THEME_KEY)).toBe('dark');
    expect(screen.getByRole('button', { name: 'Switch to light theme' })).toBeInTheDocument();
  });

  it('logs out and returns to the login page', async () => {
    const user = userEvent.setup();
    renderApp('/');

    await user.click(await screen.findByRole('button', { name: 'Log out' }));

    expect(await screen.findByRole('heading', { name: 'Log in' })).toBeInTheDocument();
  });
});

describe('errors', () => {
  it('offers a retry when the server cannot be reached', async () => {
    mockApi({
      'GET /api/auth/me': () => ({
        status: 503,
        body: { statusCode: 503, message: 'Database is not reachable' },
      }),
    });

    renderApp('/');

    expect(await screen.findByText('Could not load Orbitask')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });
});
