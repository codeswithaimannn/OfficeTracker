import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcryptjs';
import { Prisma, Role } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { toUserDto, UserDto } from '../users/user.dto.js';
import { BCRYPT_ROUNDS } from './auth.constants.js';
import { LoginDto, SignupDto } from './dto/auth.dto.js';
import { JwtPayload } from './auth.types.js';

const INVALID_LOGIN = 'Invalid email or password';
// Prisma's error code for "unique constraint failed".
const UNIQUE_VIOLATION = 'P2002';

export interface AuthResult {
  user: UserDto;
  token: string;
}

@Injectable()
export class AuthService {
  // A real bcrypt hash of a random string. Used when the email is unknown,
  // so a failed login takes the same time whether or not the email exists.
  private readonly dummyHash = bcrypt.hashSync(
    crypto.randomUUID(),
    BCRYPT_ROUNDS,
  );

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  // Creates a new organisation and its first user (the Super Admin).
  // One nested create = one transaction: both rows are saved, or neither.
  async signup(dto: SignupDto): Promise<AuthResult> {
    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    try {
      const organization = await this.prisma.organization.create({
        data: {
          name: dto.organizationName,
          users: {
            create: {
              name: dto.name,
              email: dto.email,
              passwordHash,
              role: Role.SUPER_ADMIN,
            },
          },
        },
        include: { users: true },
      });
      const user = { ...organization.users[0], organization };
      return { user: toUserDto(user), token: await this.signToken(user) };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === UNIQUE_VIOLATION
      ) {
        throw new ConflictException(
          'An account with this email already exists',
        );
      }
      throw error;
    }
  }

  async login(dto: LoginDto): Promise<AuthResult> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: { organization: true },
    });
    const passwordOk = await bcrypt.compare(
      dto.password,
      user?.passwordHash ?? this.dummyHash,
    );
    if (!user || !passwordOk || !user.isActive) {
      throw new UnauthorizedException(INVALID_LOGIN);
    }
    return { user: toUserDto(user), token: await this.signToken(user) };
  }

  async me(userId: string): Promise<UserDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { organization: true },
    });
    if (!user) {
      throw new UnauthorizedException();
    }
    return toUserDto(user);
  }

  private signToken(user: {
    id: string;
    organizationId: string;
    role: Role;
  }): Promise<string> {
    const payload: JwtPayload = {
      sub: user.id,
      org: user.organizationId,
      role: user.role,
    };
    return this.jwt.signAsync(payload);
  }
}
