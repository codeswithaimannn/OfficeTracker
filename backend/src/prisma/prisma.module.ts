import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service.js';
import { createTenantPrisma, TENANT_PRISMA } from './tenant-prisma.js';

// Global, so every feature module can inject PrismaService and
// TENANT_PRISMA without importing this module again.
@Global()
@Module({
  providers: [
    PrismaService,
    {
      provide: TENANT_PRISMA,
      inject: [PrismaService],
      useFactory: createTenantPrisma,
    },
  ],
  exports: [PrismaService, TENANT_PRISMA],
})
export class PrismaModule {}
