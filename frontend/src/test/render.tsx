import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import App from '../App';

interface FakeResponse {
  status: number;
  body?: unknown;
}

type Handler = (body: unknown) => FakeResponse;

// Replaces fetch with a fake backend. Keys look like "POST /api/auth/login".
// Any request without a handler gets a 404 in the backend's error format.
export function mockApi(routes: Record<string, Handler>) {
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const key = `${init?.method ?? 'GET'} ${String(input)}`;
    const requestBody: unknown = init?.body ? JSON.parse(String(init.body)) : undefined;
    const handler = routes[key];
    const { status, body } = handler
      ? handler(requestBody)
      : { status: 404, body: { statusCode: 404, message: 'Not found' } };
    return new Response(body === undefined ? null : JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

// Renders the whole app at a given URL, with a fresh cache each time.
export function renderApp(route = '/') {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[route]}>
        <App />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}
