import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { useLogin } from '../../auth/auth';
import { TextField } from '../../components/TextField';
import { FormError } from '../../components/FormError';
import { errorMessages } from '../../lib/errors';
import { AuthLayout, SubmitButton } from './AuthLayout';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const login = useLogin();
  const navigate = useNavigate();
  const location = useLocation();
  // The page the user wanted before being sent to login (see RequireAuth).
  const from = (location.state as { from?: string } | null)?.from ?? '/';

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    login.mutate(
      { email, password },
      { onSuccess: () => navigate(from, { replace: true }) },
    );
  }

  return (
    <AuthLayout title="Log in" subtitle="Welcome back. Use your work email.">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <FormError messages={errorMessages(login.error)} />
        <TextField
          label="Email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <TextField
          label="Password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <SubmitButton busy={login.isPending} label="Log in" />
      </form>
      <p className="text-center text-muted">
        New to Orbitask?{' '}
        <Link to="/signup" className="font-medium text-accent hover:underline">
          Create an organisation
        </Link>
      </p>
    </AuthLayout>
  );
}
