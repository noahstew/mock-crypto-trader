import { useState, useCallback } from 'react';
import PortfolioCard from './portfolio/PortfolioCard';
import HoldingsTable from './portfolio/HoldingsTable';
import type { Holding } from './portfolio/HoldingsTable';

interface PortfolioSummaryProps {
  holdings: Holding[];
  availableBalance: number;
  startingBalance: number;
}

export default function PortfolioSummary({
  holdings,
  availableBalance,
  startingBalance,
}: PortfolioSummaryProps) {
  // Keep live prices in state to recalculate overview cards
  const [livePrices, setLivePrices] = useState<Record<string, number>>({});

  // Callback to receive price updates from HoldingsTable
  const handlePriceUpdate = useCallback((symbol: string, newPrice: number) => {
    setLivePrices((prev) => ({
      ...prev,
      [symbol]: newPrice,
    }));
  }, []);

  // Use live prices for holdings if available
  const holdingsWithLivePrices = holdings.map((h) => ({
    ...h,
    currentPrice: livePrices[h.symbol] ?? h.currentPrice,
  }));

  // Calculate total portfolio value with live prices
  const holdingsValue = holdingsWithLivePrices.reduce(
    (sum, h) => sum + h.amount * h.currentPrice,
    0
  );
  const totalPortfolioValue = holdingsValue + availableBalance;

  // Calculate overall gain/loss with live prices
  const totalInvested = startingBalance;
  const totalGainLoss = totalPortfolioValue - totalInvested;
  const totalGainLossPercent =
    totalInvested > 0 ? (totalGainLoss / totalInvested) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Portfolio Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <PortfolioCard
          label="Total Portfolio Value"
          value={`$${totalPortfolioValue.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`}
        />

        <PortfolioCard
          label="Available Balance"
          value={`$${availableBalance.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`}
          valueColor="text-amber-400"
        />

        <PortfolioCard
          label="Starting Balance"
          value={`$${startingBalance.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`}
          valueColor="text-slate-300"
        />

        <PortfolioCard
          label="Total Gain/Loss"
          value={`${
            totalGainLoss >= 0 ? '+' : ''
          }$${totalGainLoss.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`}
          subValue={`${
            totalGainLossPercent >= 0 ? '+' : ''
          }${totalGainLossPercent.toFixed(2)}%`}
          valueColor={totalGainLoss >= 0 ? 'text-emerald-400' : 'text-rose-400'}
          subValueColor={
            totalGainLossPercent >= 0 ? 'text-emerald-400' : 'text-rose-400'
          }
        />
      </div>

      {/* Holdings Table */}
      <HoldingsTable
        holdings={holdingsWithLivePrices}
        onPriceUpdate={handlePriceUpdate}
      />
    </div>
  );
}
