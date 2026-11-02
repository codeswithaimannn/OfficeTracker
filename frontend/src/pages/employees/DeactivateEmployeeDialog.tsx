import { Button } from '../../components/Button';
import { Dialog } from '../../components/Dialog';
import { FormError } from '../../components/FormError';
import { useSetEmployeeActive, type Employee } from '../../employees/employees';
import { errorMessages } from '../../lib/errors';

interface DeactivateEmployeeDialogProps {
  employee: Employee;
  onClose: () => void;
}

// Confirms before locking someone out. Only mounted while open.
export function DeactivateEmployeeDialog({ employee, onClose }: DeactivateEmployeeDialogProps) {
  const setActive = useSetEmployeeActive();

  return (
    <Dialog open title="Deactivate employee?" onClose={onClose}>
      <FormError messages={errorMessages(setActive.error)} />
      <p>
        <strong>{employee.name}</strong> will be logged out straight away and cannot log in
        until someone reactivates them. Their data is kept.
      </p>
      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant="danger"
          disabled={setActive.isPending}
          onClick={() =>
            setActive.mutate({ id: employee.id, active: false }, { onSuccess: onClose })
          }
        >
          {setActive.isPending ? 'Deactivating…' : 'Deactivate'}
        </Button>
      </div>
    </Dialog>
  );
}
