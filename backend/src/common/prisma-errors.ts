import { Prisma } from '../generated/prisma/client.js';

// Prisma's error codes we turn into friendly HTTP errors.
// Full list: https://www.prisma.io/docs/orm/reference/error-reference
export const PrismaErrorCode = {
  UniqueViolation: 'P2002', // a unique column already has this value
  ForeignKeyViolation: 'P2003', // a row is still referenced by another
  RecordNotFound: 'P2025', // update/delete found no matching row
} as const;

export function isPrismaError(
  error: unknown,
  code: (typeof PrismaErrorCode)[keyof typeof PrismaErrorCode],
): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError && error.code === code
  );
}
