import express from 'express';
import type { Request, Response } from 'express';
import cors from 'cors';
import authRouter from './routes/auth.js';

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true, limit: '100kb' }));
app.use('/auth', authRouter);
app.use('/trade', authRouter);

// Health check endpoint
app.get('/', (req: Request, res: Response) => {
  res.send('Hello from TypeScript Express!');
});

app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default app;
