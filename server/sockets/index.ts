import type { Server as IOServer } from 'socket.io';
import createCoinbaseClient from './coinbase.js';

export default function registerSockets(io: IOServer) {
  const coinbase = createCoinbaseClient(io);

  io.on('connection', (socket) => {
    console.log('🔌 Client connected:', socket.id);

    // Handle custom events from clients if needed
    socket.on('disconnect', (reason) => {
      console.log('❌ Client disconnected:', socket.id, reason);
    });

    // Example: client requests specific crypto pair
    socket.on('subscribe', (pair: string) => {
      console.log(`📊 Client ${socket.id} subscribed to ${pair}`);
      // You could add dynamic subscription logic here
    });
  });

  // Return close hook for graceful shutdown
  return {
    close: () => coinbase.close(),
  };
}
