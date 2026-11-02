import type { Organization, Role, User } from '../generated/prisma/client.js';

// What the API sends back about a user. Built field by field, so the
// password hash and other internal columns can never leak by accident.
export interface UserDto {
  id: string;
  name: string;
  email: string;
  role: Role;
  organization: { id: string; name: string };
}

export function toUserDto(
  user: User & { organization: Organization },
): UserDto {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    organization: { id: user.organization.id, name: user.organization.name },
  };
}
