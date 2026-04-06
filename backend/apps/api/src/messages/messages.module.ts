import { Module, forwardRef } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { MessagesController } from './messages.controller';
import { MessagesService } from './messages.service';
import { ReactionsService } from './reactions.service';
import { PollsModule } from '../polls/polls.module';
import { PaymentsModule } from '../payments/payments.module';

@Module({
  imports: [
    BullModule.registerQueue({ name: 'broseph-jobs' }),
    forwardRef(() => PollsModule),
    forwardRef(() => PaymentsModule),
  ],
  controllers: [MessagesController],
  providers: [MessagesService, ReactionsService],
  exports: [MessagesService],
})
export class MessagesModule {}
