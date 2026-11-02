import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { ThrottlerModule } from '@nestjs/throttler';
import { AUTH_RATE_LIMIT, SESSION_TTL_SECONDS } from './auth.constants.js';
import { AuthController } from './auth.controller.js';
import { AuthGuard } from './auth.guard.js';
import { AuthService } from './auth.service.js';

@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
        signOptions: { expiresIn: SESSION_TTL_SECONDS },
      }),
    }),
    // Storage for the login rate limit; the limit itself is applied only
    // on the sign-up and login routes.
    ThrottlerModule.forRoot([AUTH_RATE_LIMIT]),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    // Makes AuthGuard run on every route in the app.
    { provide: APP_GUARD, useClass: AuthGuard },
  ],
})
export class AuthModule {}
