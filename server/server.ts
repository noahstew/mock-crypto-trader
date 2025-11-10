import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import http from 'http';
import { Server as IOServer } from 'socket.io';
import app from './app.js';
import registerSockets from './sockets/index.js';

// Load .env from project root (one level up) - only in development
// In production (Docker), environment variables are provided by the platform
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

if (process.env.NODE_ENV !== 'production') {
  config({ path: join(__dirname, '..', '.env') });
}

const PORT = process.env.PORT ? Number(process.env.PORT) : 5000;

const server = http.createServer(app);

// Socket.io CORS configuration - allow frontend connections
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000',
  process.env.FRONTEND_URL,
].filter(Boolean);

const io = new IOServer(server, {
  cors: {
    origin: (origin, callback) => {
      // Allow requests with no origin
      if (!origin) return callback(null, true);

      // Allow Vercel deployments
      if (origin.includes('vercel.app')) {
        return callback(null, true);
      }

      // Allow configured origins
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST'],
  },
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
