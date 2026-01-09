import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { MembersController } from './members.controller';
import { MembersService } from './members.service';

@Module({
  imports: [BullModule.registerQueue({ name: 'broseph-jobs' })],
  controllers: [MembersController],
  providers: [MembersService],
  exports: [MembersService],
})
export class MembersModule {}
