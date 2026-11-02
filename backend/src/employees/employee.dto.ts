import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsEnum,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  MaxLength,
} from 'class-validator';
import { Role } from '../generated/prisma/client.js';

const NAME_MIN = 2;
const NAME_MAX = 100;
const EMAIL_MAX = 254;
const PASSWORD_MIN = 8;
const PASSWORD_MAX = 72; // bcrypt uses only the first 72 bytes
const SEARCH_MAX = 100;

export const EMPLOYEE_STATUSES = ['all', 'active', 'inactive'] as const;
export type EmployeeStatus = (typeof EMPLOYEE_STATUSES)[number];

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;
const normaliseEmail = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim().toLowerCase() : value;

// Query string of GET /api/employees, e.g. ?search=priya&status=active
export class ListEmployeesQuery {
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(SEARCH_MAX)
  search?: string;

  @IsOptional()
  @IsUUID()
  departmentId?: string;

  @IsOptional()
  @IsIn(EMPLOYEE_STATUSES)
  status?: EmployeeStatus;
}

export class CreateEmployeeDto {
  @Transform(trim)
  @IsString()
  @Length(NAME_MIN, NAME_MAX)
  name: string;

  @Transform(normaliseEmail)
  @IsEmail()
  @MaxLength(EMAIL_MAX)
  email: string;

  // The starting password, set by the admin and shared with the employee.
  @IsString()
  @Length(PASSWORD_MIN, PASSWORD_MAX)
  password: string;

  @IsEnum(Role)
  role: Role;

  // Optional. null or missing = no department.
  @IsOptional()
  @IsUUID()
  departmentId?: string | null;
}

// Every field optional: send only what changes. departmentId: null removes
// the department.
export class UpdateEmployeeDto {
  @IsOptional()
  @Transform(trim)
  @IsString()
  @Length(NAME_MIN, NAME_MAX)
  name?: string;

  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @IsOptional()
  @IsUUID()
  departmentId?: string | null;
}

// What the API sends back. No password hash, built field by field.
export interface EmployeeDto {
  id: string;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
  department: { id: string; name: string } | null;
  createdAt: string;
}
