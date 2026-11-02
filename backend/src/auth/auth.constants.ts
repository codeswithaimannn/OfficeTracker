import type { CookieOptions } from 'express';

export const AUTH_COOKIE = 'orbitask_session';

// How long a login lasts.
export const SESSION_TTL_SECONDS = 60 * 60 * 24; // 1 day

// bcrypt work factor: each +1 doubles the time to hash (and to guess).
export const BCRYPT_ROUNDS = 12;

// Login and sign-up attempts allowed per IP address per minute.
export const AUTH_RATE_LIMIT = { limit: 5, ttl: 60_000 };

export function authCookieOptions(): CookieOptions {
  return {
    httpOnly: true, // JavaScript in the browser cannot read it
    sameSite: 'lax', // not sent on cross-site form posts
    secure: process.env.NODE_ENV === 'production', // HTTPS only when live
    path: '/',
  };
}
