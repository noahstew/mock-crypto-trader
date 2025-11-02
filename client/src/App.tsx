import { Link, Outlet } from 'react-router-dom';

export default function App() {
  return (
    <div>
      <nav style={{ display: 'flex', gap: '1rem' }}>
        <Link to="/">Home</Link>
        <Link to="/about">About</Link>
      </nav>

      <main>
        <Outlet />
      </main>
    </div>
  );
}

// import { useEffect, useState } from 'react';
// import { io } from 'socket.io-client';

// const socket = io('http://localhost:5000');

// function App() {
//   const [prices, setPrices] = useState<Record<string, string>>({});

//   useEffect(() => {
//     socket.on('priceUpdate', (data) => {
//       setPrices((prev) => ({ ...prev, [data.pair]: String(data.price) }));
//     });

//     return () => {
//       socket.off('priceUpdate');
//     };
//   }, []);

//   return (
//     <div style={{ textAlign: 'center', marginTop: '50px' }}>
//       <h1>Live Coinbase Prices</h1>
//       {Object.keys(prices).length === 0 ? (
//         <p>Connecting...</p>
//       ) : (
//         Object.entries(prices).map(([pair, price]) => (
//           <h2 key={pair}>
//             {pair}: ${parseFloat(price).toFixed(2)}
//           </h2>
//         ))
//       )}
//     </div>
//   );
// }

// export default App;
