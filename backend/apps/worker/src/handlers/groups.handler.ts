import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { SupabaseService, CreateGroupJobDto, DeleteGroupJobDto } from '@app/shared';

@Injectable()
export class GroupsHandler {
  private readonly logger = new Logger(GroupsHandler.name);

  constructor(private supabaseService: SupabaseService) {}

  async handleCreateGroup(job: Job<CreateGroupJobDto>): Promise<{ groupId: string }> {
    const { name, ownerId } = job.data;
    this.logger.log(`Creating group "${name}" for user ${ownerId}`);

    const adminClient = this.supabaseService.getAdminClient();

    // Create the group
    const { data: group, error: groupError } = await adminClient
      .from('groups')
      .insert({
        name,
        owner_id: ownerId,
      })
      .select('id')
      .single();

    if (groupError || !group) {
      this.logger.error(`Failed to create group: ${groupError?.message}`);
      throw new Error(`Failed to create group: ${groupError?.message}`);
    }

    // Add owner as first member with 'owner' role
    const { error: memberError } = await adminClient
      .from('group_members')
      .insert({
        group_id: group.id,
        user_id: ownerId,
        role: 'owner',
      });

    if (memberError) {
      // Rollback: delete the group if member creation fails
      await adminClient.from('groups').delete().eq('id', group.id);
      this.logger.error(`Failed to add owner as member: ${memberError.message}`);
      throw new Error(`Failed to add owner as member: ${memberError.message}`);
    }

    this.logger.log(`Created group ${group.id} for user ${ownerId}`);
    return { groupId: group.id };
  }

  async handleDeleteGroup(job: Job<DeleteGroupJobDto>): Promise<{ deleted: boolean }> {
    const { groupId, userId } = job.data;
    this.logger.log(`Deleting group ${groupId} by user ${userId}`);

    const adminClient = this.supabaseService.getAdminClient();

    // Verify ownership
    const { data: group, error: groupError } = await adminClient
      .from('groups')
      .select('owner_id')
      .eq('id', groupId)
      .single();

    if (groupError || !group) {
      throw new Error('Group not found');
    }

    if (group.owner_id !== userId) {
      throw new Error('Only group owner can delete the group');
    }

    // Check if group has other members
    const { count } = await adminClient
      .from('group_members')
      .select('*', { count: 'exact', head: true })
      .eq('group_id', groupId);

    if (count !== null && count > 1) {
      throw new Error('Cannot delete group with other members');
    }

    // Delete the group (cascade will delete members, messages, invites)
    const { error: deleteError } = await adminClient
      .from('groups')
      .delete()
      .eq('id', groupId);

    if (deleteError) {
      this.logger.error(`Failed to delete group: ${deleteError.message}`);
      throw new Error(`Failed to delete group: ${deleteError.message}`);
    }

    this.logger.log(`Deleted group ${groupId}`);
    return { deleted: true };
  }
}
