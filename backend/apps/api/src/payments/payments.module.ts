import { Module, forwardRef } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { PaymentsController } from './payments.controller';
import { StripeWebhookController } from './stripe-webhook.controller';
import { PaymentsService } from './payments.service';
import { StripeService } from './stripe.service';
import { MessagesModule } from '../messages/messages.module';

@Module({
  imports: [
    BullModule.registerQueue({ name: 'broseph-jobs' }),
    forwardRef(() => MessagesModule),
  ],
  controllers: [PaymentsController, StripeWebhookController],
  providers: [PaymentsService, StripeService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
