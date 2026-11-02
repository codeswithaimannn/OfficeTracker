import { Pencil, Plus, Search, UserCheck, UserX } from 'lucide-react';
import { useDeferredValue, useState } from 'react';
import { ROLE_LABELS, useMe } from '../../auth/auth';
import { canAddEmployees, canManageRole } from '../../auth/permissions';
import { Button } from '../../components/Button';
import { SelectField } from '../../components/SelectField';
import { StatusBlock } from '../../components/StatusBlock';
import { useDepartments } from '../../departments/departments';
import {
  useEmployees,
  useSetEmployeeActive,
  type Employee,
  type EmployeeStatus,
} from '../../employees/employees';
import { DeactivateEmployeeDialog } from './DeactivateEmployeeDialog';
import { EmployeeFormDialog } from './EmployeeFormDialog';

type OpenDialog =
  | { kind: 'none' }
  | { kind: 'form'; employee?: Employee }
  | { kind: 'deactivate'; employee: Employee };

const STATUS_OPTIONS = [
  { value: 'all', label: 'All statuses' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Deactivated' },
];

const ICON_BUTTON =
  'flex size-11 items-center justify-center rounded-lg text-muted hover:bg-hover hover:text-ink';

export function EmployeesPage() {
  const me = useMe();
  const departments = useDepartments();
  const setActive = useSetEmployeeActive();
  const [search, setSearch] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [status, setStatus] = useState<EmployeeStatus>('all');
  const [dialog, setDialog] = useState<OpenDialog>({ kind: 'none' });

  // Typing updates the box at once; the search request follows a moment
  // later instead of on every key press.
  const deferredSearch = useDeferredValue(search);
  const employees = useEmployees({ search: deferredSearch, departmentId, status });

  const user = me.data;
  if (!user) return null; // RequireAuth guarantees a user; this satisfies TypeScript.

  const filtering = Boolean(search || departmentId || status !== 'all');
  const close = () => setDialog({ kind: 'none' });
  const addButton = canAddEmployees(user.role) && (
    <Button onClick={() => setDialog({ kind: 'form' })}>
      <Plus size={18} aria-hidden="true" />
      Add employee
    </Button>
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold sm:text-3xl">Employees</h1>
          <p className="mt-1.5 text-muted">Everyone in {user.organization.name}.</p>
        </div>
        {addButton}
      </div>

      <div className="glass flex flex-wrap items-end gap-3 rounded-2xl p-3">
        <label className="flex min-h-11 min-w-0 flex-[1_1_240px] items-center gap-2 rounded-lg border border-line bg-field px-3 focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/30">
          <Search size={18} aria-hidden="true" className="shrink-0 text-muted" />
          <span className="sr-only">Search by name or email</span>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email"
            className="min-w-0 flex-1 bg-transparent text-ink outline-none placeholder:text-muted"
          />
        </label>
        <SelectField
          label="Department"
          hideLabel
          className="flex-[1_1_180px]"
          value={departmentId}
          onChange={(e) => setDepartmentId(e.target.value)}
          options={[
            { value: '', label: 'All departments' },
            ...(departments.data ?? []).map((d) => ({ value: d.id, label: d.name })),
          ]}
        />
        <SelectField
          label="Status"
          hideLabel
          className="flex-[1_1_150px]"
          value={status}
          onChange={(e) => setStatus(e.target.value as EmployeeStatus)}
          options={STATUS_OPTIONS}
        />
      </div>

      {employees.isPending && <StatusBlock title="Loading employees…" />}

      {employees.isError && (
        <StatusBlock
          title="Could not load employees"
          message={employees.error.message}
          onRetry={() => void employees.refetch()}
        />
      )}

      {employees.data?.length === 0 && (
        <StatusBlock
          title={filtering ? 'No one matches these filters' : 'No employees yet'}
          message={filtering ? 'Try a different search or filter.' : undefined}
        />
      )}

      {employees.data && employees.data.length > 0 && (
        <div className="glass overflow-x-auto rounded-2xl">
          <table className="w-full min-w-[720px] border-collapse text-sm">
            <thead>
              <tr className="text-left text-xs tracking-wide text-muted uppercase">
                <th className="px-4 py-3 font-semibold">Name</th>
                <th className="px-4 py-3 font-semibold">Department</th>
                <th className="px-4 py-3 font-semibold">Role</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {employees.data.map((employee) => {
                const isMe = employee.id === user.id;
                const canManage = canManageRole(user.role, employee.role);
                return (
                  <tr
                    key={employee.id}
                    className={`border-t border-line ${employee.isActive ? '' : 'text-muted'}`}
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium text-ink">
                        {employee.name}
                        {isMe && <span className="ml-2 text-xs text-muted">(you)</span>}
                      </div>
                      <div className="text-muted">{employee.email}</div>
                    </td>
                    <td className="px-4 py-3">
                      {employee.department?.name ?? <span className="text-muted">None</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-accent-soft px-2.5 py-1 text-xs font-semibold whitespace-nowrap text-accent">
                        {ROLE_LABELS[employee.role]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {employee.isActive ? (
                        'Active'
                      ) : (
                        <span className="rounded-full bg-danger-soft px-2.5 py-1 text-xs font-semibold text-danger">
                          Deactivated
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {canManage && (
                        <div className="flex justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => setDialog({ kind: 'form', employee })}
                            aria-label={`Edit ${employee.name}`}
                            className={ICON_BUTTON}
                          >
                            <Pencil size={18} aria-hidden="true" />
                          </button>
                          {!isMe &&
                            (employee.isActive ? (
                              <button
                                type="button"
                                onClick={() => setDialog({ kind: 'deactivate', employee })}
                                aria-label={`Deactivate ${employee.name}`}
                                className={`${ICON_BUTTON} hover:bg-danger-soft hover:text-danger`}
                              >
                                <UserX size={18} aria-hidden="true" />
                              </button>
                            ) : (
                              <button
                                type="button"
                                disabled={setActive.isPending}
                                onClick={() =>
                                  setActive.mutate({ id: employee.id, active: true })
                                }
                                aria-label={`Reactivate ${employee.name}`}
                                className={ICON_BUTTON}
                              >
                                <UserCheck size={18} aria-hidden="true" />
                              </button>
                            ))}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Mounted only while open, so each opening starts fresh. */}
      {dialog.kind === 'form' && (
        <EmployeeFormDialog
          actor={user}
          employee={dialog.employee}
          departments={departments.data ?? []}
          onClose={close}
        />
      )}
      {dialog.kind === 'deactivate' && (
        <DeactivateEmployeeDialog employee={dialog.employee} onClose={close} />
      )}
    </div>
  );
}
