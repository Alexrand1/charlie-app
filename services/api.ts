import axios from "axios";
import { useAuth } from "@clerk/clerk-expo";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000";

export const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: { "Content-Type": "application/json" },
});

/**
 * Hook: returns an Axios instance with the Clerk session token
 * attached to every request via interceptor.
 */
export function useAuthenticatedApi() {
  const { getToken } = useAuth();

  const authApi = axios.create({
    baseURL: API_URL,
    timeout: 10000,
    headers: { "Content-Type": "application/json" },
  });

  authApi.interceptors.request.use(async (config) => {
    const token = await getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  return authApi;
}
