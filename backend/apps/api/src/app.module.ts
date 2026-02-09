import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { SupabaseModule } from '@app/shared';
import { HealthController } from './health.controller';
import { AuthModule } from './auth/auth.module';
import { GroupsModule } from './groups/groups.module';
import { MessagesModule } from './messages/messages.module';
import { MembersModule } from './members/members.module';
import { InvitesModule } from './invites/invites.module';
import { PromptsModule } from './prompts/prompts.module';
import { EmailModule } from './email/email.module';

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
          url: configService.get<string>('REDIS_URL', 'redis://localhost:6379'),
        },
      }),
      inject: [ConfigService],
    }),
    SupabaseModule,
    EmailModule,
    AuthModule,
    GroupsModule,
    MessagesModule,
    MembersModule,
    InvitesModule,
    PromptsModule,
  ],
  controllers: [HealthController],
  providers: [],
})
export class AppModule {}
