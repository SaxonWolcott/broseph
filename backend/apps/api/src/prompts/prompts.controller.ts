import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { User } from '@supabase/supabase-js';
import {
  SubmitPromptResponseDto,
  PendingPromptsListDto,
  FeedListDto,
} from '@app/shared';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { PromptsService } from './prompts.service';

@ApiTags('Prompts')
@Controller('api/prompts')
@UseGuards(SupabaseAuthGuard)
@ApiBearerAuth()
export class PromptsController {
  constructor(private promptsService: PromptsService) {}

  @Get('todo')
  @ApiOperation({ summary: "Get today's unanswered prompts for user's groups" })
  @ApiResponse({ status: 200, type: PendingPromptsListDto })
  async getPromptsToDo(
    @CurrentUser() user: User,
  ): Promise<PendingPromptsListDto> {
    return this.promptsService.getPromptsToDo(user.id);
  }

  @Get('feed')
  @ApiOperation({ summary: 'Get prompt response feed from groups' })
  @ApiResponse({ status: 200, type: FeedListDto })
  async getFeed(
    @CurrentUser() user: User,
  ): Promise<FeedListDto> {
    return this.promptsService.getFeed(user.id);
  }

  @Post('respond')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Submit a prompt response' })
  @ApiResponse({ status: 201, description: 'Response created' })
  @ApiResponse({ status: 409, description: 'Already answered today' })
  async submitResponse(
    @CurrentUser() user: User,
    @Body() dto: SubmitPromptResponseDto,
  ): Promise<{ id: string; status: string }> {
    return this.promptsService.submitResponse(user.id, dto.groupId, dto.content);
  }
}
