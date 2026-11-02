import { useId, useState, type FormEvent } from 'react';
import { Button } from '../../components/Button';
import { Dialog } from '../../components/Dialog';
import { FormError } from '../../components/FormError';
import { TextField } from '../../components/TextField';
import { useSaveDepartment, type Department } from '../../departments/departments';
import { errorMessages } from '../../lib/errors';

// Same limits as the backend (backend/src/departments/department.dto.ts).
const NAME_MAX = 60;
const DESCRIPTION_MAX = 300;

interface DepartmentFormDialogProps {
  department?: Department; // given = edit, missing = create
  onClose: () => void;
}

// Only mounted while open, so each opening starts with fresh form state.
export function DepartmentFormDialog({ department, onClose }: DepartmentFormDialogProps) {
  const [name, setName] = useState(department?.name ?? '');
  const [description, setDescription] = useState(department?.description ?? '');
  const save = useSaveDepartment();
  const descriptionId = useId();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    save.mutate(
      { id: department?.id, input: { name, description } },
      { onSuccess: onClose },
    );
  }

  return (
    <Dialog open title={department ? 'Edit department' : 'New department'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <FormError messages={errorMessages(save.error)} />
        <TextField
          label="Name"
          required
          maxLength={NAME_MAX}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <div className="flex flex-col gap-1.5">
          <label htmlFor={descriptionId} className="text-sm font-medium">
            Description <span className="font-normal text-muted">(optional)</span>
          </label>
          <textarea
            id={descriptionId}
            rows={3}
            maxLength={DESCRIPTION_MAX}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="rounded-lg border border-line bg-field px-3 py-2 text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/30"
          />
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={save.isPending}>
            {save.isPending ? 'Saving…' : department ? 'Save changes' : 'Create department'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
