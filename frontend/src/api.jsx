import axios from "axios";

const api = axios.create({
  baseURL: "http://proud-consideration-production-18a6.up.railway.app/",
});

// Attach token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
