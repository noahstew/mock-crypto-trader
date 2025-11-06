interface PortfolioCardProps {
  label: string;
  value: string;
  subValue?: string;
  valueColor?: string;
  subValueColor?: string;
}

export default function PortfolioCard({
  label,
  value,
  subValue,
  valueColor = 'text-white',
  subValueColor = 'text-slate-400',
}: PortfolioCardProps) {
  return (
    <div className="bg-slate-800/50 rounded-lg p-5 border border-slate-700">
      <div className="text-sm text-slate-400 mb-1">{label}</div>
      <div className={`text-2xl font-bold ${valueColor}`}>{value}</div>
      {subValue && <div className={`text-sm ${subValueColor}`}>{subValue}</div>}
    </div>
  );
}
