import { useState, type FormEvent } from 'react';
import { ROLE_LABELS, type Role, type User } from '../../auth/auth';
import { assignableRoles } from '../../auth/permissions';
import { Button } from '../../components/Button';
import { Dialog } from '../../components/Dialog';
import { FormError } from '../../components/FormError';
import { SelectField } from '../../components/SelectField';
import { TextField } from '../../components/TextField';
import type { Department } from '../../departments/departments';
import {
  useAddEmployee,
  useUpdateEmployee,
  type Employee,
} from '../../employees/employees';
import { errorMessages } from '../../lib/errors';

// Same limits as the backend (backend/src/employees/employee.dto.ts).
const PASSWORD_MIN = 8;
const PASSWORD_MAX = 72;
const NO_DEPARTMENT = '';

interface EmployeeFormDialogProps {
  actor: User; // the logged-in user
  employee?: Employee; // given = edit, missing = add
  departments: Department[];
  onClose: () => void;
}

// Adds a new employee or edits one. Only mounted while open.
export function EmployeeFormDialog({
  actor,
  employee,
  departments,
  onClose,
}: EmployeeFormDialogProps) {
  const roles = assignableRoles(actor.role);
  const [name, setName] = useState(employee?.name ?? '');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>(employee?.role ?? 'EMPLOYEE');
  const [departmentId, setDepartmentId] = useState(
    employee?.department?.id ?? NO_DEPARTMENT,
  );
  const add = useAddEmployee();
  const update = useUpdateEmployee();
  const save = employee ? update : add;
  const isMe = employee?.id === actor.id;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const department = departmentId === NO_DEPARTMENT ? null : departmentId;
    if (employee) {
      update.mutate(
        {
          id: employee.id,
          // Nobody can change their own role, so do not send it for "me".
          changes: { name, departmentId: department, ...(isMe ? {} : { role }) },
        },
        { onSuccess: onClose },
      );
    } else {
      add.mutate(
        { name, email, password, role, departmentId: department },
        { onSuccess: onClose },
      );
    }
  }

  return (
    <Dialog open title={employee ? `Edit ${employee.name}` : 'Add employee'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <FormError messages={errorMessages(save.error)} />
        <TextField
          label="Full name"
          required
          autoComplete="off"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        {!employee && (
          <>
            <TextField
              label="Work email"
              type="email"
              required
              autoComplete="off"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <TextField
              label="Starting password"
              type="password"
              required
              autoComplete="new-password"
              minLength={PASSWORD_MIN}
              maxLength={PASSWORD_MAX}
              hint={`At least ${PASSWORD_MIN} characters. Share it with them so they can log in.`}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </>
        )}
        <SelectField
          label="Role"
          value={role}
          disabled={isMe}
          onChange={(e) => setRole(e.target.value as Role)}
          options={roles.map((r) => ({ value: r, label: ROLE_LABELS[r] }))}
        />
        {isMe && <p className="-mt-2 text-xs text-muted">You cannot change your own role.</p>}
        <SelectField
          label="Department"
          value={departmentId}
          onChange={(e) => setDepartmentId(e.target.value)}
          options={[
            { value: NO_DEPARTMENT, label: 'No department' },
            ...departments.map((d) => ({ value: d.id, label: d.name })),
          ]}
        />
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={save.isPending}>
            {save.isPending ? 'Saving…' : employee ? 'Save changes' : 'Add employee'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
