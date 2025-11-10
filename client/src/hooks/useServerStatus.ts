import { useState, useEffect } from 'react';
import { apiRequest } from '../lib/api';

export function useServerStatus() {
  const [isWakingUp, setIsWakingUp] = useState(false);
  const [hasShownWakeMessage, setHasShownWakeMessage] = useState(false);

  const checkServer = async () => {
    if (hasShownWakeMessage) return;

    try {
      setIsWakingUp(true);
      await apiRequest('/health', { skipRetry: true });
      setIsWakingUp(false);
    } catch (error) {
      // Server is sleeping, show wake-up message
      setIsWakingUp(true);
      setHasShownWakeMessage(true);

      // Retry with backoff
      try {
        await apiRequest('/health');
        setIsWakingUp(false);
      } catch (err) {
        setIsWakingUp(false);
        console.error('Server failed to wake up:', err);
      }
    }
  };

  useEffect(() => {
    checkServer();
  }, []);

  return { isWakingUp };
}
