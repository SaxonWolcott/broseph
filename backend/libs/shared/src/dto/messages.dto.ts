import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  MaxLength,
  MinLength,
  IsOptional,
  IsUUID,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { LIMITS } from '../constants/limits';

// Request DTOs

export class SendMessageDto {
  @ApiProperty({
    example: 'Hello everyone!',
    description: 'Message content',
    maxLength: LIMITS.MAX_MESSAGE_LENGTH,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(LIMITS.MAX_MESSAGE_LENGTH)
  content!: string;
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

  @ApiPropertyOptional({ default: 'message', example: 'system', enum: ['message', 'system'] })
  type!: 'message' | 'system';
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
