import { Server as SocketServer } from 'socket.io';
import { Server as HttpServer } from 'http';
import logger from '../config/logger';

let io: SocketServer;
const userSockets = new Map<string, string[]>();

export const initSocket = (server: HttpServer): SocketServer => {
  io = new SocketServer(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    logger.info(`Socket connected: ${socket.id}`);

    socket.on('authenticate', (userId: string) => {
      const existing = userSockets.get(userId) || [];
      userSockets.set(userId, [...existing, socket.id]);
      socket.join(`user:${userId}`);
      logger.info(`User ${userId} authenticated on socket ${socket.id}`);
    });

    socket.on('disconnect', () => {
      userSockets.forEach((socketIds, userId) => {
        const filtered = socketIds.filter((id) => id !== socket.id);
        if (filtered.length === 0) userSockets.delete(userId);
        else userSockets.set(userId, filtered);
      });
      logger.info(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
};

export const emitToUser = (userId: string, event: string, data: unknown) => {
  if (io) {
    io.to(`user:${userId}`).emit(event, data);
  }
};

export { io };
