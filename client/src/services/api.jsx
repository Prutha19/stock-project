export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.trim() ||
  "http://127.0.0.1:8000";

export const buildApiUrl = (path) => `${API_BASE_URL}${path}`;

export const getAuthToken = () => localStorage.getItem("token");

export const setAuthToken = (token) => {
  localStorage.setItem("token", token);
};

export const clearAuthToken = () => {
  localStorage.removeItem("token");
};

export const createAuthHeaders = (token = getAuthToken()) =>
  token
    ? {
        Authorization: `Bearer ${token}`
      }
    : {};
