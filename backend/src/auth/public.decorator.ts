import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

// Marks a route as open to everyone. Every other route needs a login.
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
