import { Response, NextFunction } from 'express';
import prisma from '../config/db';
import { AuthRequest } from '../middleware/auth.middleware';
import { AppError } from '../middleware/error.middleware';
import { assignmentGenerationQueue, pdfGenerationQueue, pdfQueueEvents } from '../queues';
import path from 'path';
import fs from 'fs';

// GET /api/assignments
export const getAssignments = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      search,
      page = '1',
      limit = '20',
      status,
    } = req.query as Record<string, string>;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where: Record<string, unknown> = {
      userId: req.userId!,
    };

    if (search) {
      where.title = {
        contains: search,
        mode: 'insensitive',
      };
    }

    if (status) {
      where.status = status.toUpperCase();
    }

    const [assignments, total] = await Promise.all([
      prisma.assignment.findMany({
        where,
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: parseInt(limit),
        include: {
          _count: {
            select: {
              sections: true,
              uploadedFiles: true,
            },
          },
          generationJobs: {
            orderBy: {
              createdAt: 'desc',
            },
            take: 1,
          },
        },
      }),

      prisma.assignment.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        assignments,
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/assignments/:id
export const getAssignment = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const assignment = await prisma.assignment.findFirst({
      where: {
        id: req.params.id,
        userId: req.userId!,
      },

      include: {
        sections: {
          include: {
            questions: {
              orderBy: {
                order: 'asc',
              },
            },
          },

          orderBy: {
            order: 'asc',
          },
        },

        uploadedFiles: true,

        generationJobs: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
        },

        questionTypes: true,

        user: {
          select: {
            schoolName: true,
            schoolCity: true,
            name: true,
          },
        },
      },
    });

    if (!assignment) {
      throw new AppError('Assignment not found', 404);
    }

    res.json({
      success: true,
      data: {
        assignment,
      },
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/assignments
export const createAssignment = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      title,
      subject,
      class: cls,
      dueDate,
      questionTypes,
      additionalInfo,
    } = req.body as {
      title: string;
      subject?: string;
      class?: string;
      dueDate?: string;
      questionTypes?: unknown;
      additionalInfo?: string;
    };

    const file = req.file;

    // =========================
    // Parse Question Types
    // =========================

    let parsedQuestionTypes: Array<{
      type: string;
      quantity: number;
      marks: number;
    }> = [];

    try {
      if (questionTypes) {
        // multipart/form-data sends arrays as strings
        if (typeof questionTypes === 'string') {
          parsedQuestionTypes = JSON.parse(questionTypes);
        }

        // normal JSON request
        else if (Array.isArray(questionTypes)) {
          parsedQuestionTypes = questionTypes;
        }
      }

      if (!Array.isArray(parsedQuestionTypes)) {
        throw new Error();
      }
    } catch {
      throw new AppError('Invalid questionTypes format', 400);
    }

    // =========================
    // Create Assignment
    // =========================

    const assignment = await prisma.assignment.create({
      data: {
        title,

        subject: subject || 'General',

        class: cls || '10th',

        dueDate: dueDate ? new Date(dueDate) : null,

        additionalInfo,

        userId: req.userId!,

        questionTypes: {
          create: parsedQuestionTypes.map((qt) => ({
            type: qt.type,
            quantity: Number(qt.quantity),
            marks: Number(qt.marks),
          })),
        },
      },
    });

    // =========================
    // Handle Uploaded File
    // =========================

    let uploadedFilePath: string | undefined;
    let uploadedFileMimetype: string | undefined;

    if (file) {
      await prisma.uploadedFile.create({
        data: {
          filename: file.filename,
          originalName: file.originalname,
          mimetype: file.mimetype,
          size: file.size,
          path: file.path,
          assignmentId: assignment.id,
        },
      });

      uploadedFilePath = file.path;
      uploadedFileMimetype = file.mimetype;
    }

    // =========================
    // Queue AI Generation Job
    // =========================

    const job = await assignmentGenerationQueue.add('generate', {
      assignmentId: assignment.id,

      userId: req.userId!,

      title,

      subject: subject || 'General',

      class: cls || '10th',

      questionTypes: parsedQuestionTypes,

      additionalInfo,

      uploadedFilePath,

      uploadedFileMimetype,
    });

    // =========================
    // Store Job
    // =========================

    await prisma.generationJob.create({
      data: {
        jobId: job.id!.toString(),
        status: 'WAITING',
        assignmentId: assignment.id,
      },
    });

    res.status(201).json({
      success: true,
      data: {
        assignment,
        jobId: job.id,
      },
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/assignments/:id
export const updateAssignment = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const existing = await prisma.assignment.findFirst({
      where: {
        id: req.params.id,
        userId: req.userId!,
      },
    });

    if (!existing) {
      throw new AppError('Assignment not found', 404);
    }

    const {
      title,
      subject,
      dueDate,
      additionalInfo,
    } = req.body as {
      title?: string;
      subject?: string;
      dueDate?: string;
      additionalInfo?: string;
    };

    const assignment = await prisma.assignment.update({
      where: {
        id: req.params.id,
      },

      data: {
        ...(title && { title }),

        ...(subject && { subject }),

        ...(dueDate && {
          dueDate: new Date(dueDate),
        }),

        ...(additionalInfo !== undefined && {
          additionalInfo,
        }),
      },
    });

    res.json({
      success: true,
      data: {
        assignment,
      },
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/assignments/:id
export const deleteAssignment = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const assignment = await prisma.assignment.findFirst({
      where: {
        id: req.params.id,
        userId: req.userId!,
      },

      include: {
        uploadedFiles: true,
      },
    });

    if (!assignment) {
      throw new AppError('Assignment not found', 404);
    }

    // Delete uploaded files from disk
    for (const file of assignment.uploadedFiles) {
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
    }

    await prisma.assignment.delete({
      where: {
        id: req.params.id,
      },
    });

    res.json({
      success: true,
      message: 'Assignment deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/assignments/:id/pdf
export const downloadPDF = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const assignment = await prisma.assignment.findFirst({
      where: {
        id: req.params.id,
        userId: req.userId!,
      },
    });

    if (!assignment) {
      throw new AppError('Assignment not found', 404);
    }

    if (assignment.status !== 'COMPLETED') {
      throw new AppError(
        'Assignment generation is not yet complete',
        400
      );
    }

    const outputDir = path.join(
      process.cwd(),
      'generated-pdfs'
    );

    const outputPath = path.join(
      outputDir,
      `${assignment.id}.pdf`
    );

    if (!fs.existsSync(outputPath)) {
      fs.mkdirSync(outputDir, { recursive: true });

      const job = await pdfGenerationQueue.add('generate', {
        assignmentId: assignment.id,
        outputPath,
      });

      try {
        await job.waitUntilFinished(pdfQueueEvents);
      } catch {
        throw new AppError('PDF generation failed. Please try again.', 500);
      }

      if (!fs.existsSync(outputPath)) {
        throw new AppError('PDF generation failed. Please try again.', 500);
      }
    }

    const safeTitle = assignment.title.replace(
      /[^a-zA-Z0-9_\-]/g,
      '_'
    );

    res.setHeader('Content-Type', 'application/pdf');

    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${safeTitle}.pdf"`
    );

    fs.createReadStream(outputPath).pipe(res);
  } catch (error) {
    next(error);
  }
};

// POST /api/assignments/:id/regenerate
export const regenerateAssignment = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const assignment = await prisma.assignment.findFirst({
      where: {
        id: req.params.id,
        userId: req.userId!,
      },

      include: {
        uploadedFiles: true,
        questionTypes: true,
      },
    });

    if (!assignment) {
      throw new AppError('Assignment not found', 404);
    }

    const cachedPdf = path.join(process.cwd(), 'generated-pdfs', `${assignment.id}.pdf`);
    if (fs.existsSync(cachedPdf)) {
      fs.unlinkSync(cachedPdf);
    }

    // Reset assignment status
    await prisma.assignment.update({
      where: {
        id: assignment.id,
      },

      data: {
        status: 'PENDING',
        totalQuestions: 0,
        totalMarks: 0,
      },
    });

    const uploadedFile = assignment.uploadedFiles[0];

    const job = await assignmentGenerationQueue.add(
      'generate',
      {
        assignmentId: assignment.id,

        userId: req.userId!,

        title: assignment.title,

        subject: assignment.subject,

        class: assignment.class,

        questionTypes: assignment.questionTypes.map(
          (qt) => ({
            type: qt.type,
            quantity: qt.quantity,
            marks: qt.marks,
          })
        ),

        additionalInfo:
          assignment.additionalInfo ?? undefined,

        uploadedFilePath: uploadedFile?.path,

        uploadedFileMimetype:
          uploadedFile?.mimetype,
      }
    );

    await prisma.generationJob.create({
      data: {
        jobId: job.id!.toString(),
        status: 'WAITING',
        assignmentId: assignment.id,
      },
    });

    res.json({
      success: true,
      data: {
        jobId: job.id,
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/assignments/:id/status
export const getJobStatus = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const assignment = await prisma.assignment.findFirst({
      where: {
        id: req.params.id,
        userId: req.userId!,
      },

      include: {
        generationJobs: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
        },
      },
    });

    if (!assignment) {
      throw new AppError('Assignment not found', 404);
    }

    const latestJob = assignment.generationJobs[0];

    res.json({
      success: true,

      data: {
        assignmentStatus: assignment.status,
        job: latestJob || null,
      },
    });
  } catch (error) {
    next(error);
  }
};