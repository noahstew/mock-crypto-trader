import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import http from 'http';
import { Server as IOServer } from 'socket.io';
import app from './app.js';
import registerSockets from './sockets/index.js';

// Load .env from project root (one level up)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: join(__dirname, '..', '.env') });

const PORT = process.env.PORT ? Number(process.env.PORT) : 5000;

const server = http.createServer(app);
const io = new IOServer(server, {
  cors: { origin: '*' },
});

// Register all Socket.IO handlers and external WebSocket clients
const socketHandlers = registerSockets(io);

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

// Graceful shutdown
const shutdown = () => {
  console.log('\n🛑 Shutting down gracefully...');
  socketHandlers.close();
  io.close(() => {
    console.log('✅ Socket.IO closed');
  });
  server.close(() => {
    console.log('✅ HTTP server closed');
    process.exit(0);
  });
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
