import axios from "axios";

const defaultApiUrl =
  typeof window === "undefined"
    ? "http://localhost:3000/api"
    : `${window.location.protocol}//${window.location.hostname}:3000/api`;

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || defaultApiUrl,
});

// Request interceptor to add JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// Response interceptor to handle 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.warn("Token expired or invalid. Redirecting to login...");
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);
