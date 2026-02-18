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
  SAMPLE_PROMPTS_MAP,
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
   * Excludes prompt_reply type (popup-only replies) from the chat stream.
   */
  async getMessages(
    groupId: string,
    accessToken: string,
    options: { cursor?: string; limit: number },
  ): Promise<MessageListDto> {
    const userClient = this.supabaseService.getClientForUser(accessToken);
    const { cursor, limit } = options;

    // Build the query — exclude prompt_reply (popup-only) messages
    let query = userClient
      .from('messages')
      .select(
        `
        id,
        group_id,
        sender_id,
        content,
        created_at,
        type,
        prompt_response_id,
        reply_to_id,
        image_urls,
        sender:sender_id (
          id,
          display_name,
          handle,
          avatar_url
        )
      `,
      )
      .eq('group_id', groupId)
      .neq('type', 'prompt_reply')
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

    // Collect ALL prompt_response_ids (from both prompt_response cards AND reply-in-chat messages)
    const promptResponseIds = resultMessages
      .filter((m) => m.prompt_response_id)
      .map((m) => m.prompt_response_id as string);

    const uniquePrIds = [...new Set(promptResponseIds)];

    let promptResponseMap = new Map<string, { prompt_id: string; content: string; user_id: string }>();
    let replyCountMap = new Map<string, number>();
    let responderProfileMap = new Map<string, { display_name: string | null; avatar_url: string | null }>();

    if (uniquePrIds.length > 0) {
      const adminClient = this.supabaseService.getAdminClient();
      const [prResult, rcResult] = await Promise.all([
        adminClient
          .from('prompt_responses')
          .select('id, prompt_id, content, user_id')
          .in('id', uniquePrIds),
        adminClient
          .from('messages')
          .select('prompt_response_id')
          .in('prompt_response_id', uniquePrIds)
          .eq('type', 'prompt_reply'),
      ]);

      promptResponseMap = new Map(
        (prResult.data || []).map((pr) => [pr.id, { prompt_id: pr.prompt_id, content: pr.content, user_id: pr.user_id }]),
      );

      for (const row of rcResult.data || []) {
        const rid = row.prompt_response_id;
        replyCountMap.set(rid, (replyCountMap.get(rid) || 0) + 1);
      }

      // Batch-fetch responder profiles for ghost previews
      const responderUserIds = [...new Set((prResult.data || []).map((pr) => pr.user_id))];
      if (responderUserIds.length > 0) {
        const { data: profiles } = await adminClient
          .from('profiles')
          .select('id, display_name, avatar_url')
          .in('id', responderUserIds);

        responderProfileMap = new Map(
          (profiles || []).map((p) => [p.id, { display_name: p.display_name, avatar_url: p.avatar_url }]),
        );
      }
    }

    // Batch-fetch reply-to messages for replyToPreview
    const replyToIds = resultMessages
      .filter((m) => m.reply_to_id)
      .map((m) => m.reply_to_id as string);

    const uniqueReplyToIds = [...new Set(replyToIds)];
    let replyToMap = new Map<string, { content: string; sender_id: string | null; image_urls: string[] | null }>();
    let replyToSenderMap = new Map<string, { display_name: string | null; avatar_url: string | null }>();

    if (uniqueReplyToIds.length > 0) {
      const adminClient2 = this.supabaseService.getAdminClient();
      const { data: replyToMessages } = await adminClient2
        .from('messages')
        .select('id, content, sender_id, image_urls')
        .in('id', uniqueReplyToIds);

      replyToMap = new Map(
        (replyToMessages || []).map((rm) => [rm.id, { content: rm.content, sender_id: rm.sender_id, image_urls: rm.image_urls }]),
      );

      // Fetch sender profiles for reply-to messages
      const replyToSenderIds = [...new Set(
        (replyToMessages || []).filter((rm) => rm.sender_id).map((rm) => rm.sender_id as string),
      )];
      if (replyToSenderIds.length > 0) {
        const { data: rtProfiles } = await adminClient2
          .from('profiles')
          .select('id, display_name, avatar_url')
          .in('id', replyToSenderIds);

        replyToSenderMap = new Map(
          (rtProfiles || []).map((p) => [p.id, { display_name: p.display_name, avatar_url: p.avatar_url }]),
        );
      }
    }

    const messageDtos: MessageDto[] = resultMessages.map((m) => {
      let sender: MessageSenderDto | null = null;

      if (m.sender_id) {
        const senderProfile = m.sender as unknown as {
          id: string;
          display_name: string | null;
          handle: string | null;
          avatar_url: string | null;
        } | null;

        sender = {
          id: m.sender_id,
          displayName: senderProfile?.display_name ?? null,
          handle: senderProfile?.handle ?? null,
          avatarUrl: senderProfile?.avatar_url ?? null,
        };
      }

      const messageType = ((m as unknown as { type: string }).type as 'message' | 'system' | 'prompt_response') ?? 'message';
      const promptResponseId = (m.prompt_response_id as string) ?? null;

      // Enrich messages that have a linked prompt response
      let promptData: MessageDto['promptData'] = null;
      let replyCount: number | null = null;

      if (promptResponseId) {
        const pr = promptResponseMap.get(promptResponseId);
        if (pr) {
          const prompt = SAMPLE_PROMPTS_MAP[pr.prompt_id];
          const responderProfile = responderProfileMap.get(pr.user_id);

          promptData = {
            promptId: pr.prompt_id,
            promptText: prompt?.text ?? 'Unknown prompt',
            promptCategory: prompt?.category,
            responseContent: pr.content,
            responseSenderName: responderProfile?.display_name ?? undefined,
            responseSenderAvatarUrl: responderProfile?.avatar_url ?? undefined,
          };
        }
        replyCount = replyCountMap.get(promptResponseId) || 0;
      }

      // Enrich reply-to preview
      const replyToId = (m.reply_to_id as string) ?? null;
      let replyToPreview: MessageDto['replyToPreview'] = null;

      if (replyToId) {
        const replyToMsg = replyToMap.get(replyToId);
        if (replyToMsg) {
          const rtSender = replyToMsg.sender_id ? replyToSenderMap.get(replyToMsg.sender_id) : null;
          const imageCount = replyToMsg.image_urls?.length ?? 0;
          const previewContent = replyToMsg.content && replyToMsg.content.length > 0
            ? (replyToMsg.content.length > 100 ? replyToMsg.content.slice(0, 100) + '...' : replyToMsg.content)
            : (imageCount === 1 ? '[Image]' : imageCount > 1 ? `[${imageCount} images]` : '');
          replyToPreview = {
            senderName: rtSender?.display_name ?? null,
            senderAvatarUrl: rtSender?.avatar_url ?? null,
            content: previewContent,
            imageUrls: replyToMsg.image_urls ?? null,
          };
        }
      }

      const imageUrls = (m as unknown as { image_urls: string[] | null }).image_urls ?? null;

      return {
        id: m.id,
        groupId: m.group_id,
        sender,
        content: m.content,
        createdAt: m.created_at,
        type: messageType,
        promptResponseId,
        promptData,
        replyCount,
        imageUrls,
        replyToId,
        replyToPreview,
      };
    });

    return {
      messages: messageDtos,
      nextCursor: hasMore ? resultMessages[resultMessages.length - 1].id : null,
      hasMore,
    };
  }
}
