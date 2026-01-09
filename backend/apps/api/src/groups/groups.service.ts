import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import {
  SupabaseService,
  GroupDto,
  GroupDetailDto,
  GroupListDto,
  GroupListItemDto,
  GroupMemberDto,
  LIMITS,
  ErrorCode,
  ERROR_MESSAGES,
} from '@app/shared';

@Injectable()
export class GroupsService {
  constructor(private supabaseService: SupabaseService) {}

  /**
   * Check if user can create a new group (hasn't exceeded limit).
   */
  async validateCanCreateGroup(userId: string): Promise<void> {
    const adminClient = this.supabaseService.getAdminClient();

    const { count, error } = await adminClient
      .from('group_members')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (error) {
      throw new BadRequestException('Failed to check group membership');
    }

    if (count !== null && count >= LIMITS.MAX_GROUPS_PER_USER) {
      throw new BadRequestException(ERROR_MESSAGES[ErrorCode.USER_GROUP_LIMIT]);
    }
  }

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
   * Validate that user is the owner of the group.
   */
  async validateOwnership(groupId: string, userId: string): Promise<void> {
    const adminClient = this.supabaseService.getAdminClient();

    const { data: group, error } = await adminClient
      .from('groups')
      .select('owner_id')
      .eq('id', groupId)
      .maybeSingle();

    if (error || !group) {
      throw new NotFoundException(ERROR_MESSAGES[ErrorCode.GROUP_NOT_FOUND]);
    }

    if (group.owner_id !== userId) {
      throw new ForbiddenException(ERROR_MESSAGES[ErrorCode.NOT_GROUP_OWNER]);
    }
  }

  /**
   * Get list of groups for the authenticated user.
   */
  async listGroups(userId: string, accessToken: string): Promise<GroupListDto> {
    const userClient = this.supabaseService.getClientForUser(accessToken);

    // Get groups user is a member of with member counts
    const { data: memberships, error: memberError } = await userClient
      .from('group_members')
      .select(
        `
        group_id,
        groups!inner (
          id,
          name,
          owner_id,
          created_at,
          updated_at
        )
      `,
      )
      .eq('user_id', userId);

    if (memberError) {
      console.error('Failed to fetch groups:', memberError);
      throw new BadRequestException(`Failed to fetch groups: ${memberError.message}`);
    }

    if (!memberships || memberships.length === 0) {
      return { groups: [] };
    }

    const groupIds = memberships.map((m) => m.group_id);

    // Get member counts for each group
    const adminClient = this.supabaseService.getAdminClient();
    const { data: memberCounts } = await adminClient
      .from('group_members')
      .select('group_id')
      .in('group_id', groupIds);

    const countMap = new Map<string, number>();
    memberCounts?.forEach((m) => {
      countMap.set(m.group_id, (countMap.get(m.group_id) || 0) + 1);
    });

    // Get last message for each group
    const { data: lastMessages } = await userClient
      .from('messages')
      .select(
        `
        group_id,
        content,
        created_at,
        sender:sender_id (display_name)
      `,
      )
      .in('group_id', groupIds)
      .order('created_at', { ascending: false });

    const lastMessageMap = new Map<
      string,
      { content: string; senderName: string | null; createdAt: string }
    >();
    lastMessages?.forEach((m) => {
      if (!lastMessageMap.has(m.group_id)) {
        const sender = m.sender as unknown as { display_name: string | null } | null;
        lastMessageMap.set(m.group_id, {
          content: m.content,
          senderName: sender?.display_name ?? null,
          createdAt: m.created_at,
        });
      }
    });

    const groups: GroupListItemDto[] = memberships.map((m) => {
      const group = m.groups as unknown as {
        id: string;
        name: string;
        owner_id: string;
        created_at: string;
        updated_at: string;
      };
      const lastMsg = lastMessageMap.get(group.id);

      return {
        id: group.id,
        name: group.name,
        ownerId: group.owner_id,
        memberCount: countMap.get(group.id) || 1,
        createdAt: group.created_at,
        updatedAt: group.updated_at,
        lastMessageContent: lastMsg?.content ?? null,
        lastMessageSenderName: lastMsg?.senderName ?? null,
        lastMessageAt: lastMsg?.createdAt ?? null,
      };
    });

    // Sort by last message time, then by created_at
    groups.sort((a, b) => {
      const aTime = a.lastMessageAt || a.createdAt;
      const bTime = b.lastMessageAt || b.createdAt;
      return new Date(bTime).getTime() - new Date(aTime).getTime();
    });

    return { groups };
  }

  /**
   * Get detailed group information including members.
   */
  async getGroup(
    groupId: string,
    userId: string,
    accessToken: string,
  ): Promise<GroupDetailDto> {
    await this.validateMembership(groupId, userId, accessToken);

    const userClient = this.supabaseService.getClientForUser(accessToken);

    const { data: group, error: groupError } = await userClient
      .from('groups')
      .select('*')
      .eq('id', groupId)
      .single();

    if (groupError || !group) {
      throw new NotFoundException(ERROR_MESSAGES[ErrorCode.GROUP_NOT_FOUND]);
    }

    // Get members with profile info
    const { data: members, error: membersError } = await userClient
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

    if (membersError) {
      throw new BadRequestException('Failed to fetch group members');
    }

    const memberDtos: GroupMemberDto[] = (members || []).map((m) => {
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

    return {
      id: group.id,
      name: group.name,
      ownerId: group.owner_id,
      memberCount: memberDtos.length,
      createdAt: group.created_at,
      updatedAt: group.updated_at,
      members: memberDtos,
    };
  }

  /**
   * Validate that group can be deleted (owner and empty).
   */
  async validateCanDeleteGroup(groupId: string, userId: string): Promise<void> {
    await this.validateOwnership(groupId, userId);

    const adminClient = this.supabaseService.getAdminClient();

    const { count, error } = await adminClient
      .from('group_members')
      .select('*', { count: 'exact', head: true })
      .eq('group_id', groupId);

    if (error) {
      throw new BadRequestException('Failed to check group members');
    }

    if (count !== null && count > 1) {
      throw new BadRequestException(ERROR_MESSAGES[ErrorCode.GROUP_HAS_MEMBERS]);
    }
  }
}
