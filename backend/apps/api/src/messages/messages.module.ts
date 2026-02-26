import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { MessagesController } from './messages.controller';
import { MessagesService } from './messages.service';
import { ReactionsService } from './reactions.service';

@Module({
  imports: [BullModule.registerQueue({ name: 'broseph-jobs' })],
  controllers: [MessagesController],
  providers: [MessagesService, ReactionsService],
  exports: [MessagesService],
})
export class MessagesModule {}
