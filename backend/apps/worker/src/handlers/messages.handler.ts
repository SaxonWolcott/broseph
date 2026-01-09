import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { SupabaseService, SendMessageJobDto, LIMITS } from '@app/shared';

@Injectable()
export class MessagesHandler {
  private readonly logger = new Logger(MessagesHandler.name);

  constructor(private supabaseService: SupabaseService) {}

  async handleSendMessage(job: Job<SendMessageJobDto>): Promise<{ messageId: string }> {
    const { groupId, senderId, content } = job.data;
    this.logger.log(`Sending message to group ${groupId} from user ${senderId}`);

    const adminClient = this.supabaseService.getAdminClient();

    // Verify membership
    const { data: membership, error: memberError } = await adminClient
      .from('group_members')
      .select('id')
      .eq('group_id', groupId)
      .eq('user_id', senderId)
      .maybeSingle();

    if (memberError || !membership) {
      throw new Error('User is not a member of this group');
    }

    // Validate content length
    if (!content || content.trim().length === 0) {
      throw new Error('Message content cannot be empty');
    }

    if (content.length > LIMITS.MAX_MESSAGE_LENGTH) {
      throw new Error(`Message exceeds maximum length of ${LIMITS.MAX_MESSAGE_LENGTH} characters`);
    }

    // Insert the message
    const { data: message, error: insertError } = await adminClient
      .from('messages')
      .insert({
        group_id: groupId,
        sender_id: senderId,
        content: content.trim(),
      })
      .select('id')
      .single();

    if (insertError || !message) {
      this.logger.error(`Failed to send message: ${insertError?.message}`);
      throw new Error(`Failed to send message: ${insertError?.message}`);
    }

    this.logger.log(`Message ${message.id} sent to group ${groupId}`);
    return { messageId: message.id };
  }
}
