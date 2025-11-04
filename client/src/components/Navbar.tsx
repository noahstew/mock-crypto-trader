import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

function Navbar() {
  const [username, setUsername] = useState<string | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check localStorage on mount
    const storedUsername = localStorage.getItem('username');
    setUsername(storedUsername);

    // Listen for storage changes (for cross-tab updates)
    function handleStorageChange(e: StorageEvent) {
      if (e.key === 'username') {
        setUsername(e.newValue);
      }
    }

    // Listen for custom event when login happens in same tab
    function handleAuthChange() {
      const storedUsername = localStorage.getItem('username');
      setUsername(storedUsername);
    }

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('authChange', handleAuthChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('authChange', handleAuthChange);
    };
  }, []);

  function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    setUsername(null);
    navigate('/auth');
  }

  return (
    <nav className="flex items-center justify-between gap-4 p-4 text-white">
      <div>
        <Link to="/" className="text-4xl font-bold">
          Crypto<span className="text-yellow-500 font-extrabold">Sandbox</span>
        </Link>
      </div>

      <div className="flex items-center gap-4 text-xl px-4 py-2 bg-yellow-500 rounded-full font-semibold text-neutral-950">
        {username ? (
          <>
            <Link
              to="/dashboard"
              className="hover:text-neutral-700 transition-colors"
            >
              Dashboard
            </Link>
            <button
              onClick={handleLogout}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              className={`flex items-center gap-2 transition-colors ${
                isHovered ? 'text-rose-600' : 'text-neutral-950'
              }`}
            >
              {!isHovered ? (
                <>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                    className="w-5 h-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                    />
                  </svg>
                  {username}
                </>
              ) : (
                <>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                    className="w-5 h-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M18 12H9m0 0l3 3m-3-3l3-3"
                    />
                  </svg>
                  Logout
                </>
              )}
            </button>
          </>
        ) : (
          <Link to="/auth">Login</Link>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
