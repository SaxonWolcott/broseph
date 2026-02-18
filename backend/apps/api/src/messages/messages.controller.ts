import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
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
import { SendMessageDto, MessagesQueryDto, MessageListDto } from '@app/shared';
import { MessagesService } from './messages.service';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard';
import {
  CurrentUser,
  AccessToken,
} from '../auth/decorators/current-user.decorator';
import { generateId } from '@app/shared';

// Response DTO for queued operations
class JobAcceptedDto {
  jobId!: string;
  status!: string;
}

@ApiTags('Messages')
@Controller('api/groups/:groupId/messages')
@UseGuards(SupabaseAuthGuard)
@ApiBearerAuth()
export class MessagesController {
  constructor(
    private messagesService: MessagesService,
    @InjectQueue('broseph-jobs') private jobQueue: Queue,
  ) {}

  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Send a message to a group' })
  @ApiResponse({
    status: 202,
    description: 'Message queued for delivery',
    type: JobAcceptedDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid message' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Not a member of this group' })
  async sendMessage(
    @Param('groupId', ParseUUIDPipe) groupId: string,
    @CurrentUser() user: User,
    @AccessToken() token: string,
    @Body() dto: SendMessageDto,
  ): Promise<JobAcceptedDto> {
    // Validate membership
    await this.messagesService.validateMembership(groupId, user.id, token);

    // Queue the job
    const jobId = generateId();
    await this.jobQueue.add(
      'send-message',
      {
        groupId,
        senderId: user.id,
        content: dto.content ?? '',
        clientMessageId: jobId, // Use jobId as client correlation ID
        promptResponseId: dto.promptResponseId,
        replyInChat: dto.replyInChat,
        replyToId: dto.replyToId,
        imageUrls: dto.imageUrls,
      },
      { jobId },
    );

    return { jobId, status: 'queued' };
  }

  @Get()
  @ApiOperation({ summary: 'Get messages for a group with cursor pagination' })
  @ApiResponse({
    status: 200,
    description: 'List of messages',
    type: MessageListDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Not a member of this group' })
  async getMessages(
    @Param('groupId', ParseUUIDPipe) groupId: string,
    @CurrentUser() user: User,
    @AccessToken() token: string,
    @Query() query: MessagesQueryDto,
  ): Promise<MessageListDto> {
    // Validate membership
    await this.messagesService.validateMembership(groupId, user.id, token);

    return this.messagesService.getMessages(groupId, token, {
      cursor: query.cursor,
      limit: query.limit ?? 50,
    });
  }
}
