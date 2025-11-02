import express from 'express';
import type { Request, Response } from 'express';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';
import WebSocket from 'ws';
import type { RawData } from 'ws';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req: Request, res: Response) => {
  res.send('Hello from TypeScript Express!');
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' },
});

// === Connect to Coinbase WebSocket ===
const coinbase = new WebSocket('wss://ws-feed.exchange.coinbase.com');

coinbase.on('open', () => {
  console.log('Connected to Coinbase feed');
  const msg = {
    type: 'subscribe',
    product_ids: ['BTC-USD', 'ETH-USD'],
    channels: ['ticker'],
  };
  coinbase.send(JSON.stringify(msg));
});

coinbase.on('message', (msg: RawData) => {
  // Convert RawData to a string safely before parsing
  let text: string;
  if (typeof msg === 'string') {
    text = msg;
  } else if (Array.isArray(msg)) {
    // msg can be Buffer[] — concatenate then convert
    text = Buffer.concat(msg).toString();
  } else if (msg instanceof ArrayBuffer) {
    text = Buffer.from(msg).toString();
  } else {
    // Buffer or other objects
    text = msg.toString();
  }

  const data = JSON.parse(text);
  if (data.type === 'ticker') {
    // Broadcast live prices to all connected clients
    io.emit('priceUpdate', {
      pair: data.product_id,
      price: data.price,
    });
  }
});

io.on('connection', (socket) => {
  console.log('Client connected');
  socket.on('disconnect', () => console.log('Client disconnected'));
});

const PORT = 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
