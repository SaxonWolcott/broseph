import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { SupabaseModule } from '@app/shared';
import { JobProcessor } from './job.processor';
import { GroupsHandler, MessagesHandler, MembersHandler } from './handlers';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '../.env',
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        connection: {
          url: configService.get('REDIS_URL', 'redis://localhost:6379'),
        },
      }),
      inject: [ConfigService],
    }),
    BullModule.registerQueue({
      name: 'broseph-jobs',
    }),
    SupabaseModule,
  ],
  providers: [JobProcessor, GroupsHandler, MessagesHandler, MembersHandler],
})
export class WorkerModule {}
