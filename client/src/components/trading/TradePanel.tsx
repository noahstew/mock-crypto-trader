import { useState } from 'react';

interface TradePanelProps {
  selectedCoin: string;
  currentPrice: number;
  type: 'buy' | 'sell';
  buttonColor: string;
  buttonHoverColor: string;
  onTradeComplete?: () => void;
}

export default function TradePanel({
  selectedCoin,
  currentPrice,
  type,
  buttonColor,
  buttonHoverColor,
  onTradeComplete,
}: TradePanelProps) {
  const [amount, setAmount] = useState('');
  const [unit, setUnit] = useState<'USD' | 'COIN'>(
    type === 'buy' ? 'USD' : 'COIN'
  );
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const handleTrade = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      setMessage({ type: 'error', text: 'Please enter a valid amount' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setMessage({ type: 'error', text: 'Please log in to trade' });
        setLoading(false);
        return;
      }

      // Calculate the actual amount of crypto to trade
      let cryptoAmount: number;
      if (unit === 'USD') {
        // If user entered USD, calculate how much crypto they can buy/sell
        cryptoAmount = parseFloat(amount) / currentPrice;
      } else {
        // If user entered crypto amount directly
        cryptoAmount = parseFloat(amount);
      }

      const endpoint =
        type === 'buy' ? '/api/portfolio/buy' : '/api/portfolio/sell';

      const response = await fetch(`http://localhost:5000${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          symbol: selectedCoin,
          amount: cryptoAmount,
          price: currentPrice,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Failed to ${type}`);
      }

      setMessage({ type: 'success', text: data.message });
      setAmount('');

      // Notify parent component to refresh data
      if (onTradeComplete) {
        onTradeComplete();
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || `Failed to ${type}` });
    } finally {
      setLoading(false);
    }
  };

  const actionText = type === 'buy' ? 'Buy' : 'Sell';
  const totalCost =
    unit === 'USD'
      ? parseFloat(amount) || 0
      : (parseFloat(amount) || 0) * currentPrice;

  return (
    <div className="col-span-3 bg-slate-800/50 rounded-lg p-4">
      <div className="text-sm font-semibold text-slate-200 mb-3">
        {actionText} {selectedCoin}
      </div>
      <div className="space-y-3">
        <div>
          <div className="flex gap-2 mb-2">
            <button
              onClick={() => setUnit('USD')}
              className={`px-3 py-1 text-xs rounded ${
                unit === 'USD'
                  ? 'bg-amber-500 text-slate-900'
                  : 'bg-slate-700 text-slate-400'
              }`}
            >
              USD
            </button>
            <button
              onClick={() => setUnit('COIN')}
              className={`px-3 py-1 text-xs rounded ${
                unit === 'COIN'
                  ? 'bg-amber-500 text-slate-900'
                  : 'bg-slate-700 text-slate-400'
              }`}
            >
              {selectedCoin}
            </button>
          </div>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder={`Amount in ${unit === 'USD' ? 'USD' : selectedCoin}`}
            className="w-full bg-slate-700 text-slate-100 px-3 py-2 rounded text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            disabled={loading}
          />
        </div>

        {amount && (
          <div className="text-xs text-slate-400">
            Total: ${totalCost.toFixed(2)} USD
            {unit === 'USD' && (
              <span className="ml-2">
                ({(totalCost / currentPrice).toFixed(8)} {selectedCoin})
              </span>
            )}
          </div>
        )}

        {message && (
          <div
            className={`text-xs p-2 rounded ${
              message.type === 'success'
                ? 'bg-emerald-500/20 text-emerald-400'
                : 'bg-rose-500/20 text-rose-400'
            }`}
          >
            {message.text}
          </div>
        )}

        <button
          onClick={handleTrade}
          disabled={loading}
          className={`w-full ${buttonColor} ${buttonHoverColor} text-white font-semibold py-2 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {loading ? 'Processing...' : actionText}
        </button>
      </div>
    </div>
  );
}
