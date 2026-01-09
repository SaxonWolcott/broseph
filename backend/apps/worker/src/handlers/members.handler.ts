import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { SupabaseService, LeaveGroupJobDto, AcceptInviteJobDto, LIMITS } from '@app/shared';

@Injectable()
export class MembersHandler {
  private readonly logger = new Logger(MembersHandler.name);

  constructor(private supabaseService: SupabaseService) {}

  async handleLeaveGroup(job: Job<LeaveGroupJobDto>): Promise<{ left: boolean; groupDeleted: boolean }> {
    const { groupId, userId } = job.data;
    this.logger.log(`User ${userId} leaving group ${groupId}`);

    const adminClient = this.supabaseService.getAdminClient();

    // Get user's membership
    const { data: membership, error: memberError } = await adminClient
      .from('group_members')
      .select('id, role')
      .eq('group_id', groupId)
      .eq('user_id', userId)
      .maybeSingle();

    if (memberError || !membership) {
      throw new Error('User is not a member of this group');
    }

    // Get member count
    const { data: allMembers, error: countError } = await adminClient
      .from('group_members')
      .select('id, user_id, joined_at')
      .eq('group_id', groupId)
      .order('joined_at', { ascending: true });

    if (countError || !allMembers) {
      throw new Error('Failed to get group members');
    }

    // Case 1: Only member - delete the group
    if (allMembers.length === 1) {
      const { error: deleteError } = await adminClient
        .from('groups')
        .delete()
        .eq('id', groupId);

      if (deleteError) {
        throw new Error(`Failed to delete group: ${deleteError.message}`);
      }

      this.logger.log(`Deleted group ${groupId} as last member left`);
      return { left: true, groupDeleted: true };
    }

    // Case 2: Owner leaving - transfer ownership to oldest member
    if (membership.role === 'owner') {
      // Find the oldest member that's not the owner
      const newOwner = allMembers.find((m) => m.user_id !== userId);

      if (newOwner) {
        // Update group ownership
        const { error: ownerError } = await adminClient
          .from('groups')
          .update({ owner_id: newOwner.user_id })
          .eq('id', groupId);

        if (ownerError) {
          throw new Error(`Failed to transfer ownership: ${ownerError.message}`);
        }

        // Update new owner's role
        const { error: roleError } = await adminClient
          .from('group_members')
          .update({ role: 'owner' })
          .eq('group_id', groupId)
          .eq('user_id', newOwner.user_id);

        if (roleError) {
          throw new Error(`Failed to update new owner role: ${roleError.message}`);
        }

        this.logger.log(`Transferred ownership of group ${groupId} to user ${newOwner.user_id}`);
      }
    }

    // Remove the member
    const { error: removeError } = await adminClient
      .from('group_members')
      .delete()
      .eq('group_id', groupId)
      .eq('user_id', userId);

    if (removeError) {
      throw new Error(`Failed to remove member: ${removeError.message}`);
    }

    this.logger.log(`User ${userId} left group ${groupId}`);
    return { left: true, groupDeleted: false };
  }

  async handleAcceptInvite(job: Job<AcceptInviteJobDto>): Promise<{ joined: boolean; groupId: string }> {
    const { inviteToken, inviteId, groupId, userId } = job.data;
    this.logger.log(`User ${userId} accepting invite ${inviteId} to group ${groupId}`);

    const adminClient = this.supabaseService.getAdminClient();

    // Verify invite is still valid
    const { data: invite, error: inviteError } = await adminClient
      .from('group_invites')
      .select('id, expires_at, used_at')
      .eq('invite_token', inviteToken)
      .maybeSingle();

    if (inviteError || !invite) {
      throw new Error('Invite not found');
    }

    if (invite.used_at) {
      throw new Error('Invite has already been used');
    }

    if (new Date(invite.expires_at) < new Date()) {
      throw new Error('Invite has expired');
    }

    // Check if already a member
    const { data: existingMember } = await adminClient
      .from('group_members')
      .select('id')
      .eq('group_id', groupId)
      .eq('user_id', userId)
      .maybeSingle();

    if (existingMember) {
      throw new Error('User is already a member of this group');
    }

    // Check group member limit
    const { count: memberCount } = await adminClient
      .from('group_members')
      .select('*', { count: 'exact', head: true })
      .eq('group_id', groupId);

    if (memberCount !== null && memberCount >= LIMITS.MAX_MEMBERS_PER_GROUP) {
      throw new Error('Group is at maximum capacity');
    }

    // Check user's group limit
    const { count: userGroupCount } = await adminClient
      .from('group_members')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (userGroupCount !== null && userGroupCount >= LIMITS.MAX_GROUPS_PER_USER) {
      throw new Error('User has reached maximum group limit');
    }

    // Add user as member
    const { error: joinError } = await adminClient
      .from('group_members')
      .insert({
        group_id: groupId,
        user_id: userId,
        role: 'member',
      });

    if (joinError) {
      throw new Error(`Failed to join group: ${joinError.message}`);
    }

    // Mark invite as used
    const { error: updateError } = await adminClient
      .from('group_invites')
      .update({
        used_at: new Date().toISOString(),
        used_by: userId,
      })
      .eq('id', inviteId);

    if (updateError) {
      this.logger.warn(`Failed to mark invite as used: ${updateError.message}`);
      // Don't fail the job for this
    }

    this.logger.log(`User ${userId} joined group ${groupId} via invite ${inviteId}`);
    return { joined: true, groupId };
  }
}
