import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { isPrismaError, PrismaErrorCode } from '../common/prisma-errors.js';
import { Prisma } from '../generated/prisma/client.js';
import {
  TENANT_PRISMA,
  tenantData,
  type TenantPrisma,
} from '../prisma/tenant-prisma.js';
import {
  CreateDepartmentDto,
  DepartmentDto,
  UpdateDepartmentDto,
} from './department.dto.js';

const NOT_FOUND = 'Department not found';
const DUPLICATE_NAME = 'A department with this name already exists';
const WITH_EMPLOYEE_COUNT = { _count: { select: { users: true } } } as const;

interface DepartmentRow {
  id: string;
  name: string;
  description: string | null;
  _count: { users: number };
}

function toDto(row: DepartmentRow): DepartmentDto {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    employeeCount: row._count.users,
  };
}

// Every query goes through the tenant client, so it only ever sees the
// logged-in user's organisation. Another organisation's department simply
// does not exist here (404).
@Injectable()
export class DepartmentsService {
  constructor(@Inject(TENANT_PRISMA) private readonly db: TenantPrisma) {}

  async list(): Promise<DepartmentDto[]> {
    const rows = await this.db.department.findMany({
      orderBy: { name: 'asc' },
      include: WITH_EMPLOYEE_COUNT,
    });
    return rows.map(toDto);
  }

  async create(dto: CreateDepartmentDto): Promise<DepartmentDto> {
    try {
      const row = await this.db.department.create({
        data: tenantData<Prisma.DepartmentUncheckedCreateInput>({
          name: dto.name,
          description: dto.description ?? null,
        }),
        include: WITH_EMPLOYEE_COUNT,
      });
      return toDto(row);
    } catch (error) {
      if (isPrismaError(error, PrismaErrorCode.UniqueViolation)) {
        throw new ConflictException(DUPLICATE_NAME);
      }
      throw error;
    }
  }

  async update(id: string, dto: UpdateDepartmentDto): Promise<DepartmentDto> {
    try {
      const row = await this.db.department.update({
        where: { id },
        data: dto,
        include: WITH_EMPLOYEE_COUNT,
      });
      return toDto(row);
    } catch (error) {
      if (isPrismaError(error, PrismaErrorCode.RecordNotFound)) {
        throw new NotFoundException(NOT_FOUND);
      }
      if (isPrismaError(error, PrismaErrorCode.UniqueViolation)) {
        throw new ConflictException(DUPLICATE_NAME);
      }
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    const employees = await this.db.user.count({ where: { departmentId: id } });
    if (employees > 0) {
      throw new ConflictException(
        `Move its ${employees} employee${employees === 1 ? '' : 's'} to another department first`,
      );
    }
    try {
      await this.db.department.delete({ where: { id } });
    } catch (error) {
      if (isPrismaError(error, PrismaErrorCode.RecordNotFound)) {
        throw new NotFoundException(NOT_FOUND);
      }
      // Someone was added to it between the count and the delete.
      if (isPrismaError(error, PrismaErrorCode.ForeignKeyViolation)) {
        throw new ConflictException('Move its employees first');
      }
      throw error;
    }
  }
}
