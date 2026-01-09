import {
  Injectable,
  ForbiddenException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import {
  SupabaseService,
  InvitePreviewDto,
  ErrorCode,
  ERROR_MESSAGES,
  LIMITS,
} from '@app/shared';
import { randomBytes } from 'crypto';

@Injectable()
export class InvitesService {
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
   * Generate a unique invite token.
   */
  generateInviteToken(): string {
    return randomBytes(32).toString('hex');
  }

  /**
   * Calculate invite expiry date.
   */
  getExpiryDate(): Date {
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + LIMITS.INVITE_EXPIRY_DAYS);
    return expiry;
  }

  /**
   * Create a new invite for a group.
   */
  async createInvite(
    groupId: string,
    invitedBy: string,
    email: string | undefined,
    accessToken: string,
  ): Promise<{ token: string; expiresAt: string }> {
    const userClient = this.supabaseService.getClientForUser(accessToken);

    const token = this.generateInviteToken();
    const expiresAt = this.getExpiryDate();

    const { data, error } = await userClient.from('group_invites').insert({
      group_id: groupId,
      invited_by: invitedBy,
      invite_token: token,
      email: email ?? null,
      expires_at: expiresAt.toISOString(),
    }).select('invite_token, expires_at').single();

    if (error) {
      throw new BadRequestException('Failed to create invite');
    }

    return {
      token: data.invite_token,
      expiresAt: data.expires_at,
    };
  }

  /**
   * Get invite preview by token (public - no auth required).
   */
  async getInvitePreview(token: string): Promise<InvitePreviewDto> {
    const adminClient = this.supabaseService.getAdminClient();

    const { data: invite, error } = await adminClient
      .from('group_invites')
      .select(
        `
        id,
        group_id,
        expires_at,
        used_at,
        invited_by,
        groups!inner (
          id,
          name
        ),
        profiles:invited_by (
          display_name
        )
      `,
      )
      .eq('invite_token', token)
      .maybeSingle();

    if (error || !invite) {
      throw new NotFoundException(ERROR_MESSAGES[ErrorCode.INVITE_NOT_FOUND]);
    }

    // Check if expired
    const isExpired = new Date(invite.expires_at) < new Date();

    // Check if already used
    const isUsed = !!invite.used_at;

    // Supabase returns single object for !inner joins, cast properly
    const group = invite.groups as unknown as { id: string; name: string };
    const inviterProfile = invite.profiles as unknown as { display_name: string | null } | null;

    // Get member count
    const { count: memberCount } = await adminClient
      .from('group_members')
      .select('*', { count: 'exact', head: true })
      .eq('group_id', invite.group_id);

    const count = memberCount ?? 0;

    return {
      groupName: group?.name ?? 'Unknown Group',
      invitedByName: inviterProfile?.display_name ?? null,
      memberCount: count,
      expiresAt: invite.expires_at,
      isExpired,
      isUsed,
      isGroupFull: count >= LIMITS.MAX_MEMBERS_PER_GROUP,
    };
  }

  /**
   * Validate that an invite can be accepted.
   */
  async validateCanAcceptInvite(
    token: string,
    userId: string,
  ): Promise<{ groupId: string; inviteId: string }> {
    const adminClient = this.supabaseService.getAdminClient();

    // Get the invite
    const { data: invite, error } = await adminClient
      .from('group_invites')
      .select('id, group_id, expires_at, used_at')
      .eq('invite_token', token)
      .maybeSingle();

    if (error || !invite) {
      throw new NotFoundException(ERROR_MESSAGES[ErrorCode.INVITE_NOT_FOUND]);
    }

    // Check if expired
    if (new Date(invite.expires_at) < new Date()) {
      throw new BadRequestException(ERROR_MESSAGES[ErrorCode.INVITE_EXPIRED]);
    }

    // Check if already used
    if (invite.used_at) {
      throw new BadRequestException(ERROR_MESSAGES[ErrorCode.INVITE_ALREADY_USED]);
    }

    // Check if user is already a member
    const { data: existingMember } = await adminClient
      .from('group_members')
      .select('id')
      .eq('group_id', invite.group_id)
      .eq('user_id', userId)
      .maybeSingle();

    if (existingMember) {
      throw new BadRequestException(ERROR_MESSAGES[ErrorCode.ALREADY_MEMBER]);
    }

    // Check group member limit
    const { count: memberCount } = await adminClient
      .from('group_members')
      .select('*', { count: 'exact', head: true })
      .eq('group_id', invite.group_id);

    if (memberCount !== null && memberCount >= LIMITS.MAX_MEMBERS_PER_GROUP) {
      throw new BadRequestException(ERROR_MESSAGES[ErrorCode.GROUP_FULL]);
    }

    // Check user's group limit
    const { count: userGroupCount } = await adminClient
      .from('group_members')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (userGroupCount !== null && userGroupCount >= LIMITS.MAX_GROUPS_PER_USER) {
      throw new BadRequestException(ERROR_MESSAGES[ErrorCode.USER_GROUP_LIMIT]);
    }

    return { groupId: invite.group_id, inviteId: invite.id };
  }
}
