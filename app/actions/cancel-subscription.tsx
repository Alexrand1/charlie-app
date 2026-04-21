import { View, Text, ScrollView, StyleSheet, Linking, Alert } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import {
  BackPill,
  Eyebrow,
  CharlieHeadline,
  CharlieSub,
  CTAButton,
  CharlieCard,
} from "@/components/shared";
import { approveInsight } from "@/services/insights";
import { colors } from "@/constants/theme";

// Common cancellation URLs for popular subscriptions
const CANCELLATION_URLS: Record<string, string> = {
  "netflix": "https://www.netflix.com/cancelplan",
  "hulu": "https://secure.hulu.com/account",
  "paramount+": "https://www.paramountplus.com/account/",
  "disney+": "https://www.disneyplus.com/account",
  "hbo max": "https://www.max.com/account",
  "max": "https://www.max.com/account",
  "spotify": "https://www.spotify.com/account/subscription/",
  "apple music": "https://support.apple.com/en-us/HT202039",
  "youtube premium": "https://www.youtube.com/paid_memberships",
  "amazon prime": "https://www.amazon.com/mc/pipelines/cancelPrime",
  "peacock": "https://www.peacocktv.com/account/",
  "draftkings": "https://myaccount.draftkings.com/subscriptions",
  "fanduel": "https://account.fanduel.com/subscriptions",
};

export default function CancelSubscriptionScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  // Parse insight data from route params, with fallbacks
  const actionValue = params.actionValue
    ? JSON.parse(params.actionValue as string)
    : {};

  const merchant = actionValue.merchant || "Paramount+";
  const monthlyCost = actionValue.monthly_cost || 14.99;
  const annualSavings = actionValue.annual_savings || monthlyCost * 12;
  const insightText = (params.insightText as string) || `You haven't used ${merchant} recently. Charlie will handle it.`;

  const handleCancel = async () => {
    // Mark insight as acted on
    if (params.insightId && params.createdAt) {
      try {
        await approveInsight(
          params.insightId as string,
          params.createdAt as string
        );
      } catch {
        // Non-blocking — proceed even if approve fails
      }
    }

    // Try to open the cancellation URL
    const key = merchant.toLowerCase();
    const url = CANCELLATION_URLS[key];
    if (url) {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
        router.push("/actions/cancelled-win" as any);
        return;
      }
    }

    // Fallback: go to cancelling animation, then success
    router.push("/actions/cancelling" as any);
  };

  return (
    <ScrollView style={s.scroll} contentContainerStyle={s.content}>
      <BackPill />
      <View style={{ height: 14 }} />

      <Eyebrow text="Stop a leak" />
      <View style={{ height: 4 }} />
      <CharlieHeadline
        plainPrefix="Cancel "
        italicEmphasis={merchant}
        plainSuffix="?"
      />
      <View style={{ height: 6 }} />
      <CharlieSub text={insightText} />
      <View style={{ height: 14 }} />

      {/* Subscription card */}
      <CharlieCard cornerRadius={14} padding={14}>
        <View style={s.subRow}>
          <View style={s.subIcon}>
            <Text style={{ fontSize: 18, color: colors.textOnBlue }}>▶</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.subName}>{merchant}</Text>
            <Text style={s.subMeta}>Recurring charge</Text>
          </View>
          <Text style={s.subPrice}>${monthlyCost.toFixed(2)}/mo</Text>
        </View>
        <View style={s.divider} />
        <View style={s.statsRow}>
          <View>
            <Text style={s.subMeta}>Monthly cost</Text>
            <Text style={s.negativeAmount}>-${monthlyCost.toFixed(2)}</Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={s.subMeta}>Saves / year</Text>
            <Text style={s.positiveAmount}>+${annualSavings.toFixed(2)}</Text>
          </View>
        </View>
      </CharlieCard>
      <View style={{ height: 10 }} />

      {/* Info box */}
      <View style={s.alertBox}>
        <Text style={{ fontSize: 16 }}>💡</Text>
        <View style={{ flex: 1 }}>
          <Text style={s.alertTitle}>Charlie spotted this leak</Text>
          <Text style={s.alertSub}>
            We'll open {merchant}'s cancellation page so you can cancel directly.
          </Text>
        </View>
      </View>

      <View style={{ flex: 1, minHeight: 40 }} />

      <CTAButton
        title={`Cancel ${merchant}`}
        variant="blue"
        onPress={handleCancel}
      />
      <View style={{ height: 8 }} />
      <CTAButton title="Keep it for now" variant="sand" onPress={() => router.back()} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.surface0 },
  content: { padding: 24, paddingTop: 54, paddingBottom: 24, minHeight: "100%" },
  subRow: { flexDirection: "row", alignItems: "center", gap: 11, marginBottom: 10 },
  subIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.blue,
    justifyContent: "center",
    alignItems: "center",
  },
  subName: { fontSize: 13, fontWeight: "600", color: colors.ink },
  subMeta: { fontSize: 10, color: colors.textSecondary, marginTop: 2 },
  subPrice: { fontSize: 12, fontWeight: "700", color: colors.ink },
  divider: { height: 1, backgroundColor: colors.borderSubtle, marginBottom: 10 },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  negativeAmount: { fontSize: 13, fontWeight: "700", color: colors.negative, marginTop: 2 },
  positiveAmount: { fontSize: 13, fontWeight: "700", color: colors.positive, marginTop: 2 },
  alertBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    padding: 12,
    backgroundColor: "rgba(224,112,112,0.08)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(224,112,112,0.25)",
  },
  alertTitle: { fontSize: 12, fontWeight: "600", color: colors.ink },
  alertSub: { fontSize: 10, color: colors.textSecondary, marginTop: 2 },
});
