import { useEffect, useState } from 'react';
import { getSocket } from '../lib/socket';
import { apiCache } from '../lib/cache';

// Single source of truth for markets: symbol -> CoinGecko id
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

export default function CryptoGrid() {
  const [prices, setPrices] = useState<
    Record<string, { price: number; prev?: number; baseline24h?: number }>
  >({});
  const [icons, setIcons] = useState<Record<string, string>>({});

  useEffect(() => {
    const socket = getSocket();

    function handlePriceUpdate(data: { pair: string; price: string }) {
      if (!data?.pair) return;
      const symbol = data.pair.split('-')[0];
      const priceNum = Number(data.price);
      if (Number.isNaN(priceNum)) return;

      setPrices((prev) => {
        const existing = prev[symbol] || {};
        // Preserve baseline24h and any other existing metadata
        return {
          ...prev,
          [symbol]: {
            ...existing,
            price: priceNum,
            prev: existing.price,
          },
        };
      });
    }

    socket.on('priceUpdate', handlePriceUpdate);

    return () => {
      socket.off('priceUpdate', handlePriceUpdate);
    };
  }, []);

  // Fetch coin images + 24h data from CoinGecko once on mount
  useEffect(() => {
    const ids = MARKETS.map((m) => m.id).filter(Boolean as any);
    if (!ids.length) return;

    const uniqueIds = Array.from(new Set(ids)).join(',');
    const cacheKey = `markets_${uniqueIds}`;

    // Check cache first (5 minute TTL)
    const cached = apiCache.get<any[]>(cacheKey);

    if (cached) {
      // Process cached data
      const iconsMap: Record<string, string> = {};
      const baselineMap: Record<string, number> = {};
      const initialPriceMap: Record<string, number> = {};

      cached.forEach((item) => {
        const market = MARKETS.find((m) => m.id === item.id);
        if (!market) return;

        // icon
        if (item.image) iconsMap[market.symbol] = item.image;

        // compute baseline (24h open)
        if (typeof item.current_price === 'number') {
          initialPriceMap[market.symbol] = item.current_price;

          if (typeof item.price_change_24h === 'number') {
            baselineMap[market.symbol] =
              item.current_price - item.price_change_24h;
          } else if (typeof item.price_change_percentage_24h === 'number') {
            const pct = item.price_change_percentage_24h;
            baselineMap[market.symbol] =
              pct === -100 ? 0 : item.current_price / (1 + pct / 100);
          }
        }
      });

      setIcons(iconsMap);

      // set initial prices and baseline24h into state
      setPrices((prev) => {
        const next = { ...prev };
        MARKETS.forEach(({ symbol }) => {
          const existing = prev[symbol];
          const initial = initialPriceMap[symbol];
          const baseline = baselineMap[symbol];

          next[symbol] = {
            price: existing?.price ?? initial ?? 0,
            prev: existing?.prev,
            baseline24h: baseline ?? existing?.baseline24h,
          };
        });
        return next;
      });
      return;
    }

    // Fetch from API if not cached
    const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${encodeURIComponent(
      uniqueIds
    )}&per_page=250`;

    fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data: any[]) => {
        // Cache the response for 5 minutes
        apiCache.set(cacheKey, data, 5 * 60 * 1000);

        const iconsMap: Record<string, string> = {};
        const baselineMap: Record<string, number> = {};
        const initialPriceMap: Record<string, number> = {};

        data.forEach((item) => {
          const market = MARKETS.find((m) => m.id === item.id);
          if (!market) return;

          // icon
          if (item.image) iconsMap[market.symbol] = item.image;

          // compute baseline (24h open)
          if (typeof item.current_price === 'number') {
            initialPriceMap[market.symbol] = item.current_price;

            if (typeof item.price_change_24h === 'number') {
              baselineMap[market.symbol] =
                item.current_price - item.price_change_24h;
            } else if (typeof item.price_change_percentage_24h === 'number') {
              const pct = item.price_change_percentage_24h;
              baselineMap[market.symbol] =
                pct === -100 ? 0 : item.current_price / (1 + pct / 100);
            }
          }
        });

        setIcons(iconsMap);

        // set initial prices and baseline24h into state so UI can calculate 24h percent immediately
        setPrices((prev) => {
          const next = { ...prev };
          MARKETS.forEach(({ symbol }) => {
            const existing = prev[symbol];
            const initial = initialPriceMap[symbol];
            const baseline = baselineMap[symbol];

            // keep existing prev if present
            next[symbol] = {
              price: existing?.price ?? initial ?? 0,
              prev: existing?.prev,
              baseline24h: baseline ?? existing?.baseline24h,
            };
          });
          return next;
        });
      })
      .catch((err) => {
        console.warn('CoinGecko markets fetch failed:', err);
      });
  }, []);

  return (
    <section className="max-w-6xl mx-auto mt-10 px-6">
      <h3 className="text-2xl font-semibold text-white mb-1 text-left">
        Available markets (USD)
      </h3>
      <p className="text-xs text-slate-400 mb-4">Prices quoted in USD</p>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {MARKETS.map(({ symbol }) => (
          <div
            key={symbol}
            className="flex flex-col items-start gap-2 p-4 bg-slate-800/40 border border-slate-700 rounded-lg text-left hover:scale-[1.02] transition-transform"
          >
            {/* top row: logo + code */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center overflow-hidden">
                {icons[symbol] ? (
                  <img
                    src={icons[symbol]}
                    alt={symbol}
                    className="w-8 h-8 object-contain"
                  />
                ) : (
                  <span className="text-amber-400 font-semibold text-sm">
                    {symbol.slice(0, 1)}
                  </span>
                )}
              </div>

              <div className="text-lg font-bold text-white">{symbol}</div>
            </div>

            {/* caption below */}
            <div className="mt-2 text-left">
              <div className="text-sm text-white font-medium">
                {typeof prices[symbol]?.price === 'number' ? (
                  new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD',
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 5,
                  }).format(prices[symbol].price)
                ) : (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-slate-600 border-t-transparent rounded-full animate-spin" />
                    <span className="text-slate-400 text-xs">loading</span>
                  </div>
                )}
              </div>
              <div
                className={`text-xs mt-1 ${
                  prices[symbol]?.baseline24h
                    ? prices[symbol].price >= (prices[symbol].baseline24h ?? 0)
                      ? 'text-emerald-400'
                      : 'text-rose-400'
                    : prices[symbol]?.prev
                    ? prices[symbol].price >= (prices[symbol].prev ?? 0)
                      ? 'text-emerald-400'
                      : 'text-rose-400'
                    : 'text-slate-400'
                }`}
              >
                {typeof prices[symbol]?.baseline24h === 'number' &&
                prices[symbol].baseline24h > 0 ? (
                  `${(
                    ((prices[symbol].price - prices[symbol].baseline24h) /
                      prices[symbol].baseline24h) *
                    100
                  ).toFixed(2)}%`
                ) : prices[symbol]?.prev ? (
                  `${(
                    ((prices[symbol].price -
                      (prices[symbol].prev ?? prices[symbol].price)) /
                      (prices[symbol].prev ?? prices[symbol].price)) *
                    100
                  ).toFixed(2)}%`
                ) : prices[symbol]?.price ? (
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 border-2 border-slate-600 border-t-transparent rounded-full animate-spin" />
                    <span className="text-slate-400 text-xs">calculating</span>
                  </div>
                ) : (
                  <span className="text-slate-400 text-xs">—</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
