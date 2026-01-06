import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService implements OnModuleInit {
  private adminClient!: SupabaseClient;

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    const supabaseUrl = this.configService.getOrThrow<string>('SUPABASE_URL');
    const serviceKey = this.configService.getOrThrow<string>('SUPABASE_SERVICE_KEY');

    this.adminClient = createClient(supabaseUrl, serviceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  /**
   * Admin client with service_role privileges.
   * Use for: sending magic links, admin operations, bypassing RLS.
   */
  getAdminClient(): SupabaseClient {
    return this.adminClient;
  }

  /**
   * Create a client scoped to a specific user's JWT.
   * Use for: operations that should respect RLS for the user.
   */
  getClientForUser(accessToken: string): SupabaseClient {
    const supabaseUrl = this.configService.getOrThrow<string>('SUPABASE_URL');
    const anonKey = this.configService.getOrThrow<string>('SUPABASE_ANON_KEY');

    return createClient(supabaseUrl, anonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    });
  }

  /**
   * Validate a JWT and return the user.
   * Returns null if token is invalid or expired.
   */
  async validateToken(token: string): Promise<User | null> {
    const { data, error } = await this.adminClient.auth.getUser(token);
    if (error || !data.user) {
      return null;
    }
    return data.user;
  }
}
