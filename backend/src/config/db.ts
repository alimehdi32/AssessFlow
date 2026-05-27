import { PrismaClient } from '@prisma/client';
import logger from './logger';

const prisma = new PrismaClient({
  log: ['error', 'warn'],
});

prisma.$connect()
  .then(() => logger.info('Database connected successfully'))
  .catch((err) => logger.error('Database connection failed', err));

export default prisma;
