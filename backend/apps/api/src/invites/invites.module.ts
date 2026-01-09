import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { InvitesController } from './invites.controller';
import { InvitesService } from './invites.service';

@Module({
  imports: [BullModule.registerQueue({ name: 'broseph-jobs' })],
  controllers: [InvitesController],
  providers: [InvitesService],
  exports: [InvitesService],
})
export class InvitesModule {}
