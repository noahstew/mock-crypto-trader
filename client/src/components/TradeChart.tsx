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
import { apiCache } from '../lib/cache';
import PeriodSelector from './trading/PeriodSelector';
import PeriodStats from './trading/PeriodStats';
import TradePanel from './trading/TradePanel';
import HoldingsPanel from './trading/HoldingsPanel';

type TimePeriod = '1H' | '1D' | '1W' | '1Y';
type ChartDataPoint = { timestamp: number; price: number; time: string };

interface TradeChartProps {
  selectedCoin: string;
  coinId: string;
  coinIcon: string | null;
}

export default function TradeChart({
  selectedCoin,
  coinId,
  coinIcon,
}: TradeChartProps) {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('1D');
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  // Real holdings and balance data from backend
  const [holdings, setHoldings] = useState({
    amount: 0,
    purchasePrice: 0,
  });
  const [availableBalance, setAvailableBalance] = useState(0);
  const [portfolioLoading, setPortfolioLoading] = useState(true);

  // Fetch portfolio data from backend
  const fetchPortfolioData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setPortfolioLoading(false);
        return;
      }

      const response = await fetch('http://localhost:5000/api/portfolio', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        setPortfolioLoading(false);
        return;
      }

      const data = await response.json();

      // Set available balance
      setAvailableBalance(data.portfolio.availableBalance);

      // Find holdings for the selected coin
      const coinHolding = data.holdings.find(
        (h: any) => h.symbol === selectedCoin
      );

      if (coinHolding) {
        setHoldings({
          amount: coinHolding.amount,
          purchasePrice: coinHolding.avgPurchasePrice,
        });
      } else {
        setHoldings({
          amount: 0,
          purchasePrice: 0,
        });
      }
    } catch (err) {
      console.error('Error fetching portfolio data:', err);
    } finally {
      setPortfolioLoading(false);
    }
  };

  // Fetch portfolio data on mount and when coin changes
  useEffect(() => {
    fetchPortfolioData();
  }, [selectedCoin]);

  // Fetch historical data from CoinGecko
  useEffect(() => {
    if (!coinId) return;

    function fetchHistoricalData() {
      if (!coinId) return;

      const daysMap: Record<TimePeriod, number> = {
        '1H': 0.042, // ~1 hour in days
        '1D': 1,
        '1W': 7,
        '1Y': 365,
      };

      const days = daysMap[timePeriod];

      // Check cache first (cache TTL varies by period)
      const cacheKey = `chart_${coinId}_${timePeriod}`;
      const cached = apiCache.get<ChartDataPoint[]>(cacheKey);

      if (cached) {
        setChartData(cached);
        if (cached.length > 0) {
          setCurrentPrice(cached[cached.length - 1].price);
        }
        setLoading(false);
        return;
      }

      setLoading(true);
      const url = `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=usd&days=${days}`;

      fetch(url)
        .then((r) => {
          if (!r.ok) throw new Error(`HTTP ${r.status}`);
          return r.json();
        })
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

            // Cache with TTL based on period
            const cacheTTLMap: Record<TimePeriod, number> = {
              '1H': 30 * 1000, // 30 seconds for 1H
              '1D': 2 * 60 * 1000, // 2 minutes for 1D
              '1W': 5 * 60 * 1000, // 5 minutes for 1W
              '1Y': 15 * 60 * 1000, // 15 minutes for 1Y
            };
            apiCache.set(cacheKey, formatted, cacheTTLMap[timePeriod]);
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
  }, [coinId, timePeriod]);

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

    // Current value: amount of coins * current price
    const currentValue = holdings.amount * currentPrice;

    // Purchase value: amount of coins * average purchase price
    const purchaseValue = holdings.amount * holdings.purchasePrice;

    // Change in dollar amount: current value - purchase value
    const changeAmount = currentValue - purchaseValue;

    // Change in percentage: (change amount / purchase value) * 100
    const changePercent = (changeAmount / purchaseValue) * 100;

    return {
      currentValue,
      purchaseValue,
      changePercent,
      changeAmount,
    };
  }, [currentPrice, holdings]);

  return (
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
            <div className="text-2xl font-bold text-white">{selectedCoin}</div>
            <div className="text-sm text-slate-400">
              {portfolioLoading ? (
                'Loading balance...'
              ) : (
                <>
                  Available: $
                  {availableBalance.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </>
              )}
            </div>
          </div>
        </div>

        <div className="text-right">
          <div className="text-sm text-slate-400 mb-1">Current Price</div>
          <div className="text-3xl font-bold text-white">
            {currentPrice !== null
              ? `$${currentPrice.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 5,
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
        <PeriodSelector
          timePeriod={timePeriod}
          onPeriodChange={setTimePeriod}
        />

        {/* Period Stats - Inline */}
        {chartData.length > 0 && (
          <PeriodStats high={priceStats.high} low={priceStats.low} />
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
      {chartData.length > 0 && currentPrice !== null && (
        <div className="grid grid-cols-10 gap-4 pt-4 border-t border-slate-700">
          <TradePanel
            selectedCoin={selectedCoin}
            currentPrice={currentPrice}
            type="buy"
            buttonColor="bg-emerald-600"
            buttonHoverColor="hover:bg-emerald-700"
            onTradeComplete={() => {
              // Refresh holdings and balance data after trade
              fetchPortfolioData();
            }}
          />
          <HoldingsPanel
            selectedCoin={selectedCoin}
            holdings={holdings}
            holdingsValue={holdingsValue}
          />
          <TradePanel
            selectedCoin={selectedCoin}
            currentPrice={currentPrice}
            type="sell"
            buttonColor="bg-rose-600"
            buttonHoverColor="hover:bg-rose-700"
            onTradeComplete={() => {
              // Refresh holdings and balance data after trade
              fetchPortfolioData();
            }}
          />
        </div>
      )}
    </div>
  );
}
