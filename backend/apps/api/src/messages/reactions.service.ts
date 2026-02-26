import { Injectable } from '@nestjs/common';
import {
  SupabaseService,
  ReactionDto,
  ToggleReactionResponseDto,
} from '@app/shared';

@Injectable()
export class ReactionsService {
  constructor(private supabaseService: SupabaseService) {}

  /**
   * Toggle a reaction on a message. Removes if it exists, inserts if it doesn't.
   * Returns updated reaction list for the message.
   */
  async toggleReaction(
    messageId: string,
    userId: string,
    emoji: string,
  ): Promise<ToggleReactionResponseDto> {
    const adminClient = this.supabaseService.getAdminClient();

    // Check if the user already reacted with this emoji
    const { data: existing } = await adminClient
      .from('message_reactions')
      .select('id')
      .eq('message_id', messageId)
      .eq('user_id', userId)
      .eq('emoji', emoji)
      .maybeSingle();

    let action: 'added' | 'removed';

    if (existing) {
      await adminClient
        .from('message_reactions')
        .delete()
        .eq('id', existing.id);
      action = 'removed';
    } else {
      await adminClient
        .from('message_reactions')
        .insert({ message_id: messageId, user_id: userId, emoji });
      action = 'added';
    }

    // Fetch updated reactions for the message
    const reactions = await this.getReactionsForMessage(messageId, userId);

    return { action, reactions };
  }

  /**
   * Get aggregated reactions for a single message.
   */
  private async getReactionsForMessage(
    messageId: string,
    userId: string,
  ): Promise<ReactionDto[]> {
    const adminClient = this.supabaseService.getAdminClient();

    const { data: rows } = await adminClient
      .from('message_reactions')
      .select('emoji, user_id')
      .eq('message_id', messageId);

    if (!rows || rows.length === 0) return [];

    return this.aggregateReactions(rows, userId);
  }

  /**
   * Batch-fetch reactions for multiple messages. Returns a map of messageId → ReactionDto[].
   */
  async batchFetchReactions(
    messageIds: string[],
    userId: string,
  ): Promise<Map<string, ReactionDto[]>> {
    if (messageIds.length === 0) return new Map();

    const adminClient = this.supabaseService.getAdminClient();

    const { data: rows } = await adminClient
      .from('message_reactions')
      .select('message_id, emoji, user_id')
      .in('message_id', messageIds);

    if (!rows || rows.length === 0) return new Map();

    // Group by message_id
    const byMessage = new Map<string, { emoji: string; user_id: string }[]>();
    for (const row of rows) {
      const existing = byMessage.get(row.message_id) || [];
      existing.push({ emoji: row.emoji, user_id: row.user_id });
      byMessage.set(row.message_id, existing);
    }

    // Aggregate each message's reactions
    const result = new Map<string, ReactionDto[]>();
    for (const [msgId, reactions] of byMessage) {
      result.set(msgId, this.aggregateReactions(reactions, userId));
    }

    return result;
  }

  /**
   * Aggregate raw reaction rows into ReactionDto[] (emoji + count + hasReacted).
   */
  private aggregateReactions(
    rows: { emoji: string; user_id: string }[],
    userId: string,
  ): ReactionDto[] {
    const emojiMap = new Map<string, { count: number; hasReacted: boolean }>();

    for (const row of rows) {
      const existing = emojiMap.get(row.emoji) || { count: 0, hasReacted: false };
      existing.count++;
      if (row.user_id === userId) existing.hasReacted = true;
      emojiMap.set(row.emoji, existing);
    }

    return Array.from(emojiMap.entries()).map(([emoji, data]) => ({
      emoji,
      count: data.count,
      hasReacted: data.hasReacted,
    }));
  }
}
