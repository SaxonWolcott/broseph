import { Injectable, ForbiddenException, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { SupabaseService, PollDto, PollOptionDto, PollVoterDto, ClosePollJobDto } from '@app/shared';

@Injectable()
export class PollsService {
  constructor(
    private supabaseService: SupabaseService,
    @InjectQueue('broseph-jobs') private jobQueue: Queue,
  ) {}

  async getPoll(pollId: string, userId: string): Promise<PollDto> {
    const adminClient = this.supabaseService.getAdminClient();

    // Fetch poll
    const { data: poll, error: pollError } = await adminClient
      .from('polls')
      .select('*')
      .eq('id', pollId)
      .single();

    if (pollError || !poll) {
      throw new NotFoundException('Poll not found');
    }

    return this.buildPollDto(poll, userId);
  }

  async castVote(pollId: string, userId: string, optionIds: string[]): Promise<PollDto> {
    const adminClient = this.supabaseService.getAdminClient();

    // Fetch poll
    const { data: poll, error: pollError } = await adminClient
      .from('polls')
      .select('*')
      .eq('id', pollId)
      .single();

    if (pollError || !poll) {
      throw new NotFoundException('Poll not found');
    }

    if (poll.closed) {
      throw new BadRequestException('Poll is closed');
    }

    // Validate option count
    if (!poll.allow_multiple && optionIds.length > 1) {
      throw new BadRequestException('This poll only allows a single vote');
    }

    // Verify all optionIds belong to this poll
    const { data: validOptions } = await adminClient
      .from('poll_options')
      .select('id')
      .eq('poll_id', pollId)
      .in('id', optionIds);

    if (!validOptions || validOptions.length !== optionIds.length) {
      throw new BadRequestException('One or more option IDs are invalid');
    }

    // Delete existing votes for this user on this poll
    await adminClient
      .from('poll_votes')
      .delete()
      .eq('poll_id', pollId)
      .eq('user_id', userId);

    // Insert new votes
    const voteRows = optionIds.map((optionId) => ({
      poll_id: pollId,
      option_id: optionId,
      user_id: userId,
    }));

    const { error: voteError } = await adminClient
      .from('poll_votes')
      .insert(voteRows);

    if (voteError) {
      throw new BadRequestException(`Failed to cast vote: ${voteError.message}`);
    }

    // Check auto-close on all voted
    if (poll.declare_winner_on_all_voted) {
      await this.checkAllVoted(pollId, poll.group_id);
    }

    // Return updated poll
    return this.buildPollDto(poll, userId);
  }

  async addOption(pollId: string, userId: string, text: string): Promise<PollDto> {
    const adminClient = this.supabaseService.getAdminClient();

    const { data: poll, error: pollError } = await adminClient
      .from('polls')
      .select('*')
      .eq('id', pollId)
      .single();

    if (pollError || !poll) {
      throw new NotFoundException('Poll not found');
    }

    if (poll.closed) {
      throw new BadRequestException('Poll is closed');
    }

    if (!poll.allow_add_options) {
      throw new ForbiddenException('Adding options is not allowed for this poll');
    }

    // Get max position
    const { data: lastOption } = await adminClient
      .from('poll_options')
      .select('position')
      .eq('poll_id', pollId)
      .order('position', { ascending: false })
      .limit(1)
      .single();

    const nextPosition = (lastOption?.position ?? -1) + 1;

    const { error: insertError } = await adminClient
      .from('poll_options')
      .insert({
        poll_id: pollId,
        text,
        position: nextPosition,
        added_by: userId,
      });

    if (insertError) {
      throw new BadRequestException(`Failed to add option: ${insertError.message}`);
    }

    return this.buildPollDto(poll, userId);
  }

  async closePoll(pollId: string, userId: string): Promise<PollDto> {
    const adminClient = this.supabaseService.getAdminClient();

    const { data: poll, error: pollError } = await adminClient
      .from('polls')
      .select('*')
      .eq('id', pollId)
      .single();

    if (pollError || !poll) {
      throw new NotFoundException('Poll not found');
    }

    if (poll.closed) {
      throw new BadRequestException('Poll is already closed');
    }

    if (poll.creator_id !== userId) {
      throw new ForbiddenException('Only the poll creator can close the poll');
    }

    const winningOptionId = await this.determineWinner(pollId);

    const { error: updateError } = await adminClient
      .from('polls')
      .update({
        closed: true,
        closed_reason: 'creator',
        winning_option_id: winningOptionId,
      })
      .eq('id', pollId);

    if (updateError) {
      throw new BadRequestException(`Failed to close poll: ${updateError.message}`);
    }

    // Cancel any scheduled close job
    try {
      await this.jobQueue.remove(`close-poll-${pollId}`);
    } catch {
      // Job may not exist, ignore
    }

    // Re-fetch closed poll
    const { data: closedPoll } = await adminClient
      .from('polls')
      .select('*')
      .eq('id', pollId)
      .single();

    return this.buildPollDto(closedPoll!, userId);
  }

  /**
   * Batch-fetch poll data for a list of message IDs (for message enrichment).
   */
  async batchFetchPollData(
    messageIds: string[],
    userId: string,
  ): Promise<Map<string, PollDto>> {
    if (messageIds.length === 0) return new Map();

    const adminClient = this.supabaseService.getAdminClient();

    // Fetch polls for these messages
    const { data: polls } = await adminClient
      .from('polls')
      .select('*')
      .in('message_id', messageIds);

    if (!polls || polls.length === 0) return new Map();

    const pollIds = polls.map((p) => p.id);

    // Batch-fetch options and votes
    const [optionsResult, votesResult] = await Promise.all([
      adminClient.from('poll_options').select('*').in('poll_id', pollIds).order('position'),
      adminClient.from('poll_votes').select('*').in('poll_id', pollIds),
    ]);

    const options = optionsResult.data || [];
    const votes = votesResult.data || [];

    // Fetch voter profiles if any polls have show_votes
    const showVotesPolls = new Set(polls.filter((p) => p.show_votes).map((p) => p.id));
    const voterUserIds = [...new Set(
      votes
        .filter((v) => showVotesPolls.has(v.poll_id))
        .map((v) => v.user_id),
    )];

    let profileMap = new Map<string, { display_name: string | null; avatar_url: string | null }>();
    if (voterUserIds.length > 0) {
      const { data: profiles } = await adminClient
        .from('profiles')
        .select('id, display_name, avatar_url')
        .in('id', voterUserIds);
      profileMap = new Map(
        (profiles || []).map((p) => [p.id, { display_name: p.display_name, avatar_url: p.avatar_url }]),
      );
    }

    // Group options/votes by poll_id
    const optionsByPoll = new Map<string, typeof options>();
    for (const opt of options) {
      const list = optionsByPoll.get(opt.poll_id) || [];
      list.push(opt);
      optionsByPoll.set(opt.poll_id, list);
    }

    const votesByPoll = new Map<string, typeof votes>();
    for (const vote of votes) {
      const list = votesByPoll.get(vote.poll_id) || [];
      list.push(vote);
      votesByPoll.set(vote.poll_id, list);
    }

    // Build DTOs
    const result = new Map<string, PollDto>();
    for (const poll of polls) {
      const pollOptions = optionsByPoll.get(poll.id) || [];
      const pollVotes = votesByPoll.get(poll.id) || [];

      // Count votes per option
      const voteCounts = new Map<string, number>();
      const votersByOption = new Map<string, string[]>();
      const uniqueVoters = new Set<string>();

      for (const v of pollVotes) {
        voteCounts.set(v.option_id, (voteCounts.get(v.option_id) || 0) + 1);
        const voters = votersByOption.get(v.option_id) || [];
        voters.push(v.user_id);
        votersByOption.set(v.option_id, voters);
        uniqueVoters.add(v.user_id);
      }

      const optionDtos: PollOptionDto[] = pollOptions.map((opt) => {
        let voters: PollVoterDto[] | null = null;
        if (poll.show_votes) {
          const optVoterIds = votersByOption.get(opt.id) || [];
          voters = optVoterIds.map((uid) => {
            const profile = profileMap.get(uid);
            return {
              userId: uid,
              displayName: profile?.display_name ?? null,
              avatarUrl: profile?.avatar_url ?? null,
            };
          });
        }

        return {
          id: opt.id,
          text: opt.text,
          position: opt.position,
          voteCount: voteCounts.get(opt.id) || 0,
          voters,
          hasVoted: pollVotes.some((v) => v.option_id === opt.id && v.user_id === userId),
        };
      });

      const pollDto: PollDto = {
        id: poll.id,
        title: poll.title,
        options: optionDtos,
        allowMultiple: poll.allow_multiple,
        showVotes: poll.show_votes,
        allowAddOptions: poll.allow_add_options,
        declareWinnerOnAllVoted: poll.declare_winner_on_all_voted,
        closesAt: poll.closes_at,
        closed: poll.closed,
        closedReason: poll.closed_reason,
        winningOptionId: poll.winning_option_id,
        creatorId: poll.creator_id,
        totalVoters: uniqueVoters.size,
      };

      result.set(poll.message_id, pollDto);
    }

    return result;
  }

  private async buildPollDto(poll: Record<string, unknown>, userId: string): Promise<PollDto> {
    const map = await this.batchFetchPollData([poll.message_id as string], userId);
    const dto = map.get(poll.message_id as string);
    if (!dto) throw new NotFoundException('Poll data not found');
    return dto;
  }

  private async determineWinner(pollId: string): Promise<string | null> {
    const adminClient = this.supabaseService.getAdminClient();

    const { data: votes } = await adminClient
      .from('poll_votes')
      .select('option_id')
      .eq('poll_id', pollId);

    if (!votes || votes.length === 0) return null;

    const counts = new Map<string, number>();
    for (const v of votes) {
      counts.set(v.option_id, (counts.get(v.option_id) || 0) + 1);
    }

    let maxCount = 0;
    let winnerId: string | null = null;
    let tieCount = 0;

    for (const [optionId, count] of counts) {
      if (count > maxCount) {
        maxCount = count;
        winnerId = optionId;
        tieCount = 1;
      } else if (count === maxCount) {
        tieCount++;
      }
    }

    return tieCount === 1 ? winnerId : null;
  }

  private async checkAllVoted(pollId: string, groupId: string): Promise<void> {
    const adminClient = this.supabaseService.getAdminClient();

    // Get member count
    const { count: memberCount } = await adminClient
      .from('group_members')
      .select('id', { count: 'exact', head: true })
      .eq('group_id', groupId);

    // Get unique voter count
    const { data: voters } = await adminClient
      .from('poll_votes')
      .select('user_id')
      .eq('poll_id', pollId);

    const uniqueVoters = new Set((voters || []).map((v) => v.user_id));

    if (memberCount && uniqueVoters.size >= memberCount) {
      // All members voted — close the poll
      const winningOptionId = await this.determineWinner(pollId);

      await adminClient
        .from('polls')
        .update({
          closed: true,
          closed_reason: 'all_voted',
          winning_option_id: winningOptionId,
        })
        .eq('id', pollId)
        .eq('closed', false); // Only if not already closed

      // Cancel any scheduled close job
      try {
        await this.jobQueue.remove(`close-poll-${pollId}`);
      } catch {
        // Ignore
      }
    }
  }
}
