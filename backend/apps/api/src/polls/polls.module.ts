import { Module, forwardRef } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { PollsController } from './polls.controller';
import { PollsService } from './polls.service';
import { MessagesModule } from '../messages/messages.module';

@Module({
  imports: [
    BullModule.registerQueue({ name: 'broseph-jobs' }),
    forwardRef(() => MessagesModule),
  ],
  controllers: [PollsController],
  providers: [PollsService],
  exports: [PollsService],
})
export class PollsModule {}
