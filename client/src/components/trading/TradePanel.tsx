import { useState } from 'react';

interface TradePanelProps {
  selectedCoin: string;
  type: 'buy' | 'sell';
  buttonColor: string;
  buttonHoverColor: string;
}

export default function TradePanel({
  selectedCoin,
  type,
  buttonColor,
  buttonHoverColor,
}: TradePanelProps) {
  const [amount, setAmount] = useState('');
  const [unit, setUnit] = useState<'USD' | 'COIN'>(
    type === 'buy' ? 'USD' : 'COIN'
  );

  const handleTrade = () => {
    console.log(type === 'buy' ? 'Bought' : 'Sold');
    // TODO: Implement trade logic with amount and unit
  };

  const actionText = type === 'buy' ? 'Buy' : 'Sell';

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
          />
        </div>
        <button
          onClick={handleTrade}
          className={`w-full ${buttonColor} ${buttonHoverColor} text-white font-semibold py-2 rounded transition-colors`}
        >
          {actionText}
        </button>
      </div>
    </div>
  );
}
