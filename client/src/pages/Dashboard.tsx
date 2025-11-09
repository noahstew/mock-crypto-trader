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

interface Holding {
  symbol: string;
  amount: number;
  avgPurchasePrice: number;
  currentPrice: number;
  icon?: string;
}

export default function Dashboard() {
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [availableBalance, setAvailableBalance] = useState(0);
  const [startingBalance, setStartingBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetAmount, setResetAmount] = useState('50000');
  const [resetting, setResetting] = useState(false);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [setupAmount, setSetupAmount] = useState('50000');
  const [creatingPortfolio, setCreatingPortfolio] = useState(false);

  // Fetch portfolio data from backend
  const fetchPortfolio = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please log in to view your portfolio');
        setLoading(false);
        return;
      }

      const response = await fetch('http://localhost:5000/api/portfolio', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      // Check if portfolio needs to be created
      if (response.status === 404 && data.needsSetup) {
        setNeedsSetup(true);
        setLoading(false);
        return;
      }

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch portfolio data');
      }

      // Set portfolio balances
      setAvailableBalance(data.portfolio.availableBalance);
      setStartingBalance(data.portfolio.startingBalance);

      // Fetch icons and current prices for holdings
      const holdingsWithDetails = await Promise.all(
        data.holdings.map(async (holding: any) => {
          const coinId = COIN_IDS[holding.symbol];
          let icon: string | undefined = undefined;
          let currentPrice = holding.avgPurchasePrice; // Default to purchase price

          // Fetch icon and price if coinId exists
          if (coinId) {
            const cacheKey = `markets_${coinId}`;
            let marketData = apiCache.get<any>(cacheKey);

            if (!marketData) {
              try {
                const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${coinId}`;
                const response = await fetch(url);
                if (response.ok) {
                  const data = await response.json();
                  if (data && data[0]) {
                    marketData = data[0];
                    apiCache.set(cacheKey, marketData, 5 * 60 * 1000); // Cache for 5 minutes
                  }
                }
              } catch (err) {
                console.warn(
                  `Failed to fetch market data for ${holding.symbol}:`,
                  err
                );
              }
            }

            if (marketData) {
              icon = marketData.image;
              currentPrice =
                marketData.current_price || holding.avgPurchasePrice;
            }
          }

          return {
            symbol: holding.symbol,
            amount: holding.amount,
            avgPurchasePrice: holding.avgPurchasePrice,
            currentPrice,
            icon,
          };
        })
      );

      setHoldings(holdingsWithDetails);
      setNeedsSetup(false);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching portfolio:', err);
      setError(err.message || 'Failed to load portfolio');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPortfolio();

    // Listen for auth changes to refresh portfolio
    const handleAuthChange = () => {
      const token = localStorage.getItem('token');
      if (token) {
        fetchPortfolio();
      } else {
        setHoldings([]);
        setAvailableBalance(0);
        setStartingBalance(0);
      }
    };

    window.addEventListener('authChange', handleAuthChange);
    return () => window.removeEventListener('authChange', handleAuthChange);
  }, []);

  const handleCreatePortfolio = async () => {
    if (!setupAmount || parseFloat(setupAmount) <= 0) {
      alert('Please enter a valid starting balance');
      return;
    }

    setCreatingPortfolio(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please log in to create a portfolio');
        return;
      }

      const response = await fetch(
        'http://localhost:5000/api/portfolio/create',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            startingBalance: parseFloat(setupAmount),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create portfolio');
      }

      // Refresh portfolio data
      await fetchPortfolio();
    } catch (err: any) {
      alert(err.message || 'Failed to create portfolio');
      setCreatingPortfolio(false);
    }
  };

  const handleResetAccount = async () => {
    if (!resetAmount || parseFloat(resetAmount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    const confirmReset = window.confirm(
      `Are you sure you want to reset your account? This will:\n- Delete all holdings\n- Set your balance to $${parseFloat(
        resetAmount
      ).toLocaleString()}\n\nThis action cannot be undone!`
    );

    if (!confirmReset) return;

    setResetting(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please log in to reset your account');
        return;
      }

      const response = await fetch(
        'http://localhost:5000/api/portfolio/reset',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            startingBalance: parseFloat(resetAmount),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reset account');
      }

      alert('Account reset successfully!');
      setShowResetModal(false);
      // Refresh portfolio data
      await fetchPortfolio();
    } catch (err: any) {
      alert(err.message || 'Failed to reset account');
    } finally {
      setResetting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex items-center justify-center h-64">
          <div className="w-12 h-12 border-4 border-slate-600 border-t-amber-400 rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (needsSetup) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="max-w-md mx-auto mt-20">
          <div className="bg-slate-800 rounded-lg p-8 border border-slate-700">
            <h1 className="text-3xl font-bold text-white mb-2">Welcome!</h1>
            <p className="text-slate-400 mb-6">
              Let's set up your trading portfolio to get started.
            </p>

            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Starting Balance
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  $
                </span>
                <input
                  type="number"
                  value={setupAmount}
                  onChange={(e) => setSetupAmount(e.target.value)}
                  className="w-full pl-8 pr-4 py-3 bg-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  placeholder="50000"
                  min="0"
                  step="1000"
                />
              </div>
              <p className="text-xs text-slate-500 mt-2">
                This is your virtual trading balance. You can reset it anytime.
              </p>
            </div>

            <button
              onClick={handleCreatePortfolio}
              disabled={creatingPortfolio}
              className="w-full px-4 py-3 bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {creatingPortfolio ? 'Creating Portfolio...' : 'Create Portfolio'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="bg-rose-500/20 border border-rose-500 rounded-lg p-4 text-rose-400">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-6">
      <div className="mb-6 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-white">Portfolio</h1>
          <p className="text-slate-400 mt-1">
            Track your holdings and performance
          </p>
        </div>
        <button
          onClick={() => setShowResetModal(true)}
          className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition-colors font-medium"
        >
          Reset Account
        </button>
      </div>

      <PortfolioSummary
        holdings={holdings}
        availableBalance={availableBalance}
        startingBalance={startingBalance}
      />

      {/* Reset Account Modal */}
      {showResetModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold text-white mb-4">
              Reset Account
            </h2>
            <p className="text-slate-300 mb-4">
              This will delete all your holdings and reset your account balance.
            </p>

            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                New Starting Balance
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  $
                </span>
                <input
                  type="number"
                  value={resetAmount}
                  onChange={(e) => setResetAmount(e.target.value)}
                  className="w-full pl-8 pr-4 py-2 bg-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  placeholder="50000"
                  min="0"
                  step="1000"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowResetModal(false)}
                className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                disabled={resetting}
              >
                Cancel
              </button>
              <button
                onClick={handleResetAccount}
                disabled={resetting}
                className="flex-1 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {resetting ? 'Resetting...' : 'Reset Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
