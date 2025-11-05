interface HoldingsPanelProps {
  selectedCoin: string;
  holdings: {
    amount: number;
    purchasePrice: number;
  };
  holdingsValue: {
    currentValue: number;
    purchaseValue: number;
    changePercent: number;
    changeAmount: number;
  };
}

export default function HoldingsPanel({
  selectedCoin,
  holdings,
  holdingsValue,
}: HoldingsPanelProps) {
  return (
    <div className="col-span-4 bg-slate-800/50 rounded-lg p-4">
      <div className="text-sm font-semibold text-slate-200 mb-3">
        Your Holdings
      </div>
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-xs text-slate-400">{selectedCoin} Amount</span>
          <span className="text-sm font-semibold text-slate-100">
            {holdings.amount.toFixed(5)}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs text-slate-400">Avg Purchase Price</span>
          <span className="text-sm font-semibold text-slate-400">
            $
            {holdings.purchasePrice.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs text-slate-400">Total Investment</span>
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
          <span className="text-xs text-slate-400">Total Gain/Loss</span>
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
  );
}
