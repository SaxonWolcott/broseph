import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User } from '@supabase/supabase-js';

/**
 * Parameter decorator to extract the authenticated user from the request.
 * Use with SupabaseAuthGuard.
 *
 * @example
 * @Get('me')
 * @UseGuards(SupabaseAuthGuard)
 * getMe(@CurrentUser() user: User) {
 *   return user;
 * }
 */
export const CurrentUser = createParamDecorator(
  (data: keyof User | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as User;
    return data ? user?.[data] : user;
  },
);

/**
 * Parameter decorator to extract the access token from the request.
 * Use with SupabaseAuthGuard.
 *
 * @example
 * @Get('me')
 * @UseGuards(SupabaseAuthGuard)
 * getMe(@AccessToken() token: string) {
 *   // Use token for user-scoped Supabase client
 * }
 */
export const AccessToken = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    return request.accessToken;
  },
);
