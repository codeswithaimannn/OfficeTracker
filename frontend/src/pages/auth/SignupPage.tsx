import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import { useSignup, type SignupInput } from '../../auth/auth';
import { TextField } from '../../components/TextField';
import { FormError } from '../../components/FormError';
import { errorMessages } from '../../lib/errors';
import { AuthLayout, SubmitButton } from './AuthLayout';

// Same limits as the backend (backend/src/auth/dto/auth.dto.ts). The
// backend still checks everything; these just give faster feedback.
const PASSWORD_MIN = 8;
const PASSWORD_MAX = 72;

const EMPTY_FORM: SignupInput = {
  organizationName: '',
  name: '',
  email: '',
  password: '',
};

export function SignupPage() {
  const [form, setForm] = useState<SignupInput>(EMPTY_FORM);
  const signup = useSignup();
  const navigate = useNavigate();

  function update(field: keyof SignupInput, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    signup.mutate(form, { onSuccess: () => navigate('/', { replace: true }) });
  }

  return (
    <AuthLayout
      title="Create your organisation"
      subtitle="You will be its Super Admin and can invite your team later."
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <FormError messages={errorMessages(signup.error)} />
        <TextField
          label="Organisation name"
          autoComplete="organization"
          required
          value={form.organizationName}
          onChange={(e) => update('organizationName', e.target.value)}
        />
        <TextField
          label="Your name"
          autoComplete="name"
          required
          value={form.name}
          onChange={(e) => update('name', e.target.value)}
        />
        <TextField
          label="Work email"
          type="email"
          autoComplete="email"
          required
          value={form.email}
          onChange={(e) => update('email', e.target.value)}
        />
        <TextField
          label="Password"
          type="password"
          autoComplete="new-password"
          required
          minLength={PASSWORD_MIN}
          maxLength={PASSWORD_MAX}
          hint={`At least ${PASSWORD_MIN} characters.`}
          value={form.password}
          onChange={(e) => update('password', e.target.value)}
        />
        <SubmitButton busy={signup.isPending} label="Create organisation" />
      </form>
      <p className="text-center text-muted">
        Already have an account?{' '}
        <Link to="/login" className="font-medium text-accent hover:underline">
          Log in
        </Link>
      </p>
    </AuthLayout>
  );
}
