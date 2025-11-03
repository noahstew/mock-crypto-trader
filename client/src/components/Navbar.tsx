import React from 'react';
import { Link } from 'react-router-dom';

function Navbar() {
  const user = null; // Replace with actual user authentication logic

  return (
    <nav className="flex items-center justify-between gap-4 p-4 text-white">
      <div>
        <Link to="/" className="text-4xl font-bold">
          Crypto<span className="text-yellow-500 font-extrabold">Sandbox</span>
        </Link>
      </div>

      <div className="flex gap-4 text-xl px-4 py-2 bg-yellow-500 rounded-full font-semibold text-neutral-950">
        <Link to="/auth">{user ? 'Logout' : 'Login'}</Link>
      </div>
    </nav>
  );
}

export default Navbar;
