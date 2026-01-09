import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { GroupsHandler, MessagesHandler, MembersHandler } from './handlers';

@Processor('broseph-jobs')
export class JobProcessor extends WorkerHost {
  private readonly logger = new Logger(JobProcessor.name);

  constructor(
    private groupsHandler: GroupsHandler,
    private messagesHandler: MessagesHandler,
    private membersHandler: MembersHandler,
  ) {
    super();
  }

  async process(job: Job): Promise<unknown> {
    this.logger.log(`Processing job ${job.id} of type ${job.name}`);

    try {
      let result: unknown;

      switch (job.name) {
        // Group operations
        case 'create-group':
          result = await this.groupsHandler.handleCreateGroup(job);
          break;
        case 'delete-group':
          result = await this.groupsHandler.handleDeleteGroup(job);
          break;

        // Message operations
        case 'send-message':
          result = await this.messagesHandler.handleSendMessage(job);
          break;

        // Member operations
        case 'leave-group':
          result = await this.membersHandler.handleLeaveGroup(job);
          break;
        case 'accept-invite':
          result = await this.membersHandler.handleAcceptInvite(job);
          break;

        default:
          this.logger.warn(`Unknown job type: ${job.name}`);
          return undefined;
      }

      this.logger.log(`Completed job ${job.id} with result: ${JSON.stringify(result)}`);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed job ${job.id}: ${errorMessage}`);
      throw error;
    }
  }
}
