import { useEffect, useState, useMemo } from 'react';
import TradeChart from '../components/TradeChart';
import { apiCache } from '../lib/cache';

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

export default function Trade() {
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

    // Check cache first (5 minute TTL)
    const cacheKey = `icon_${selectedMarket.id}`;
    const cached = apiCache.get<string>(cacheKey);

    if (cached) {
      setCoinIcon(cached);
      return;
    }

    // Only fetch if not in cache
    const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${selectedMarket.id}`;
    fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data) => {
        if (data && data[0]?.image) {
          const iconUrl = data[0].image;
          setCoinIcon(iconUrl);
          // Cache for 5 minutes
          apiCache.set(cacheKey, iconUrl, 5 * 60 * 1000);
        }
      })
      .catch((err) => {
        console.warn('Icon fetch failed:', err);
        // Set null to prevent infinite retries
        setCoinIcon(null);
      });
  }, [selectedMarket]);

  return (
    <div className="max-w-7xl mx-auto px-6 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-white">Trading</h1>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Search coins..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-2 bg-slate-800 text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Coin Selector Sidebar */}
        <div className="col-span-2">
          <div className="bg-slate-800/50 rounded-lg p-4 max-h-[calc(100vh-200px)] overflow-y-auto">
            <h3 className="text-sm font-semibold text-slate-300 mb-3">
              Select Coin
            </h3>
            <div className="space-y-2">
              {filteredMarkets.map((market) => (
                <button
                  key={market.symbol}
                  onClick={() => setSelectedCoin(market.symbol)}
                  className={`w-full text-left px-3 py-2 rounded transition-colors ${
                    selectedCoin === market.symbol
                      ? 'bg-amber-500 text-slate-900 font-semibold'
                      : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {market.symbol}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Trade Chart */}
        <div className="col-span-10">
          {selectedMarket && (
            <TradeChart
              selectedCoin={selectedCoin}
              coinId={selectedMarket.id}
              coinIcon={coinIcon}
            />
          )}
        </div>
      </div>
    </div>
  );
}
