import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Role, User } from '../../auth/auth';
import type { Department } from '../../departments/departments';
import { mockApi, renderApp } from '../../test/render';

function userWithRole(role: Role): User {
  return {
    id: 'me',
    name: 'Priya Sharma',
    email: 'priya@demo.test',
    role,
    organization: { id: 'o1', name: 'Demo Office' },
  };
}

const SALES: Department = { id: 'd1', name: 'Sales', description: null, employeeCount: 2 };

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('Departments page', () => {
  it('lets a Manager create the first department', async () => {
    let departments: Department[] = [];
    mockApi({
      'GET /api/auth/me': () => ({ status: 200, body: userWithRole('MANAGER') }),
      'GET /api/departments': () => ({ status: 200, body: departments }),
      'POST /api/departments': (body) => {
        const created = { ...SALES, ...(body as object), employeeCount: 0 };
        departments = [created];
        return { status: 201, body: created };
      },
    });
    const user = userEvent.setup();
    renderApp('/departments');

    expect(await screen.findByText('No departments yet')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'New department' }));
    const dialog = screen.getByRole('dialog');
    await user.type(within(dialog).getByLabelText('Name'), 'Sales');
    await user.click(within(dialog).getByRole('button', { name: 'Create department' }));

    expect(await screen.findByRole('heading', { name: 'Sales' })).toBeInTheDocument();
    expect(screen.getByText('0 employees')).toBeInTheDocument();
  });

  it('shows the server’s reason when a department cannot be deleted', async () => {
    mockApi({
      'GET /api/auth/me': () => ({ status: 200, body: userWithRole('SUPER_ADMIN') }),
      'GET /api/departments': () => ({ status: 200, body: [SALES] }),
      'DELETE /api/departments/d1': () => ({
        status: 409,
        body: {
          statusCode: 409,
          message: 'Move its 2 employees to another department first',
        },
      }),
    });
    const user = userEvent.setup();
    renderApp('/departments');

    await user.click(await screen.findByRole('button', { name: 'Delete Sales' }));
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Delete' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Move its 2 employees to another department first',
    );
  });

  it('shows departments to an Employee without edit buttons', async () => {
    mockApi({
      'GET /api/auth/me': () => ({ status: 200, body: userWithRole('EMPLOYEE') }),
      'GET /api/departments': () => ({ status: 200, body: [SALES] }),
    });
    renderApp('/departments');

    expect(await screen.findByRole('heading', { name: 'Sales' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'New department' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Edit Sales' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Delete Sales' })).not.toBeInTheDocument();
  });

  it('tells an Employee who can create departments when there are none', async () => {
    mockApi({
      'GET /api/auth/me': () => ({ status: 200, body: userWithRole('EMPLOYEE') }),
      'GET /api/departments': () => ({ status: 200, body: [] }),
    });
    renderApp('/departments');

    expect(
      await screen.findByText('A Super Admin or Manager can create departments.'),
    ).toBeInTheDocument();
  });
});
