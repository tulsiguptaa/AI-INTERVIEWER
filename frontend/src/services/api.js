/**
 * Centralized API client for AI Interviewer
 * Provides robust credentials handling, session-key propagation,
 * and automatic fallback between Vite proxy (/api) and direct Django backend (http://127.0.0.1:8000/api).
 */

const getInitialBase = () => {
  // If in browser and running on Vite dev server (port 5173 / 3000), use proxy '/api'
  if (typeof window !== 'undefined' && window.location) {
    const port = window.location.port;
    if (port === '5173' || port === '3000' || !window.location.origin.includes(':8000')) {
      return '/api';
    }
  }
  return 'http://127.0.0.1:8000/api';
};

export const API_BASE = getInitialBase();
export const BACKEND_DIRECT_BASE = 'http://127.0.0.1:8000/api';

/**
 * Returns authentication headers containing session key and candidate identifiers.
 */
export const getAuthHeaders = () => {
  const headers = {};
  try {
    const sessionKey = localStorage.getItem('ai_interviewer_session_key');
    if (sessionKey) {
      headers['X-Session-Key'] = sessionKey;
      headers['Authorization'] = `Bearer ${sessionKey}`;
    }

    const savedUser = localStorage.getItem('ai_interviewer_user');
    if (savedUser) {
      const user = JSON.parse(savedUser);
      if (user?.student_email) {
        headers['X-User-Email'] = user.student_email;
      }
      if (user?.id) {
        headers['X-User-Id'] = String(user.id);
      }
    }
  } catch (err) {
    console.warn('[API] Could not retrieve auth headers:', err);
  }
  return headers;
};

/**
 * Persists authenticated user and session key to localStorage.
 */
export const saveAuthSession = (user, sessionKey) => {
  try {
    if (user) {
      localStorage.setItem('ai_interviewer_user', JSON.stringify(user));
    }
    if (sessionKey) {
      localStorage.setItem('ai_interviewer_session_key', sessionKey);
    }
  } catch (err) {
    console.warn('[API] Could not save auth session:', err);
  }
};

/**
 * Clears authentication data from localStorage.
 */
export const clearAuthSession = () => {
  try {
    localStorage.removeItem('ai_interviewer_user');
    localStorage.removeItem('ai_interviewer_session_key');
  } catch (err) {
    console.warn('[API] Could not clear auth session:', err);
  }
};

/**
 * Performs an authenticated fetch with automatic credentials inclusion,
 * session headers, and fallback to direct backend if proxy is inactive.
 */
export async function apiFetch(endpoint, options = {}) {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const authHeaders = getAuthHeaders();

  // Merge headers
  const isFormData = options.body instanceof FormData;
  const mergedHeaders = {
    ...authHeaders,
    ...(options.headers || {}),
  };

  if (!isFormData && !mergedHeaders['Content-Type']) {
    mergedHeaders['Content-Type'] = 'application/json';
  }

  const primaryUrl = `${API_BASE}${cleanEndpoint}`;
  const fallbackUrl = `${BACKEND_DIRECT_BASE}${cleanEndpoint}`;

  const fetchOptions = {
    ...options,
    credentials: 'include',
    headers: mergedHeaders,
  };

  try {
    const response = await fetch(primaryUrl, fetchOptions);
    return response;
  } catch (primaryErr) {
    // If proxy failed, retry with direct backend URL
    if (primaryUrl !== fallbackUrl) {
      console.warn(`[API] Primary request to ${primaryUrl} failed, falling back to ${fallbackUrl}:`, primaryErr);
      return await fetch(fallbackUrl, fetchOptions);
    }
    throw primaryErr;
  }
}
