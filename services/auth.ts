import AsyncStorage from "@react-native-async-storage/async-storage";
import { api } from "./api";

const TOKEN_KEY = "charlie_auth_token";
const USER_KEY = "charlie_user";

export interface AuthUser {
  userId: string;
  email: string;
  firstName: string;
}

export const auth = {
  async register(email: string, password: string, firstName: string): Promise<AuthUser> {
    const response = await api.post("/auth/register", {
      email,
      password,
      firstName,
    });
    const { token, user } = response.data;
    await AsyncStorage.setItem(TOKEN_KEY, token);
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
    return user;
  },

  async login(email: string, password: string): Promise<AuthUser> {
    const response = await api.post("/auth/login", {
      email,
      password,
    });
    const { token, user } = response.data;
    await AsyncStorage.setItem(TOKEN_KEY, token);
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
    return user;
  },

  async getToken(): Promise<string | null> {
    return AsyncStorage.getItem(TOKEN_KEY);
  },

  async getUser(): Promise<AuthUser | null> {
    const data = await AsyncStorage.getItem(USER_KEY);
    return data ? JSON.parse(data) : null;
  },

  async logout(): Promise<void> {
    await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
  },

  async isAuthenticated(): Promise<boolean> {
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    return !!token;
  },
};
