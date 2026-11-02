// One place for every call to our backend.

// The backend's error format (see backend/src/common/http-exception.filter.ts).
interface ErrorBody {
  statusCode: number;
  message: string | string[];
}

export class ApiError extends Error {
  readonly status: number;
  readonly messages: string[];

  constructor(status: number, messages: string[]) {
    super(messages.join(' '));
    this.name = 'ApiError';
    this.status = status;
    this.messages = messages;
  }
}

const HTTP_NO_CONTENT = 204;
const FALLBACK_MESSAGE = 'Something went wrong. Please try again.';

async function readErrorMessages(res: Response): Promise<string[]> {
  try {
    const body = (await res.json()) as Partial<ErrorBody>;
    if (Array.isArray(body.message)) return body.message;
    if (typeof body.message === 'string') return [body.message];
  } catch {
    // Not JSON (e.g. the proxy could not reach the backend).
  }
  return [FALLBACK_MESSAGE];
}

export async function api<T>(
  path: string,
  options: { method?: string; body?: unknown } = {},
): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`/api${path}`, {
      method: options.method ?? 'GET',
      // The login cookie is httpOnly: JavaScript never sees it, the
      // browser just sends it along with same-origin requests.
      credentials: 'same-origin',
      headers:
        options.body === undefined
          ? undefined
          : { 'Content-Type': 'application/json' },
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });
  } catch {
    throw new ApiError(0, ['Cannot reach the server. Check your connection.']);
  }

  if (!res.ok) {
    throw new ApiError(res.status, await readErrorMessages(res));
  }
  if (res.status === HTTP_NO_CONTENT) {
    return undefined as T;
  }
  return (await res.json()) as T;
}
