import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import type { AuthenticatedRequest } from '../auth/auth.types.js';
import { Roles } from '../auth/roles.decorator.js';
import { Role } from '../generated/prisma/client.js';
import {
  CreateEmployeeDto,
  EmployeeDto,
  ListEmployeesQuery,
  UpdateEmployeeDto,
} from './employee.dto.js';
import { EmployeesService } from './employees.service.js';

// Everyone can see the employee list (a staff directory). Adding and
// changing people is for Super Admins and Managers; the finer rules
// (whom a Manager may manage) live in employee-permissions.ts.
@Controller('employees')
export class EmployeesController {
  constructor(private readonly employees: EmployeesService) {}

  @Get()
  list(@Query() query: ListEmployeesQuery): Promise<EmployeeDto[]> {
    return this.employees.list(query);
  }

  @Roles(Role.SUPER_ADMIN, Role.MANAGER)
  @Post()
  create(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateEmployeeDto,
  ): Promise<EmployeeDto> {
    return this.employees.create(req.user, dto);
  }

  @Roles(Role.SUPER_ADMIN, Role.MANAGER)
  @Patch(':id')
  update(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateEmployeeDto,
  ): Promise<EmployeeDto> {
    return this.employees.update(req.user, id, dto);
  }

  @Roles(Role.SUPER_ADMIN, Role.MANAGER)
  @Post(':id/deactivate')
  @HttpCode(HttpStatus.OK)
  deactivate(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<EmployeeDto> {
    return this.employees.setActive(req.user, id, false);
  }

  @Roles(Role.SUPER_ADMIN, Role.MANAGER)
  @Post(':id/reactivate')
  @HttpCode(HttpStatus.OK)
  reactivate(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<EmployeeDto> {
    return this.employees.setActive(req.user, id, true);
  }
}
