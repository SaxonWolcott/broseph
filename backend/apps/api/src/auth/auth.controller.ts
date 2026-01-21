import {
  Controller,
  Post,
  Get,
  Body,
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
import {
  MagicLinkRequestDto,
  MagicLinkResponseDto,
  ProfileDto,
  OnboardDto,
  CheckEmailDto,
  CheckEmailResponseDto,
} from '@app/shared';
import { AuthService } from './auth.service';
import { SupabaseAuthGuard } from './guards/supabase-auth.guard';
import {
  CurrentUser,
  AccessToken,
} from './decorators/current-user.decorator';
import { User } from '@supabase/supabase-js';

@ApiTags('Auth')
@Controller('api/auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('check-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Check if an email address has an existing account' })
  @ApiResponse({
    status: 200,
    description: 'Email check result',
    type: CheckEmailResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid email' })
  async checkEmail(
    @Body() dto: CheckEmailDto,
  ): Promise<CheckEmailResponseDto> {
    return this.authService.checkEmail(dto.email);
  }

  @Post('magic-link')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send magic link email for passwordless sign-in' })
  @ApiResponse({
    status: 200,
    description: 'Magic link sent successfully',
    type: MagicLinkResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid email or rate limited' })
  async sendMagicLink(
    @Body() dto: MagicLinkRequestDto,
  ): Promise<MagicLinkResponseDto> {
    await this.authService.sendMagicLink(dto);
    return { success: true, message: 'Magic link sent to email' };
  }

  @Post('signup-magic-link')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send signup magic link with custom email' })
  @ApiResponse({
    status: 200,
    description: 'Signup link sent successfully',
    type: MagicLinkResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid email or rate limited' })
  async sendSignupMagicLink(
    @Body() dto: MagicLinkRequestDto,
  ): Promise<MagicLinkResponseDto> {
    await this.authService.sendSignupMagicLink(dto);
    return { success: true, message: 'Signup link sent to email' };
  }

  @Get('me')
  @UseGuards(SupabaseAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({
    status: 200,
    description: 'Profile retrieved successfully',
    type: ProfileDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid token' })
  async getMe(
    @CurrentUser() user: User,
    @AccessToken() token: string,
  ): Promise<ProfileDto> {
    return this.authService.getProfile(user, token);
  }

  @Post('onboard')
  @UseGuards(SupabaseAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update profile during onboarding' })
  @ApiResponse({
    status: 200,
    description: 'Profile updated successfully',
    type: ProfileDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid token' })
  @ApiResponse({ status: 409, description: 'Handle already taken' })
  async onboard(
    @CurrentUser() user: User,
    @AccessToken() token: string,
    @Body() dto: OnboardDto,
  ): Promise<ProfileDto> {
    return this.authService.onboard(user, token, dto);
  }
}
