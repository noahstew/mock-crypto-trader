type TimePeriod = '1H' | '1D' | '1W' | '1Y';

interface PeriodSelectorProps {
  timePeriod: TimePeriod;
  onPeriodChange: (period: TimePeriod) => void;
}

export default function PeriodSelector({
  timePeriod,
  onPeriodChange,
}: PeriodSelectorProps) {
  return (
    <div className="flex gap-2">
      {(['1H', '1D', '1W', '1Y'] as TimePeriod[]).map((period) => (
        <button
          key={period}
          onClick={() => onPeriodChange(period)}
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
  );
}
