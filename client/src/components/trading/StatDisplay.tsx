interface StatDisplayProps {
  label: string;
  value: number | null;
  type: 'high' | 'low';
}

export default function StatDisplay({ label, value, type }: StatDisplayProps) {
  const colorClass = type === 'high' ? 'text-emerald-400' : 'text-rose-400';

  return (
    <div className="bg-slate-800/50 rounded-lg px-4 py-2">
      <div className="text-xs text-slate-400">{label}</div>
      <div className={`text-sm font-semibold ${colorClass}`}>
        {value !== null
          ? `$${value.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}`
          : '—'}
      </div>
    </div>
  );
}
