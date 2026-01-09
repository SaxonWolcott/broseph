import {
  Controller,
  Get,
  Delete,
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
import { GroupMemberDto } from '@app/shared';
import { MembersService } from './members.service';
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

// Response DTO for members list
class MembersListDto {
  members!: GroupMemberDto[];
}

@ApiTags('Members')
@Controller('api/groups/:groupId/members')
@UseGuards(SupabaseAuthGuard)
@ApiBearerAuth()
export class MembersController {
  constructor(
    private membersService: MembersService,
    @InjectQueue('broseph-jobs') private jobQueue: Queue,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all members of a group' })
  @ApiResponse({
    status: 200,
    description: 'List of group members',
    type: MembersListDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Not a member of this group' })
  async getMembers(
    @Param('groupId', ParseUUIDPipe) groupId: string,
    @CurrentUser() user: User,
    @AccessToken() token: string,
  ): Promise<MembersListDto> {
    // Validate membership
    await this.membersService.validateMembership(groupId, user.id, token);

    const members = await this.membersService.getMembers(groupId, token);
    return { members };
  }

  @Delete('me')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Leave a group' })
  @ApiResponse({
    status: 202,
    description: 'Leave group request queued',
    type: JobAcceptedDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Not a member of this group' })
  async leaveGroup(
    @Param('groupId', ParseUUIDPipe) groupId: string,
    @CurrentUser() user: User,
    @AccessToken() token: string,
  ): Promise<JobAcceptedDto> {
    // Validate membership
    await this.membersService.validateMembership(groupId, user.id, token);

    // Queue the job
    const jobId = generateId();
    await this.jobQueue.add(
      'leave-group',
      {
        groupId,
        userId: user.id,
      },
      { jobId },
    );

    return { jobId, status: 'queued' };
  }
}
