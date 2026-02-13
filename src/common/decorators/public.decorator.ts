import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

// Capitalized name avoids reserved keyword issues
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
