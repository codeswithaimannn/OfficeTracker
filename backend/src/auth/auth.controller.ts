import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import type { Response } from 'express';
import { UserDto } from '../users/user.dto.js';
import {
  AUTH_COOKIE,
  AUTH_RATE_LIMIT,
  authCookieOptions,
  SESSION_TTL_SECONDS,
} from './auth.constants.js';
import { AuthService } from './auth.service.js';
import type { AuthenticatedRequest } from './auth.types.js';
import { LoginDto, SignupDto } from './dto/auth.dto.js';
import { Public } from './public.decorator.js';

const MS_PER_SECOND = 1000;

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: AUTH_RATE_LIMIT })
  @Post('signup')
  async signup(
    @Body() dto: SignupDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<UserDto> {
    const { user, token } = await this.auth.signup(dto);
    this.setSessionCookie(res, token);
    return user;
  }

  @Public()
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: AUTH_RATE_LIMIT })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<UserDto> {
    const { user, token } = await this.auth.login(dto);
    this.setSessionCookie(res, token);
    return user;
  }

  // Public, so logging out works even with an expired token.
  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  logout(@Res({ passthrough: true }) res: Response): void {
    res.clearCookie(AUTH_COOKIE, authCookieOptions());
  }

  @Get('me')
  me(@Req() req: AuthenticatedRequest): Promise<UserDto> {
    return this.auth.me(req.user.id);
  }

  private setSessionCookie(res: Response, token: string): void {
    res.cookie(AUTH_COOKIE, token, {
      ...authCookieOptions(),
      maxAge: SESSION_TTL_SECONDS * MS_PER_SECOND,
    });
  }
}
