import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Role, User } from '../../auth/auth';
import type { Employee } from '../../employees/employees';
import { mockApi, renderApp } from '../../test/render';

const ORG = { id: 'o1', name: 'Demo Office' };

function userWithRole(role: Role): User {
  return { id: 'me', name: 'Priya Sharma', email: 'priya@demo.test', role, organization: ORG };
}

function employee(overrides: Partial<Employee>): Employee {
  return {
    id: 'e1',
    name: 'Ravi Kumar',
    email: 'ravi@demo.test',
    role: 'EMPLOYEE',
    isActive: true,
    department: null,
    createdAt: '2026-11-02T10:00:00.000Z',
    ...overrides,
  };
}

const ME_AS_EMPLOYEE_ROW = (role: Role) =>
  employee({ id: 'me', name: 'Priya Sharma', email: 'priya@demo.test', role });

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('Employees page', () => {
  it('lets a Super Admin add an employee, who then appears in the list', async () => {
    let rows: Employee[] = [ME_AS_EMPLOYEE_ROW('SUPER_ADMIN')];
    const fetchMock = mockApi({
      'GET /api/auth/me': () => ({ status: 200, body: userWithRole('SUPER_ADMIN') }),
      'GET /api/departments': () => ({ status: 200, body: [] }),
      'GET /api/employees': () => ({ status: 200, body: rows }),
      'POST /api/employees': (body) => {
        const input = body as { name: string; email: string };
        const created = employee({ id: 'e2', name: input.name, email: input.email });
        rows = [...rows, created];
        return { status: 201, body: created };
      },
    });
    const user = userEvent.setup();
    renderApp('/employees');

    await user.click(await screen.findByRole('button', { name: 'Add employee' }));
    const dialog = screen.getByRole('dialog');
    await user.type(within(dialog).getByLabelText('Full name'), 'Ravi Kumar');
    await user.type(within(dialog).getByLabelText('Work email'), 'ravi@demo.test');
    await user.type(within(dialog).getByLabelText(/Starting password/), 'starting-pass-1');
    await user.click(within(dialog).getByRole('button', { name: 'Add employee' }));

    expect(await screen.findByText('Ravi Kumar')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/employees',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          name: 'Ravi Kumar',
          email: 'ravi@demo.test',
          password: 'starting-pass-1',
          role: 'EMPLOYEE',
          departmentId: null,
        }),
      }),
    );
  });

  it('offers a Manager only the Team Leader and Employee roles', async () => {
    mockApi({
      'GET /api/auth/me': () => ({ status: 200, body: userWithRole('MANAGER') }),
      'GET /api/departments': () => ({ status: 200, body: [] }),
      'GET /api/employees': () => ({ status: 200, body: [ME_AS_EMPLOYEE_ROW('MANAGER')] }),
    });
    const user = userEvent.setup();
    renderApp('/employees');

    await user.click(await screen.findByRole('button', { name: 'Add employee' }));
    const roleSelect = within(screen.getByRole('dialog')).getByLabelText('Role');
    const options = within(roleSelect).getAllByRole('option').map((o) => o.textContent);

    expect(options).toEqual(['Team Leader', 'Employee']);
  });

  it('hides add, edit and deactivate from an Employee', async () => {
    mockApi({
      'GET /api/auth/me': () => ({ status: 200, body: userWithRole('EMPLOYEE') }),
      'GET /api/departments': () => ({ status: 200, body: [] }),
      'GET /api/employees': () => ({
        status: 200,
        body: [ME_AS_EMPLOYEE_ROW('EMPLOYEE'), employee({})],
      }),
    });
    renderApp('/employees');

    expect(await screen.findByText('Ravi Kumar')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Add employee' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Edit / })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Deactivate / })).not.toBeInTheDocument();
  });

  it('deactivates after confirming', async () => {
    let ravi = employee({});
    mockApi({
      'GET /api/auth/me': () => ({ status: 200, body: userWithRole('SUPER_ADMIN') }),
      'GET /api/departments': () => ({ status: 200, body: [] }),
      'GET /api/employees': () => ({
        status: 200,
        body: [ME_AS_EMPLOYEE_ROW('SUPER_ADMIN'), ravi],
      }),
      'POST /api/employees/e1/deactivate': () => {
        ravi = { ...ravi, isActive: false };
        return { status: 200, body: ravi };
      },
    });
    const user = userEvent.setup();
    renderApp('/employees');

    await user.click(await screen.findByRole('button', { name: 'Deactivate Ravi Kumar' }));
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Deactivate' }));

    expect(
      await screen.findByRole('button', { name: 'Reactivate Ravi Kumar' }),
    ).toBeInTheDocument();
    const raviRow = screen.getByRole('row', { name: /Ravi Kumar/ });
    expect(within(raviRow).getByText('Deactivated')).toBeInTheDocument();
  });

  it('never offers to deactivate yourself', async () => {
    mockApi({
      'GET /api/auth/me': () => ({ status: 200, body: userWithRole('SUPER_ADMIN') }),
      'GET /api/departments': () => ({ status: 200, body: [] }),
      'GET /api/employees': () => ({ status: 200, body: [ME_AS_EMPLOYEE_ROW('SUPER_ADMIN')] }),
    });
    renderApp('/employees');

    expect(await screen.findByRole('button', { name: 'Edit Priya Sharma' })).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Deactivate Priya Sharma' }),
    ).not.toBeInTheDocument();
  });

  it('shows a helpful empty state when filters match no one', async () => {
    mockApi({
      'GET /api/auth/me': () => ({ status: 200, body: userWithRole('SUPER_ADMIN') }),
      'GET /api/departments': () => ({ status: 200, body: [] }),
      'GET /api/employees': () => ({ status: 200, body: [ME_AS_EMPLOYEE_ROW('SUPER_ADMIN')] }),
      'GET /api/employees?search=zzz': () => ({ status: 200, body: [] }),
    });
    const user = userEvent.setup();
    renderApp('/employees');

    await user.type(await screen.findByLabelText('Search by name or email'), 'zzz');

    expect(await screen.findByText('No one matches these filters')).toBeInTheDocument();
  });

  it('offers a retry when the list cannot load', async () => {
    mockApi({
      'GET /api/auth/me': () => ({ status: 200, body: userWithRole('SUPER_ADMIN') }),
      'GET /api/departments': () => ({ status: 200, body: [] }),
      'GET /api/employees': () => ({
        status: 503,
        body: { statusCode: 503, message: 'Database is not reachable' },
      }),
    });
    renderApp('/employees');

    expect(await screen.findByText('Could not load employees')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });
});
