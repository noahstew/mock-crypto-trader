import { useState, useEffect } from 'react';
import { getSocket } from '../../lib/socket';

// Format price with dynamic decimal places (2-5 based on value)
function formatPrice(price: number): string {
  if (price >= 1000) {
    // Large prices: $1,234.12
    return price.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  } else if (price >= 1) {
    // Medium prices: $12.345
    return price.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 3,
    });
  } else if (price >= 0.01) {
    // Small prices: $0.12345
    return price.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 5,
    });
  } else {
    // Very small prices: $0.00123
    return price.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 5,
    });
  }
}

export interface Holding {
  symbol: string;
  amount: number;
  avgPurchasePrice: number;
  currentPrice: number;
  icon?: string;
}

type SortKey =
  | 'symbol'
  | 'amount'
  | 'avgPurchasePrice'
  | 'currentPrice'
  | 'totalValue'
  | 'gainLoss';
type SortDirection = 'asc' | 'desc';

interface HoldingsTableProps {
  holdings: Holding[];
  onPriceUpdate?: (symbol: string, newPrice: number) => void;
}

export default function HoldingsTable({
  holdings,
  onPriceUpdate,
}: HoldingsTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('symbol');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [livePrices, setLivePrices] = useState<Record<string, number>>({});

  // Subscribe to WebSocket price updates
  useEffect(() => {
    const socket = getSocket();

    function handlePriceUpdate(data: { pair: string; price: string }) {
      if (!data?.pair) return;
      const symbol = data.pair.split('-')[0];
      const priceNum = Number(data.price);
      if (Number.isNaN(priceNum)) return;

      // Update local state for live display
      setLivePrices((prev) => ({
        ...prev,
        [symbol]: priceNum,
      }));

      // Notify parent component if callback provided
      if (onPriceUpdate) {
        onPriceUpdate(symbol, priceNum);
      }
    }

    socket.on('priceUpdate', handlePriceUpdate);

    return () => {
      socket.off('priceUpdate', handlePriceUpdate);
    };
  }, [onPriceUpdate]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  // Use live prices if available, otherwise fall back to initial price
  const holdingsWithLivePrices = holdings.map((h) => ({
    ...h,
    currentPrice: livePrices[h.symbol] ?? h.currentPrice,
  }));

  const sortedHoldings = [...holdingsWithLivePrices].sort((a, b) => {
    let aValue: number | string = 0;
    let bValue: number | string = 0;

    switch (sortKey) {
      case 'symbol':
        aValue = a.symbol;
        bValue = b.symbol;
        break;
      case 'amount':
        aValue = a.amount;
        bValue = b.amount;
        break;
      case 'avgPurchasePrice':
        aValue = a.avgPurchasePrice;
        bValue = b.avgPurchasePrice;
        break;
      case 'currentPrice':
        aValue = a.currentPrice;
        bValue = b.currentPrice;
        break;
      case 'totalValue':
        aValue = a.amount * a.currentPrice;
        bValue = b.amount * b.currentPrice;
        break;
      case 'gainLoss':
        aValue = a.amount * a.currentPrice - a.amount * a.avgPurchasePrice;
        bValue = b.amount * b.currentPrice - b.amount * b.avgPurchasePrice;
        break;
    }

    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortDirection === 'asc'
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }

    return sortDirection === 'asc'
      ? (aValue as number) - (bValue as number)
      : (bValue as number) - (aValue as number);
  });

  const SortIcon = ({ columnKey }: { columnKey: SortKey }) => {
    if (sortKey !== columnKey) {
      return (
        <svg
          className="w-4 h-4 text-slate-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
          />
        </svg>
      );
    }
    return sortDirection === 'asc' ? (
      <svg
        className="w-4 h-4 text-amber-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M5 15l7-7 7 7"
        />
      </svg>
    ) : (
      <svg
        className="w-4 h-4 text-amber-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M19 9l-7 7-7-7"
        />
      </svg>
    );
  };

  if (holdings.length === 0) {
    return (
      <div className="bg-slate-800/50 rounded-lg border border-slate-700 px-6 py-12 text-center text-slate-400">
        No holdings yet. Start trading to build your portfolio!
      </div>
    );
  }

  return (
    <div className="bg-slate-800/50 rounded-lg border border-slate-700 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-700">
        <h2 className="text-xl font-semibold text-white">Your Holdings</h2>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-700/50">
            <tr>
              <th
                className="px-6 py-3 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider cursor-pointer hover:bg-slate-700 transition-colors"
                onClick={() => handleSort('symbol')}
              >
                <div className="flex items-center gap-2">
                  Asset
                  <SortIcon columnKey="symbol" />
                </div>
              </th>
              <th
                className="px-6 py-3 text-right text-xs font-semibold text-slate-300 uppercase tracking-wider cursor-pointer hover:bg-slate-700 transition-colors"
                onClick={() => handleSort('amount')}
              >
                <div className="flex items-center justify-end gap-2">
                  Amount
                  <SortIcon columnKey="amount" />
                </div>
              </th>
              <th
                className="px-6 py-3 text-right text-xs font-semibold text-slate-300 uppercase tracking-wider cursor-pointer hover:bg-slate-700 transition-colors"
                onClick={() => handleSort('avgPurchasePrice')}
              >
                <div className="flex items-center justify-end gap-2">
                  Avg Purchase Price
                  <SortIcon columnKey="avgPurchasePrice" />
                </div>
              </th>
              <th
                className="px-6 py-3 text-right text-xs font-semibold text-slate-300 uppercase tracking-wider cursor-pointer hover:bg-slate-700 transition-colors"
                onClick={() => handleSort('currentPrice')}
              >
                <div className="flex items-center justify-end gap-2">
                  Current Price
                  <SortIcon columnKey="currentPrice" />
                </div>
              </th>
              <th
                className="px-6 py-3 text-right text-xs font-semibold text-slate-300 uppercase tracking-wider cursor-pointer hover:bg-slate-700 transition-colors"
                onClick={() => handleSort('totalValue')}
              >
                <div className="flex items-center justify-end gap-2">
                  Total Value
                  <SortIcon columnKey="totalValue" />
                </div>
              </th>
              <th
                className="px-6 py-3 text-right text-xs font-semibold text-slate-300 uppercase tracking-wider cursor-pointer hover:bg-slate-700 transition-colors"
                onClick={() => handleSort('gainLoss')}
              >
                <div className="flex items-center justify-end gap-2">
                  Gain/Loss
                  <SortIcon columnKey="gainLoss" />
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {sortedHoldings.map((holding) => {
              const totalValue = holding.amount * holding.currentPrice;
              const totalCost = holding.amount * holding.avgPurchasePrice;
              const gainLoss = totalValue - totalCost;
              const gainLossPercent =
                totalCost > 0 ? (gainLoss / totalCost) * 100 : 0;

              return (
                <tr
                  key={holding.symbol}
                  className="hover:bg-slate-700/30 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {holding.icon && (
                        <img
                          src={holding.icon}
                          alt={holding.symbol}
                          className="w-8 h-8 rounded-full"
                        />
                      )}
                      <div className="text-sm font-semibold text-white">
                        {holding.symbol}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right text-sm text-slate-300">
                    {holding.amount.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 8,
                    })}
                  </td>
                  <td className="px-6 py-4 text-right text-sm text-slate-300">
                    ${formatPrice(holding.avgPurchasePrice)}
                  </td>
                  <td className="px-6 py-4 text-right text-sm text-white font-medium">
                    ${formatPrice(holding.currentPrice)}
                  </td>
                  <td className="px-6 py-4 text-right text-sm text-white font-semibold">
                    $
                    {totalValue.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div
                      className={`text-sm font-semibold ${
                        gainLoss >= 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {gainLoss >= 0 ? '+' : ''}$
                      {gainLoss.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </div>
                    <div
                      className={`text-xs ${
                        gainLossPercent >= 0
                          ? 'text-emerald-400'
                          : 'text-rose-400'
                      }`}
                    >
                      {gainLossPercent >= 0 ? '+' : ''}
                      {gainLossPercent.toFixed(2)}%
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
