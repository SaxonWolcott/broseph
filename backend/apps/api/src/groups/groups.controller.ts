import {
  Controller,
  Post,
  Get,
  Delete,
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
  CreateGroupDto,
  GroupDto,
  GroupDetailDto,
  GroupListDto,
} from '@app/shared';
import { GroupsService } from './groups.service';
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

@ApiTags('Groups')
@Controller('api/groups')
@UseGuards(SupabaseAuthGuard)
@ApiBearerAuth()
export class GroupsController {
  constructor(
    private groupsService: GroupsService,
    @InjectQueue('broseph-jobs') private jobQueue: Queue,
  ) {}

  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Create a new group' })
  @ApiResponse({
    status: 202,
    description: 'Group creation queued',
    type: JobAcceptedDto,
  })
  @ApiResponse({ status: 400, description: 'User has reached group limit' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createGroup(
    @CurrentUser() user: User,
    @Body() dto: CreateGroupDto,
  ): Promise<JobAcceptedDto> {
    // Validate user can create a group
    await this.groupsService.validateCanCreateGroup(user.id);

    // Queue the job
    const jobId = generateId();
    await this.jobQueue.add(
      'create-group',
      {
        ownerId: user.id,
        name: dto.name,
      },
      { jobId },
    );

    return { jobId, status: 'queued' };
  }

  @Get()
  @ApiOperation({ summary: "List user's groups" })
  @ApiResponse({
    status: 200,
    description: 'List of groups',
    type: GroupListDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async listGroups(
    @CurrentUser() user: User,
    @AccessToken() token: string,
  ): Promise<GroupListDto> {
    return this.groupsService.listGroups(user.id, token);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get group details with members' })
  @ApiResponse({
    status: 200,
    description: 'Group details',
    type: GroupDetailDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Not a member of this group' })
  @ApiResponse({ status: 404, description: 'Group not found' })
  async getGroup(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
    @AccessToken() token: string,
  ): Promise<GroupDetailDto> {
    return this.groupsService.getGroup(id, user.id, token);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Delete a group (owner only, must be empty)' })
  @ApiResponse({
    status: 202,
    description: 'Group deletion queued',
    type: JobAcceptedDto,
  })
  @ApiResponse({ status: 400, description: 'Group has other members' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Not the group owner' })
  @ApiResponse({ status: 404, description: 'Group not found' })
  async deleteGroup(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ): Promise<JobAcceptedDto> {
    // Validate user can delete the group
    await this.groupsService.validateCanDeleteGroup(id, user.id);

    // Queue the job
    const jobId = generateId();
    await this.jobQueue.add(
      'delete-group',
      {
        groupId: id,
        userId: user.id,
      },
      { jobId },
    );

    return { jobId, status: 'queued' };
  }
}
