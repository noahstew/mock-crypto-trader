import { useEffect, useState } from 'react';
import PortfolioSummary from '../components/PortfolioSummary';
import { apiCache } from '../lib/cache';

// Mapping of symbols to CoinGecko IDs
const COIN_IDS: Record<string, string> = {
  BTC: 'bitcoin',
  ETH: 'ethereum',
  SOL: 'solana',
  ADA: 'cardano',
  XRP: 'ripple',
  LTC: 'litecoin',
  BCH: 'bitcoin-cash',
  DOT: 'polkadot',
  DOGE: 'dogecoin',
  BNB: 'binancecoin',
  AVAX: 'avalanche-2',
  LINK: 'chainlink',
};

export default function Dashboard() {
  const [holdings, setHoldings] = useState([
    {
      symbol: 'BTC',
      amount: 0.5,
      avgPurchasePrice: 65000,
      currentPrice: 67500,
      icon: undefined,
    },
    {
      symbol: 'ETH',
      amount: 2.5,
      avgPurchasePrice: 3200,
      currentPrice: 3400,
      icon: undefined,
    },
    {
      symbol: 'SOL',
      amount: 15,
      avgPurchasePrice: 145,
      currentPrice: 152,
      icon: undefined,
    },
  ]);

  const mockAvailableBalance = 25000;
  const mockStartingBalance = 50000;

  // Fetch icons for all holdings using cache
  useEffect(() => {
    const fetchIcons = async () => {
      const updatedHoldings = await Promise.all(
        holdings.map(async (holding) => {
          const coinId = COIN_IDS[holding.symbol];
          if (!coinId) return holding;

          // Check cache first
          const cacheKey = `icon_${coinId}`;
          const cached = apiCache.get<string>(cacheKey);

          if (cached) {
            return { ...holding, icon: cached };
          }

          // Fetch if not cached
          try {
            const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${coinId}`;
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const data = await response.json();

            if (data && data[0]?.image) {
              const iconUrl = data[0].image;
              // Cache for 5 minutes
              apiCache.set(cacheKey, iconUrl, 5 * 60 * 1000);
              return { ...holding, icon: iconUrl };
            }
          } catch (err) {
            console.warn(`Icon fetch failed for ${holding.symbol}:`, err);
          }

          return holding;
        })
      );

      setHoldings(updatedHoldings);
    };

    fetchIcons();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-6 py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white">Portfolio Dashboard</h1>
        <p className="text-slate-400 mt-1">
          Track your holdings and performance
        </p>
      </div>

      <PortfolioSummary
        holdings={holdings}
        availableBalance={mockAvailableBalance}
        startingBalance={mockStartingBalance}
      />
    </div>
  );
}
