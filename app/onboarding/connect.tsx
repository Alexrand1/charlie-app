import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Linking,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useOnboarding } from "@/components/onboarding/OnboardingContext";
import { OnboardingButton } from "@/components/onboarding/OnboardingButton";
import { ProgressDots } from "@/components/onboarding/ProgressDots";
import { getLinkToken, sandboxConnect, getAccounts } from "@/services/plaid";
import { colors, spacing, radii } from "@/constants/theme";

const BANK_ICONS = [
  { name: "Chase", color: "#117ACA" },
  { name: "BofA", color: "#E31837" },
  { name: "Wells", color: "#D71E28" },
  { name: "Citi", color: "#003B70" },
];

export default function ConnectScreen() {
  const router = useRouter();
  const { update } = useOnboarding();
  const [loading, setLoading] = useState(false);
  const [linked, setLinked] = useState(false);
  const [accountCount, setAccountCount] = useState(0);

  const handleLinkBank = useCallback(async () => {
    setLoading(true);
    try {
      // Get link token from backend
      const linkToken = await getLinkToken();

      // Open Plaid Link in browser-based flow (Expo Go doesn't support native SDK)
      // The backend serves an HTML page at /plaid/link-page?link_token=...
      const baseUrl = (await import("@/services/api")).api.defaults.baseURL;
      const linkUrl = `${baseUrl}/plaid/link-page?link_token=${linkToken}`;
      await Linking.openURL(linkUrl);

      // After user returns, check if accounts were linked
      // (slight delay to allow webhook to process)
      await new Promise((r) => setTimeout(r, 2000));
      const accounts = await getAccounts();
      if (accounts && accounts.length > 0) {
        setLinked(true);
        setAccountCount(accounts.length);
        update({ bankConnected: true, accountCount: accounts.length });
      }
    } catch (err: any) {
      // If we can't do real Plaid, try sandbox for dev
      try {
        await sandboxConnect();
        const accounts = await getAccounts();
        if (accounts && accounts.length > 0) {
          setLinked(true);
          setAccountCount(accounts.length);
          update({ bankConnected: true, accountCount: accounts.length });
        }
      } catch {
        Alert.alert(
          "Connection Issue",
          "We couldn't connect to your bank right now. You can try again later from Settings."
        );
      }
    } finally {
      setLoading(false);
    }
  }, [update]);

  return (
    <View style={s.container}>
      <ProgressDots total={6} current={2} />

      <View style={s.content}>
        <View style={s.header}>
          <Text style={s.title}>Link your accounts</Text>
          <Text style={s.subtitle}>
            Connect your bank so Charlie can find savings and track your
            spending automatically.
          </Text>
        </View>

        {/* Bank icons grid */}
        <View style={s.bankGrid}>
          {BANK_ICONS.map((bank) => (
            <View key={bank.name} style={s.bankIcon}>
              <View style={[s.bankCircle, { backgroundColor: bank.color }]}>
                <Text style={s.bankInitial}>{bank.name[0]}</Text>
              </View>
              <Text style={s.bankName}>{bank.name}</Text>
            </View>
          ))}
          <View style={s.bankIcon}>
            <View style={[s.bankCircle, { backgroundColor: colors.surface2 }]}>
              <Text style={s.bankInitial}>+</Text>
            </View>
            <Text style={s.bankName}>More</Text>
          </View>
        </View>

        {/* Security note */}
        <View style={s.securityNote}>
          <Text style={s.securityIcon}>🔒</Text>
          <Text style={s.securityText}>
            Your credentials are encrypted and never stored. Powered by Plaid,
            trusted by millions.
          </Text>
        </View>

        {/* Connected state */}
        {linked && (
          <View style={s.successBanner}>
            <Text style={s.successIcon}>✓</Text>
            <Text style={s.successText}>
              {accountCount} account{accountCount !== 1 ? "s" : ""} connected
            </Text>
          </View>
        )}
      </View>

      {/* Actions */}
      <View style={s.actions}>
        {loading ? (
          <View style={s.loadingContainer}>
            <ActivityIndicator size="small" color={colors.yellow} />
            <Text style={s.loadingText}>Connecting to your bank...</Text>
          </View>
        ) : linked ? (
          <OnboardingButton
            title="Continue"
            onPress={() => router.push("/onboarding/results")}
          />
        ) : (
          <>
            <OnboardingButton
              title="Connect Your Bank"
              onPress={handleLinkBank}
            />
            <OnboardingButton
              title="Skip for now"
              variant="ghost"
              onPress={() => router.push("/onboarding/results")}
            />
          </>
        )}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface0,
    paddingHorizontal: spacing.xxl,
    paddingTop: 60,
    paddingBottom: 40,
  },
  content: {
    flex: 1,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontStyle: "italic",
    color: colors.cream,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  bankGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
    justifyContent: "center",
    marginBottom: 28,
  },
  bankIcon: {
    alignItems: "center",
    gap: 6,
    width: 56,
  },
  bankCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  bankInitial: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  bankName: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  securityNote: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: colors.surface1,
    borderRadius: radii.md,
    padding: 14,
    marginBottom: 16,
  },
  securityIcon: {
    fontSize: 14,
    marginTop: 1,
  },
  securityText: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 19,
    flex: 1,
  },
  successBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(168,197,160,0.12)",
    borderRadius: radii.md,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(168,197,160,0.25)",
  },
  successIcon: {
    fontSize: 16,
    color: colors.sage,
  },
  successText: {
    fontSize: 15,
    color: colors.sage,
    fontWeight: "600",
  },
  actions: {
    gap: 8,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    height: 54,
  },
  loadingText: {
    fontSize: 15,
    color: colors.textSecondary,
  },
});
