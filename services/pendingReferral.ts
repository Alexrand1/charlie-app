import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * A referral code captured from a deep link (charlie://invite/CODE or
 * https://getcharlie.co/invite/CODE) that hasn't yet been consumed by a
 * completed signup. We stash it in AsyncStorage so that:
 *   1. The onboarding/signup screen can show an "Invited by X" banner.
 *   2. auth.register() and auth.signInWithApple() can include it in the
 *      request body without the UI needing to thread it through manually.
 *   3. The code survives an app restart mid-onboarding.
 *
 * Cleared automatically after a successful register/apple sign-in.
 */
const CODE_KEY = "charlie_pending_referral_code";
const REFERRER_NAME_KEY = "charlie_pending_referrer_name";

export interface PendingReferral {
  code: string;
  referrerFirstName?: string;
}

export const pendingReferral = {
  async set(code: string, referrerFirstName?: string): Promise<void> {
    await AsyncStorage.setItem(CODE_KEY, code.toUpperCase());
    if (referrerFirstName) {
      await AsyncStorage.setItem(REFERRER_NAME_KEY, referrerFirstName);
    } else {
      await AsyncStorage.removeItem(REFERRER_NAME_KEY);
    }
  },

  async get(): Promise<PendingReferral | null> {
    const code = await AsyncStorage.getItem(CODE_KEY);
    if (!code) return null;
    const referrerFirstName =
      (await AsyncStorage.getItem(REFERRER_NAME_KEY)) || undefined;
    return { code, referrerFirstName };
  },

  async clear(): Promise<void> {
    await AsyncStorage.multiRemove([CODE_KEY, REFERRER_NAME_KEY]);
  },
};
