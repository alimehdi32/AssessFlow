import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { startAIWorker } from './ai.worker';
import { startPDFWorker } from './pdf.worker';
import { initSocket } from '../sockets';
import logger from '../config/logger';

// Minimal Express server to host Socket.IO so workers can emit real-time events
const app = express();
const server = createServer(app);
initSocket(server);

const WORKER_PORT = parseInt(process.env.WORKER_PORT || '5001');
server.listen(WORKER_PORT, () =>
  logger.info(`Worker socket bridge running on port ${WORKER_PORT}`)
);

startAIWorker();
startPDFWorker();
logger.info('All workers started successfully');
