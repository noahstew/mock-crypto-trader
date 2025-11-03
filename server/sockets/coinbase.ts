import WebSocket from 'ws';
import type { Server as IOServer } from 'socket.io';

type TickerMessage = {
  type: 'ticker';
  product_id: string;
  price: string;
  time: string;
  sequence: number;
  // Add other fields as needed
};

export default function createCoinbaseClient(io: IOServer) {
  let ws: WebSocket | null = null;
  let reconnectMs = 1000;

  const connect = () => {
    ws = new WebSocket('wss://ws-feed.exchange.coinbase.com');

    ws.on('open', () => {
      reconnectMs = 1000;
      console.log('✅ Connected to Coinbase feed');
      ws!.send(
        JSON.stringify({
          type: 'subscribe',
          // subscribe to a wider set of product ids matching frontend grid
          product_ids: [
            'BTC-USD',
            'ETH-USD',
            'SOL-USD',
            'ADA-USD',
            'XRP-USD',
            'LTC-USD',
            'BCH-USD',
            'DOT-USD',
            'DOGE-USD',
            'MATIC-USD',
            'BNB-USD',
            'AVAX-USD',
            'LINK-USD',
          ],
          channels: ['ticker'],
        })
      );
    });

    ws.on('message', (data: WebSocket.Data) => {
      try {
        const text = typeof data === 'string' ? data : data.toString();
        const parsed = JSON.parse(text) as Partial<TickerMessage>;

        if (parsed.type === 'ticker' && parsed.product_id && parsed.price) {
          // Broadcast live prices to all connected Socket.IO clients
          io.emit('priceUpdate', {
            pair: parsed.product_id,
            price: parsed.price,
            timestamp: parsed.time || new Date().toISOString(),
          });
        }
      } catch (err) {
        console.error('❌ Coinbase parse error:', err);
      }
    });

    ws.on('close', (code, reason) => {
      console.warn('⚠️  Coinbase WS closed:', code, reason.toString());
      ws = null;

      // Reconnect with exponential backoff
      setTimeout(() => {
        reconnectMs = Math.min(30000, reconnectMs * 2);
        console.log(`🔄 Reconnecting in ${reconnectMs}ms...`);
        connect();
      }, reconnectMs);
    });

    ws.on('error', (err) => {
      console.error('❌ Coinbase WS error:', err);
      ws?.close();
    });
  };

  connect();

  return {
    close: () => {
      if (ws) {
        console.log('Closing Coinbase WebSocket...');
        ws.close();
      }
    },
  };
}
