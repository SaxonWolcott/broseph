import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  UseInterceptors,
  UploadedFile,
  Req,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { User } from '@supabase/supabase-js';
import { Request } from 'express';
import {
  CreatePaymentRequestDto,
  InitiateCheckoutDto,
  PaymentRequestDto,
  CheckoutSessionResponseDto,
  CreatePaymentRequestJobDto,
  ExtractedReceipt,
  generateId,
} from '@app/shared';
import { PaymentsService } from './payments.service';
import { ReceiptExtractionService } from './receipt-extraction.service';
import { MessagesService } from '../messages/messages.service';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard';
import {
  CurrentUser,
  AccessToken,
} from '../auth/decorators/current-user.decorator';

const MAX_RECEIPT_IMAGE_BYTES = 8 * 1024 * 1024; // 8MB

class JobAcceptedDto {
  jobId!: string;
  status!: string;
}

@ApiTags('Payments')
@Controller('api/groups/:groupId/payments')
@UseGuards(SupabaseAuthGuard)
@ApiBearerAuth()
export class PaymentsController {
  constructor(
    private paymentsService: PaymentsService,
    private receiptExtractionService: ReceiptExtractionService,
    private messagesService: MessagesService,
    @InjectQueue('broseph-jobs') private jobQueue: Queue,
  ) {}

  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Create a payment request in a group' })
  @ApiResponse({ status: 202, description: 'Payment request creation queued', type: JobAcceptedDto })
  async createPaymentRequest(
    @Param('groupId', ParseUUIDPipe) groupId: string,
    @CurrentUser() user: User,
    @AccessToken() token: string,
    @Body() dto: CreatePaymentRequestDto,
  ): Promise<JobAcceptedDto> {
    await this.messagesService.validateMembership(groupId, user.id, token);

    const jobId = generateId();
    const jobData: CreatePaymentRequestJobDto = {
      groupId,
      creatorId: user.id,
      title: dto.title,
      note: dto.note,
      extractedReceipt: dto.extractedReceipt,
      mode: dto.mode,
      recipientId: dto.recipientId,
      items: dto.items.map((item) => ({
        description: item.description,
        amountCents: item.amountCents,
        assignedUserId: item.assignedUserId,
      })),
    };

    await this.jobQueue.add('create-payment-request', jobData, { jobId });
    return { jobId, status: 'queued' };
  }

  @Get('counts')
  @ApiOperation({ summary: 'Get active payment counts for banner display' })
  @ApiResponse({ status: 200 })
  async getPaymentCounts(
    @Param('groupId', ParseUUIDPipe) groupId: string,
    @CurrentUser() user: User,
    @AccessToken() token: string,
  ): Promise<{ activeCount: number; attentionCount: number }> {
    await this.messagesService.validateMembership(groupId, user.id, token);
    return this.paymentsService.getActivePaymentCounts(groupId, user.id);
  }

  @Get('active')
  @ApiOperation({ summary: 'List active payment requests for a group' })
  @ApiResponse({ status: 200, type: [PaymentRequestDto] })
  async listActivePayments(
    @Param('groupId', ParseUUIDPipe) groupId: string,
    @CurrentUser() user: User,
    @AccessToken() token: string,
  ): Promise<PaymentRequestDto[]> {
    await this.messagesService.validateMembership(groupId, user.id, token);
    return this.paymentsService.listActivePaymentRequests(groupId);
  }

  @Get(':paymentId')
  @ApiOperation({ summary: 'Get payment request details' })
  @ApiResponse({ status: 200, type: PaymentRequestDto })
  async getPaymentRequest(
    @Param('groupId', ParseUUIDPipe) groupId: string,
    @Param('paymentId', ParseUUIDPipe) paymentId: string,
    @CurrentUser() user: User,
    @AccessToken() token: string,
  ): Promise<PaymentRequestDto> {
    await this.messagesService.validateMembership(groupId, user.id, token);
    return this.paymentsService.getPaymentRequest(paymentId);
  }

  @Post(':paymentId/checkout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Initiate Stripe checkout for a payment item' })
  @ApiResponse({ status: 200, type: CheckoutSessionResponseDto })
  async initiateCheckout(
    @Param('groupId', ParseUUIDPipe) groupId: string,
    @Param('paymentId', ParseUUIDPipe) paymentId: string,
    @CurrentUser() user: User,
    @AccessToken() token: string,
    @Body() dto: InitiateCheckoutDto,
  ): Promise<CheckoutSessionResponseDto> {
    await this.messagesService.validateMembership(groupId, user.id, token);
    return this.paymentsService.initiateCheckout(paymentId, dto.itemId, user.id, groupId);
  }

  @Post(':paymentId/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel a payment request (creator only)' })
  @ApiResponse({ status: 200, type: PaymentRequestDto })
  async cancelPaymentRequest(
    @Param('groupId', ParseUUIDPipe) groupId: string,
    @Param('paymentId', ParseUUIDPipe) paymentId: string,
    @CurrentUser() user: User,
    @AccessToken() token: string,
  ): Promise<PaymentRequestDto> {
    await this.messagesService.validateMembership(groupId, user.id, token);
    return this.paymentsService.cancelPaymentRequest(paymentId, user.id);
  }

  @Post('extract-from-receipt')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Extract structured payment data from a receipt image' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 200, description: 'Extracted receipt data' })
  @UseInterceptors(
    FileInterceptor('image', { limits: { fileSize: MAX_RECEIPT_IMAGE_BYTES } }),
  )
  async extractFromReceipt(
    @Param('groupId', ParseUUIDPipe) groupId: string,
    @CurrentUser() user: User,
    @AccessToken() token: string,
    @Req() req: Request,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<ExtractedReceipt> {
    if (!file) {
      throw new BadRequestException('No image uploaded. Send a multipart form with field "image".');
    }
    await this.messagesService.validateMembership(groupId, user.id, token);

    const abortController = new AbortController();
    req.on('close', () => {
      if (!req.complete) {
        abortController.abort();
      }
    });

    return this.receiptExtractionService.extractFromImage(
      file.buffer,
      file.mimetype,
      abortController.signal,
    );
  }
}
