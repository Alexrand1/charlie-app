import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://127.0.0.1:3000";

export const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: { "Content-Type": "application/json" },
});

// Attach auth token to every request
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem("charlie_auth_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
