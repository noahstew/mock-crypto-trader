import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';

export function getSocket(): Socket {
  if (!socket) {
    // Connect to the server using the configured API base URL
    socket = io(API_BASE);

    socket.on('connect', () => {
      console.log('⚡ Socket connected (client):', socket?.id);
    });

    socket.on('connect_error', (err) => {
      console.warn('⚡ Socket connect error (client):', err.message || err);
    });
  }
  return socket;
}

export function closeSocket() {
  if (socket) {
    socket.close();
    socket = null;
  }
}
