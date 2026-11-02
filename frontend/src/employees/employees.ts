import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Role } from '../auth/auth';
import { DEPARTMENTS_KEY } from '../departments/departments';
import { api } from '../lib/api';

export interface Employee {
  id: string;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
  department: { id: string; name: string } | null;
  createdAt: string;
}

export type EmployeeStatus = 'all' | 'active' | 'inactive';

export interface EmployeeFilters {
  search: string;
  departmentId: string; // '' = any department
  status: EmployeeStatus;
}

export interface NewEmployeeInput {
  name: string;
  email: string;
  password: string; // the starting password, shared with the employee
  role: Role;
  departmentId: string | null;
}

export interface EmployeeChanges {
  name?: string;
  role?: Role;
  departmentId?: string | null;
}

const EMPLOYEES_KEY = ['employees'];

// Turns the filters into a query string, leaving out empty ones:
// { search: 'priya', status: 'active' } -> "?search=priya&status=active"
function toQueryString(filters: EmployeeFilters): string {
  const params = new URLSearchParams();
  if (filters.search.trim()) params.set('search', filters.search.trim());
  if (filters.departmentId) params.set('departmentId', filters.departmentId);
  if (filters.status !== 'all') params.set('status', filters.status);
  const query = params.toString();
  return query ? `?${query}` : '';
}

// Each combination of filters is cached separately.
export function useEmployees(filters: EmployeeFilters) {
  return useQuery({
    queryKey: [...EMPLOYEES_KEY, filters],
    queryFn: () => api<Employee[]>(`/employees${toQueryString(filters)}`),
    placeholderData: (previous) => previous, // keep the old rows while filtering
  });
}

// After any change: reload employee lists, and departments too (their
// employee counts change when someone moves).
function useInvalidateEmployees() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: EMPLOYEES_KEY });
    void queryClient.invalidateQueries({ queryKey: DEPARTMENTS_KEY });
  };
}

export function useAddEmployee() {
  const invalidate = useInvalidateEmployees();
  return useMutation({
    mutationFn: (input: NewEmployeeInput) =>
      api<Employee>('/employees', { method: 'POST', body: input }),
    onSuccess: invalidate,
  });
}

export function useUpdateEmployee() {
  const invalidate = useInvalidateEmployees();
  return useMutation({
    mutationFn: ({ id, changes }: { id: string; changes: EmployeeChanges }) =>
      api<Employee>(`/employees/${id}`, { method: 'PATCH', body: changes }),
    onSuccess: invalidate,
  });
}

export function useSetEmployeeActive() {
  const invalidate = useInvalidateEmployees();
  return useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      api<Employee>(`/employees/${id}/${active ? 'reactivate' : 'deactivate'}`, {
        method: 'POST',
      }),
    onSuccess: invalidate,
  });
}
