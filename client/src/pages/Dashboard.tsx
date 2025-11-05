import { useEffect, useState, useMemo } from 'react';
import TradeChart from '../components/TradeChart';

const MARKETS: { symbol: string; id: string }[] = [
  { symbol: 'BTC', id: 'bitcoin' },
  { symbol: 'ETH', id: 'ethereum' },
  { symbol: 'SOL', id: 'solana' },
  { symbol: 'ADA', id: 'cardano' },
  { symbol: 'XRP', id: 'ripple' },
  { symbol: 'LTC', id: 'litecoin' },
  { symbol: 'BCH', id: 'bitcoin-cash' },
  { symbol: 'DOT', id: 'polkadot' },
  { symbol: 'DOGE', id: 'dogecoin' },
  { symbol: 'BNB', id: 'binancecoin' },
  { symbol: 'AVAX', id: 'avalanche-2' },
  { symbol: 'LINK', id: 'chainlink' },
];

export default function Dashboard() {
  const [selectedCoin, setSelectedCoin] = useState<string>('BTC');
  const [searchTerm, setSearchTerm] = useState('');
  const [coinIcon, setCoinIcon] = useState<string | null>(null);

  const selectedMarket = MARKETS.find((m) => m.symbol === selectedCoin);

  const filteredMarkets = useMemo(() => {
    if (!searchTerm) return MARKETS;
    const lower = searchTerm.toLowerCase();
    return MARKETS.filter((m) => m.symbol.toLowerCase().includes(lower));
  }, [searchTerm]);

  // Fetch coin icon when selected coin changes
  useEffect(() => {
    if (!selectedMarket) return;

    const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${selectedMarket.id}`;
    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        if (data && data[0]?.image) {
          setCoinIcon(data[0].image);
        }
      })
      .catch((err) => console.warn('Icon fetch failed:', err));
  }, [selectedMarket]);

  return (
    <div className="max-w-7xl mx-auto px-6 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-white">Live Price Chart</h1>

        {/* Coin Search */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search coin..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-2 pr-10 bg-slate-800 border border-slate-700 text-white rounded-lg w-64"
          />
          {searchTerm && (
            <div className="absolute top-full left-0 mt-1 w-full bg-slate-800 border border-slate-700 rounded-lg max-h-60 overflow-y-auto z-10 shadow-lg">
              {filteredMarkets.map((market) => (
                <button
                  key={market.symbol}
                  onClick={() => {
                    setSelectedCoin(market.symbol);
                    setSearchTerm('');
                  }}
                  className="w-full text-left px-4 py-2 text-white hover:bg-slate-700 transition-colors"
                >
                  {market.symbol}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <TradeChart
        selectedCoin={selectedCoin}
        coinId={selectedMarket?.id || 'bitcoin'}
        coinIcon={coinIcon}
      />
    </div>
  );
}
