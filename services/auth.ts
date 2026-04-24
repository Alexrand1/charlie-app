import AsyncStorage from "@react-native-async-storage/async-storage";
import { api } from "./api";
import { pendingReferral } from "./pendingReferral";

const TOKEN_KEY = "charlie_auth_token";
const USER_KEY = "charlie_user";

export interface AuthUser {
  userId: string;
  email: string;
  firstName: string;
}

/** Read any pending referral code captured from a deep link. Best-effort —
 *  if AsyncStorage fails, signup still proceeds without attribution. */
async function readPendingReferralCode(): Promise<string | undefined> {
  try {
    const pending = await pendingReferral.get();
    return pending?.code;
  } catch {
    return undefined;
  }
}

export const auth = {
  async register(
    email: string,
    password: string,
    firstName: string
  ): Promise<AuthUser> {
    const referralCode = await readPendingReferralCode();
    const response = await api.post("/auth/register", {
      email,
      password,
      firstName,
      referralCode,
    });
    const { token, user } = response.data;
    await AsyncStorage.setItem(TOKEN_KEY, token);
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
    // Code has been consumed — clear so we don't reuse it on a future signup
    // from the same device.
    if (referralCode) {
      await pendingReferral.clear().catch(() => undefined);
    }
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

  async signInWithApple(params: {
    identityToken: string;
    email?: string | null;
    firstName?: string | null;
    lastName?: string | null;
  }): Promise<AuthUser> {
    const referralCode = await readPendingReferralCode();
    const response = await api.post("/auth/apple", {
      identityToken: params.identityToken,
      email: params.email || undefined,
      firstName: params.firstName || undefined,
      lastName: params.lastName || undefined,
      referralCode,
    });
    const { token, user } = response.data;
    await AsyncStorage.setItem(TOKEN_KEY, token);
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
    if (referralCode) {
      await pendingReferral.clear().catch(() => undefined);
    }
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
