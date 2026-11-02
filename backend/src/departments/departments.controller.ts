import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { Roles } from '../auth/roles.decorator.js';
import { Role } from '../generated/prisma/client.js';
import {
  CreateDepartmentDto,
  DepartmentDto,
  UpdateDepartmentDto,
} from './department.dto.js';
import { DepartmentsService } from './departments.service.js';

// Everyone in the organisation can see departments; only Super Admins and
// Managers can change them.
@Controller('departments')
export class DepartmentsController {
  constructor(private readonly departments: DepartmentsService) {}

  @Get()
  list(): Promise<DepartmentDto[]> {
    return this.departments.list();
  }

  @Roles(Role.SUPER_ADMIN, Role.MANAGER)
  @Post()
  create(@Body() dto: CreateDepartmentDto): Promise<DepartmentDto> {
    return this.departments.create(dto);
  }

  @Roles(Role.SUPER_ADMIN, Role.MANAGER)
  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDepartmentDto,
  ): Promise<DepartmentDto> {
    return this.departments.update(id, dto);
  }

  @Roles(Role.SUPER_ADMIN, Role.MANAGER)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.departments.remove(id);
  }
}
