import StatDisplay from './StatDisplay';

interface PeriodStatsProps {
  high: number | null;
  low: number | null;
}

export default function PeriodStats({ high, low }: PeriodStatsProps) {
  return (
    <div className="flex gap-4">
      <StatDisplay label="Period High" value={high} type="high" />
      <StatDisplay label="Period Low" value={low} type="low" />
    </div>
  );
}
