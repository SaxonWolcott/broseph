import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { User } from '@supabase/supabase-js';
import {
  CreatePollDto,
  CastVoteDto,
  AddPollOptionDto,
  PollDto,
  CreatePollJobDto,
  generateId,
} from '@app/shared';
import { PollsService } from './polls.service';
import { MessagesService } from '../messages/messages.service';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard';
import {
  CurrentUser,
  AccessToken,
} from '../auth/decorators/current-user.decorator';

class JobAcceptedDto {
  jobId!: string;
  status!: string;
}

@ApiTags('Polls')
@Controller('api/groups/:groupId/polls')
@UseGuards(SupabaseAuthGuard)
@ApiBearerAuth()
export class PollsController {
  constructor(
    private pollsService: PollsService,
    private messagesService: MessagesService,
    @InjectQueue('broseph-jobs') private jobQueue: Queue,
  ) {}

  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Create a poll in a group' })
  @ApiResponse({ status: 202, description: 'Poll creation queued', type: JobAcceptedDto })
  async createPoll(
    @Param('groupId', ParseUUIDPipe) groupId: string,
    @CurrentUser() user: User,
    @AccessToken() token: string,
    @Body() dto: CreatePollDto,
  ): Promise<JobAcceptedDto> {
    await this.messagesService.validateMembership(groupId, user.id, token);

    const jobId = generateId();
    const jobData: CreatePollJobDto = {
      groupId,
      creatorId: user.id,
      title: dto.title,
      options: dto.options.map((o) => ({ text: o.text })),
      settings: {
        allowMultiple: dto.settings?.allowMultiple ?? false,
        showVotes: dto.settings?.showVotes ?? true,
        allowAddOptions: dto.settings?.allowAddOptions ?? false,
        declareWinnerOnAllVoted: dto.settings?.declareWinnerOnAllVoted ?? false,
        closesAt: dto.settings?.closesAt,
      },
    };

    await this.jobQueue.add('create-poll', jobData, { jobId });
    return { jobId, status: 'queued' };
  }

  @Get(':pollId')
  @ApiOperation({ summary: 'Get poll data' })
  @ApiResponse({ status: 200, type: PollDto })
  async getPoll(
    @Param('groupId', ParseUUIDPipe) groupId: string,
    @Param('pollId', ParseUUIDPipe) pollId: string,
    @CurrentUser() user: User,
    @AccessToken() token: string,
  ): Promise<PollDto> {
    await this.messagesService.validateMembership(groupId, user.id, token);
    return this.pollsService.getPoll(pollId, user.id);
  }

  @Post(':pollId/vote')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cast or change vote on a poll' })
  @ApiResponse({ status: 200, type: PollDto })
  async castVote(
    @Param('groupId', ParseUUIDPipe) groupId: string,
    @Param('pollId', ParseUUIDPipe) pollId: string,
    @CurrentUser() user: User,
    @AccessToken() token: string,
    @Body() dto: CastVoteDto,
  ): Promise<PollDto> {
    await this.messagesService.validateMembership(groupId, user.id, token);
    return this.pollsService.castVote(pollId, user.id, dto.optionIds);
  }

  @Post(':pollId/options')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Add an option to a poll' })
  @ApiResponse({ status: 200, type: PollDto })
  async addOption(
    @Param('groupId', ParseUUIDPipe) groupId: string,
    @Param('pollId', ParseUUIDPipe) pollId: string,
    @CurrentUser() user: User,
    @AccessToken() token: string,
    @Body() dto: AddPollOptionDto,
  ): Promise<PollDto> {
    await this.messagesService.validateMembership(groupId, user.id, token);
    return this.pollsService.addOption(pollId, user.id, dto.text);
  }

  @Post(':pollId/close')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Close a poll (creator only)' })
  @ApiResponse({ status: 200, type: PollDto })
  async closePoll(
    @Param('groupId', ParseUUIDPipe) groupId: string,
    @Param('pollId', ParseUUIDPipe) pollId: string,
    @CurrentUser() user: User,
    @AccessToken() token: string,
  ): Promise<PollDto> {
    await this.messagesService.validateMembership(groupId, user.id, token);
    return this.pollsService.closePoll(pollId, user.id);
  }
}
