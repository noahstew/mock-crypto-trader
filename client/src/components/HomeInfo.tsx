import CryptoGrid from './CryptoGrid';

export default function HomeInfo() {
  return (
    <main className="text-white">
      {/* Hero - full width background with overlayed text */}
      <section className="relative overflow-hidden">
        {/* solid neutral-950 background per request */}
        <div className="absolute inset-0 bg-neutral-950 -z-10" />

        <div className="max-w-6xl mx-auto px-6 py-28">
          <h1 className="text-5xl md:text-6xl font-extrabold leading-tight">
            Trade <span className="text-amber-200">Fake Money</span>
            <span className="block -mt-2">
              on the <span className="text-yellow-400">Real Market.</span>
            </span>
          </h1>

          <p className="mt-4 text-slate-300 max-w-2xl text-xl">
            CryptoSandbox is a platform for crypto beginners and veterans to
            practice their trades with live market data, risk free.
          </p>
        </div>

        {/* Decorative background shapes (yellow-tinted, detailed blob) */}
        <svg
          className="pointer-events-none absolute right-72 top-32 opacity-25 w-1/3 h-96 transform translate-x-8 -translate-y-10"
          viewBox="0 0 600 600"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient
              id="blobGradient"
              x1="0%"
              x2="100%"
              y1="0%"
              y2="100%"
            >
              <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.9" />
              <stop offset="50%" stopColor="#f59e0b" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#f97316" stopOpacity="0.5" />
            </linearGradient>
            <radialGradient id="glow" cx="50%" cy="30%" r="60%">
              <stop offset="0%" stopColor="#fef3c7" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
            </radialGradient>
          </defs>

          <g transform="translate(300,300)">
            <path
              fill="url(#blobGradient)"
              d="M120,-150C150,-120,190,-90,200,-40C210,10,190,70,150,100C110,130,50,140,0,140C-50,140,-100,130,-140,100C-180,70,-200,10,-190,-40C-180,-90,-150,-120,-120,-150C-90,-180,-45,-200,0,-200C45,-200,90,-180,120,-150Z"
            />

            {/* inner decorative rings */}
            <path
              fill="none"
              stroke="#fcd34d"
              strokeOpacity="0.35"
              strokeWidth="6"
              d="M0,-170 A170,170 0 1,1 -1,-170"
            />
            <path
              fill="url(#glow)"
              d="M-60,-80 C-30,-120,30,-120,60,-80 C30,-40,-30,-40,-60,-80Z"
              opacity="0.7"
            />

            {/* small sparkles */}
            <g fill="#fff7ed" fillOpacity="0.7">
              <circle cx="110" cy="-20" r="4" />
              <circle cx="140" cy="40" r="3" />
              <circle cx="60" cy="120" r="2.5" />
            </g>
          </g>
        </svg>
      </section>

      {/* Crypto grid placeholder */}
      <CryptoGrid />

      {/* How it works */}
      <section className="max-w-6xl mx-auto mt-10 px-6 pb-20">
        <h2 className="text-2xl font-semibold text-white mb-4">How it works</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-900/40 border border-slate-700 p-4 rounded-lg">
            <div className="flex items-start gap-3">
              <div className="flex-none w-10 h-10 rounded-full bg-amber-400 text-black font-bold flex items-center justify-center">
                1
              </div>
              <div>
                <div className="font-semibold text-white">
                  Create an account
                </div>
                <div className="text-slate-300 text-sm">
                  No email required — pick a username and you're ready to go in
                  seconds.
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-900/40 border border-slate-700 p-4 rounded-lg">
            <div className="flex items-start gap-3">
              <div className="flex-none w-10 h-10 rounded-full bg-amber-400 text-black font-bold flex items-center justify-center">
                2
              </div>
              <div>
                <div className="font-semibold text-white">
                  Choose your starting balance
                </div>
                <div className="text-slate-300 text-sm">
                  Set a fixed bankroll for repeatable practice or use the
                  default demo balance.
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-900/40 border border-slate-700 p-4 rounded-lg">
            <div className="flex items-start gap-3">
              <div className="flex-none w-10 h-10 rounded-full bg-amber-400 text-black font-bold flex items-center justify-center">
                3
              </div>
              <div>
                <div className="font-semibold text-white">
                  Trade with live prices
                </div>
                <div className="text-slate-300 text-sm">
                  Place mock orders against real market prices. P&L is simulated
                  so you can learn without risk.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
