import {
  Injectable,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  SupabaseService,
  ProfileDto,
  MagicLinkRequestDto,
  OnboardDto,
} from '@app/shared';
import { User } from '@supabase/supabase-js';

@Injectable()
export class AuthService {
  constructor(
    private supabaseService: SupabaseService,
    private configService: ConfigService,
  ) {}

  /**
   * Send a magic link email to the specified address.
   * Does not leak whether the email exists in the system.
   */
  async sendMagicLink(dto: MagicLinkRequestDto): Promise<void> {
    const adminClient = this.supabaseService.getAdminClient();
    const siteUrl = this.configService.get<string>(
      'SITE_URL',
      'http://localhost:5173',
    );
    const redirectTo = dto.redirectTo || `${siteUrl}/auth/callback`;

    // Validate redirectTo is in allowed list (basic security)
    const allowedOrigins = [
      siteUrl,
      'http://localhost:5173',
      'http://127.0.0.1:5173',
    ];
    const redirectOrigin = new URL(redirectTo).origin;
    if (!allowedOrigins.includes(redirectOrigin)) {
      throw new BadRequestException('Invalid redirect URL');
    }

    const { error } = await adminClient.auth.signInWithOtp({
      email: dto.email,
      options: {
        emailRedirectTo: redirectTo,
      },
    });

    if (error) {
      // Log the error but don't expose details to client
      console.error('Magic link error:', error.message);
      throw new BadRequestException(
        'Unable to send magic link. Please try again.',
      );
    }
  }

  /**
   * Get the profile for the authenticated user.
   * Uses RLS - user can only read their own profile.
   */
  async getProfile(user: User, accessToken: string): Promise<ProfileDto> {
    const userClient = this.supabaseService.getClientForUser(accessToken);

    const { data: profile, error } = await userClient
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('Profile fetch error:', error.message);
      throw new BadRequestException('Failed to fetch profile');
    }

    return this.mapToProfileDto(profile, user);
  }

  /**
   * Update profile during onboarding.
   * Handles unique handle conflicts gracefully.
   */
  async onboard(
    user: User,
    accessToken: string,
    dto: OnboardDto,
  ): Promise<ProfileDto> {
    const userClient = this.supabaseService.getClientForUser(accessToken);

    // Check handle uniqueness if provided
    if (dto.handle) {
      const { data: existing } = await userClient
        .from('profiles')
        .select('id')
        .eq('handle', dto.handle)
        .neq('id', user.id)
        .maybeSingle();

      if (existing) {
        throw new ConflictException('Handle is already taken');
      }
    }

    // Build update object only with provided fields
    const updateData: Record<string, unknown> = {};
    if (dto.displayName !== undefined) {
      updateData.display_name = dto.displayName;
    }
    if (dto.handle !== undefined) {
      updateData.handle = dto.handle;
    }

    // If nothing to update, just return current profile
    if (Object.keys(updateData).length === 0) {
      return this.getProfile(user, accessToken);
    }

    const { data: profile, error } = await userClient
      .from('profiles')
      .update(updateData)
      .eq('id', user.id)
      .select('*')
      .single();

    if (error) {
      console.error('Profile update error:', error.message);
      // Handle unique constraint violation
      if (error.code === '23505') {
        throw new ConflictException('Handle is already taken');
      }
      throw new BadRequestException('Failed to update profile');
    }

    return this.mapToProfileDto(profile, user);
  }

  /**
   * Map database profile to DTO with camelCase fields.
   */
  private mapToProfileDto(
    profile: {
      id: string;
      display_name: string | null;
      handle: string | null;
      avatar_url: string | null;
      created_at: string;
      updated_at: string;
    },
    user: User,
  ): ProfileDto {
    return {
      id: profile.id,
      displayName: profile.display_name,
      handle: profile.handle,
      avatarUrl: profile.avatar_url,
      email: user.email || null,
      createdAt: profile.created_at,
      updatedAt: profile.updated_at,
    };
  }
}
