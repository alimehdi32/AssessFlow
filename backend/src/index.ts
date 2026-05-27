import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import fs from 'fs';
import { initSocket } from './sockets';
import authRoutes from './routes/auth.routes';
import assignmentRoutes from './routes/assignment.routes';
import { errorHandler, notFound } from './middleware/error.middleware';
import logger from './config/logger';

const app = express();
const server = createServer(app);

// Initialise Socket.IO
initSocket(server);

// ─── Ensure Required Directories ─────────────────────────────────────────────
const dirs = [
  process.env.UPLOAD_DIR || './uploads',
  './logs',
  './generated-pdfs',
];
for (const dir of dirs) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

// ─── Global Middleware ────────────────────────────────────────────────────────
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: 'Too many requests, please try again later.' },
  })
);

// Stricter rate limit for auth endpoints
app.use(
  '/api/auth',
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 30,
    message: { success: false, error: 'Too many auth requests, please try again later.' },
  })
);

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/assignments', assignmentRoutes);

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'OK',
    service: 'VedaAI Backend',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV,
  });
});

// ─── Error Handling ───────────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ─── Start Server ─────────────────────────────────────────────────────────────
const PORT = parseInt(process.env.PORT || '5000');
server.listen(PORT, () => {
  logger.info(`🚀 VedaAI server running on http://localhost:${PORT}`);
  logger.info(`📝 Environment: ${process.env.NODE_ENV}`);
});

export { app, server };
