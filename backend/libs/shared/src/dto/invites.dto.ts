import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

// Request DTOs

export class CreateInviteDto {
  @ApiProperty({
    example: 'friend@example.com',
    description: 'Email address to send the invite to',
  })
  @IsEmail()
  email!: string;
}

// Response DTOs

export class InviteDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  groupId!: string;

  @ApiProperty({ example: 'abc123def456...' })
  inviteToken!: string;

  @ApiProperty({ example: 'http://localhost:5173/invite/abc123def456...' })
  inviteUrl!: string;

  @ApiProperty()
  expiresAt!: string;

  @ApiProperty()
  createdAt!: string;
}

export class InvitePreviewDto {
  @ApiProperty({ example: 'The Crew' })
  groupName!: string;

  @ApiPropertyOptional({ example: 'John Doe' })
  invitedByName!: string | null;

  @ApiProperty()
  expiresAt!: string;

  @ApiProperty({ description: 'Whether the invite has expired' })
  isExpired!: boolean;

  @ApiProperty({ description: 'Whether the invite has been used' })
  isUsed!: boolean;

  @ApiProperty({ description: 'Current member count of the group' })
  memberCount!: number;

  @ApiProperty({ description: 'Whether the group is at max capacity' })
  isGroupFull!: boolean;
}

export class AcceptInviteResponseDto {
  @ApiProperty({ description: 'Whether the operation was successful' })
  success!: boolean;

  @ApiProperty({ format: 'uuid', description: 'The group ID to redirect to' })
  groupId!: string;

  @ApiProperty({ description: 'Whether user was already a member' })
  alreadyMember!: boolean;
}
