import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { AppError } from './error.middleware';

export const validate = (schema: ZodSchema) => (req: Request, res: Response, next: NextFunction) => {
  try {
    schema.parse(req.body);
    next();
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      const messages = error.errors.map((e) => e.message).join(', ');
      next(new AppError(messages || 'Validation failed', 400));
    } else {
      next(new AppError('Validation failed', 400));
    }
  }
};
