import { z } from 'zod';
import { JobStatus, JobStepStatus } from '../enums/job-status.enum';

export const jobSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  status: z.nativeEnum(JobStatus),
  metadata: z.record(z.unknown()).optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const jobStepSchema = z.object({
  id: z.string().uuid(),
  jobId: z.string().uuid(),
  stepName: z.string(),
  status: z.nativeEnum(JobStepStatus),
  errorMessage: z.string().optional(),
  startedAt: z.date().optional(),
  completedAt: z.date().optional(),
});

export type Job = z.infer<typeof jobSchema>;
export type JobStep = z.infer<typeof jobStepSchema>;
