import { Outlet } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import { LoadingToast } from './components/Toast';
import { useServerStatus } from './hooks/useServerStatus';

export default function App() {
  const { isWakingUp } = useServerStatus();

  return (
    <div>
      <Navbar />

      <main>
        <Outlet />
      </main>

      <Footer />

      {isWakingUp && (
        <LoadingToast message="🚀 Server is waking up from sleep (free tier). This may take 30-60 seconds. Thanks for your patience!" />
      )}
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
