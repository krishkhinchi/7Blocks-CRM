import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 10000
});

// Request interceptor: attach bearer token and handle FormData boundary
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('7blocks_access_token');
  if (token) {
    if (config.headers && typeof (config.headers as any).set === 'function') {
      (config.headers as any).set('Authorization', `Bearer ${token}`);
    } else {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
  }

  // When sending FormData, let the browser set multipart/form-data with the correct boundary
  if (config.data instanceof FormData) {
    if (config.headers && typeof (config.headers as any).delete === 'function') {
      (config.headers as any).delete('Content-Type');
    } else if (config.headers) {
      delete config.headers['Content-Type'];
    }
  }

  return config;
});

// Helper to check if response is an accidental HTML document (from SPA router rewrite)
function isHtmlResponse(data: any): boolean {
  if (typeof data === 'string') {
    const trimmed = data.trim().toLowerCase();
    return trimmed.startsWith('<!doctype html') || trimmed.startsWith('<html') || trimmed.includes('<div id="root">');
  }
  return false;
}

// Response interceptor: handle 401 token expiry and strict rejection of HTML / errors
api.interceptors.response.use(
  (response) => {
    // If hosting provider (e.g. Vercel SPA rewrite) returned index.html with HTTP 200 for an API call:
    if (isHtmlResponse(response.data)) {
      console.error(`[7BLOCKS CRM] Received HTML response instead of JSON for ${response.config.url}. Endpoint may not exist.`);
      return Promise.reject(new Error(`API returned HTML document instead of JSON for ${response.config.url}`));
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 token expiry if refresh is possible
    if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url?.includes('/auth/login') && !originalRequest.url?.includes('/auth/refresh')) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('7blocks_refresh_token');
      if (refreshToken) {
        try {
          const res = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken });
          const newAccessToken = res.data?.data?.accessToken;
          if (newAccessToken) {
            localStorage.setItem('7blocks_access_token', newAccessToken);
            if (originalRequest.headers && typeof originalRequest.headers.set === 'function') {
              originalRequest.headers.set('Authorization', `Bearer ${newAccessToken}`);
            } else {
              originalRequest.headers = originalRequest.headers || {};
              originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            }
            return api(originalRequest);
          }
        } catch {
          // Token refresh failed - clear stored credentials
          localStorage.removeItem('7blocks_access_token');
          localStorage.removeItem('7blocks_refresh_token');
          localStorage.removeItem('7blocks_user');
          if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
        }
      } else {
        localStorage.removeItem('7blocks_access_token');
        localStorage.removeItem('7blocks_user');
        if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    }

    return Promise.reject(error);
  }
);
