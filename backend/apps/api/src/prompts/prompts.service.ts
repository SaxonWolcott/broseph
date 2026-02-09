import {
  Injectable,
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import {
  SupabaseService,
  PendingPromptDto,
  PendingPromptsListDto,
  FeedListDto,
  FeedItemDto,
  ErrorCode,
  ERROR_MESSAGES,
  SAMPLE_PROMPTS_MAP,
  getPromptForGroupOnDate,
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
      .select('id, group_id, user_id, prompt_id, content, created_at')
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
          ? { id: samplePrompt.id, text: samplePrompt.text, category: samplePrompt.category }
          : { id: r.prompt_id, text: 'Unknown prompt' },
        user: {
          id: r.user_id,
          displayName: profile?.display_name ?? null,
          avatarUrl: profile?.avatar_url ?? null,
        },
        groupId: r.group_id,
        groupName: group?.name ?? 'Unknown',
        content: r.content,
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
        content,
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

    return { id: inserted.id, status: 'created' };
  }
}
