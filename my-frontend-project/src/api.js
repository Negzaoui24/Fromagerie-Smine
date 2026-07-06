import axios from "axios";

// Déterminer l'URL de base de l'API
let API_BASE_URL = process.env.REACT_APP_API_URL;

// Si pas de URL d'API, essayer de la déduire
if (!API_BASE_URL) {
  if (typeof window !== "undefined" && window.location.hostname) {
    const hostname = window.location.hostname;
    const isProduction = process.env.NODE_ENV === "production" || !hostname.includes("localhost");
    
    if (isProduction && hostname.includes("vercel")) {
      // En production sur Vercel, utiliser le backend Vercel
      API_BASE_URL = "https://fromagerie-smine-swart.vercel.app";
    } else if (isProduction && hostname.includes("fromagerie")) {
      // Autres domaines de production
      API_BASE_URL = process.env.REACT_APP_API_URL || "https://fromagerie-smine-swart.vercel.app";
    } else {
      // En développement local
      API_BASE_URL = "http://localhost:5000";
    }
  } else {
    API_BASE_URL = "http://localhost:5000";
  }
}

// Fallback
if (!API_BASE_URL) {
  API_BASE_URL = "http://localhost:5000";
}

console.log("🔌 API URL configurée:", API_BASE_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token && config && config.headers && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.warn("⚠️ Token expiré ou invalide");
      localStorage.removeItem("token");
      localStorage.removeItem("role");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export const buildApiUrl = (path = "") => `${API_BASE_URL}${path}`;

export default api;
