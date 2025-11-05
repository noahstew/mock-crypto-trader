import { useEffect, useState, useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { getSocket } from '../lib/socket';

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

type TimePeriod = '1H' | '1D' | '1W' | '1Y';
type ChartDataPoint = { timestamp: number; price: number; time: string };

export default function Dashboard() {
  const [selectedCoin, setSelectedCoin] = useState<string>('BTC');
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('1D');
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [coinIcon, setCoinIcon] = useState<string | null>(null);
  const [buyAmount, setBuyAmount] = useState('');
  const [buyUnit, setBuyUnit] = useState<'USD' | 'COIN'>('USD');
  const [sellAmount, setSellAmount] = useState('');
  const [sellUnit, setSellUnit] = useState<'USD' | 'COIN'>('COIN');

  // Mock holdings data - will be replaced with real data from backend
  const [holdings] = useState({
    amount: 0.5, // amount of coins owned
    purchasePrice: 65000, // average purchase price
  });

  const selectedMarket = MARKETS.find((m) => m.symbol === selectedCoin);

  // Fetch historical data from CoinGecko
  useEffect(() => {
    if (!selectedMarket) return;

    function fetchHistoricalData() {
      if (!selectedMarket) return;
      setLoading(true);

      const daysMap: Record<TimePeriod, number> = {
        '1H': 0.042, // ~1 hour in days
        '1D': 1,
        '1W': 7,
        '1Y': 365,
      };

      const days = daysMap[timePeriod];
      const url = `https://api.coingecko.com/api/v3/coins/${selectedMarket.id}/market_chart?vs_currency=usd&days=${days}`;

      fetch(url)
        .then((r) => r.json())
        .then((data) => {
          if (data?.prices) {
            const formatted = data.prices.map(
              ([timestamp, price]: [number, number]) => ({
                timestamp,
                price,
                time: formatTime(timestamp, timePeriod),
              })
            );
            setChartData(formatted);
            if (formatted.length > 0) {
              setCurrentPrice(formatted[formatted.length - 1].price);
            }
          }
        })
        .catch((err) => console.warn('Chart data fetch failed:', err))
        .finally(() => setLoading(false));
    }

    // Initial fetch
    fetchHistoricalData();

    // Refresh intervals based on time period
    const refreshIntervalMap: Record<TimePeriod, number> = {
      '1H': 30 * 1000, // Refresh every 30 seconds for 1H
      '1D': 2 * 60 * 1000, // Refresh every 2 minutes for 1D
      '1W': 10 * 60 * 1000, // Refresh every 10 minutes for 1W
      '1Y': 30 * 60 * 1000, // Refresh every 30 minutes for 1Y
    };

    // Set up periodic refresh
    const intervalId = setInterval(
      fetchHistoricalData,
      refreshIntervalMap[timePeriod]
    );

    return () => clearInterval(intervalId);
  }, [selectedMarket, timePeriod]);

  // Subscribe to live price updates (for current price display only)
  useEffect(() => {
    const socket = getSocket();

    function handlePriceUpdate(data: { pair: string; price: string }) {
      if (!data?.pair) return;
      const symbol = data.pair.split('-')[0];
      if (symbol !== selectedCoin) return;

      const priceNum = Number(data.price);
      if (Number.isNaN(priceNum)) return;

      // Update current price display (not the chart)
      setCurrentPrice(priceNum);
    }

    socket.on('priceUpdate', handlePriceUpdate);
    return () => {
      socket.off('priceUpdate', handlePriceUpdate);
    };
  }, [selectedCoin]);

  function formatTime(timestamp: number, period: TimePeriod): string {
    const date = new Date(timestamp);
    if (period === '1H') {
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } else if (period === '1D') {
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } else if (period === '1W') {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
      });
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
    }
  }

  const filteredMarkets = useMemo(() => {
    if (!searchTerm) return MARKETS;
    const lower = searchTerm.toLowerCase();
    return MARKETS.filter((m) => m.symbol.toLowerCase().includes(lower));
  }, [searchTerm]);

  const priceChange = useMemo(() => {
    if (chartData.length < 2 || !currentPrice) return null;
    const firstPrice = chartData[0].price;
    const change = ((currentPrice - firstPrice) / firstPrice) * 100;
    return change;
  }, [chartData, currentPrice]);

  const priceStats = useMemo(() => {
    if (chartData.length === 0) return { high: null, low: null };
    const prices = chartData.map((d) => d.price);
    return {
      high: Math.max(...prices),
      low: Math.min(...prices),
    };
  }, [chartData]);

  const holdingsValue = useMemo(() => {
    if (!currentPrice || holdings.amount === 0) {
      return {
        currentValue: 0,
        purchaseValue: 0,
        changePercent: 0,
        changeAmount: 0,
      };
    }

    const currentValue = holdings.amount * currentPrice;
    const purchaseValue = holdings.amount * holdings.purchasePrice;
    const changeAmount = currentValue - purchaseValue;
    const changePercent =
      ((currentPrice - holdings.purchasePrice) / holdings.purchasePrice) * 100;

    return {
      currentValue,
      purchaseValue,
      changePercent,
      changeAmount,
    };
  }, [currentPrice, holdings]);

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

      <div className="bg-slate-900/60 border border-slate-700 rounded-lg p-6">
        {/* Active Coin Header with Icon */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-700">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-slate-800 flex items-center justify-center overflow-hidden">
              {coinIcon ? (
                <img
                  src={coinIcon}
                  alt={selectedCoin}
                  className="w-12 h-12 object-contain"
                />
              ) : (
                <span className="text-amber-400 font-bold text-xl">
                  {selectedCoin.slice(0, 1)}
                </span>
              )}
            </div>
            <div>
              <div className="text-2xl font-bold text-white">
                {selectedCoin}
              </div>
              <div className="text-sm text-slate-400">
                {selectedMarket?.id
                  .split('-')
                  .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                  .join(' ')}
              </div>
            </div>
          </div>

          <div className="text-right">
            <div className="text-sm text-slate-400 mb-1">Current Price</div>
            <div className="text-3xl font-bold text-white">
              {currentPrice !== null
                ? `$${currentPrice.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}`
                : '—'}
            </div>
            {priceChange !== null && (
              <div
                className={`text-lg font-semibold ${
                  priceChange >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {priceChange >= 0 ? '+' : ''}
                {priceChange.toFixed(2)}%
              </div>
            )}
          </div>
        </div>

        {/* Time period selector and stats */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex gap-2">
            {(['1H', '1D', '1W', '1Y'] as TimePeriod[]).map((period) => (
              <button
                key={period}
                onClick={() => setTimePeriod(period)}
                className={`px-4 py-2 rounded font-semibold transition-colors ${
                  timePeriod === period
                    ? 'bg-amber-400 text-slate-900'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {period}
              </button>
            ))}
          </div>

          {/* Period Stats - Inline */}
          {chartData.length > 0 && (
            <div className="flex gap-4">
              <div className="bg-slate-800/50 rounded-lg px-4 py-2">
                <div className="text-xs text-slate-400">Period High</div>
                <div className="text-sm font-semibold text-emerald-400">
                  {priceStats.high !== null
                    ? `$${priceStats.high.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}`
                    : '—'}
                </div>
              </div>
              <div className="bg-slate-800/50 rounded-lg px-4 py-2">
                <div className="text-xs text-slate-400">Period Low</div>
                <div className="text-sm font-semibold text-rose-400">
                  {priceStats.low !== null
                    ? `$${priceStats.low.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}`
                    : '—'}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Chart */}
        <div className="h-96 mb-6">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="w-8 h-8 border-4 border-slate-600 border-t-amber-400 rounded-full animate-spin" />
            </div>
          ) : chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis
                  dataKey="time"
                  stroke="#94a3b8"
                  tick={{ fill: '#94a3b8', fontSize: 12 }}
                  interval="preserveStartEnd"
                  minTickGap={50}
                />
                <YAxis
                  stroke="#94a3b8"
                  tick={{ fill: '#94a3b8', fontSize: 12 }}
                  domain={['dataMin - 10', 'dataMax + 10']}
                  tickFormatter={(val: number) =>
                    `$${Number(val).toLocaleString(undefined, {
                      maximumFractionDigits: 0,
                    })}`
                  }
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #475569',
                    borderRadius: '0.5rem',
                    color: '#fff',
                  }}
                  formatter={(value: number) => [
                    `$${value.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}`,
                    'Price',
                  ]}
                />
                <Line
                  type="monotone"
                  dataKey="price"
                  stroke="#fbbf24"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-slate-400">
              No data available
            </div>
          )}
        </div>

        {/* Trading Panel */}
        {chartData.length > 0 && (
          <div className="grid grid-cols-10 gap-4 pt-4 border-t border-slate-700">
            {/* Buy Section */}
            <div className="col-span-3 bg-slate-800/50 rounded-lg p-4">
              <div className="text-sm font-semibold text-slate-200 mb-3">
                Buy {selectedCoin}
              </div>
              <div className="space-y-3">
                <div>
                  <div className="flex gap-2 mb-2">
                    <button
                      onClick={() => setBuyUnit('USD')}
                      className={`px-3 py-1 text-xs rounded ${
                        buyUnit === 'USD'
                          ? 'bg-amber-500 text-slate-900'
                          : 'bg-slate-700 text-slate-400'
                      }`}
                    >
                      USD
                    </button>
                    <button
                      onClick={() => setBuyUnit('COIN')}
                      className={`px-3 py-1 text-xs rounded ${
                        buyUnit === 'COIN'
                          ? 'bg-amber-500 text-slate-900'
                          : 'bg-slate-700 text-slate-400'
                      }`}
                    >
                      {selectedCoin}
                    </button>
                  </div>
                  <input
                    type="number"
                    value={buyAmount}
                    onChange={(e) => setBuyAmount(e.target.value)}
                    placeholder={`Amount in ${
                      buyUnit === 'USD' ? 'USD' : selectedCoin
                    }`}
                    className="w-full bg-slate-700 text-slate-100 px-3 py-2 rounded text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <button
                  onClick={() => console.log('Buy:', buyAmount, buyUnit)}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-2 rounded transition-colors"
                >
                  Buy
                </button>
              </div>
            </div>

            {/* Holdings Section */}
            <div className="col-span-4 bg-slate-800/50 rounded-lg p-4">
              <div className="text-sm font-semibold text-slate-200 mb-3">
                Your Holdings
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-400">
                    {selectedCoin} Amount
                  </span>
                  <span className="text-sm font-semibold text-slate-100">
                    {holdings.amount.toFixed(5)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-400">
                    Avg Purchase Price
                  </span>
                  <span className="text-sm font-semibold text-slate-400">
                    $
                    {holdings.purchasePrice.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-400">
                    Total Investment
                  </span>
                  <span className="text-sm font-semibold text-slate-400">
                    $
                    {holdingsValue.purchaseValue.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-400">Current Value</span>
                  <span className="text-sm font-semibold text-slate-100">
                    $
                    {holdingsValue.currentValue.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-400">
                    Total Gain/Loss
                  </span>
                  <span
                    className={`text-sm font-semibold ${
                      holdingsValue.changePercent >= 0
                        ? 'text-emerald-400'
                        : 'text-rose-400'
                    }`}
                  >
                    {holdingsValue.changePercent >= 0 ? '+' : ''}$
                    {holdingsValue.changeAmount.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{' '}
                    ({holdingsValue.changePercent >= 0 ? '+' : ''}
                    {holdingsValue.changePercent.toFixed(2)}%)
                  </span>
                </div>
              </div>
            </div>

            {/* Sell Section */}
            <div className="col-span-3 bg-slate-800/50 rounded-lg p-4">
              <div className="text-sm font-semibold text-slate-200 mb-3">
                Sell {selectedCoin}
              </div>
              <div className="space-y-3">
                <div>
                  <div className="flex gap-2 mb-2">
                    <button
                      onClick={() => setSellUnit('USD')}
                      className={`px-3 py-1 text-xs rounded ${
                        sellUnit === 'USD'
                          ? 'bg-amber-500 text-slate-900'
                          : 'bg-slate-700 text-slate-400'
                      }`}
                    >
                      USD
                    </button>
                    <button
                      onClick={() => setSellUnit('COIN')}
                      className={`px-3 py-1 text-xs rounded ${
                        sellUnit === 'COIN'
                          ? 'bg-amber-500 text-slate-900'
                          : 'bg-slate-700 text-slate-400'
                      }`}
                    >
                      {selectedCoin}
                    </button>
                  </div>
                  <input
                    type="number"
                    value={sellAmount}
                    onChange={(e) => setSellAmount(e.target.value)}
                    placeholder={`Amount in ${
                      sellUnit === 'USD' ? 'USD' : selectedCoin
                    }`}
                    className="w-full bg-slate-700 text-slate-100 px-3 py-2 rounded text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <button
                  onClick={() => console.log('Sell:', sellAmount, sellUnit)}
                  className="w-full bg-rose-500 hover:bg-rose-600 text-white font-semibold py-2 rounded transition-colors"
                >
                  Sell
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
