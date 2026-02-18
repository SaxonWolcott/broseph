import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  MaxLength,
  IsOptional,
  IsUUID,
  IsInt,
  Min,
  Max,
  IsUrl,
  IsArray,
  ArrayMaxSize,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { IsBoolean } from 'class-validator';
import { LIMITS } from '../constants/limits';

// Request DTOs

export class SendMessageDto {
  @ApiPropertyOptional({
    example: 'Hello everyone!',
    description: 'Message content (required if no images)',
    maxLength: LIMITS.MAX_MESSAGE_LENGTH,
  })
  @IsOptional()
  @IsString()
  @MaxLength(LIMITS.MAX_MESSAGE_LENGTH)
  content?: string;

  @ApiPropertyOptional({
    description: 'URLs of uploaded image attachments (max 10)',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(LIMITS.MAX_IMAGES_PER_MESSAGE)
  @IsUrl({ require_tld: false }, { each: true })
  imageUrls?: string[];

  @ApiPropertyOptional({
    description: 'Prompt response ID to reply to',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  promptResponseId?: string;

  @ApiPropertyOptional({
    description: 'If true, reply appears in chat stream with ghost preview. If false, reply only visible in popup.',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === true || value === 'true')
  replyInChat?: boolean;

  @ApiPropertyOptional({
    description: 'Message ID to reply to (general message reply)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  replyToId?: string;
}

export class MessagesQueryDto {
  @ApiPropertyOptional({
    description: 'Cursor for pagination (message ID to fetch before)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  cursor?: string;

  @ApiPropertyOptional({
    description: 'Number of messages to fetch',
    default: 50,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 50;
}

// Response DTOs

export class MessageSenderDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiPropertyOptional({ example: 'John Doe' })
  displayName!: string | null;

  @ApiPropertyOptional({ example: 'johndoe' })
  handle!: string | null;

  @ApiPropertyOptional({ example: 'https://example.com/avatar.jpg' })
  avatarUrl!: string | null;
}

export class MessageDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  groupId!: string;

  @ApiProperty({ type: MessageSenderDto, nullable: true })
  sender!: MessageSenderDto | null;

  @ApiProperty({ example: 'Hello everyone!' })
  content!: string;

  @ApiProperty()
  createdAt!: string;

  @ApiPropertyOptional({ default: 'message', enum: ['message', 'system', 'prompt_response'] })
  type!: 'message' | 'system' | 'prompt_response';

  @ApiPropertyOptional({ format: 'uuid', description: 'Linked prompt response ID' })
  promptResponseId!: string | null;

  @ApiPropertyOptional({ description: 'Prompt data (for prompt_response and reply-in-chat messages)' })
  promptData!: {
    promptId: string;
    promptText: string;
    promptCategory?: string;
    responseContent: string;
    responseSenderName?: string;
    responseSenderAvatarUrl?: string;
  } | null;

  @ApiPropertyOptional({ description: 'Number of comments on this prompt response' })
  replyCount!: number | null;

  @ApiPropertyOptional({ description: 'URLs of attached images', type: [String] })
  imageUrls!: string[] | null;

  @ApiPropertyOptional({ format: 'uuid', description: 'Message this is a reply to' })
  replyToId!: string | null;

  @ApiPropertyOptional({ description: 'Preview of the message being replied to' })
  replyToPreview!: {
    senderName: string | null;
    senderAvatarUrl: string | null;
    content: string;
    imageUrls?: string[] | null;
  } | null;
}

export class MessageListDto {
  @ApiProperty({ type: [MessageDto] })
  messages!: MessageDto[];

  @ApiPropertyOptional({
    description: 'Cursor for next page (null if no more messages)',
    format: 'uuid',
  })
  nextCursor!: string | null;

  @ApiProperty({ description: 'Whether more messages exist' })
  hasMore!: boolean;
}
