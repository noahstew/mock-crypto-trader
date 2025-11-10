import express from 'express';
import type { Request, Response } from 'express';
import cors from 'cors';
import authRouter from './routes/auth.js';
import portfolioRouter from './routes/holdings.js';

const app = express();

// CORS configuration - allow requests from frontend (local and production)
const allowedOrigins = [
  'http://localhost:5173', // Vite dev server
  'http://localhost:5174', // Alternate Vite port
  'http://localhost:3000', // Alternative local dev
  process.env.FRONTEND_URL, // Production frontend URL (set in Render)
].filter(Boolean); // Remove undefined values

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, Postman, etc.)
      if (!origin) return callback(null, true);

      // Allow Vercel preview/production deployments
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
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true, limit: '100kb' }));

// Routes
app.use('/auth', authRouter);
app.use('/api/portfolio', portfolioRouter);

// Health check endpoint
app.get('/', (req: Request, res: Response) => {
  res.send('Hello from TypeScript Express!');
});

app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default app;
