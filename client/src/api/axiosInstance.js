import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL, // http://localhost:8000/api
});

// Inject JWT token into every request automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// A token can stop being valid mid-session (expiry, or the account being
// deactivated/suspended server-side), which would otherwise leave the UI stuck
// half-authenticated. Login/register 401s stay with the caller to render inline.
const AUTH_PATHS = ['/auth/login', '/auth/register'];

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url || '';
    const isAuthAttempt = AUTH_PATHS.some((path) => url.includes(path));

    if (error.response?.status === 401 && !isAuthAttempt && localStorage.getItem('token')) {
      localStorage.removeItem('token');
      if (window.location.pathname !== '/login') {
        window.location.assign('/login');
      }
    }
    return Promise.reject(error);
  }
);

export default api;
