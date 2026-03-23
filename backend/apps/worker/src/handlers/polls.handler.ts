import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Job, Queue } from 'bullmq';
import { SupabaseService, CreatePollJobDto, ClosePollJobDto } from '@app/shared';

@Injectable()
export class PollsHandler {
  private readonly logger = new Logger(PollsHandler.name);

  constructor(
    private supabaseService: SupabaseService,
    @InjectQueue('broseph-jobs') private jobQueue: Queue,
  ) {}

  async handleCreatePoll(job: Job<CreatePollJobDto>): Promise<{ messageId: string; pollId: string }> {
    const { groupId, creatorId, title, options, settings } = job.data;
    this.logger.log(`Creating poll "${title}" in group ${groupId}`);

    const adminClient = this.supabaseService.getAdminClient();

    // Verify membership
    const { data: membership, error: memberError } = await adminClient
      .from('group_members')
      .select('id')
      .eq('group_id', groupId)
      .eq('user_id', creatorId)
      .maybeSingle();

    if (memberError || !membership) {
      throw new Error('User is not a member of this group');
    }

    // 1. Insert the message with type 'poll'
    const { data: message, error: msgError } = await adminClient
      .from('messages')
      .insert({
        group_id: groupId,
        sender_id: creatorId,
        content: title,
        type: 'poll',
      })
      .select('id')
      .single();

    if (msgError || !message) {
      throw new Error(`Failed to create poll message: ${msgError?.message}`);
    }

    // 2. Insert the poll
    const { data: poll, error: pollError } = await adminClient
      .from('polls')
      .insert({
        message_id: message.id,
        group_id: groupId,
        creator_id: creatorId,
        title,
        allow_multiple: settings.allowMultiple,
        show_votes: settings.showVotes,
        allow_add_options: settings.allowAddOptions,
        declare_winner_on_all_voted: settings.declareWinnerOnAllVoted,
        closes_at: settings.closesAt ?? null,
      })
      .select('id')
      .single();

    if (pollError || !poll) {
      throw new Error(`Failed to create poll: ${pollError?.message}`);
    }

    // 3. Insert poll options
    const optionRows = options.map((opt, i) => ({
      poll_id: poll.id,
      text: opt.text,
      position: i,
      added_by: creatorId,
    }));

    const { error: optError } = await adminClient
      .from('poll_options')
      .insert(optionRows);

    if (optError) {
      throw new Error(`Failed to create poll options: ${optError.message}`);
    }

    // 4. Schedule delayed close job if closes_at is set
    if (settings.closesAt) {
      const delay = new Date(settings.closesAt).getTime() - Date.now();
      if (delay > 0) {
        await this.jobQueue.add(
          'close-poll',
          { pollId: poll.id, reason: 'time_limit' } satisfies ClosePollJobDto,
          { delay, jobId: `close-poll-${poll.id}` },
        );
        this.logger.log(`Scheduled close-poll job for poll ${poll.id} in ${delay}ms`);
      }
    }

    this.logger.log(`Poll ${poll.id} created for message ${message.id}`);
    return { messageId: message.id, pollId: poll.id };
  }

  async handleClosePoll(job: Job<ClosePollJobDto>): Promise<{ pollId: string }> {
    const { pollId, reason } = job.data;
    this.logger.log(`Closing poll ${pollId} with reason: ${reason}`);

    const adminClient = this.supabaseService.getAdminClient();

    // Check if already closed
    const { data: poll, error: fetchError } = await adminClient
      .from('polls')
      .select('id, closed')
      .eq('id', pollId)
      .single();

    if (fetchError || !poll) {
      throw new Error(`Poll not found: ${pollId}`);
    }

    if (poll.closed) {
      this.logger.log(`Poll ${pollId} already closed, skipping`);
      return { pollId };
    }

    // Determine winner
    const winningOptionId = await this.determineWinner(pollId);

    // Close the poll
    const { error: updateError } = await adminClient
      .from('polls')
      .update({
        closed: true,
        closed_reason: reason,
        winning_option_id: winningOptionId,
      })
      .eq('id', pollId);

    if (updateError) {
      throw new Error(`Failed to close poll: ${updateError.message}`);
    }

    this.logger.log(`Poll ${pollId} closed with winner: ${winningOptionId ?? 'tie/none'}`);
    return { pollId };
  }

  async determineWinner(pollId: string): Promise<string | null> {
    const adminClient = this.supabaseService.getAdminClient();

    const { data: votes } = await adminClient
      .from('poll_votes')
      .select('option_id')
      .eq('poll_id', pollId);

    if (!votes || votes.length === 0) return null;

    // Count votes per option
    const counts = new Map<string, number>();
    for (const v of votes) {
      counts.set(v.option_id, (counts.get(v.option_id) || 0) + 1);
    }

    // Find the max count
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

    // If there's a tie, no single winner
    return tieCount === 1 ? winnerId : null;
  }
}
