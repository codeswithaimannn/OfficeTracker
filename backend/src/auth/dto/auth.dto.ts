import { Transform } from 'class-transformer';
import { IsEmail, IsString, Length, MaxLength } from 'class-validator';

// bcrypt only uses the first 72 bytes of a password, so longer ones are
// rejected rather than silently cut.
const PASSWORD_MIN = 8;
const PASSWORD_MAX = 72;
const NAME_MIN = 2;
const NAME_MAX = 100;
const EMAIL_MAX = 254;

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;
const normaliseEmail = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim().toLowerCase() : value;

export class SignupDto {
  @Transform(trim)
  @IsString()
  @Length(NAME_MIN, NAME_MAX)
  organizationName: string;

  @Transform(trim)
  @IsString()
  @Length(NAME_MIN, NAME_MAX)
  name: string;

  @Transform(normaliseEmail)
  @IsEmail()
  @MaxLength(EMAIL_MAX)
  email: string;

  @IsString()
  @Length(PASSWORD_MIN, PASSWORD_MAX)
  password: string;
}

export class LoginDto {
  @Transform(normaliseEmail)
  @IsEmail()
  @MaxLength(EMAIL_MAX)
  email: string;

  // No length rules here: a wrong password should get the same
  // "Invalid email or password" answer, whatever its length.
  @IsString()
  @MaxLength(PASSWORD_MAX)
  password: string;
}
