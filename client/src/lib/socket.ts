import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    // Explicitly connect to the server running on port 5000.
    // If your server runs elsewhere, change this URL or use an env var.
    socket = io('http://localhost:5000');

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
