import { Queue, QueueEvents } from 'bullmq';
import { getRedisConnection } from '../config/redis';

export const assignmentGenerationQueue = new Queue('assignment-generation', {
  connection: getRedisConnection(),
  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail: 50,
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
  },
});

export const pdfGenerationQueue = new Queue('pdf-generation', {
  connection: getRedisConnection(),
  defaultJobOptions: {
    removeOnComplete: 50,
    removeOnFail: 20,
    attempts: 2,
    backoff: { type: 'fixed', delay: 1000 },
  },
});

export const pdfQueueEvents = new QueueEvents('pdf-generation', {
  connection: getRedisConnection(),
});
