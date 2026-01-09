import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';
import { LIMITS } from '../constants/limits';

// Request DTOs

export class CreateGroupDto {
  @ApiProperty({
    example: 'The Crew',
    description: 'Name of the group',
    maxLength: LIMITS.MAX_GROUP_NAME_LENGTH,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(LIMITS.MAX_GROUP_NAME_LENGTH)
  name!: string;
}

// Response DTOs

export class GroupMemberDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  userId!: string;

  @ApiPropertyOptional({ example: 'John Doe' })
  displayName!: string | null;

  @ApiPropertyOptional({ example: 'johndoe' })
  handle!: string | null;

  @ApiPropertyOptional({ example: 'https://example.com/avatar.jpg' })
  avatarUrl!: string | null;

  @ApiProperty({ enum: ['owner', 'member'] })
  role!: 'owner' | 'member';

  @ApiProperty()
  joinedAt!: string;
}

export class GroupDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'The Crew' })
  name!: string;

  @ApiProperty({ format: 'uuid' })
  ownerId!: string;

  @ApiProperty({ example: 3 })
  memberCount!: number;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}

export class GroupDetailDto extends GroupDto {
  @ApiProperty({ type: [GroupMemberDto] })
  members!: GroupMemberDto[];
}

export class GroupListItemDto extends GroupDto {
  @ApiPropertyOptional({ example: 'Hey everyone!' })
  lastMessageContent?: string | null;

  @ApiPropertyOptional({ example: 'John' })
  lastMessageSenderName?: string | null;

  @ApiPropertyOptional()
  lastMessageAt?: string | null;
}

export class GroupListDto {
  @ApiProperty({ type: [GroupListItemDto] })
  groups!: GroupListItemDto[];
}
