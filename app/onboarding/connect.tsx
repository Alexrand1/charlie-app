import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Linking,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import { useOnboarding } from "@/components/onboarding/OnboardingContext";
import { OnboardingButton } from "@/components/onboarding/OnboardingButton";
import { ProgressDots } from "@/components/onboarding/ProgressDots";
import { getLinkToken, sandboxConnect, getAccounts } from "@/services/plaid";
import { colors, spacing, radii } from "@/constants/theme";

export default function ConnectScreen() {
  const router = useRouter();
  const { update } = useOnboarding();
  const [loading, setLoading] = useState(false);
  const [linked, setLinked] = useState(false);
  const [accountCount, setAccountCount] = useState(0);
  const [institutionName, setInstitutionName] = useState("");

  const handleLinkBank = useCallback(async () => {
    setLoading(true);
    try {
      const linkToken = await getLinkToken();
      const baseUrl = (await import("@/services/api")).api.defaults.baseURL;
      const linkUrl = `${baseUrl}/plaid/link-page?link_token=${linkToken}`;
      await Linking.openURL(linkUrl);

      // After user returns, check if accounts were linked
      await new Promise((r) => setTimeout(r, 2000));
      const accounts = await getAccounts();
      if (accounts && accounts.length > 0) {
        setLinked(true);
        setAccountCount(accounts.length);
        setInstitutionName("Chase"); // TODO: get from Plaid metadata
        update({ bankConnected: true, accountCount: accounts.length });
      }
    } catch (err: any) {
      try {
        await sandboxConnect();
        const accounts = await getAccounts();
        if (accounts && accounts.length > 0) {
          setLinked(true);
          setAccountCount(accounts.length);
          setInstitutionName("First Platypus Bank");
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
      {/* Back pill */}
      <TouchableOpacity
        style={s.backPill}
        onPress={() => router.back()}
      >
        <Text style={s.backArrow}>‹</Text>
        <Text style={s.backText}>Back</Text>
      </TouchableOpacity>

      {/* Headline */}
      <View style={s.header}>
        <Text style={s.title}>
          Connect your{"\n"}<Text style={s.titleItalic}>bank</Text>
        </Text>
        <Text style={s.subtitle}>
          Charlie needs to see your transactions to find you savings.
        </Text>
      </View>

      {/* Trust badge */}
      <View style={s.trustBadge}>
        <Text style={s.trustIcon}>🔒</Text>
        <Text style={s.trustText}>256-bit encryption · Read-only · Never stored</Text>
      </View>

      {/* Bank card */}
      <View style={s.bankCard}>
        {linked ? (
          <>
            <View style={s.bankRow}>
              <View style={s.bankIconCircle}>
                <Text style={s.bankEmoji}>🏦</Text>
              </View>
              <View style={s.bankInfo}>
                <Text style={s.bankName}>{institutionName}</Text>
                <Text style={s.bankStatus}>● Connected</Text>
              </View>
            </View>
            <View style={s.bankDivider} />
            <TouchableOpacity onPress={handleLinkBank}>
              <Text style={s.addAnother}>+ Add another account</Text>
            </TouchableOpacity>
          </>
        ) : (
          <View style={s.bankRow}>
            <View style={s.bankIconCircle}>
              <Text style={s.bankEmoji}>🏦</Text>
            </View>
            <View style={s.bankInfo}>
              <Text style={s.bankName}>Link your bank</Text>
              <Text style={s.bankSubtext}>Tap below to connect via Plaid</Text>
            </View>
          </View>
        )}
      </View>

      {/* Trust copy */}
      <Text style={s.trustCopy}>
        Powered by Plaid. Charlie can only read — it cannot move money without your explicit approval.
      </Text>

      <View style={{ flex: 1 }} />

      {/* Bottom */}
      <ProgressDots total={5} current={1} />

      {loading ? (
        <View style={s.loadingContainer}>
          <ActivityIndicator size="small" color={colors.yellow} />
          <Text style={s.loadingText}>Connecting to your bank...</Text>
        </View>
      ) : (
        <>
          <OnboardingButton
            title={linked ? "Analyze my money" : "Analyze my money"}
            onPress={linked ? () => router.push("/onboarding/results") : handleLinkBank}
            style={{ marginTop: 10 }}
          />
          {!linked && (
            <OnboardingButton
              title="Skip for now"
              variant="ghost"
              onPress={() => router.push("/onboarding/results")}
            />
          )}
        </>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface0,
    paddingHorizontal: 26,
    paddingTop: 52,
    paddingBottom: 26,
  },
  backPill: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: colors.surface2,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 18,
    gap: 4,
  },
  backArrow: {
    fontSize: 18,
    color: colors.cream,
    fontWeight: "600",
    marginTop: -1,
  },
  backText: {
    fontSize: 13,
    color: colors.cream,
    fontWeight: "500",
  },
  header: {
    marginBottom: 12,
  },
  title: {
    fontSize: 28,
    color: colors.cream,
    fontWeight: "400",
    lineHeight: 36,
  },
  titleItalic: {
    fontStyle: "italic",
  },
  subtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 7,
    lineHeight: 19,
  },
  trustBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.surface1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: "flex-start",
    marginBottom: 12,
  },
  trustIcon: {
    fontSize: 12,
  },
  trustText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: "500",
  },
  bankCard: {
    backgroundColor: colors.surface1,
    borderRadius: radii.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    marginBottom: 10,
  },
  bankRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
  },
  bankIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: colors.surface2,
    justifyContent: "center",
    alignItems: "center",
  },
  bankEmoji: {
    fontSize: 18,
  },
  bankInfo: {
    flex: 1,
  },
  bankName: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.cream,
  },
  bankStatus: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.sage,
    marginTop: 2,
  },
  bankSubtext: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  bankDivider: {
    height: 1,
    backgroundColor: colors.borderSubtle,
    marginVertical: 10,
  },
  addAnother: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.yellow,
  },
  trustCopy: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: 14,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    height: 54,
    marginTop: 10,
  },
  loadingText: {
    fontSize: 15,
    color: colors.textSecondary,
  },
});
