import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';

@Processor('broseph-jobs')
export class JobProcessor extends WorkerHost {
  private readonly logger = new Logger(JobProcessor.name);

  async process(job: Job): Promise<void> {
    this.logger.log(`Processing job ${job.id} of type ${job.name}`);

    switch (job.name) {
      case 'example':
        await this.handleExample(job);
        break;
      default:
        this.logger.warn(`Unknown job type: ${job.name}`);
    }

    this.logger.log(`Completed job ${job.id}`);
  }

  private async handleExample(job: Job): Promise<void> {
    this.logger.log(`Handling example job with data: ${JSON.stringify(job.data)}`);
    // Placeholder for actual job processing logic
  }
}
