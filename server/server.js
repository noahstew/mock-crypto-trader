import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import WebSocket from 'ws';
import cors from 'cors';

const app = express();
app.use(cors());

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

coinbase.on('message', (msg) => {
  const data = JSON.parse(msg);
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
