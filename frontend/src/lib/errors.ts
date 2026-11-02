import { ApiError } from './api';

// Turns any error into the list of messages to show.
export function errorMessages(error: Error | null): string[] {
  if (!error) return [];
  return error instanceof ApiError ? error.messages : [error.message];
}
