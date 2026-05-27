import { Worker, Job } from 'bullmq';
import { getRedisConnection } from '../config/redis';
import { generatePDF } from '../services/pdf.service';
import prisma from '../config/db';
import logger from '../config/logger';
import fs from 'fs';
import path from 'path';

export interface PDFJobData {
  assignmentId: string;
  outputPath: string;
}

export const startPDFWorker = () => {
  const worker = new Worker<PDFJobData>(
    'pdf-generation',
    async (job: Job<PDFJobData>) => {
      const { assignmentId, outputPath } = job.data;
      logger.info(`Processing PDF job ${job.id} for assignment ${assignmentId}`);

      const assignment = await prisma.assignment.findUnique({
        where: { id: assignmentId },
        include: {
          sections: {
            include: {
              questions: { orderBy: { order: 'asc' } },
            },
            orderBy: { order: 'asc' },
          },
          user: true,
        },
      });

      if (!assignment) throw new Error(`Assignment ${assignmentId} not found`);

      const pdfBytes = await generatePDF({
        title: assignment.title,
        subject: assignment.subject,
        class: assignment.class,
        schoolName: assignment.user.schoolName,
        totalMarks: assignment.totalMarks,
        sections: assignment.sections.map((s) => ({
          title: s.title,
          instruction: s.instruction || '',
          questions: s.questions.map((q) => ({
            text: q.text,
            marks: q.marks,
            difficulty: q.difficulty.toLowerCase(),
            answer: q.answer ?? undefined,
          })),
        })),
      });

      fs.mkdirSync(path.dirname(outputPath), { recursive: true });
      fs.writeFileSync(outputPath, Buffer.from(pdfBytes));
      logger.info(`PDF generated at ${outputPath}`);
    },
    { connection: getRedisConnection() }
  );

  worker.on('failed', (job, err) => {
    logger.error(`PDF worker job ${job?.id} failed: ${err.message}`);
  });

  logger.info('PDF generation worker started');
  return worker;
};
