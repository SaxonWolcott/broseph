import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { GroupsController } from './groups.controller';
import { GroupsService } from './groups.service';

@Module({
  imports: [BullModule.registerQueue({ name: 'broseph-jobs' })],
  controllers: [GroupsController],
  providers: [GroupsService],
  exports: [GroupsService],
})
export class GroupsModule {}
