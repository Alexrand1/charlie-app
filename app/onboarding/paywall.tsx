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
import { ProgressDots } from "@/components/onboarding/ProgressDots";
import { colors, spacing, radii } from "@/constants/theme";

const FEATURES = [
  { icon: "🔍", text: "Unlimited savings scans" },
  { icon: "💬", text: "Unlimited AI chat with Charlie" },
  { icon: "📊", text: "Advanced spending insights" },
  { icon: "🎯", text: "Smart goal tracking" },
  { icon: "🔔", text: "Bill negotiation alerts" },
  { icon: "📈", text: "Net worth tracking" },
];

export default function PaywallScreen() {
  const router = useRouter();
  const { state, update } = useOnboarding();
  const [loading, setLoading] = useState(false);

  const totalSavings = state.opportunities.reduce((sum, item) => {
    const match = item.amount?.match(/\$(\d+(?:\.\d+)?)/);
    return sum + (match ? parseFloat(match[1]) : 0);
  }, 0);

  async function handleSubscribe() {
    setLoading(true);
    try {
      // STUB: In production, this would use expo-in-app-purchases / react-native-iap
      // to purchase com.charlie.pro.annual.intro via StoreKit 2
      // then POST /subscription/activate with the receipt
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Simulate successful purchase
      update({ userPlan: "pro" });
      router.push("/onboarding/complete");
    } catch (err: any) {
      Alert.alert("Purchase Failed", "Please try again later.");
    } finally {
      setLoading(false);
    }
  }

  function handleSkip() {
    update({ userPlan: "free" });
    router.push("/onboarding/complete");
  }

  return (
    <View style={s.container}>
      <ProgressDots total={6} current={4} />

      <View style={s.content}>
        {/* Header */}
        <View style={s.header}>
          <Text style={s.title}>Unlock your full{"\n"}financial picture</Text>
          {totalSavings > 0 && (
            <View style={s.savingsBadge}>
              <Text style={s.savingsText}>
                We found ${totalSavings.toFixed(0)}+ in potential savings
              </Text>
            </View>
          )}
        </View>

        {/* Features list */}
        <View style={s.features}>
          {FEATURES.map((f, i) => (
            <View key={i} style={s.featureRow}>
              <Text style={s.featureIcon}>{f.icon}</Text>
              <Text style={s.featureText}>{f.text}</Text>
            </View>
          ))}
        </View>

        {/* Pricing card */}
        <View style={s.pricingCard}>
          <View style={s.pricingBadge}>
            <Text style={s.pricingBadgeText}>7-DAY FREE TRIAL</Text>
          </View>
          <View style={s.pricingRow}>
            <View>
              <Text style={s.pricingTitle}>Charlie Pro</Text>
              <Text style={s.pricingSubtitle}>Annual plan</Text>
            </View>
            <View style={s.pricingAmount}>
              <Text style={s.pricingPrice}>$4.99</Text>
              <Text style={s.pricingPeriod}>/month</Text>
            </View>
          </View>
          <Text style={s.pricingNote}>
            $59.99/year after trial · Cancel anytime
          </Text>
        </View>
      </View>

      {/* Actions */}
      <View style={s.actions}>
        <OnboardingButton
          title="Start Free Trial"
          onPress={handleSubscribe}
          loading={loading}
        />
        <OnboardingButton
          title="Continue with free plan"
          variant="ghost"
          onPress={handleSkip}
        />
        <Text style={s.legal}>
          Payment will be charged to your Apple ID account at the end of the
          trial period. Subscription automatically renews unless cancelled at
          least 24 hours before the end of the current period.
        </Text>
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
    paddingBottom: 32,
  },
  content: {
    flex: 1,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontStyle: "italic",
    color: colors.cream,
    lineHeight: 36,
  },
  savingsBadge: {
    backgroundColor: "rgba(168,197,160,0.12)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: "flex-start",
    marginTop: 12,
  },
  savingsText: {
    fontSize: 13,
    color: colors.sage,
    fontWeight: "600",
  },
  features: {
    gap: 14,
    marginBottom: 24,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  featureIcon: {
    fontSize: 18,
  },
  featureText: {
    fontSize: 15,
    color: colors.cream,
  },
  pricingCard: {
    backgroundColor: colors.surface1,
    borderRadius: radii.lg,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.yellow,
  },
  pricingBadge: {
    backgroundColor: colors.yellow,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 4,
    alignSelf: "flex-start",
    marginBottom: 12,
  },
  pricingBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.textOnYellow,
    letterSpacing: 1,
  },
  pricingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  pricingTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.cream,
  },
  pricingSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  pricingAmount: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  pricingPrice: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.yellow,
  },
  pricingPeriod: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  pricingNote: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  actions: {
    gap: 8,
  },
  legal: {
    fontSize: 10,
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 14,
    marginTop: 4,
  },
});
