import {
  Injectable,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import {
  SupabaseService,
  PendingPromptDto,
  PendingPromptsListDto,
  FeedListDto,
  FeedItemDto,
  GroupPromptTodayDto,
  PromptResponseRepliesListDto,
  ErrorCode,
  ERROR_MESSAGES,
  SAMPLE_PROMPTS_MAP,
  getPromptForGroupOnDate,
  generateId,
} from '@app/shared';

@Injectable()
export class PromptsService {
  constructor(private supabaseService: SupabaseService) {}

  /**
   * Get today's unanswered prompts for the user's groups.
   */
  async getPromptsToDo(userId: string): Promise<PendingPromptsListDto> {
    const adminClient = this.supabaseService.getAdminClient();
    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10); // YYYY-MM-DD

    // 1. Get user's groups
    const { data: memberships, error: memberError } = await adminClient
      .from('group_members')
      .select(`
        group_id,
        groups!inner ( id, name )
      `)
      .eq('user_id', userId);

    if (memberError) {
      throw new BadRequestException(`Failed to fetch groups: ${memberError.message}`);
    }

    if (!memberships || memberships.length === 0) {
      return { prompts: [], allComplete: true };
    }

    const groupIds = memberships.map((m) => m.group_id);

    // 2. Get today's responses from this user
    const { data: answered, error: answeredError } = await adminClient
      .from('prompt_responses')
      .select('group_id')
      .eq('user_id', userId)
      .eq('response_date', todayStr);

    if (answeredError) {
      throw new BadRequestException(`Failed to check responses: ${answeredError.message}`);
    }

    const answeredGroupIds = new Set((answered || []).map((r) => r.group_id));

    // 3. Build pending list — only groups not yet answered
    const prompts: PendingPromptDto[] = [];

    for (const membership of memberships) {
      const group = membership.groups as unknown as { id: string; name: string };
      if (answeredGroupIds.has(group.id)) continue;

      const samplePrompt = getPromptForGroupOnDate(group.id, today);
      prompts.push({
        groupId: group.id,
        groupName: group.name,
        prompt: {
          id: samplePrompt.id,
          text: samplePrompt.text,
          category: samplePrompt.category,
          responseType: samplePrompt.responseType,
        },
      });
    }

    return {
      prompts,
      allComplete: prompts.length === 0 && groupIds.length > 0,
    };
  }

  /**
   * Get the prompt response feed for the user's groups.
   */
  async getFeed(userId: string): Promise<FeedListDto> {
    const adminClient = this.supabaseService.getAdminClient();

    // 1. Get user's group IDs
    const { data: memberships, error: memberError } = await adminClient
      .from('group_members')
      .select('group_id')
      .eq('user_id', userId);

    if (memberError) {
      throw new BadRequestException(`Failed to fetch groups: ${memberError.message}`);
    }

    if (!memberships || memberships.length === 0) {
      return { responses: [] };
    }

    const groupIds = memberships.map((m) => m.group_id);

    // 2. Fetch recent responses (no joins — avoids PostgREST FK resolution issues)
    const { data: rawResponses, error: feedError } = await adminClient
      .from('prompt_responses')
      .select('id, group_id, user_id, prompt_id, content, image_url, created_at')
      .in('group_id', groupIds)
      .order('created_at', { ascending: false })
      .limit(50);

    if (feedError) {
      throw new BadRequestException(`Failed to fetch feed: ${feedError.message}`);
    }

    if (!rawResponses || rawResponses.length === 0) {
      return { responses: [] };
    }

    // 3. Batch-fetch profiles and group names for the results
    const userIds = [...new Set(rawResponses.map((r) => r.user_id))];
    const responseGroupIds = [...new Set(rawResponses.map((r) => r.group_id))];

    const [profilesResult, groupsResult] = await Promise.all([
      adminClient
        .from('profiles')
        .select('id, display_name, avatar_url')
        .in('id', userIds),
      adminClient
        .from('groups')
        .select('id, name')
        .in('id', responseGroupIds),
    ]);

    const profileMap = new Map(
      (profilesResult.data || []).map((p) => [p.id, p]),
    );
    const groupMap = new Map(
      (groupsResult.data || []).map((g) => [g.id, g]),
    );

    // 4. Map to DTOs, enriching with prompt text from constant map
    const responses: FeedItemDto[] = rawResponses.map((r) => {
      const profile = profileMap.get(r.user_id);
      const group = groupMap.get(r.group_id);
      const samplePrompt = SAMPLE_PROMPTS_MAP[r.prompt_id];

      return {
        id: r.id,
        prompt: samplePrompt
          ? { id: samplePrompt.id, text: samplePrompt.text, category: samplePrompt.category, responseType: samplePrompt.responseType }
          : { id: r.prompt_id, text: 'Unknown prompt', responseType: 'text' as const },
        user: {
          id: r.user_id,
          displayName: profile?.display_name ?? null,
          avatarUrl: profile?.avatar_url ?? null,
        },
        groupId: r.group_id,
        groupName: group?.name ?? 'Unknown',
        content: r.content,
        imageUrl: r.image_url ?? null,
        createdAt: r.created_at,
      };
    });

    return { responses };
  }

  /**
   * Submit a prompt response for a group.
   */
  async submitResponse(
    userId: string,
    groupId: string,
    content: string,
    imageUrl?: string,
  ): Promise<{ id: string; status: string }> {
    const adminClient = this.supabaseService.getAdminClient();
    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);

    // 1. Validate membership
    const { data: member, error: memberError } = await adminClient
      .from('group_members')
      .select('id')
      .eq('group_id', groupId)
      .eq('user_id', userId)
      .maybeSingle();

    if (memberError || !member) {
      throw new ForbiddenException(ERROR_MESSAGES[ErrorCode.NOT_GROUP_MEMBER]);
    }

    // 2. Get today's prompt for this group
    const samplePrompt = getPromptForGroupOnDate(groupId, today);

    // 3. Insert response — unique constraint catches double-submits
    const { data: inserted, error: insertError } = await adminClient
      .from('prompt_responses')
      .insert({
        group_id: groupId,
        user_id: userId,
        prompt_id: samplePrompt.id,
        response_date: todayStr,
        content: content || '',
        image_url: imageUrl || null,
      })
      .select('id')
      .single();

    if (insertError) {
      // Unique constraint violation → already answered
      if (insertError.code === '23505') {
        throw new ConflictException(ERROR_MESSAGES[ErrorCode.PROMPT_ALREADY_ANSWERED]);
      }
      throw new BadRequestException(`Failed to submit response: ${insertError.message}`);
    }

    // 4. Post a prompt_response message in the group chat
    await adminClient.from('messages').insert({
      id: generateId(),
      group_id: groupId,
      sender_id: userId,
      content: content || '',
      type: 'prompt_response',
      prompt_response_id: inserted.id,
      image_urls: imageUrl ? [imageUrl] : null,
    });

    return { id: inserted.id, status: 'created' };
  }

  /**
   * Get today's prompt for a specific group, including response status and respondents.
   */
  async getGroupPromptToday(userId: string, groupId: string): Promise<GroupPromptTodayDto> {
    const adminClient = this.supabaseService.getAdminClient();
    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10); // YYYY-MM-DD

    // 1. Validate user is a member of the group
    const { data: member, error: memberError } = await adminClient
      .from('group_members')
      .select('id')
      .eq('group_id', groupId)
      .eq('user_id', userId)
      .maybeSingle();

    if (memberError || !member) {
      throw new ForbiddenException(ERROR_MESSAGES[ErrorCode.NOT_GROUP_MEMBER]);
    }

    // 2. Get today's prompt
    const samplePrompt = getPromptForGroupOnDate(groupId, today);

    // 3. Query prompt_responses for today + this group (with content)
    const { data: responses, error: responsesError } = await adminClient
      .from('prompt_responses')
      .select('id, user_id, content, image_url, created_at')
      .eq('group_id', groupId)
      .eq('response_date', todayStr);

    if (responsesError) {
      throw new BadRequestException(`Failed to fetch responses: ${responsesError.message}`);
    }

    const respondedUserIds = responses?.map((r) => r.user_id) || [];
    const hasResponded = respondedUserIds.includes(userId);
    const responseIds = responses?.map((r) => r.id) || [];

    // 4. Batch-fetch profiles and reply counts
    let respondents: Array<{
      userId: string;
      displayName: string | null;
      avatarUrl: string | null;
      responseId: string;
      content: string;
      imageUrl: string | null;
      createdAt: string;
      replyCount: number;
    }> = [];

    if (respondedUserIds.length > 0) {
      const [profilesResult, replyCountsResult] = await Promise.all([
        adminClient
          .from('profiles')
          .select('id, display_name, avatar_url')
          .in('id', respondedUserIds),
        responseIds.length > 0
          ? adminClient
              .from('messages')
              .select('prompt_response_id')
              .in('prompt_response_id', responseIds)
              .eq('type', 'prompt_reply')
          : Promise.resolve({ data: [] as { prompt_response_id: string }[] }),
      ]);

      if (profilesResult.error) {
        throw new BadRequestException(`Failed to fetch respondent profiles: ${profilesResult.error.message}`);
      }

      // Count replies per response
      const replyCountMap = new Map<string, number>();
      for (const row of replyCountsResult.data || []) {
        const rid = row.prompt_response_id;
        replyCountMap.set(rid, (replyCountMap.get(rid) || 0) + 1);
      }

      const profileMap = new Map(
        (profilesResult.data || []).map((p) => [p.id, p]),
      );

      respondents = (responses || []).map((r) => {
        const profile = profileMap.get(r.user_id);
        return {
          userId: r.user_id,
          displayName: profile?.display_name ?? null,
          avatarUrl: profile?.avatar_url ?? null,
          responseId: r.id,
          content: r.content,
          imageUrl: r.image_url ?? null,
          createdAt: r.created_at,
          replyCount: replyCountMap.get(r.id) || 0,
        };
      });
    }

    return {
      prompt: {
        id: samplePrompt.id,
        text: samplePrompt.text,
        category: samplePrompt.category,
        responseType: samplePrompt.responseType,
      },
      hasResponded,
      respondents,
    };
  }

  /**
   * Get replies to a specific prompt response.
   */
  async getResponseReplies(
    userId: string,
    responseId: string,
  ): Promise<PromptResponseRepliesListDto> {
    const adminClient = this.supabaseService.getAdminClient();

    // 1. Fetch the prompt response to get its group_id
    const { data: promptResponse, error: prError } = await adminClient
      .from('prompt_responses')
      .select('id, group_id')
      .eq('id', responseId)
      .maybeSingle();

    if (prError || !promptResponse) {
      throw new NotFoundException('Prompt response not found');
    }

    // 2. Validate membership
    const { data: member, error: memberError } = await adminClient
      .from('group_members')
      .select('id')
      .eq('group_id', promptResponse.group_id)
      .eq('user_id', userId)
      .maybeSingle();

    if (memberError || !member) {
      throw new ForbiddenException(ERROR_MESSAGES[ErrorCode.NOT_GROUP_MEMBER]);
    }

    // 3. Fetch comment messages (popup-only, not reply-in-chat)
    const { data: replies, error: repliesError } = await adminClient
      .from('messages')
      .select('id, sender_id, content, created_at')
      .eq('prompt_response_id', responseId)
      .eq('type', 'prompt_reply')
      .order('created_at', { ascending: true })
      .limit(50);

    if (repliesError) {
      throw new BadRequestException(`Failed to fetch replies: ${repliesError.message}`);
    }

    if (!replies || replies.length === 0) {
      return { replies: [] };
    }

    // 4. Batch-fetch sender profiles
    const senderIds = [...new Set(replies.map((r) => r.sender_id).filter(Boolean))];
    const { data: profiles } = await adminClient
      .from('profiles')
      .select('id, display_name, avatar_url')
      .in('id', senderIds);

    const profileMap = new Map(
      (profiles || []).map((p) => [p.id, p]),
    );

    return {
      replies: replies.map((r) => {
        const profile = r.sender_id ? profileMap.get(r.sender_id) : null;
        return {
          id: r.id,
          sender: {
            id: r.sender_id || '',
            displayName: profile?.display_name ?? null,
            avatarUrl: profile?.avatar_url ?? null,
          },
          content: r.content,
          createdAt: r.created_at,
        };
      }),
    };
  }
}
