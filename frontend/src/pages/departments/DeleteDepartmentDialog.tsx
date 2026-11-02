import { Button } from '../../components/Button';
import { Dialog } from '../../components/Dialog';
import { FormError } from '../../components/FormError';
import { useDeleteDepartment, type Department } from '../../departments/departments';
import { errorMessages } from '../../lib/errors';

interface DeleteDepartmentDialogProps {
  department: Department;
  onClose: () => void;
}

// Only mounted while open. A department that still has employees comes back
// from the server as an error ("Move its N employees…"), shown here.
export function DeleteDepartmentDialog({ department, onClose }: DeleteDepartmentDialogProps) {
  const remove = useDeleteDepartment();

  return (
    <Dialog open title="Delete department?" onClose={onClose}>
      <FormError messages={errorMessages(remove.error)} />
      <p>
        <strong>{department.name}</strong> will be removed. This cannot be undone.
      </p>
      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant="danger"
          disabled={remove.isPending}
          onClick={() => remove.mutate(department.id, { onSuccess: onClose })}
        >
          {remove.isPending ? 'Deleting…' : 'Delete'}
        </Button>
      </div>
    </Dialog>
  );
}
