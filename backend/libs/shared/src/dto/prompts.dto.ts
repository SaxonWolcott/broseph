import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsUUID, MaxLength, MinLength } from 'class-validator';
import { LIMITS } from '../constants/limits';

// ─── Request DTOs ────────────────────────────────────────

export class SubmitPromptResponseDto {
  @ApiProperty({ format: 'uuid', description: 'Group to respond for' })
  @IsUUID()
  groupId!: string;

  @ApiProperty({
    example: 'Pizza from that place downtown — absolutely incredible!',
    description: 'The response content',
    maxLength: LIMITS.MAX_MESSAGE_LENGTH,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(LIMITS.MAX_MESSAGE_LENGTH)
  content!: string;
}

// ─── Response DTOs ───────────────────────────────────────

export class PromptDto {
  @ApiProperty({ example: 'p1' })
  id!: string;

  @ApiProperty({ example: "What's the best meal you've had recently?" })
  text!: string;

  @ApiPropertyOptional({ example: 'icebreaker' })
  category?: string;
}

export class PendingPromptDto {
  @ApiProperty({ format: 'uuid', description: 'Group ID (used as pending item key)' })
  groupId!: string;

  @ApiProperty({ example: 'College Friends' })
  groupName!: string;

  @ApiProperty({ type: PromptDto })
  prompt!: PromptDto;
}

export class PendingPromptsListDto {
  @ApiProperty({ type: [PendingPromptDto] })
  prompts!: PendingPromptDto[];

  @ApiProperty({ description: 'True when user has answered all groups today' })
  allComplete!: boolean;
}

export class FeedUserDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiPropertyOptional({ example: 'Alex Chen' })
  displayName!: string | null;

  @ApiPropertyOptional({ example: 'https://example.com/avatar.jpg' })
  avatarUrl!: string | null;
}

export class FeedItemDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ type: PromptDto })
  prompt!: PromptDto;

  @ApiProperty({ type: FeedUserDto })
  user!: FeedUserDto;

  @ApiProperty({ format: 'uuid' })
  groupId!: string;

  @ApiProperty({ example: 'College Friends' })
  groupName!: string;

  @ApiProperty({ example: 'Pizza from that place downtown!' })
  content!: string;

  @ApiProperty()
  createdAt!: string;
}

export class FeedListDto {
  @ApiProperty({ type: [FeedItemDto] })
  responses!: FeedItemDto[];
}
