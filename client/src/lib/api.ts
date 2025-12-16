// API utility with retry logic for Render free tier sleep
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 2000; // 2 seconds

export interface ApiOptions extends RequestInit {
  skipRetry?: boolean;
}

export async function apiRequest(
  endpoint: string,
  options: ApiOptions = {}
): Promise<Response> {
  const { skipRetry, ...fetchOptions } = options;
  const url = `${API_BASE}${endpoint}`;

  // First attempt
  try {
    const response = await fetch(url, fetchOptions);

    // Auto-logout on authentication failures (401, 403)
    if (response.status === 401 || response.status === 403) {
      console.warn('Authentication failed. Logging out...');
      localStorage.removeItem('token');
      localStorage.removeItem('username');
      window.dispatchEvent(new Event('authChange'));
      window.location.href = '/auth';
    }

    return response;
  } catch (error) {
    // If skipRetry or not a network error, throw immediately
    if (skipRetry) throw error;

    // Retry logic for server wake-up
    console.log('Server might be sleeping, retrying...');

    for (let i = 0; i < MAX_RETRIES; i++) {
      const delay = INITIAL_RETRY_DELAY * Math.pow(2, i); // Exponential backoff

      console.log(`Retry ${i + 1}/${MAX_RETRIES} after ${delay}ms...`);
      await new Promise((resolve) => setTimeout(resolve, delay));

      try {
        const response = await fetch(url, fetchOptions);
        console.log('Server is awake!');

        // Auto-logout on authentication failures (401, 403)
        if (response.status === 401 || response.status === 403) {
          console.warn('Authentication failed. Logging out...');
          localStorage.removeItem('token');
          localStorage.removeItem('username');
          window.dispatchEvent(new Event('authChange'));
          window.location.href = '/auth';
        }

        return response;
      } catch (retryError) {
        if (i === MAX_RETRIES - 1) {
          throw retryError;
        }
      }
    }

    throw error;
  }
}

export { API_BASE };
