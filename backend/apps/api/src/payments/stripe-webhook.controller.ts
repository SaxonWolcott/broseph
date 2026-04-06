import {
  Controller,
  Post,
  Headers,
  RawBody,
  HttpCode,
  HttpStatus,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiExcludeEndpoint } from '@nestjs/swagger';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { ProcessStripeWebhookJobDto } from '@app/shared';
import { StripeService } from './stripe.service';

@ApiTags('Webhooks')
@Controller('api/webhooks')
export class StripeWebhookController {
  private readonly logger = new Logger(StripeWebhookController.name);

  constructor(
    private stripeService: StripeService,
    @InjectQueue('broseph-jobs') private jobQueue: Queue,
  ) {}

  @Post('stripe')
  @HttpCode(HttpStatus.OK)
  @ApiExcludeEndpoint()
  async handleStripeWebhook(
    @RawBody() rawBody: Buffer,
    @Headers('stripe-signature') signature: string,
  ): Promise<{ received: boolean }> {
    if (!signature) {
      throw new BadRequestException('Missing stripe-signature header');
    }

    let event;
    try {
      event = this.stripeService.verifyWebhookSignature(rawBody, signature);
    } catch (err) {
      this.logger.warn(`Webhook signature verification failed: ${(err as Error).message}`);
      throw new BadRequestException('Invalid webhook signature');
    }

    // Queue for async processing
    const jobData: ProcessStripeWebhookJobDto = {
      eventType: event.type,
      eventId: event.id,
      eventData: event.data.object as Record<string, unknown>,
    };

    await this.jobQueue.add('process-stripe-webhook', jobData, {
      jobId: `stripe-event-${event.id}`,
    });

    this.logger.log(`Queued Stripe event ${event.type} (${event.id})`);
    return { received: true };
  }
}
