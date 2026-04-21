import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useOnboarding } from "@/components/onboarding/OnboardingContext";
import { OnboardingButton } from "@/components/onboarding/OnboardingButton";
import { colors, radii } from "@/constants/theme";

const PRO_FEATURES = [
  "Cancels subscriptions for you",
  "Negotiates bills automatically",
  "Auto-saves to high-yield account",
  "Personalized action queue",
];

const FREE_FEATURES = [
  "View insights only",
  "Manual actions",
];

export default function PaywallScreen() {
  const router = useRouter();
  const { update } = useOnboarding();
  const [loading, setLoading] = useState(false);

  async function handleStartPro() {
    setLoading(true);
    try {
      // STUB: In production, this would use expo-in-app-purchases / react-native-iap
      await new Promise((resolve) => setTimeout(resolve, 1500));
      update({ userPlan: "pro" });
      router.push("/onboarding/complete");
    } catch (err: any) {
      Alert.alert("Purchase Failed", "Please try again later.");
    } finally {
      setLoading(false);
    }
  }

  function handleFree() {
    update({ userPlan: "free" });
    router.push("/onboarding/complete");
  }

  return (
    <View style={s.container}>
      {/* Headline */}
      <View style={s.header}>
        <Text style={s.title}>
          Unlock{"\n"}<Text style={s.titleItalic}>every action</Text>
        </Text>
        <Text style={s.subtitle}>
          Charlie takes the actions. You keep the savings.
        </Text>
      </View>

      {/* Pro card */}
      <View style={s.proCard}>
        <View style={s.proHeader}>
          <Text style={s.proTitle}>Charlie Pro</Text>
          <View style={s.bestValueBadge}>
            <Text style={s.bestValueText}>BEST VALUE</Text>
          </View>
        </View>

        <View style={s.priceRow}>
          <Text style={s.priceAmount}>$9.99 </Text>
          <Text style={s.pricePeriod}>/ month</Text>
        </View>

        <Text style={s.yearlyNote}>
          Or <Text style={s.yearlyHighlight}>$79/year</Text> — save 34%
        </Text>

        <View style={s.featureList}>
          {PRO_FEATURES.map((f, i) => (
            <View key={i} style={s.featureRow}>
              <Text style={s.checkmark}>✓</Text>
              <Text style={s.featureText}>{f}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Free card */}
      <View style={s.freeCard}>
        <Text style={s.freeTitle}>Free</Text>
        <View style={s.freePriceRow}>
          <Text style={s.freePriceAmount}>$0 </Text>
          <Text style={s.pricePeriod}>/ month</Text>
        </View>
        <View style={s.featureList}>
          {FREE_FEATURES.map((f, i) => (
            <View key={i} style={s.featureRow}>
              <Text style={s.checkmark}>✓</Text>
              <Text style={s.featureTextMuted}>{f}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={{ flex: 1 }} />

      {/* CTAs */}
      <OnboardingButton
        title="Start Pro"
        onPress={handleStartPro}
        loading={loading}
        style={{ marginTop: 10 }}
      />
      <OnboardingButton
        title="Continue with Free"
        variant="ghost"
        onPress={handleFree}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface0,
    paddingHorizontal: 26,
    paddingTop: 60,
    paddingBottom: 26,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    color: colors.ink,
    fontWeight: "400",
    lineHeight: 36,
  },
  titleItalic: {
    fontStyle: "italic",
  },
  subtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 6,
  },
  proCard: {
    backgroundColor: colors.surface1,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1.5,
    borderColor: colors.blue,
    marginBottom: 8,
  },
  proHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  proTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.ink,
  },
  bestValueBadge: {
    backgroundColor: colors.blue,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  bestValueText: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.45,
    color: colors.textOnBlue,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: 4,
  },
  priceAmount: {
    fontSize: 26,
    fontStyle: "italic",
    color: colors.ink,
  },
  pricePeriod: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  yearlyNote: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  yearlyHighlight: {
    color: colors.blue,
    fontWeight: "700",
  },
  featureList: {
    gap: 6,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
  },
  checkmark: {
    fontSize: 12,
    fontWeight: "900",
    color: colors.blue,
    marginTop: 1,
  },
  featureText: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 17,
  },
  featureTextMuted: {
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 17,
  },
  freeCard: {
    backgroundColor: colors.surface1,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  freeTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.ink,
    marginBottom: 6,
  },
  freePriceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: 12,
  },
  freePriceAmount: {
    fontSize: 20,
    fontStyle: "italic",
    color: colors.ink,
  },
});
