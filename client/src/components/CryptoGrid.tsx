const SYMBOLS = [
  'BTC',
  'ETH',
  'SOL',
  'ADA',
  'XRP',
  'LTC',
  'BCH',
  'DOT',
  'DOGE',
  'MATIC',
  'AVAX',
  'LINK',
];

export default function CryptoGrid() {
  return (
    <section className="max-w-6xl mx-auto mt-10 px-6">
      <h3 className="text-2xl font-semibold text-white mb-4 text-left">
        Available markets
      </h3>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {SYMBOLS.map((s) => (
          <div
            key={s}
            className="flex flex-col items-start gap-2 p-4 bg-slate-800/40 border border-slate-700 rounded-lg text-left hover:scale-[1.02] transition-transform"
          >
            {/* top row: logo + code */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center">
                <span className="text-amber-400 font-semibold text-sm">
                  {s.slice(0, 1)}
                </span>
              </div>

              <div className="text-lg font-bold text-white">{s}</div>
            </div>

            {/* caption below */}
            <div className="text-xs text-slate-400 mt-2">
              Placeholder caption
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
