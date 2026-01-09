import {
  Injectable,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import {
  SupabaseService,
  GroupMemberDto,
  ErrorCode,
  ERROR_MESSAGES,
} from '@app/shared';

@Injectable()
export class MembersService {
  constructor(private supabaseService: SupabaseService) {}

  /**
   * Validate that user is a member of the group.
   */
  async validateMembership(
    groupId: string,
    userId: string,
    accessToken: string,
  ): Promise<void> {
    const userClient = this.supabaseService.getClientForUser(accessToken);

    const { data, error } = await userClient
      .from('group_members')
      .select('id')
      .eq('group_id', groupId)
      .eq('user_id', userId)
      .maybeSingle();

    if (error || !data) {
      throw new ForbiddenException(ERROR_MESSAGES[ErrorCode.NOT_GROUP_MEMBER]);
    }
  }

  /**
   * Get all members of a group.
   */
  async getMembers(
    groupId: string,
    accessToken: string,
  ): Promise<GroupMemberDto[]> {
    const userClient = this.supabaseService.getClientForUser(accessToken);

    const { data: members, error } = await userClient
      .from('group_members')
      .select(
        `
        id,
        user_id,
        role,
        joined_at,
        profiles:user_id (
          display_name,
          handle,
          avatar_url
        )
      `,
      )
      .eq('group_id', groupId)
      .order('joined_at', { ascending: true });

    if (error) {
      throw new BadRequestException('Failed to fetch group members');
    }

    return (members || []).map((m) => {
      const profile = m.profiles as unknown as {
        display_name: string | null;
        handle: string | null;
        avatar_url: string | null;
      } | null;

      return {
        id: m.id,
        userId: m.user_id,
        displayName: profile?.display_name ?? null,
        handle: profile?.handle ?? null,
        avatarUrl: profile?.avatar_url ?? null,
        role: m.role as 'owner' | 'member',
        joinedAt: m.joined_at,
      };
    });
  }
}
