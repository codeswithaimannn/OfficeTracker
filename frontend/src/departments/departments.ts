import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

export interface Department {
  id: string;
  name: string;
  description: string | null;
  employeeCount: number;
}

export interface DepartmentInput {
  name: string;
  description?: string;
}

export const DEPARTMENTS_KEY = ['departments'];

export function useDepartments() {
  return useQuery({
    queryKey: DEPARTMENTS_KEY,
    queryFn: () => api<Department[]>('/departments'),
  });
}

// After any change, mark the cached list as stale so it reloads. Employee
// lists show department names, so they reload too.
function useInvalidateDepartments() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: DEPARTMENTS_KEY });
    void queryClient.invalidateQueries({ queryKey: ['employees'] });
  };
}

export function useSaveDepartment() {
  const invalidate = useInvalidateDepartments();
  return useMutation({
    // No id = create, id = update.
    mutationFn: ({ id, input }: { id?: string; input: DepartmentInput }) =>
      id
        ? api<Department>(`/departments/${id}`, { method: 'PATCH', body: input })
        : api<Department>('/departments', { method: 'POST', body: input }),
    onSuccess: invalidate,
  });
}

export function useDeleteDepartment() {
  const invalidate = useInvalidateDepartments();
  return useMutation({
    mutationFn: (id: string) =>
      api<void>(`/departments/${id}`, { method: 'DELETE' }),
    onSuccess: invalidate,
  });
}
