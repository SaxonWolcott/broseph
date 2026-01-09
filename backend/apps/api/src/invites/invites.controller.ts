import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
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
import { CreateInviteDto, InvitePreviewDto } from '@app/shared';
import { InvitesService } from './invites.service';
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

// Response DTO for invite creation
class InviteCreatedDto {
  token!: string;
  expiresAt!: string;
}

// Response DTO for accept invite
class AcceptInviteResponseDto {
  jobId!: string;
  status!: string;
  groupId!: string;
}

@ApiTags('Invites')
@Controller('api')
export class InvitesController {
  constructor(
    private invitesService: InvitesService,
    @InjectQueue('broseph-jobs') private jobQueue: Queue,
  ) {}

  @Post('groups/:groupId/invites')
  @UseGuards(SupabaseAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create an invite link for a group' })
  @ApiResponse({
    status: 201,
    description: 'Invite created',
    type: InviteCreatedDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Not a member of this group' })
  async createInvite(
    @Param('groupId') groupId: string,
    @CurrentUser() user: User,
    @AccessToken() token: string,
    @Body() dto: CreateInviteDto,
  ): Promise<InviteCreatedDto> {
    // Validate membership
    await this.invitesService.validateMembership(groupId, user.id, token);

    // Create the invite directly (not a heavy operation, no job needed)
    const invite = await this.invitesService.createInvite(
      groupId,
      user.id,
      dto.email,
      token,
    );

    return {
      token: invite.token,
      expiresAt: invite.expiresAt,
    };
  }

  @Get('invites/:token')
  @ApiOperation({ summary: 'Get invite preview (public)' })
  @ApiResponse({
    status: 200,
    description: 'Invite preview',
    type: InvitePreviewDto,
  })
  @ApiResponse({ status: 404, description: 'Invite not found' })
  @ApiResponse({ status: 400, description: 'Invite expired or already used' })
  async getInvitePreview(
    @Param('token') token: string,
  ): Promise<InvitePreviewDto> {
    return this.invitesService.getInvitePreview(token);
  }

  @Post('invites/:token/accept')
  @UseGuards(SupabaseAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Accept an invite and join the group' })
  @ApiResponse({
    status: 202,
    description: 'Accept invite request queued',
    type: AcceptInviteResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 400, description: 'Invalid invite or limits exceeded' })
  @ApiResponse({ status: 404, description: 'Invite not found' })
  async acceptInvite(
    @Param('token') token: string,
    @CurrentUser() user: User,
  ): Promise<AcceptInviteResponseDto> {
    // Validate the invite can be accepted
    const { groupId, inviteId } = await this.invitesService.validateCanAcceptInvite(
      token,
      user.id,
    );

    // Queue the job
    const jobId = generateId();
    await this.jobQueue.add(
      'accept-invite',
      {
        inviteToken: token,
        inviteId,
        groupId,
        userId: user.id,
      },
      { jobId },
    );

    return { jobId, status: 'queued', groupId };
  }
}
