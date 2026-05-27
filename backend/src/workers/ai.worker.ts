import { Worker, Job } from 'bullmq';
import { getRedisConnection } from '../config/redis';
import { generateAssignment, QuestionTypeConfig } from '../services/ai.service';
import { extractTextFromFile } from '../services/file.service';
import prisma from '../config/db';
import { emitToUser } from '../sockets';
import logger from '../config/logger';

export interface AIGenerationJobData {
  assignmentId: string;
  userId: string;
  title: string;
  subject: string;
  class: string;
  questionTypes: QuestionTypeConfig[];
  additionalInfo?: string;
  uploadedFilePath?: string;
  uploadedFileMimetype?: string;
}

export const startAIWorker = () => {
  const worker = new Worker<AIGenerationJobData>(
    'assignment-generation',
    async (job: Job<AIGenerationJobData>) => {
      const {
        assignmentId,
        userId,
        title,
        subject,
        questionTypes,
        additionalInfo,
        uploadedFilePath,
        uploadedFileMimetype,
      } = job.data;

      logger.info(`Processing AI generation job ${job.id} for assignment ${assignmentId}`);

      // Mark job as active
      await prisma.generationJob.updateMany({
        where: { jobId: job.id! },
        data: { status: 'ACTIVE' },
      });

      // Mark assignment as generating
      await prisma.assignment.update({
        where: { id: assignmentId },
        data: { status: 'GENERATING' },
      });

      emitToUser(userId, 'generation_started', { assignmentId, jobId: job.id });

      // Extract text from uploaded file if present
      let uploadedText: string | undefined;
      if (uploadedFilePath && uploadedFileMimetype) {
        emitToUser(userId, 'generation_progress', {
          assignmentId,
          message: 'Extracting content from uploaded file...',
          progress: 10,
        });
        uploadedText = await extractTextFromFile(uploadedFilePath, uploadedFileMimetype);
      }

      // Generate questions via Ollama
      emitToUser(userId, 'generation_progress', {
        assignmentId,
        message: 'Generating questions with AI...',
        progress: 30,
      });

      const generated = await generateAssignment(
        title,
        subject,
        job.data.class,
        questionTypes,
        additionalInfo,
        uploadedText
      );

      emitToUser(userId, 'generation_progress', {
        assignmentId,
        message: 'Saving generated questions...',
        progress: 80,
      });

      // Clear existing sections (supports regeneration)
      await prisma.assignmentSection.deleteMany({ where: { assignmentId } });

      let totalQuestions = 0;
      let totalMarks = 0;

      for (let i = 0; i < generated.sections.length; i++) {
        const sec = generated.sections[i];
        const section = await prisma.assignmentSection.create({
          data: {
            assignmentId,
            title: sec.title,
            instruction: sec.instruction,
            order: i,
          },
        });

        for (let j = 0; j < sec.questions.length; j++) {
          const q = sec.questions[j];
          await prisma.question.create({
            data: {
              sectionId: section.id,
              text: q.text,
              marks: q.marks,
              difficulty: q.difficulty.toUpperCase() as 'EASY' | 'MEDIUM' | 'HARD',
              answer: q.answer,
              order: j,
            },
          });
          totalQuestions++;
          totalMarks += q.marks;
        }
      }

      // Finalize assignment
      await prisma.assignment.update({
        where: { id: assignmentId },
        data: { status: 'COMPLETED', totalQuestions, totalMarks },
      });

      await prisma.generationJob.updateMany({
        where: { jobId: job.id! },
        data: { status: 'COMPLETED' },
      });

      emitToUser(userId, 'generation_completed', {
        assignmentId,
        jobId: job.id,
        totalQuestions,
        totalMarks,
        sections: generated.sections.length,
      });

      logger.info(
        `Assignment ${assignmentId} generation completed: ${totalQuestions} questions, ${totalMarks} marks`
      );
    },
    { connection: getRedisConnection(), concurrency: 2 }
  );

  worker.on('failed', async (job, err) => {
    logger.error(`AI worker job ${job?.id} failed: ${err.message}`);
    if (job?.data?.assignmentId) {
      await prisma.assignment
        .update({
          where: { id: job.data.assignmentId },
          data: { status: 'FAILED' },
        })
        .catch(() => {});

      await prisma.generationJob
        .updateMany({
          where: { jobId: job.id! },
          data: { status: 'FAILED', error: err.message },
        })
        .catch(() => {});

      emitToUser(job.data.userId, 'generation_failed', {
        assignmentId: job.data.assignmentId,
        error: err.message,
      });
    }
  });

  logger.info('AI generation worker started');
  return worker;
};
