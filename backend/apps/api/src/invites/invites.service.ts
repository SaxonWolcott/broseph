import {
  Injectable,
  ForbiddenException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  SupabaseService,
  InvitePreviewDto,
  ErrorCode,
  ERROR_MESSAGES,
  LIMITS,
} from '@app/shared';
import { randomBytes } from 'crypto';
import { EmailService } from '../email/email.service';

interface SendMagicLinkResult {
  sent: boolean;
  email: string;
}

interface CheckAccountResult {
  hasAccount: boolean;
}

@Injectable()
export class InvitesService {
  constructor(
    private supabaseService: SupabaseService,
    private emailService: EmailService,
    private configService: ConfigService,
  ) {}

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
   * Create a new invite for a group and send email.
   */
  async createInvite(
    groupId: string,
    invitedBy: string,
    email: string,
    accessToken: string,
  ): Promise<{ token: string; expiresAt: string }> {
    const userClient = this.supabaseService.getClientForUser(accessToken);

    const token = this.generateInviteToken();
    const expiresAt = this.getExpiryDate();

    // Create the invite record
    const { data, error } = await userClient
      .from('group_invites')
      .insert({
        group_id: groupId,
        invited_by: invitedBy,
        invite_token: token,
        email: email,
        expires_at: expiresAt.toISOString(),
      })
      .select('invite_token, expires_at')
      .single();

    if (error) {
      throw new BadRequestException('Failed to create invite');
    }

    // Fetch group name and inviter name for the email
    const { data: groupData } = await userClient
      .from('groups')
      .select('name')
      .eq('id', groupId)
      .single();

    const { data: inviterData } = await userClient
      .from('profiles')
      .select('display_name')
      .eq('id', invitedBy)
      .single();

    const groupName = groupData?.name ?? 'a group';
    const inviterName = inviterData?.display_name ?? 'Someone';

    // Build invite link — try to generate a Supabase magic link so the user
    // is authenticated in one click (no second email needed).
    const siteUrl = this.configService.get<string>(
      'SITE_URL',
      'http://localhost:5173',
    );
    const adminClient = this.supabaseService.getAdminClient();
    const callbackUrl = `${siteUrl}/auth/callback?autoAcceptInvite=${token}`;
    const { data: linkData, error: linkError } =
      await adminClient.auth.admin.generateLink({
        type: 'magiclink',
        email,
        options: { redirectTo: callbackUrl },
      });
    if (linkError) {
      console.warn(
        'Failed to generate magic link, falling back to invite page:',
        linkError.message,
      );
    }
    const inviteLink =
      linkData?.properties?.action_link ?? `${siteUrl}/invite/${token}`;

    // Send custom invite email with proper branding
    try {
      console.log(`Sending invite email to ${email} for group "${groupName}"...`);
      await this.emailService.sendInviteEmail({
        to: email,
        groupName,
        inviterName,
        inviteLink,
      });
      console.log(`Invite email sent successfully to ${email}`);
    } catch (error) {
      console.error('Failed to send invite email:', error);
      // Don't fail the invite creation if email fails
      // The invite is still valid, they just won't get the email
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

  /**
   * Check if the invite's email has an existing account.
   */
  async checkInviteAccount(token: string): Promise<CheckAccountResult> {
    const adminClient = this.supabaseService.getAdminClient();

    // Get the invite and its email
    const { data: invite, error } = await adminClient
      .from('group_invites')
      .select('id, email, expires_at, used_at')
      .eq('invite_token', token)
      .maybeSingle();

    if (error || !invite) {
      throw new NotFoundException(ERROR_MESSAGES[ErrorCode.INVITE_NOT_FOUND]);
    }

    if (!invite.email) {
      throw new BadRequestException('This invite does not have an email address');
    }

    // Check if expired
    if (new Date(invite.expires_at) < new Date()) {
      throw new BadRequestException(ERROR_MESSAGES[ErrorCode.INVITE_EXPIRED]);
    }

    // Check if already used
    if (invite.used_at) {
      throw new BadRequestException(ERROR_MESSAGES[ErrorCode.INVITE_ALREADY_USED]);
    }

    // Check if email has an existing account
    const { data: users } = await adminClient.auth.admin.listUsers();
    const hasAccount = users?.users.some(
      (user) => user.email?.toLowerCase() === invite.email.toLowerCase(),
    ) ?? false;

    return { hasAccount };
  }

  /**
   * Send a magic link to the invite's email for one-click join.
   * Uses generateLink + custom branded email (never Supabase's default template).
   * Works for both existing and new users (generateLink creates users automatically).
   */
  async sendMagicLinkForInvite(token: string): Promise<SendMagicLinkResult> {
    const adminClient = this.supabaseService.getAdminClient();

    // Get the invite and its email
    const { data: invite, error } = await adminClient
      .from('group_invites')
      .select('id, email, group_id, expires_at, used_at')
      .eq('invite_token', token)
      .maybeSingle();

    if (error || !invite) {
      throw new NotFoundException(ERROR_MESSAGES[ErrorCode.INVITE_NOT_FOUND]);
    }

    if (!invite.email) {
      throw new BadRequestException('This invite does not have an email address');
    }

    // Check if expired
    if (new Date(invite.expires_at) < new Date()) {
      throw new BadRequestException(ERROR_MESSAGES[ErrorCode.INVITE_EXPIRED]);
    }

    // Check if already used
    if (invite.used_at) {
      throw new BadRequestException(ERROR_MESSAGES[ErrorCode.INVITE_ALREADY_USED]);
    }

    // Build redirect URL that includes the invite token for auto-accept
    const siteUrl = this.configService.get<string>(
      'SITE_URL',
      'http://localhost:5173',
    );
    const callbackUrl = `${siteUrl}/auth/callback?autoAcceptInvite=${token}`;

    // Generate magic link without sending Supabase's default email
    // generateLink with type 'magiclink' creates the user if they don't exist
    const { data: linkData, error: linkError } =
      await adminClient.auth.admin.generateLink({
        type: 'magiclink',
        email: invite.email,
        options: { redirectTo: callbackUrl },
      });

    if (linkError || !linkData?.properties?.action_link) {
      console.error('Failed to generate magic link for invite:', linkError?.message);
      throw new BadRequestException('Failed to send sign-in link');
    }

    // Fetch group name and inviter name for the email
    const { data: groupData } = await adminClient
      .from('groups')
      .select('name')
      .eq('id', invite.group_id)
      .single();

    const { data: inviterProfile } = await adminClient
      .from('group_invites')
      .select('profiles:invited_by (display_name)')
      .eq('id', invite.id)
      .single();

    const groupName = groupData?.name ?? 'a group';
    const inviterName =
      (inviterProfile?.profiles as unknown as { display_name: string | null })
        ?.display_name ?? 'Someone';

    // Send our custom branded invite email
    try {
      await this.emailService.sendInviteEmail({
        to: invite.email,
        groupName,
        inviterName,
        inviteLink: linkData.properties.action_link,
      });
    } catch (emailError) {
      console.error('Failed to send invite magic link email:', emailError);
      throw new BadRequestException('Failed to send sign-in link');
    }

    // Mask the email for privacy (show first 2 chars and domain)
    const [localPart, domain] = invite.email.split('@');
    const maskedEmail = `${localPart.slice(0, 2)}***@${domain}`;

    return { sent: true, email: maskedEmail };
  }
}
