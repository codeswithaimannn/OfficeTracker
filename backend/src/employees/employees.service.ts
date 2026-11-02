import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import bcrypt from 'bcryptjs';
import { BCRYPT_ROUNDS } from '../auth/auth.constants.js';
import type { AuthUser } from '../auth/auth.types.js';
import { isPrismaError, PrismaErrorCode } from '../common/prisma-errors.js';
import { Prisma, Role } from '../generated/prisma/client.js';
import {
  TENANT_PRISMA,
  tenantData,
  type TenantPrisma,
} from '../prisma/tenant-prisma.js';
import {
  CreateEmployeeDto,
  EmployeeDto,
  ListEmployeesQuery,
  UpdateEmployeeDto,
} from './employee.dto.js';
import { assertCanManageRole } from './employee-permissions.js';

const NOT_FOUND = 'Employee not found';
const NEEDS_SUPER_ADMIN =
  'The organisation needs at least one active Super Admin';

// Only these columns ever leave the database for this API.
const EMPLOYEE_SELECT = {
  id: true,
  name: true,
  email: true,
  role: true,
  isActive: true,
  createdAt: true,
  department: { select: { id: true, name: true } },
} satisfies Prisma.UserSelect;

type EmployeeRow = Prisma.UserGetPayload<{ select: typeof EMPLOYEE_SELECT }>;

function toDto(row: EmployeeRow): EmployeeDto {
  return { ...row, createdAt: row.createdAt.toISOString() };
}

// All queries use the tenant client: another organisation's employees and
// departments are invisible here (404 / "Department not found").
@Injectable()
export class EmployeesService {
  constructor(@Inject(TENANT_PRISMA) private readonly db: TenantPrisma) {}

  async list(query: ListEmployeesQuery): Promise<EmployeeDto[]> {
    const where: Prisma.UserWhereInput = {};
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    if (query.departmentId) {
      where.departmentId = query.departmentId;
    }
    if (query.status === 'active') where.isActive = true;
    if (query.status === 'inactive') where.isActive = false;

    const rows = await this.db.user.findMany({
      where,
      select: EMPLOYEE_SELECT,
      orderBy: { name: 'asc' },
    });
    return rows.map(toDto);
  }

  async create(actor: AuthUser, dto: CreateEmployeeDto): Promise<EmployeeDto> {
    assertCanManageRole(actor, dto.role);
    await this.assertDepartmentExists(dto.departmentId);

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    try {
      const row = await this.db.user.create({
        data: tenantData<Prisma.UserUncheckedCreateInput>({
          name: dto.name,
          email: dto.email,
          passwordHash,
          role: dto.role,
          departmentId: dto.departmentId ?? null,
        }),
        select: EMPLOYEE_SELECT,
      });
      return toDto(row);
    } catch (error) {
      if (isPrismaError(error, PrismaErrorCode.UniqueViolation)) {
        throw new ConflictException(
          'An account with this email already exists',
        );
      }
      throw error;
    }
  }

  async update(
    actor: AuthUser,
    id: string,
    dto: UpdateEmployeeDto,
  ): Promise<EmployeeDto> {
    const target = await this.findTarget(id);
    assertCanManageRole(actor, target.role);

    const roleChanges = dto.role !== undefined && dto.role !== target.role;
    if (roleChanges) {
      if (target.id === actor.id) {
        throw new BadRequestException('You cannot change your own role');
      }
      assertCanManageRole(actor, dto.role!);
      if (target.role === Role.SUPER_ADMIN && target.isActive) {
        await this.assertAnotherActiveSuperAdmin();
      }
    }
    if (dto.departmentId !== undefined) {
      await this.assertDepartmentExists(dto.departmentId);
    }

    const row = await this.db.user.update({
      where: { id },
      data: dto,
      select: EMPLOYEE_SELECT,
    });
    return toDto(row);
  }

  async setActive(
    actor: AuthUser,
    id: string,
    isActive: boolean,
  ): Promise<EmployeeDto> {
    const target = await this.findTarget(id);
    assertCanManageRole(actor, target.role);

    if (!isActive) {
      if (target.id === actor.id) {
        throw new BadRequestException('You cannot deactivate yourself');
      }
      if (target.role === Role.SUPER_ADMIN && target.isActive) {
        await this.assertAnotherActiveSuperAdmin();
      }
    }

    // The auth guard checks isActive on every request, so a deactivated
    // employee is locked out from their very next click.
    const row = await this.db.user.update({
      where: { id },
      data: { isActive },
      select: EMPLOYEE_SELECT,
    });
    return toDto(row);
  }

  private async findTarget(id: string) {
    const target = await this.db.user.findUnique({
      where: { id },
      select: { id: true, role: true, isActive: true },
    });
    if (!target) {
      throw new NotFoundException(NOT_FOUND);
    }
    return target;
  }

  // Called before a Super Admin is demoted or deactivated.
  private async assertAnotherActiveSuperAdmin(): Promise<void> {
    const activeSuperAdmins = await this.db.user.count({
      where: { role: Role.SUPER_ADMIN, isActive: true },
    });
    if (activeSuperAdmins <= 1) {
      throw new ConflictException(NEEDS_SUPER_ADMIN);
    }
  }

  // The department must exist in THIS organisation. Without this check a
  // user could be linked to another organisation's department by its id.
  private async assertDepartmentExists(
    departmentId: string | null | undefined,
  ): Promise<void> {
    if (!departmentId) return;
    const department = await this.db.department.findUnique({
      where: { id: departmentId },
      select: { id: true },
    });
    if (!department) {
      throw new BadRequestException('Department not found');
    }
  }
}
