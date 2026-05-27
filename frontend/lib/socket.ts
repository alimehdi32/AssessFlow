import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    socket = io(
      process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000',
      {
        withCredentials: true,
        autoConnect: false,
      }
    );
  }
  return socket;
};

export const connectSocket = (userId: string): Socket => {
  const s = getSocket();
  if (!s.connected) {
    s.connect();
    s.emit('authenticate', userId);
  }
  return s;
};

export const disconnectSocket = () => {
  socket?.disconnect();
  socket = null;
};
