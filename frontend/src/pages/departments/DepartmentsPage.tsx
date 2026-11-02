import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useMe } from '../../auth/auth';
import { canEditDepartments } from '../../auth/permissions';
import { Button } from '../../components/Button';
import { StatusBlock } from '../../components/StatusBlock';
import { useDepartments, type Department } from '../../departments/departments';
import { DeleteDepartmentDialog } from './DeleteDepartmentDialog';
import { DepartmentFormDialog } from './DepartmentFormDialog';

// Which dialog is open: none, the form (new or editing one), or delete.
type OpenDialog =
  | { kind: 'none' }
  | { kind: 'form'; department?: Department }
  | { kind: 'delete'; department: Department };

export function DepartmentsPage() {
  const me = useMe();
  const departments = useDepartments();
  const [dialog, setDialog] = useState<OpenDialog>({ kind: 'none' });
  const canEdit = me.data ? canEditDepartments(me.data.role) : false;
  const close = () => setDialog({ kind: 'none' });

  const newButton = canEdit && (
    <Button onClick={() => setDialog({ kind: 'form' })}>
      <Plus size={18} aria-hidden="true" />
      New department
    </Button>
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold sm:text-3xl">Departments</h1>
          <p className="mt-1.5 text-muted">The teams in your organisation.</p>
        </div>
        {departments.data && departments.data.length > 0 && newButton}
      </div>

      {departments.isPending && <StatusBlock title="Loading departments…" />}

      {departments.isError && (
        <StatusBlock
          title="Could not load departments"
          message={departments.error.message}
          onRetry={() => void departments.refetch()}
        />
      )}

      {departments.data?.length === 0 && (
        <StatusBlock
          title="No departments yet"
          message={
            canEdit
              ? 'Create teams like Sales or Accounts, then add employees to them.'
              : 'A Super Admin or Manager can create departments.'
          }
          action={newButton}
        />
      )}

      {departments.data && departments.data.length > 0 && (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {departments.data.map((department) => (
            <li
              key={department.id}
              className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-5"
            >
              <div className="flex-1">
                <h2 className="font-semibold">{department.name}</h2>
                {department.description && (
                  <p className="mt-1 text-sm text-muted">{department.description}</p>
                )}
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm text-muted">
                  {department.employeeCount}{' '}
                  {department.employeeCount === 1 ? 'employee' : 'employees'}
                </span>
                {canEdit && (
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => setDialog({ kind: 'form', department })}
                      aria-label={`Edit ${department.name}`}
                      className="flex size-11 items-center justify-center rounded-lg text-muted hover:bg-canvas hover:text-ink"
                    >
                      <Pencil size={18} aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDialog({ kind: 'delete', department })}
                      aria-label={`Delete ${department.name}`}
                      className="flex size-11 items-center justify-center rounded-lg text-muted hover:bg-danger-soft hover:text-danger"
                    >
                      <Trash2 size={18} aria-hidden="true" />
                    </button>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Mounted only while open, so each opening starts fresh. */}
      {dialog.kind === 'form' && (
        <DepartmentFormDialog department={dialog.department} onClose={close} />
      )}
      {dialog.kind === 'delete' && (
        <DeleteDepartmentDialog department={dialog.department} onClose={close} />
      )}
    </div>
  );
}
