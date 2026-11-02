import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, ApiError } from '../lib/api';

export type Role = 'SUPER_ADMIN' | 'MANAGER' | 'TEAM_LEADER' | 'EMPLOYEE';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  organization: { id: string; name: string };
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface SignupInput extends LoginInput {
  organizationName: string;
  name: string;
}

export const ROLE_LABELS: Record<Role, string> = {
  SUPER_ADMIN: 'Super Admin',
  MANAGER: 'Manager',
  TEAM_LEADER: 'Team Leader',
  EMPLOYEE: 'Employee',
};

const ME_KEY = ['me'];
const HTTP_UNAUTHORIZED = 401;

// The logged-in user, or null when logged out. Shared by every component
// through TanStack Query's cache, so it is fetched only once.
export function useMe() {
  return useQuery({
    queryKey: ME_KEY,
    queryFn: async (): Promise<User | null> => {
      try {
        return await api<User>('/auth/me');
      } catch (error) {
        if (error instanceof ApiError && error.status === HTTP_UNAUTHORIZED) {
          return null;
        }
        throw error;
      }
    },
  });
}

// After login or sign-up the server returns the user, so we put it straight
// into the cache instead of asking again.
export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: LoginInput) =>
      api<User>('/auth/login', { method: 'POST', body: input }),
    onSuccess: (user) => queryClient.setQueryData(ME_KEY, user),
  });
}

export function useSignup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: SignupInput) =>
      api<User>('/auth/signup', { method: 'POST', body: input }),
    onSuccess: (user) => queryClient.setQueryData(ME_KEY, user),
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api<void>('/auth/logout', { method: 'POST' }),
    onSuccess: () => {
      // Forget everything cached for this user, then mark as logged out.
      queryClient.clear();
      queryClient.setQueryData(ME_KEY, null);
    },
  });
}
