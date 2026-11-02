import { Transform } from 'class-transformer';
import { IsOptional, IsString, Length, MaxLength } from 'class-validator';

const NAME_MIN = 2;
const NAME_MAX = 60;
const DESCRIPTION_MAX = 300;

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class CreateDepartmentDto {
  @Transform(trim)
  @IsString()
  @Length(NAME_MIN, NAME_MAX)
  name: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(DESCRIPTION_MAX)
  description?: string;
}

// Every field optional: send only what changes.
export class UpdateDepartmentDto {
  @IsOptional()
  @Transform(trim)
  @IsString()
  @Length(NAME_MIN, NAME_MAX)
  name?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(DESCRIPTION_MAX)
  description?: string;
}

// What the API sends back.
export interface DepartmentDto {
  id: string;
  name: string;
  description: string | null;
  employeeCount: number;
}
