import { useEffect } from "react";
import { View, ActivityIndicator, StyleSheet, Text } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { colors } from "@/constants/theme";
import { lookupReferralCode, ReferralLookup } from "@/services/referral";
import { pendingReferral } from "@/services/pendingReferral";
import { auth } from "@/services/auth";

/**
 * Deep-link landing screen for referral invites.
 *
 * Triggered when the user taps one of:
 *   - charlie://invite/CODE          (custom scheme)
 *   - https://getcharlie.co/invite/CODE  (universal link — requires AASA)
 *
 * Flow:
 *   1. Validate the code with the backend (lookupReferralCode).
 *   2. Stash the code + referrer name in AsyncStorage so the signup screen
 *      can show an "Invited by X" banner and auth.register can include it.
 *   3. If the user is already authenticated, they can't redeem — drop them
 *      on the home tab with no banner change.
 *   4. Otherwise, redirect into the onboarding flow starting at splash.
 *
 * The route is intentionally not inside /onboarding/* so it works even when
 * the OnboardingProvider hasn't mounted yet.
 */
export default function InviteLandingScreen() {
  const router = useRouter();
  const { code } = useLocalSearchParams<{ code: string }>();

  useEffect(() => {
    let cancelled = false;

    async function run() {
      const normalized = (code || "").toString().trim().toUpperCase();
      if (!normalized) {
        router.replace("/onboarding/splash" as any);
        return;
      }

      // Validate + fetch referrer first name in parallel with the auth check
      const [lookup, isAuthed] = await Promise.all([
        lookupReferralCode(normalized).catch<ReferralLookup>(() => ({
          valid: false,
        })),
        auth.isAuthenticated().catch(() => false),
      ]);

      if (cancelled) return;

      // If the code resolves, store it for the signup flow. Invalid codes
      // silently fall through — the user can still sign up, just without
      // attribution (better than a hard error on a link we can't fix).
      if (lookup.valid) {
        await pendingReferral
          .set(normalized, lookup.referrerFirstName)
          .catch(() => undefined);
      }

      if (cancelled) return;

      // Already signed in → can't redeem a referral on an existing account.
      // Drop them at home; we could show a toast here later.
      if (isAuthed) {
        router.replace("/tabs" as any);
        return;
      }

      // New-user path — splash is the canonical onboarding entry point.
      router.replace("/onboarding/splash" as any);
    }

    run();

    return () => {
      cancelled = true;
    };
  }, [code, router]);

  return (
    <View style={s.container}>
      <ActivityIndicator color={colors.blue} />
      <Text style={s.label}>Opening your invite…</Text>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface0,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  label: {
    fontSize: 12,
    color: colors.textSecondary,
  },
});
