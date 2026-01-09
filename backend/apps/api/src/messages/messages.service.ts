import {
  Injectable,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import {
  SupabaseService,
  MessageDto,
  MessageListDto,
  MessageSenderDto,
  ErrorCode,
  ERROR_MESSAGES,
} from '@app/shared';

@Injectable()
export class MessagesService {
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
   * Get messages for a group with cursor-based pagination.
   */
  async getMessages(
    groupId: string,
    accessToken: string,
    options: { cursor?: string; limit: number },
  ): Promise<MessageListDto> {
    const userClient = this.supabaseService.getClientForUser(accessToken);
    const { cursor, limit } = options;

    // Build the query
    let query = userClient
      .from('messages')
      .select(
        `
        id,
        group_id,
        sender_id,
        content,
        created_at,
        sender:sender_id (
          id,
          display_name,
          handle,
          avatar_url
        )
      `,
      )
      .eq('group_id', groupId)
      .order('created_at', { ascending: false })
      .limit(limit + 1); // Fetch one extra to check if there are more

    // If cursor provided, fetch messages before that cursor
    if (cursor) {
      // First get the cursor message's created_at
      const { data: cursorMessage } = await userClient
        .from('messages')
        .select('created_at')
        .eq('id', cursor)
        .single();

      if (cursorMessage) {
        query = query.lt('created_at', cursorMessage.created_at);
      }
    }

    const { data: messages, error } = await query;

    if (error) {
      throw new BadRequestException('Failed to fetch messages');
    }

    const hasMore = messages && messages.length > limit;
    const resultMessages = hasMore ? messages.slice(0, limit) : messages || [];

    const messageDtos: MessageDto[] = resultMessages.map((m) => {
      const senderProfile = m.sender as unknown as {
        id: string;
        display_name: string | null;
        handle: string | null;
        avatar_url: string | null;
      } | null;

      const sender: MessageSenderDto = {
        id: m.sender_id,
        displayName: senderProfile?.display_name ?? null,
        handle: senderProfile?.handle ?? null,
        avatarUrl: senderProfile?.avatar_url ?? null,
      };

      return {
        id: m.id,
        groupId: m.group_id,
        sender,
        content: m.content,
        createdAt: m.created_at,
      };
    });

    return {
      messages: messageDtos,
      nextCursor: hasMore ? resultMessages[resultMessages.length - 1].id : null,
      hasMore,
    };
  }
}
