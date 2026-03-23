import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsBoolean,
  IsOptional,
  IsArray,
  ArrayMinSize,
  ArrayMaxSize,
  MaxLength,
  IsDateString,
  IsUUID,
} from 'class-validator';
import { LIMITS } from '../constants/limits';

// ── Request DTOs ──

export class CreatePollOptionInput {
  @ApiProperty({ example: 'Option A' })
  @IsString()
  @MaxLength(LIMITS.MAX_POLL_OPTION_LENGTH)
  text!: string;
}

export class PollSettingsInput {
  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  allowMultiple?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  showVotes?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  allowAddOptions?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  declareWinnerOnAllVoted?: boolean;

  @ApiPropertyOptional({ description: 'ISO 8601 datetime when poll closes' })
  @IsOptional()
  @IsDateString()
  closesAt?: string;
}

export class CreatePollDto {
  @ApiProperty({ example: 'Where should we eat?' })
  @IsString()
  @MaxLength(LIMITS.MAX_POLL_TITLE_LENGTH)
  title!: string;

  @ApiProperty({ type: [CreatePollOptionInput], minItems: 2 })
  @IsArray()
  @ArrayMinSize(LIMITS.MIN_POLL_OPTIONS)
  @ArrayMaxSize(LIMITS.MAX_POLL_OPTIONS)
  options!: CreatePollOptionInput[];

  @ApiPropertyOptional({ type: PollSettingsInput })
  @IsOptional()
  settings?: PollSettingsInput;
}

export class CastVoteDto {
  @ApiProperty({ type: [String], description: 'Option IDs to vote for' })
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('4', { each: true })
  optionIds!: string[];
}

export class AddPollOptionDto {
  @ApiProperty({ example: 'New option' })
  @IsString()
  @MaxLength(LIMITS.MAX_POLL_OPTION_LENGTH)
  text!: string;
}

// ── Response DTOs ──

export class PollVoterDto {
  @ApiProperty({ format: 'uuid' })
  userId!: string;

  @ApiPropertyOptional()
  displayName!: string | null;

  @ApiPropertyOptional()
  avatarUrl!: string | null;
}

export class PollOptionDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  text!: string;

  @ApiProperty()
  position!: number;

  @ApiProperty()
  voteCount!: number;

  @ApiPropertyOptional({ type: [PollVoterDto] })
  voters!: PollVoterDto[] | null;

  @ApiProperty({ description: 'Whether the current user voted for this option' })
  hasVoted!: boolean;
}

export class PollDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty({ type: [PollOptionDto] })
  options!: PollOptionDto[];

  @ApiProperty()
  allowMultiple!: boolean;

  @ApiProperty()
  showVotes!: boolean;

  @ApiProperty()
  allowAddOptions!: boolean;

  @ApiProperty()
  declareWinnerOnAllVoted!: boolean;

  @ApiPropertyOptional()
  closesAt!: string | null;

  @ApiProperty()
  closed!: boolean;

  @ApiPropertyOptional({ enum: ['creator', 'time_limit', 'all_voted'] })
  closedReason!: string | null;

  @ApiPropertyOptional({ format: 'uuid' })
  winningOptionId!: string | null;

  @ApiProperty({ format: 'uuid' })
  creatorId!: string;

  @ApiProperty()
  totalVoters!: number;
}
