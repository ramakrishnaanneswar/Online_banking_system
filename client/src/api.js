import axios from "axios";

// API URL resolution:
// 1. Explicit VITE_API_URL (for Render / custom backend) if provided.
// 2. Same-origin /api when deployed — Vercel serves the client AND the
//    serverless API together, so this avoids both localhost and CORS issues.
// 3. Localhost fallback for local development.
const DEFAULT_API_URL = "http://localhost:3100/api";

const getApiUrl = () => {
  const explicit = import.meta.env.VITE_API_URL;
  if (explicit) return explicit;

  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    const isLocal =
      host === "localhost" || host === "127.0.0.1" || host === "::1";
    if (!isLocal) return `${window.location.origin}/api`;
  }

  return DEFAULT_API_URL;
};

const API_URL = getApiUrl();
console.log("API URL =", API_URL);
const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// Add JWT token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Handle responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    }

    return Promise.reject(error);
  }
);

export default api;